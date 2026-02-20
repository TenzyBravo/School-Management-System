from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.mixins import TenantViewSetMixin
from apps.core.permissions import IsSchoolAdmin
from .models import Attendance
from .serializers import AttendanceSerializer
from .filters import AttendanceFilter


class AttendanceViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by('-date')
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_class = AttendanceFilter
    ordering_fields = ['date', 'student']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return super().get_permissions()
