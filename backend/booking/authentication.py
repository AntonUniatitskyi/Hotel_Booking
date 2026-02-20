from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
from .models import Client

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        if 'fullname' in validated_token:
            try:
                user_id = validated_token.get('user_id')
                return Client.objects.get(id=user_id)
            except Client.DoesNotExist:
                raise AuthenticationFailed('Клієнта не знайдено', code='user_not_found')

        return super().get_user(validated_token)
