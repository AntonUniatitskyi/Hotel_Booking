# booking/permissions.py
from rest_framework.permissions import BasePermission
from django.contrib.auth.models import User
from .models import Client

class IsClientOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return isinstance(request.user, (Client, User))
