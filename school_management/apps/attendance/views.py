from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'bulk_create']:
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    @action(detail=False, methods=['post'], url_path='bulk_create')
    def bulk_create(self, request):
        """
        Bulk create or update attendance records for a class.
        Payload: { "records": [{"student": "<id>", "date": "YYYY-MM-DD", "status": "P|A|L|E"}, ...] }
        """
        records = request.data.get('records', [])
        if not records:
            return Response({'error': 'No records provided.'}, status=status.HTTP_400_BAD_REQUEST)

        created, updated = 0, 0
        errors = []

        for rec in records:
            student_id = rec.get('student')
            date = rec.get('date')
            att_status = rec.get('status', 'P')

            if not student_id or not date:
                errors.append({'record': rec, 'error': 'Missing student or date'})
                continue

            obj, was_created = Attendance.objects.update_or_create(
                student_id=student_id,
                date=date,
                defaults={
                    'status': att_status,
                    'marked_by': request.user,
                    'school': request.user.school,
                }
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response({
            'created': created,
            'updated': updated,
            'errors': errors,
        }, status=status.HTTP_200_OK)
