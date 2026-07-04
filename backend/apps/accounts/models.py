from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_USER = 'user'
    ROLE_CREATOR = 'creator'
    ROLE_CHOICES = [
        (ROLE_USER, 'User'),
        (ROLE_CREATOR, 'Creator'),
    ]

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_USER)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    avatar_url = models.URLField(null=True, blank=True)  # for OAuth avatars
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.email

    @property
    def display_avatar(self):
        if self.avatar:
            return self.avatar.url
        return self.avatar_url or f"https://api.dicebear.com/7.x/initials/svg?seed={self.username}"

    @property
    def is_creator(self):
        return self.role == self.ROLE_CREATOR
