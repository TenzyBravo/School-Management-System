from rest_framework.permissions import BasePermission
from apps.users.models import UserRole

class IsHQUser(BasePermission):
    """Allow access only to HQ users."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_hq_user


class IsSchoolAdmin(BasePermission):
    """Allow access to headteachers and deputy heads."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_school_admin or request.user.is_hq_user
        )


class CanAccessStudent(BasePermission):
    """
    Check if user can access specific student data.
    Assumes the view has a get_object() method that returns a TenantAwareModel (like Student).
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not user.is_authenticated:
            return False

        # HQ users can access all
        if user.is_hq_user:
            return True
        
        # Must be same school
        if hasattr(obj, 'school_id') and obj.school_id != user.school_id:
            return False
        
        # School admins can access all in their school
        if user.is_school_admin:
            return True
        
        # Teachers: Logic will be refined when Student/TeacherAssignment models exist. 
        # For now, allow same school teachers access.
        if user.role == UserRole.TEACHER:
            # TODO: Refine to allow only assigned students
            return True
        
        # Social officers can access all in their school
        if user.role == UserRole.SOCIAL_OFFICER:
            return True
        
        return False
