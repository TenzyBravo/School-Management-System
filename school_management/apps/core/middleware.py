from django.utils.deprecation import MiddlewareMixin
from apps.core.context import set_current_context, clear_context
from django.apps import apps

class TenantMiddleware(MiddlewareMixin):
    """
    Middleware to set current tenant in thread-local storage.
    """

    def process_request(self, request):
        user = getattr(request, 'user', None)
        # Allow superusers / HQ users to override the active school via a
        # request header (sent by the frontend) named `X-Active-School`.
        # This enables a super-admin to select which school's context they
        # are currently operating in without changing their user.school.
        active_school_header = None
        try:
            # Django exposes HTTP headers in request.META with 'HTTP_' prefix
            active_school_header = request.META.get('HTTP_X_ACTIVE_SCHOOL')
        except Exception:
            active_school_header = None

        if user and user.is_authenticated:
            # If a header is present and the user is a superuser or HQ user,
            # prefer the header to set the current tenant context.
            if active_school_header and (getattr(user, 'is_superuser', False) or getattr(user, 'is_hq_user', False)):
                # Resolve the School model lazily to avoid import cycles
                School = apps.get_model('schools', 'School')
                try:
                    school = School.objects.filter(pk=active_school_header).first()
                except Exception:
                    school = None
                set_current_context(user, school)
            else:
                # Default behavior: use the user's assigned school (if any)
                school = getattr(user, 'school', None)
                set_current_context(user, school)
        else:
            set_current_context(None, None)

    def process_response(self, request, response):
        # Clear thread-local data
        clear_context()
        return response
