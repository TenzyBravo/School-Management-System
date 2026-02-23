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
        
        # Teachers: Can only access students in grades/streams they are assigned to
        if user.role == UserRole.TEACHER:
            # Import here to avoid circular dependency
            from apps.academics.models import TeacherAssignment, AcademicYear

            # Get the student's current class (grade)
            if not hasattr(obj, 'current_class') or not obj.current_class:
                # Student has no assigned class, deny access unless class teacher
                return False

            # Get current academic year
            try:
                current_year = AcademicYear.objects.get(is_current=True)
            except AcademicYear.DoesNotExist:
                # No current academic year set, deny access
                return False

            # Check if teacher has any assignment for this student's grade in current year
            has_assignment = TeacherAssignment.objects.filter(
                teacher=user,
                grade=obj.current_class,
                academic_year=current_year
            ).exists()

            return has_assignment
        
        # Social officers can access all in their school
        if user.role == UserRole.SOCIAL_OFFICER:
            return True
        
        return False
