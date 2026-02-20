from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()


class Command(BaseCommand):
    help = 'Ensures a superuser exists (creates or updates based on environment variables)'

    def handle(self, *args, **options):
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
        first_name = os.environ.get('DJANGO_SUPERUSER_FIRST_NAME', 'Admin')
        last_name = os.environ.get('DJANGO_SUPERUSER_LAST_NAME', 'User')

        if not email or not password or not username:
            self.stdout.write(
                self.style.ERROR(
                    'Missing required environment variables: '
                    'DJANGO_SUPERUSER_EMAIL, DJANGO_SUPERUSER_PASSWORD, DJANGO_SUPERUSER_USERNAME'
                )
            )
            return

        try:
            # Try to get existing user
            user = User.objects.filter(email=email).first()

            if user:
                # Update existing user
                user.username = username
                user.first_name = first_name
                user.last_name = last_name
                user.set_password(password)
                user.is_staff = True
                user.is_superuser = True
                user.is_active = True
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully updated superuser: {email}')
                )
            else:
                # Create new user
                user = User.objects.create_superuser(
                    email=email,
                    username=username,
                    password=password,
                    first_name=first_name,
                    last_name=last_name
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully created superuser: {email}')
                )

            self.stdout.write(
                self.style.SUCCESS(
                    f'\nLogin credentials:\n'
                    f'  Email: {email}\n'
                    f'  Username: {username}\n'
                    f'  Password: [hidden]\n'
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error ensuring superuser: {str(e)}')
            )
