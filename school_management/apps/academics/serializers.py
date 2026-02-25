from rest_framework import serializers
from .models import AcademicYear, Term, Grade, Stream, Subject, TeacherAssignment

class TermSerializer(serializers.ModelSerializer):
    class Meta:
        model = Term
        fields = ['id', 'academic_year', 'name', 'start_date', 'end_date', 'is_current']

class AcademicYearSerializer(serializers.ModelSerializer):
    terms = TermSerializer(many=True, read_only=True)

    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date', 'is_current', 'terms']

class StreamSerializer(serializers.ModelSerializer):
    grade_name = serializers.CharField(source='grade.name', read_only=True)

    class Meta:
        model = Stream
        fields = ['id', 'grade', 'grade_name', 'name']

class GradeSerializer(serializers.ModelSerializer):
    streams = StreamSerializer(many=True, read_only=True)

    class Meta:
        model = Grade
        fields = ['id', 'name', 'level', 'streams']

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'is_core']

    def validate(self, data):
        request = self.context.get('request')
        if request and request.user:
            school = request.user.school
            if school:
                # Check for duplicate code
                code = data.get('code')
                queryset = Subject.objects.filter(school=school, code=code)
                if self.instance:
                    queryset = queryset.exclude(pk=self.instance.pk)
                
                if queryset.exists():
                    raise serializers.ValidationError({"code": "Subject with this code already exists for this school."})
        return data

class TeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    grade_name = serializers.CharField(source='grade.name', read_only=True)
    grade_level = serializers.IntegerField(source='grade.level', read_only=True)
    stream_name = serializers.CharField(source='stream.name', read_only=True)
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = TeacherAssignment
        fields = [
            'id', 'teacher', 'teacher_name', 'grade', 'grade_name', 'grade_level',
            'stream', 'stream_name', 'subject', 'subject_name', 'subject_code',
            'academic_year', 'is_class_teacher', 'student_count'
        ]

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}"

    def get_student_count(self, obj):
        from apps.students.models import Student
        qs = Student.objects.filter(school=obj.school, current_class=obj.grade, is_active=True)
        if obj.stream:
            # stream is not on Student model, so count by grade only when stream present
            pass
        return qs.count()
