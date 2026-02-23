from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg, Count, Sum
from apps.core.mixins import TenantViewSetMixin
from apps.core.permissions import IsSchoolAdmin
from .models import Assessment, Mark, TermGrade
from .serializers import (
    AssessmentSerializer, MarkSerializer, TermGradeSerializer,
    MarkBulkCreateSerializer, StudentPerformanceSerializer
)


class AssessmentViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Assessment.objects.all().select_related('subject', 'grade', 'term')
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['subject', 'grade', 'term', 'assessment_type']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSchoolAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['get'])
    def marks_summary(self, request, pk=None):
        """Get marks summary for an assessment"""
        assessment = self.get_object()
        marks = assessment.marks.all()

        summary = {
            'assessment': AssessmentSerializer(assessment).data,
            'total_students': marks.count(),
            'average_marks': marks.aggregate(Avg('marks_obtained'))['marks_obtained__avg'] or 0,
            'highest_marks': marks.order_by('-marks_obtained').first(),
            'lowest_marks': marks.order_by('marks_obtained').first(),
            'grade_distribution': self._get_grade_distribution(marks)
        }

        return Response(summary)

    def _get_grade_distribution(self, marks):
        """Calculate grade distribution"""
        distribution = {'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0}
        for mark in marks:
            distribution[mark.grade_letter] += 1
        return distribution


class MarkViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = Mark.objects.all().select_related('assessment', 'student', 'entered_by')
    serializer_class = MarkSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['assessment', 'student', 'assessment__subject', 'assessment__grade', 'assessment__term']

    def perform_create(self, serializer):
        serializer.save(entered_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(entered_by=self.request.user)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create marks for multiple students in an assessment"""
        serializer = MarkBulkCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        assessment_id = serializer.validated_data['assessment']
        marks_data = serializer.validated_data['marks']

        try:
            assessment = Assessment.objects.get(id=assessment_id, school=request.user.school)
        except Assessment.DoesNotExist:
            return Response(
                {'error': 'Assessment not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        created_marks = []
        errors = []

        for mark_entry in marks_data:
            student_id = mark_entry.get('student_id')
            marks_obtained = mark_entry.get('marks_obtained')
            remarks = mark_entry.get('remarks', '')

            try:
                mark, created = Mark.objects.update_or_create(
                    assessment=assessment,
                    student_id=student_id,
                    school=request.user.school,
                    defaults={
                        'marks_obtained': marks_obtained,
                        'remarks': remarks,
                        'entered_by': request.user
                    }
                )
                created_marks.append(MarkSerializer(mark).data)
            except Exception as e:
                errors.append({
                    'student_id': student_id,
                    'error': str(e)
                })

        return Response({
            'created': len(created_marks),
            'marks': created_marks,
            'errors': errors
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def student_performance(self, request):
        """Get performance analytics for a student"""
        student_id = request.query_params.get('student_id')
        term_id = request.query_params.get('term_id')

        if not student_id:
            return Response(
                {'error': 'student_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        marks = self.get_queryset().filter(student_id=student_id)
        if term_id:
            marks = marks.filter(assessment__term_id=term_id)

        # Group by subject
        performance = []
        subjects = marks.values('assessment__subject').distinct()

        for subject in subjects:
            subject_marks = marks.filter(assessment__subject_id=subject['assessment__subject'])
            avg_marks = subject_marks.aggregate(
                avg=Avg('marks_obtained'),
                count=Count('id')
            )

            # Calculate average percentage
            total_percentage = 0
            count = 0
            for mark in subject_marks:
                total_percentage += mark.percentage
                count += 1

            avg_percentage = total_percentage / count if count > 0 else 0

            # Determine grade letter
            if avg_percentage >= 80:
                grade_letter = 'A'
            elif avg_percentage >= 70:
                grade_letter = 'B'
            elif avg_percentage >= 60:
                grade_letter = 'C'
            elif avg_percentage >= 50:
                grade_letter = 'D'
            elif avg_percentage >= 40:
                grade_letter = 'E'
            else:
                grade_letter = 'F'

            first_mark = subject_marks.first()
            performance.append({
                'student_id': student_id,
                'student_name': first_mark.student.full_name if first_mark else '',
                'subject_id': subject['assessment__subject'],
                'subject_name': first_mark.assessment.subject.name if first_mark else '',
                'average_marks': avg_marks['avg'] or 0,
                'average_percentage': avg_percentage,
                'total_assessments': avg_marks['count'],
                'grade_letter': grade_letter
            })

        return Response(performance)


class TermGradeViewSet(TenantViewSetMixin, viewsets.ModelViewSet):
    queryset = TermGrade.objects.all().select_related('student', 'subject', 'term', 'grade')
    serializer_class = TermGradeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['student', 'subject', 'term', 'grade']

    @action(detail=False, methods=['post'])
    def calculate_term_grades(self, request):
        """Calculate and save term grades for all students in a term"""
        term_id = request.data.get('term_id')
        grade_id = request.data.get('grade_id')

        if not term_id or not grade_id:
            return Response(
                {'error': 'term_id and grade_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get all students in the grade
        from apps.students.models import Student
        students = Student.objects.filter(current_grade_id=grade_id, school=request.user.school)

        # Get all assessments for this term and grade
        assessments = Assessment.objects.filter(
            term_id=term_id,
            grade_id=grade_id,
            school=request.user.school
        )

        calculated_count = 0

        for student in students:
            # Group by subject
            subjects = assessments.values('subject').distinct()

            for subject_data in subjects:
                subject_id = subject_data['subject']
                subject_assessments = assessments.filter(subject_id=subject_id)

                # Get marks for this student in this subject
                marks = Mark.objects.filter(
                    student=student,
                    assessment__in=subject_assessments
                )

                if marks.exists():
                    total_marks = sum(mark.marks_obtained for mark in marks)
                    max_marks = sum(mark.assessment.max_marks for mark in marks)
                    percentage = (total_marks / max_marks * 100) if max_marks > 0 else 0

                    # Determine grade letter
                    if percentage >= 80:
                        grade_letter = 'A'
                    elif percentage >= 70:
                        grade_letter = 'B'
                    elif percentage >= 60:
                        grade_letter = 'C'
                    elif percentage >= 50:
                        grade_letter = 'D'
                    elif percentage >= 40:
                        grade_letter = 'E'
                    else:
                        grade_letter = 'F'

                    # Create or update term grade
                    TermGrade.objects.update_or_create(
                        student=student,
                        subject_id=subject_id,
                        term_id=term_id,
                        grade_id=grade_id,
                        school=request.user.school,
                        defaults={
                            'total_marks': total_marks,
                            'max_possible_marks': max_marks,
                            'percentage': percentage,
                            'grade_letter': grade_letter
                        }
                    )
                    calculated_count += 1

        return Response({
            'message': f'Successfully calculated {calculated_count} term grades',
            'students_processed': students.count(),
            'subjects_processed': subjects.count()
        })
