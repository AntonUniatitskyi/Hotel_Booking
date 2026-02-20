from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user = super().get_user(validated_token)

        if user is None:
            return None

        if not (user.is_staff or hasattr(user, 'client')):
             raise AuthenticationFailed('У цього користувача немає профілю клієнта або прав адміністратора')

        return user
