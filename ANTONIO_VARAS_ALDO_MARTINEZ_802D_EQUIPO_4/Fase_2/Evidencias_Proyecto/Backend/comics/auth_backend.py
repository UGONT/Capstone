# comics/auth_backend.py
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User


class EmailOrUsernameBackend(ModelBackend):
    """Autentica con email (case-insensitive) o con username."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None:
            username = kwargs.get('email')
        if not username or not password:
            return None

        # Intentar por email primero
        try:
            user = User.objects.get(email__iexact=username)
        except User.DoesNotExist:
            # Fallback a username
            try:
                user = User.objects.get(username__iexact=username)
            except User.DoesNotExist:
                User().set_password(password)  # reduce timing attacks
                return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None