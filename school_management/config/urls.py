"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.http import HttpResponse, HttpResponseNotFound, JsonResponse
import os

from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

def health_check(request):
    """Simple health check endpoint"""
    return JsonResponse({
        'status': 'healthy',
        'message': 'School Management System API is running',
        'allowed_hosts': settings.ALLOWED_HOSTS,
        'debug': settings.DEBUG
    })

urlpatterns = [
    path('', health_check, name='health'),
    path('health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/v1/', include('apps.users.urls')),
    path('api/v1/', include('apps.academics.urls')),
    path('api/v1/', include('apps.schools.urls')),
    path('api/v1/', include('apps.students.urls')),
    path('api/v1/', include('apps.attendance.urls')),
    path('api/v1/', include('apps.assessments.urls')),

    # Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Development convenience: redirect certain frontend routes to the Vite dev server.
# This allows developers to visit http://localhost:8000/teacher/ and be redirected
# to the frontend dev server at http://localhost:5173/teacher/ when DEBUG=True.
if settings.DEBUG:
    # If a built frontend exists in frontend/dist, serve it directly from Django.
    dist_index = os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html')
    if os.path.exists(dist_index):
        def _serve_built_spa(request):
            try:
                with open(dist_index, 'r', encoding='utf-8') as fh:
                    return HttpResponse(fh.read(), content_type='text/html')
            except Exception:
                return HttpResponseNotFound('Built frontend not found')

        urlpatterns += [
            path('teacher/', _serve_built_spa),
        ]
    else:
        # During active frontend development, redirect to Vite dev server
        urlpatterns += [
            path('teacher/', RedirectView.as_view(url='http://localhost:5173/teacher/', permanent=False)),
        ]
