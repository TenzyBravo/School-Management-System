from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'date', 'status', 'marked_by', 'remarks', 'school', 'created_at']
        read_only_fields = ['id', 'school', 'created_at']
