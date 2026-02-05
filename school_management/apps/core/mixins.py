from apps.core.context import set_current_context, clear_context

class TenantViewSetMixin:
    """
    Mixin to set the tenant context for DRF Views.
    This is necessary because standard Middleware runs before DRF Authentication.
    We set the context in `initial()` which runs after Authentication.
    """
    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        
        # At this point, request.user is populated by JWTAuthentication
        user = getattr(request, 'user', None)
        if user and user.is_authenticated:
            school = getattr(user, 'school', None)
            set_current_context(user, school)
        else:
            set_current_context(None, None)

    def get_queryset(self):
        """
        Force re-evaluation of the queryset to ensure TenantManager 
        runs with the current thread-local context.
        """
        # We assume self.queryset is set on the view
        if self.queryset is not None:
            return self.queryset.model.objects.all()
        return super().get_queryset()

    def finalize_response(self, request, response, *args, **kwargs):
        clear_context()
        return super().finalize_response(request, response, *args, **kwargs)
