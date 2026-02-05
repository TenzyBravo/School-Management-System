from rest_framework import serializers
from .models import Student, StudentProfile

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['id', 'guardian_name', 'guardian_phone', 'guardian_email', 'address', 'medical_notes', 'special_needs']

class StudentSerializer(serializers.ModelSerializer):
    profile = StudentProfileSerializer(required=False)
    
    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'middle_name', 
            'admission_number', 'date_of_birth', 'gender', 
            'enrollment_date', 'current_class', 'is_active', 
            'profile', 'school', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'school']

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', None)
        student = Student.objects.create(**validated_data)
        if profile_data:
            StudentProfile.objects.create(student=student, **profile_data)
        return student

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update student instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update or create profile
        if profile_data:
            StudentProfile.objects.update_or_create(
                student=instance,
                defaults=profile_data
            )
        return instance
