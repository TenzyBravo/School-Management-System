from rest_framework import serializers
from .models import School
from apps.academics.serializers import GradeSerializer


class SchoolSerializer(serializers.ModelSerializer):
    grades = GradeSerializer(many=True, read_only=True, source='grade_set')
    class Meta:
        model = School
        fields = ['id', 'name', 'code', 'address', 'phone', 'email', 'is_active', 'created_at', 'updated_at', 'grades']
        read_only_fields = ['id', 'created_at', 'updated_at']
