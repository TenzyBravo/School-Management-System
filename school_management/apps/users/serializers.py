from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'employee_number', 'email', 'first_name', 'last_name',
            'role', 'school', 'school_name', 'phone', 'profile_picture', 'profile_picture_url'
        ]
        read_only_fields = ['role', 'school']

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


class ProfileSerializer(serializers.ModelSerializer):
    """Serializer for staff to view and update their own profile"""
    school_name = serializers.CharField(source='school.name', read_only=True)
    profile_picture_url = serializers.SerializerMethodField()
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'employee_number', 'email', 'first_name', 'last_name',
            'role', 'school', 'school_name', 'phone', 'profile_picture', 'profile_picture_url',
            'current_password', 'new_password', 'confirm_password'
        ]
        read_only_fields = ['id', 'role', 'school', 'username', 'employee_number']

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def validate(self, attrs):
        current_password = attrs.pop('current_password', '')
        new_password = attrs.pop('new_password', '')
        confirm_password = attrs.pop('confirm_password', '')

        if new_password or confirm_password:
            if not current_password:
                raise serializers.ValidationError(
                    {'current_password': 'Current password is required to set a new password.'}
                )
            if not self.instance.check_password(current_password):
                raise serializers.ValidationError(
                    {'current_password': 'Current password is incorrect.'}
                )
            if new_password != confirm_password:
                raise serializers.ValidationError(
                    {'confirm_password': 'Passwords do not match.'}
                )
            validate_password(new_password, self.instance)
            attrs['_new_password'] = new_password

        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop('_new_password', None)
        instance = super().update(instance, validated_data)
        if new_password:
            instance.set_password(new_password)
            instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['role'] = user.role
        token['school_id'] = str(user.school_id) if user.school_id else None
        token['name'] = f"{user.first_name} {user.last_name}"

        return token
