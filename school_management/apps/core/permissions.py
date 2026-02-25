from rest_framework.permissions import BasePermission
from apps.users.models import UserRole


class IsSuperAdmin(BasePermission):
    """Allow access only to super admins (cross-school, all privileges)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin


class IsHQUser(BasePermission):
    """Allow access to HQ users and super admins (cross-school read/write)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_hq_user


class IsSchoolAdmin(BasePermission):
    """Allow access to headteachers, deputy heads, HQ users, and super admins."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_school_admin or request.user.is_hq_user
        )


class CanAccessStudent(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False
        if user.is_hq_user:
            return True
        if hasattr(obj, 'school_id') and obj.school_id != user.school_id:
            return False
        if user.is_school_admin:
            return True
        if user.role in [UserRole.TEACHER, UserRole.SOCIAL_OFFICER]:
            return True
        return False
