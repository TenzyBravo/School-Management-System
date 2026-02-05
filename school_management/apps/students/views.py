from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Student
from .serializers import StudentSerializer
from apps.core.context import get_current_school

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['current_class', 'gender', 'is_active']
    search_fields = ['first_name', 'last_name', 'admission_number', 'profile__guardian_name']
    ordering_fields = ['first_name', 'last_name', 'admission_number']

    def get_queryset(self):
        # Filter by school is handled automatically if TenantAwareModel logic is perfect,
        # but ModelViewSet needs explicit filtering usually if using a standard Manager
        # unless our default manager already filters.
        # Let's check TenantManager in core/managers.py later.
        # Typically, a safe approach is:
        user = self.request.user
        print(f"VIEW DEBUG: User: {user}, School: {getattr(user, 'school', None)}")
        print(f"VIEW DEBUG: Context School: {get_current_school()}")
        if not user.school:
            if user.is_hq_user:
                return Student.objects.all()
            return Student.objects.none() # Should not happen
        qs = Student.objects.filter(school=user.school)
        print(f"VIEW DEBUG: Queryset Count: {qs.count()}")
        return qs

    def perform_create(self, serializer):
        # Automatically assign school from user
        if self.request.user.school:
           serializer.save(school=self.request.user.school)
        else:
            # If HQ user creating, they might need to specify school? 
            # For now, assume HQ users can't create students without a school context.
            # Or reliance on TenantMiddleware + context.
            serializer.save() 
