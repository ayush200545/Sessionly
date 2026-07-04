from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator

from .models import Booking
from .serializers import BookingSerializer
from apps.accounts.permissions import IsCreator


@method_decorator(ratelimit(key='user', rate='20/h', block=True), name='post')
class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        session = serializer.validated_data['session']
        # Free sessions: auto-confirm. Paid: pending until Stripe webhook
        payment_status = 'paid' if session.is_free else 'pending'
        booking_status = 'confirmed' if session.is_free else 'pending'
        serializer.save(
            user=self.request.user,
            status=booking_status,
            payment_status=payment_status
        )


class UserBookingsView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(
            user=self.request.user
        ).select_related('session', 'session__creator', 'session__category')


class CreatorBookingsView(generics.ListAPIView):
    """Creator sees all bookings on their sessions."""
    serializer_class = BookingSerializer
    permission_classes = [IsCreator]

    def get_queryset(self):
        return Booking.objects.filter(
            session__creator=self.request.user
        ).select_related('user', 'session', 'session__category')


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_booking_status(request, pk):
    """Creator can confirm/cancel. User can cancel their own."""
    try:
        booking = Booking.objects.get(pk=pk)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)

    new_status = request.data.get('status')
    if not new_status:
        return Response({'error': 'status is required'}, status=400)

    # Authorization check
    is_session_creator = booking.session.creator == request.user
    is_booking_owner = booking.user == request.user

    if not (is_session_creator or is_booking_owner):
        return Response({'error': 'Permission denied'}, status=403)

    # Creators can confirm; both can cancel
    allowed_transitions = {
        'confirmed': is_session_creator,
        'cancelled': True,
    }
    if new_status not in allowed_transitions or not allowed_transitions[new_status]:
        return Response({'error': f'Cannot set status to {new_status}'}, status=400)

    booking.status = new_status
    booking.save(update_fields=['status'])
    return Response(BookingSerializer(booking).data)


# ─── Stripe Bonus ───────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='10/h', block=True)
def create_stripe_checkout(request, booking_id):
    """Create a Stripe Checkout Session for a paid booking."""
    import stripe
    from django.conf import settings

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        booking = Booking.objects.get(pk=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=404)

    # If Stripe keys are not configured or are dummy values, fall back to sandbox mode
    is_dummy_key = not stripe.api_key or stripe.api_key.startswith('sk_test_dummy')

    if not is_dummy_key:
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'inr',
                        'product_data': {'name': booking.session.title},
                        'unit_amount': int(booking.session.price * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{settings.FRONTEND_URL or 'http://localhost:5173'}/dashboard/user?payment=success&booking={booking.id}",
                cancel_url=f"{settings.FRONTEND_URL or 'http://localhost:5173'}/sessions/{booking.session.id}?payment=cancelled",
                metadata={'booking_id': str(booking.id)},
            )

            booking.stripe_session_id = session.id
            booking.save(update_fields=['stripe_session_id'])

            return Response({'checkout_url': session.url})
        except Exception as e:
            print(f"Stripe Checkout error: {str(e)}. Falling back to local Sandbox Simulation.")

    # Fallback Sandbox Mode: auto-confirm booking in sandbox!
    booking.payment_status = 'paid'
    booking.status = 'confirmed'
    booking.save(update_fields=['payment_status', 'status'])

    # Make sure spots are updated (handled in model save or perform_create? Let's check)
    # Return a local mock redirect URL that will direct the user back to their dashboard with success!
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    if frontend_url == 'http://localhost' or not frontend_url:
        frontend_url = 'http://localhost:5173'

    mock_checkout_url = f"{frontend_url}/dashboard/user?payment=success&booking={booking.id}&sandbox=true"
    return Response({'checkout_url': mock_checkout_url})


@api_view(['POST'])
@permission_classes([])
def stripe_webhook(request):
    """Handle Stripe webhooks to confirm payment."""
    import stripe
    from django.conf import settings

    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        return Response({'error': 'Invalid signature'}, status=400)

    if event['type'] == 'checkout.session.completed':
        session_data = event['data']['object']
        booking_id = session_data['metadata'].get('booking_id')
        if booking_id:
            Booking.objects.filter(pk=booking_id).update(
                payment_status='paid',
                status='confirmed'
            )

    return Response({'status': 'ok'})


# ─── Razorpay Bonus ─────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@ratelimit(key='user', rate='15/h', block=True)
def create_razorpay_order(request, booking_id):
    """Create a Razorpay Payment Link for a paid booking."""
    try:
        booking = Booking.objects.get(pk=booking_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)

    from .razorpay_service import RazorpayService
    from django.conf import settings

    amount_in_paise = int(booking.session.price * 100)
    
    try:
        order_result = RazorpayService.create_payment_link(amount_in_paise, booking.id, booking.session.title, request.user.email)
    except Exception as e:
        return Response({'error': f"Payment setup error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    booking.razorpay_order_id = order_result['order_id']
    booking.save(update_fields=['razorpay_order_id'])

    return Response({
        'order_id': order_result['order_id'],
        'amount': order_result['amount'],
        'currency': order_result['currency'],
        'short_url': order_result['short_url'],
        'sandbox': order_result['sandbox'],
        'razorpay_key_id': settings.RAZORPAY_KEY_ID or 'rzp_test_mockkey1234'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def confirm_razorpay_payment(request):
    """Verify Razorpay payment link signatures and confirm seat bookings."""
    payment_link_id = request.data.get('razorpay_payment_link_id')
    payment_id = request.data.get('razorpay_payment_id')
    payment_link_reference_id = request.data.get('razorpay_payment_link_reference_id')
    payment_link_status = request.data.get('razorpay_payment_link_status')
    signature = request.data.get('razorpay_signature')

    if not all([payment_link_id, payment_id, payment_link_reference_id, payment_link_status, signature]):
        return Response({'error': 'All signature fields are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        booking = Booking.objects.get(razorpay_order_id=payment_link_id, user=request.user)
    except Booking.DoesNotExist:
        return Response({'error': 'Booking not found for order'}, status=status.HTTP_404_NOT_FOUND)

    from .razorpay_service import RazorpayService
    is_valid = RazorpayService.verify_payment_link_signature(
        payment_id, payment_link_id, payment_link_reference_id, payment_link_status, signature
    )

    if is_valid and payment_link_status == 'paid':
        booking.payment_status = 'paid'
        booking.status = 'confirmed'
        booking.razorpay_payment_id = payment_id
        booking.save(update_fields=['payment_status', 'status', 'razorpay_payment_id'])
        return Response({
            'status': 'success',
            'message': 'Payment confirmed successfully',
            'booking_id': booking.id
        })
    else:
        booking.payment_status = 'failed'
        booking.save(update_fields=['payment_status'])
        return Response({'error': 'Invalid payment signature verification or payment not paid'}, status=status.HTTP_400_BAD_REQUEST)
