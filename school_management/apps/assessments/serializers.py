from rest_framework import serializers
from .models import Assessment, Mark, TermGrade


class AssessmentSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    marks_count = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            'id', 'name', 'assessment_type', 'subject', 'subject_name',
            'grade', 'grade_name', 'term', 'term_name', 'max_marks',
            'weight', 'date_conducted', 'description', 'instructions',
            'marks_count', 'school', 'created_at'
        ]
        read_only_fields = ['id', 'school', 'created_at']

    def get_marks_count(self, obj):
        return obj.marks.count()


class MarkSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    assessment_name = serializers.CharField(source='assessment.name', read_only=True)
    assessment_max_marks = serializers.DecimalField(
        source='assessment.max_marks',
        max_digits=6,
        decimal_places=2,
        read_only=True
    )
    percentage = serializers.ReadOnlyField()
    grade_letter = serializers.ReadOnlyField()
    entered_by_name = serializers.CharField(source='entered_by.get_full_name', read_only=True)

    class Meta:
        model = Mark
        fields = [
            'id', 'assessment', 'assessment_name', 'assessment_max_marks',
            'student', 'student_name', 'marks_obtained', 'percentage',
            'grade_letter', 'remarks', 'entered_by', 'entered_by_name',
            'entered_at', 'updated_at', 'school'
        ]
        read_only_fields = ['id', 'entered_by', 'entered_at', 'updated_at', 'school']

    def validate(self, data):
        """Ensure marks don't exceed max marks"""
        assessment = data.get('assessment')
        marks_obtained = data.get('marks_obtained')

        if marks_obtained and assessment and marks_obtained > assessment.max_marks:
            raise serializers.ValidationError({
                'marks_obtained': f'Marks cannot exceed maximum marks ({assessment.max_marks})'
            })

        if marks_obtained and marks_obtained < 0:
            raise serializers.ValidationError({
                'marks_obtained': 'Marks cannot be negative'
            })

        return data


class MarkBulkCreateSerializer(serializers.Serializer):
    """Serializer for bulk marks entry"""
    assessment = serializers.UUIDField()
    marks = serializers.ListField(
        child=serializers.DictField(child=serializers.DecimalField(max_digits=6, decimal_places=2))
    )


class TermGradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    grade_name = serializers.CharField(source='grade.name', read_only=True)

    class Meta:
        model = TermGrade
        fields = [
            'id', 'student', 'student_name', 'subject', 'subject_name',
            'term', 'term_name', 'grade', 'grade_name', 'total_marks',
            'max_possible_marks', 'percentage', 'grade_letter',
            'calculated_at', 'school'
        ]
        read_only_fields = ['id', 'calculated_at', 'school']


class StudentPerformanceSerializer(serializers.Serializer):
    """Serializer for student performance analytics"""
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    subject_id = serializers.UUIDField()
    subject_name = serializers.CharField()
    average_marks = serializers.DecimalField(max_digits=6, decimal_places=2)
    average_percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_assessments = serializers.IntegerField()
    grade_letter = serializers.CharField()
