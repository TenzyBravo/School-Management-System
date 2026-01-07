from django.db import models
from apps.core.context import get_current_school, get_current_user

class TenantManager(models.Manager):
    """
    Custom manager that automatically filters by current tenant.
    """

    def get_queryset(self):
        qs = super().get_queryset()
        school = get_current_school()
        user = get_current_user()
        
        # HW users (if implemented) or Superusers can see all
        # For mixed context where user might be None but school set, use school.
        
        if user and getattr(user, 'is_superuser', False):
            return qs

        # If user has is_hq_user property (checked dynamically to avoid circular import if possible, 
        # or assuming the User model will have it)
        if user and getattr(user, 'is_hq_user', False):
            return qs
        
        # School users only see their school's data
        if school:
            return qs.filter(school=school)
        
        # If no school context and not HQ/Superuser, return empty (safest)
        # OR return all if we are in a non-request context (like management command)? 
        # For safety, let's return none unless explicitly bypassed.
        return qs.none() 

    def for_school(self, school):
        """Explicitly filter for a specific school."""
        return super().get_queryset().filter(school=school)

    def all_schools(self):
        """Get data across all schools (HQ reporting)."""
        return super().get_queryset()
