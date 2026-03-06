from rest_framework import serializers
from .models import Student, StudentProfile
from apps.academics.serializers import ClassroomSerializer, StreamSerializer


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['guardian_name', 'guardian_phone', 'guardian_email', 'address', 'medical_notes', 'special_needs']


class StudentSerializer(serializers.ModelSerializer):
    profile = StudentProfileSerializer(read_only=True)
    classroom = ClassroomSerializer(read_only=True)
    stream = StreamSerializer(read_only=True)

    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'middle_name', 'admission_number',
            'date_of_birth', 'gender', 'enrollment_date', 'current_class',
            'classroom', 'stream', 'is_active', 'profile'
        ]
        read_only_fields = ['id']
