from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated, AllowAny
# comics/views.py
from rest_framework import viewsets, mixins
from .models import Comic, ComicExterno, Etiqueta
from .serializers import ComicSerializer, ComicExternoSerializer, EtiquetaSerializer, RegistroSerializer, LoginSerializer

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Perfil, Etiqueta, ComicExterno

from rest_framework import status
from rest_framework.views import APIView


from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken


class ComicViewSet(viewsets.ReadOnlyModelViewSet):
    #  GET /api/comics/       → lista todos los cómics
    #  GET /api/comics/{id}/  → detalle de un cómic
    queryset = Comic.objects.all().order_by('-id')
    serializer_class = ComicSerializer
    
class ComicExternoViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """GET /api/comics-externos/ — lista de cómics para elegir."""
    queryset = ComicExterno.objects.all()
    serializer_class = ComicExternoSerializer
    # permission_classes = [IsAuthenticated]  # opcional
    
class EtiquetaViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """GET /api/etiquetas/ — lista de etiquetas para elegir gustos."""
    queryset = Etiqueta.objects.all()
    serializer_class = EtiquetaSerializer
    
    
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def actualizar_mis_gustos(request):
    """
    PATCH /api/perfil/gustos/
    Body: { "gustos": [1,2,3], "comics_leidos": [4,5,6] }
    """
    perfil, _ = Perfil.objects.get_or_create(usuario=request.user)
    
    gustos_ids = request.data.get('gustos', [])
    comics_ids = request.data.get('comics_leidos', [])
    
    perfil.gustos.set(Etiqueta.objects.filter(id__in=gustos_ids))
    perfil.comics_leidos.set(ComicExterno.objects.filter(id__in=comics_ids))
    
    return Response({
        "gustos": [e.id for e in perfil.gustos.all()],
        "comics_leidos": [c.id for c in perfil.comics_leidos.all()],
    })
    
    
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'usuario': _serializar_usuario(user),
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
    
def _serializar_usuario(user):
    """Estructura que consume el front."""
    perfil, _ = Perfil.objects.get_or_create(
        usuario=user,
        defaults={'nickname': user.username},
    )
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'nombre': perfil.nickname,
        'edad': perfil.edad,
        'es_creador': perfil.es_creador,
        'generos': [e.nombre for e in perfil.gustos.all()],
        'leidos': [c.nombre for c in perfil.comics_leidos.all()],
    }


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response(
                {'error': 'Credenciales inválidas'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'usuario': _serializar_usuario(user),
        })


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_serializar_usuario(request.user))