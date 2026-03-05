from rest_framework import serializers
from .models import School
from apps.academics.serializers import GradeSerializer
from apps.academics.serializers import ClassroomSerializer
from apps.academics.models import Classroom


class SchoolSerializer(serializers.ModelSerializer):
    grades = GradeSerializer(many=True, read_only=True, source='grade_set')
    classes = serializers.SerializerMethodField()
    class Meta:
        model = School
        fields = ['id', 'name', 'code', 'address', 'phone', 'email', 'is_active', 'created_at', 'updated_at', 'grades', 'classes']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_classes(self, obj):
        # Return all classrooms for the given school across grades
        qs = Classroom.objects.filter(school=obj)
        return ClassroomSerializer(qs, many=True, context=self.context).data
