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
        classroom_id = request.data.get('classroom')
        stream_id = request.data.get('stream')
        date = request.data.get('date')
        default_status = request.data.get('status', 'P')

        from apps.core.context import get_current_school
        school = get_current_school() or getattr(request.user, 'school', None)

        created, updated = 0, 0
        errors = []

        # If no explicit records provided but classroom/stream + date exist,
        # generate records for all students in that classroom/stream.
        if not records and (classroom_id or stream_id) and date:
            from apps.students.models import Student
            qs = Student.objects.filter(school=school)
            if classroom_id:
                qs = qs.filter(classroom_id=classroom_id)
            if stream_id:
                qs = qs.filter(stream_id=stream_id)
            # Build records list from students queryset
            records = [{'student': str(s.id), 'date': date, 'status': default_status} for s in qs]

        if not records:
            return Response({'error': 'No records provided.'}, status=status.HTTP_400_BAD_REQUEST)

        for rec in records:
            student_id = rec.get('student')
            rec_date = rec.get('date')
            att_status = rec.get('status', default_status)

            if not student_id or not rec_date:
                errors.append({'record': rec, 'error': 'Missing student or date'})
                continue

            try:
                obj, was_created = Attendance.objects.update_or_create(
                    student_id=student_id,
                    date=rec_date,
                    defaults={
                        'status': att_status,
                        'marked_by': request.user,
                        'school': school,
                    }
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
            except Exception as e:
                errors.append({'record': rec, 'error': str(e)})

        return Response({
            'created': created,
            'updated': updated,
            'errors': errors,
        }, status=status.HTTP_200_OK)
