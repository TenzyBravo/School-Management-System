from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import IsHQUser, IsSchoolAdmin
from apps.core.mixins import TenantViewSetMixin
from .models import AcademicYear, Term, Grade, Stream, Subject, TeacherAssignment
from .serializers import (
    AcademicYearSerializer, TermSerializer, GradeSerializer,
    StreamSerializer, SubjectSerializer, TeacherAssignmentSerializer
)


def _get_school_or_error(request):
    """Return the user's school, or raise 400 if not set."""
    school = getattr(request.user, 'school', None)
    if not school:
        raise ValidationError(
            "Your account is not linked to a school. "
            "Contact your administrator to assign you to a school."
        )
    return school


class AcademicYearViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all().order_by('-start_date')
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHQUser()]
        return super().get_permissions()


class TermViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Term.objects.all().order_by('start_date')
    serializer_class = TermSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['academic_year', 'is_current']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsHQUser()]
        return super().get_permissions()


class GradeViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [IsSchoolAdmin]

    def get_permissions(self):
        # Any authenticated user with a school can manage their school's grades
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(school=_get_school_or_error(self.request))

    def perform_update(self, serializer):
        serializer.save(school=_get_school_or_error(self.request))

    @action(detail=True, methods=['get'], url_path='students')
    def students(self, request, pk=None):
        """Return all active students enrolled in this grade (optionally filtered by stream)."""
        from apps.students.models import Student
        from apps.students.serializers import StudentSerializer
        grade = self.get_object()
        qs = Student.objects.filter(school=request.user.school, current_class=grade, is_active=True)
        stream_id = request.query_params.get('stream')
        if stream_id:
            qs = qs.filter(current_stream_id=stream_id)
        serializer = StudentSerializer(qs.order_by('last_name', 'first_name'), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='class-list')
    def class_list(self, request):
        """
        Return full school class hierarchy:
        Grade → Streams → {class_teacher, student_count}
        """
        grades = self.get_queryset().prefetch_related('stream_set')
        # Fetch all class-teacher assignments for this school at once
        class_teachers = {}
        if request.user.school:
            for assignment in TeacherAssignment.objects.filter(
                school=request.user.school, is_class_teacher=True
            ).select_related('teacher', 'stream'):
                if assignment.stream_id:
                    class_teachers[str(assignment.stream_id)] = {
                        'id': str(assignment.teacher_id),
                        'name': f"{assignment.teacher.first_name} {assignment.teacher.last_name}".strip(),
                    }

        from apps.students.models import Student
        # Count students per stream and per grade (for streams with no students assigned yet)
        stream_counts = {}
        grade_counts = {}
        for student in Student.objects.filter(
            school=request.user.school, is_active=True
        ).values('current_class_id', 'current_stream_id'):
            gid = str(student['current_class_id']) if student['current_class_id'] else None
            sid = str(student['current_stream_id']) if student['current_stream_id'] else None
            if sid:
                stream_counts[sid] = stream_counts.get(sid, 0) + 1
            elif gid:
                grade_counts[gid] = grade_counts.get(gid, 0) + 1

        result = []
        for grade in grades:
            streams_data = []
            for stream in grade.stream_set.all():
                sid = str(stream.id)
                streams_data.append({
                    'id': sid,
                    'name': stream.name,
                    'class_name': f"{grade.name} {stream.name}",
                    'class_teacher': class_teachers.get(sid),
                    'student_count': stream_counts.get(sid, 0),
                })
            gid = str(grade.id)
            result.append({
                'id': gid,
                'name': grade.name,
                'level': grade.level,
                'category': grade.category,
                'category_display': grade.get_category_display(),
                'total_students': sum(s['student_count'] for s in streams_data) + grade_counts.get(gid, 0),
                'streams': streams_data,
            })
        return Response(result)


class StreamViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Stream.objects.all()
    serializer_class = StreamSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['grade']

    def perform_create(self, serializer):
        serializer.save(school=_get_school_or_error(self.request))

    def perform_update(self, serializer):
        serializer.save(school=_get_school_or_error(self.request))


class SubjectViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(school=_get_school_or_error(self.request))

    def perform_update(self, serializer):
        serializer.save(school=_get_school_or_error(self.request))


class TeacherAssignmentViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = TeacherAssignment.objects.all()
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [IsSchoolAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['teacher', 'grade', 'stream', 'subject', 'academic_year']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'my_classes']:
            return [permissions.IsAuthenticated()]
        return [IsSchoolAdmin()]

    def perform_create(self, serializer):
        serializer.save(school=_get_school_or_error(self.request))

    @action(detail=False, methods=['get'], url_path='my-classes')
    def my_classes(self, request):
        """
        Returns the current teacher's assignments for the active academic year.
        """
        current_year = AcademicYear.objects.filter(is_current=True).first()
        if not current_year:
            current_year = AcademicYear.objects.order_by('-start_date').first()

        qs = TeacherAssignment.objects.filter(
            teacher=request.user,
            school=request.user.school,
        )
        if current_year:
            qs = qs.filter(academic_year=current_year)

        qs = qs.select_related('grade', 'stream', 'subject', 'academic_year')
        serializer = TeacherAssignmentSerializer(qs, many=True, context={'request': request})
        return Response({
            'academic_year': current_year.name if current_year else None,
            'assignments': serializer.data,
        })
