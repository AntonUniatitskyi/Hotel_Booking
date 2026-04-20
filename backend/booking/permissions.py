from rest_framework import permissions
from rest_framework.permissions import SAFE_METHODS, BasePermission

from .models import Client, Booking

class IsAuthorOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user

class IsClientOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.is_superuser:
            return True

        if isinstance(obj, Client):
            return obj.user == user

        if isinstance(obj, Booking):
            if user.is_staff:
                return obj.room.hostel.admin == user
            return bool(obj.client and obj.client.user == user)
        return False

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS: # GET, HEAD, OPTIONS
            return True
        return bool(request.user and request.user.is_staff)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user.is_superuser or obj.admin == request.user)
