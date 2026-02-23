from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'employee_number', 'email', 'first_name', 'last_name',
            'role', 'school', 'school_name', 'phone'
        ]
        read_only_fields = ['role', 'school']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['role'] = user.role
        token['school_id'] = str(user.school_id) if user.school_id else None
        token['name'] = f"{user.first_name} {user.last_name}"

        return token
