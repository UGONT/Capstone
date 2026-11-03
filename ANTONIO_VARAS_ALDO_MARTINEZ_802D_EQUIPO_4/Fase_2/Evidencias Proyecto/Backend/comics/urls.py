from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    ComicViewSet,
    ComicExternoViewSet,
    EtiquetaViewSet,
    RegisterView,
    MeView,
    LoginView,
    actualizar_mis_gustos,
)

router = DefaultRouter()
router.register(r'comics', ComicViewSet, basename='comic')
router.register(r'comics-externos', ComicExternoViewSet, basename='comic-externo')
router.register(r'etiquetas', EtiquetaViewSet, basename='etiqueta')

urlpatterns = [
    path('perfil/gustos/', actualizar_mis_gustos, name='actualizar-gustos'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/registro/', RegisterView.as_view(), name='registro'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
]

urlpatterns += router.urls