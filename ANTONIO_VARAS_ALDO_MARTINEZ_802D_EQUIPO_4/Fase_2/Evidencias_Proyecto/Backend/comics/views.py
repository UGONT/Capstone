from django.shortcuts import render
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly
# comics/views.py
from rest_framework import viewsets, mixins, status
from .models import Comic, ComicExterno, Etiqueta, Perfil, PaginaAvance, Donacion, PaginaCapitulo
from .serializers import (
    ComicSerializer, ComicExternoSerializer, EtiquetaSerializer, 
    RegistroSerializer, LoginSerializer, ComicCreateSerializer, 
    CapituloCreateSerializer, NivelRecompensaSerializer, Capitulo, NivelRecompensa, 
    ComicUpdateSerializer, PerfilUpdateSerializer, PaginaAvanceSerializer, DonacionSerializer, DonacionCreateSerializer, PaginaCapituloSerializer, PerfilPublicoSerializer   )



from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response


from rest_framework.views import APIView


from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.exceptions import PermissionDenied


from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


def _puede_ver_capitulo(capitulo, user):
    """Devuelve True si el user puede leer el capítulo."""
    if capitulo.es_gratis:
        return True
    if not user or not user.is_authenticated:
        return False
    if capitulo.comic.autores.filter(autor=user).exists():
        return True
    return Donacion.objects.filter(
        comic=capitulo.comic,
        usuario=user,
        estado_pago=Donacion.EstadoPago.COMPLETADO,
    ).exists()

class ComicViewSet(viewsets.ModelViewSet):
    queryset = Comic.objects.all().order_by('-fecha_creacion')
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ['get', 'post', 'patch', 'delete']   

    def get_serializer_class(self):
        if self.action == 'create':
            return ComicCreateSerializer
        if self.action == 'partial_update':
            return ComicUpdateSerializer
        return ComicSerializer

    def _verificar_autor(self, comic):
        if not comic.autores.filter(autor=self.request.user).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No eres autor de este cómic.')

    def perform_create(self, serializer):
        perfil = getattr(self.request.user, 'perfil', None)
        if not perfil or not perfil.es_creador:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Solo los creadores pueden publicar cómics.')
        serializer.save()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comic = serializer.save()
        salida = ComicSerializer(comic, context={'request': request})
        return Response(salida.data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        comic = self.get_object()
        self._verificar_autor(comic)

        serializer = self.get_serializer(comic, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        comic = serializer.save()

        # Devolver el cómic con el serializer completo (con autores, etiquetas, etc.)
        salida = ComicSerializer(comic, context={'request': request})
        return Response(salida.data)

    def destroy(self, request, *args, **kwargs):
        comic = self.get_object()
        self._verificar_autor(comic)
        return super().destroy(request, *args, **kwargs)
    
    
        # ----- Endpoint anidado: /api/comics/{id}/capitulos/ -----
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def capitulos(self, request, pk=None):
        comic = self.get_object()

        # Validar que el user sea autor
        if not comic.autores.filter(autor=request.user).exists():
            return Response(
                {'error': 'No eres autor de este cómic.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Auto-asignar número si no viene
        data = request.data.copy()
        if not data.get('numero'):
            ultimo = comic.capitulos.order_by('-numero').first()
            data['numero'] = (ultimo.numero + 1) if ultimo else 1

        serializer = CapituloCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(comic=comic)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # ----- Endpoint anidado: /api/comics/{id}/recompensas/ -----
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def recompensas(self, request, pk=None):
        comic = self.get_object()

        if not comic.autores.filter(autor=request.user).exists():
            return Response(
                {'error': 'No eres autor de este cómic.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = NivelRecompensaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(comic=comic)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # ----- Endpoint: /api/comics/{id}/avance/ -----
    @action(detail=True, methods=['get', 'post'],
            permission_classes=[IsAuthenticated],
            parser_classes=[MultiPartParser, FormParser])
    def avance(self, request, pk=None):
        """
        GET  → lista las páginas de avance (solo autor o donante)
        POST → sube una nueva página (solo autor)
        """
        comic = self.get_object()
        es_autor = comic.autores.filter(autor=request.user).exists()

        # GET
        if request.method == 'GET':
            if not es_autor:
                # Verificar si donó
                dono = Donacion.objects.filter(
                    comic=comic,
                    usuario=request.user,
                    estado_pago=Donacion.EstadoPago.COMPLETADO,
                ).exists()
                if not dono:
                    return Response(
                        {'error': 'Solo autores y donantes pueden ver el avance.'},
                        status=status.HTTP_403_FORBIDDEN,
                    )

            paginas = comic.paginas_avance.all()
            return Response(PaginaAvanceSerializer(paginas, many=True).data)

        # POST
        if not es_autor:
            return Response(
                {'error': 'Solo el autor puede subir páginas de avance.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        imagen = request.FILES.get('imagen')
        if not imagen:
            return Response(
                {'error': 'Falta el archivo "imagen".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orden = comic.paginas_avance.count()
        pagina = PaginaAvance.objects.create(
            comic=comic,
            imagen=imagen,
            orden=orden,
        )
        return Response(
            PaginaAvanceSerializer(pagina).data,
            status=status.HTTP_201_CREATED,
        )
        

    @action(
        detail=True, methods=['get', 'post'],
        permission_classes=[IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser],
    )
    def paginas(self, request, pk=None):
        """
        GET  → lista páginas del capítulo (con validación de permisos)
        POST → sube una página nueva (solo autor)
        """
        capitulo = self.get_object()
        es_autor = capitulo.comic.autores.filter(autor=request.user).exists()

        # GET
        if request.method == 'GET':
            if not _puede_ver_capitulo(capitulo, request.user):
                return Response(
                    {'error': 'Este capítulo es exclusivo para donantes.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            paginas = capitulo.paginas.all()
            return Response(PaginaCapituloSerializer(paginas, many=True).data)

        # POST
        if not es_autor:
            return Response(
                {'error': 'Solo el autor puede subir páginas.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        imagen = request.FILES.get('imagen')
        if not imagen:
            return Response(
                {'error': 'Falta el archivo "imagen".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orden = capitulo.paginas.count()
        pagina = PaginaCapitulo.objects.create(
            capitulo=capitulo, imagen=imagen, orden=orden,
        )
        return Response(
            PaginaCapituloSerializer(pagina).data,
            status=status.HTTP_201_CREATED,
        )
    
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
        'nickname': perfil.nickname, 
        'edad': perfil.edad,
        'bio': perfil.bio, 
        'avatar': perfil.avatar.url if perfil.avatar else None,
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
    
    
    
def _verificar_autor_comic(comic, user):
    """Lanza 403 si el user no es autor del cómic."""
    if not comic.autores.filter(autor=user).exists():
        raise PermissionDenied('No eres autor de este cómic.')


class CapituloViewSet(viewsets.ModelViewSet):
    """
    GET    /api/capitulos/?comic=X     → lista de capítulos de un cómic
    PATCH  /api/capitulos/{id}/        → editar
    DELETE /api/capitulos/{id}/        → eliminar
    """
    serializer_class = CapituloCreateSerializer
    permission_classes = [IsAuthenticated]
    queryset = Capitulo.objects.all().select_related('comic')
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        qs = super().get_queryset()
        comic_id = self.request.query_params.get('comic')
        if comic_id:
            qs = qs.filter(comic_id=comic_id)
        return qs

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        _verificar_autor_comic(obj.comic, request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        _verificar_autor_comic(obj.comic, request.user)
        return super().destroy(request, *args, **kwargs)


class NivelRecompensaViewSet(viewsets.ModelViewSet):
    """
    GET    /api/recompensas/?comic=X   → lista de recompensas de un cómic
    PATCH  /api/recompensas/{id}/      → editar
    DELETE /api/recompensas/{id}/      → eliminar
    """
    serializer_class = NivelRecompensaSerializer
    permission_classes = [IsAuthenticated]
    queryset = NivelRecompensa.objects.all().select_related('comic')
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        qs = super().get_queryset()
        comic_id = self.request.query_params.get('comic')
        if comic_id:
            qs = qs.filter(comic_id=comic_id)
        return qs

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        _verificar_autor_comic(obj.comic, request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        _verificar_autor_comic(obj.comic, request.user)
        return super().destroy(request, *args, **kwargs)
    
    



class MiPerfilView(APIView):
    """
    GET   /api/perfil/   → devuelve el perfil del usuario logueado
    PATCH /api/perfil/   → actualiza nickname, edad, bio, avatar, gustos, leídos
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        perfil, _ = Perfil.objects.get_or_create(
            usuario=request.user,
            defaults={'nickname': request.user.username},
        )
        serializer = PerfilUpdateSerializer(perfil)
        return Response(serializer.data)

    def patch(self, request):
        perfil, _ = Perfil.objects.get_or_create(
            usuario=request.user,
            defaults={'nickname': request.user.username},
        )
        serializer = PerfilUpdateSerializer(
            perfil, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class PaginaAvanceViewSet(viewsets.ModelViewSet):
    """
    DELETE /api/avance/{id}/  → borrar una página (solo el autor)
    """
    serializer_class = PaginaAvanceSerializer
    permission_classes = [IsAuthenticated]
    queryset = PaginaAvance.objects.all().select_related('comic')
    http_method_names = ['delete']

    def destroy(self, request, *args, **kwargs):
        pagina = self.get_object()
        if not pagina.comic.autores.filter(autor=request.user).exists():
            raise PermissionDenied('No eres autor de este cómic.')
        return super().destroy(request, *args, **kwargs)
    

class DonacionViewSet(viewsets.ModelViewSet):
    """
    GET  /api/donaciones/  → mis donaciones (logueado)
    POST /api/donaciones/  → crear (simulada, completada al instante)
    """
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post']

    def get_queryset(self):
        return Donacion.objects.filter(
            usuario=self.request.user
        ).select_related('comic', 'nivel_recompensa').order_by('-fecha')

    def get_serializer_class(self):
        if self.action == 'create':
            return DonacionCreateSerializer
        return DonacionSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donacion = serializer.save()

        # Devolvemos con el serializer de lectura
        salida = DonacionSerializer(donacion)
        return Response(salida.data, status=status.HTTP_201_CREATED)
    
    
class PaginaCapituloViewSet(viewsets.ModelViewSet):
    """DELETE /api/paginas-capitulo/{id}/ → borrar una página."""
    serializer_class = PaginaCapituloSerializer
    permission_classes = [IsAuthenticated]
    queryset = PaginaCapitulo.objects.all().select_related('capitulo__comic')
    http_method_names = ['delete']

    def destroy(self, request, *args, **kwargs):
        pagina = self.get_object()
        if not pagina.capitulo.comic.autores.filter(autor=request.user).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No eres autor de este cómic.')
        return super().destroy(request, *args, **kwargs)
    
    
    
# comics/views.py

class CapituloViewSet(viewsets.ModelViewSet):
    """
    GET    /api/capitulos/?comic=X     → lista
    PATCH  /api/capitulos/{id}/        → editar
    DELETE /api/capitulos/{id}/        → eliminar
    GET    /api/capitulos/{id}/paginas/ → páginas (con permisos)
    POST   /api/capitulos/{id}/paginas/ → subir página (autor)
    """
    serializer_class = CapituloCreateSerializer
    permission_classes = [IsAuthenticated]
    queryset = Capitulo.objects.all().select_related('comic')
    http_method_names = ['get', 'post', 'patch', 'delete']   # 👈 incluye post

    def get_queryset(self):
        qs = super().get_queryset()
        comic_id = self.request.query_params.get('comic')
        if comic_id:
            qs = qs.filter(comic_id=comic_id)
        return qs

    def update(self, request, *args, **kwargs):
        obj = self.get_object()
        _verificar_autor_comic(obj.comic, request.user)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        _verificar_autor_comic(obj.comic, request.user)
        return super().destroy(request, *args, **kwargs)

    @action(
        detail=True, methods=['get', 'post'],
        permission_classes=[IsAuthenticated],
        parser_classes=[MultiPartParser, FormParser],
    )
    def paginas(self, request, pk=None):
        capitulo = self.get_object()
        es_autor = capitulo.comic.autores.filter(autor=request.user).exists()

        # GET
        if request.method == 'GET':
            if not _puede_ver_capitulo(capitulo, request.user):
                return Response(
                    {'error': 'Este capítulo es exclusivo para donantes.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            paginas = capitulo.paginas.all()
            return Response(PaginaCapituloSerializer(paginas, many=True).data)

        # POST
        if not es_autor:
            return Response(
                {'error': 'Solo el autor puede subir páginas.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        imagen = request.FILES.get('imagen')
        if not imagen:
            return Response(
                {'error': 'Falta el archivo "imagen".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        orden = capitulo.paginas.count()
        pagina = PaginaCapitulo.objects.create(
            capitulo=capitulo, imagen=imagen, orden=orden,
        )
        return Response(
            PaginaCapituloSerializer(pagina).data,
            status=status.HTTP_201_CREATED,
        )
        
        
class PerfilPublicoView(APIView):
    """GET /api/usuarios/{username}/ → perfil público (sin auth)."""
    permission_classes = [AllowAny]

    def get(self, request, username):
        try:
            perfil = Perfil.objects.select_related('usuario').prefetch_related(
                'gustos', 'usuario__comics_como_autor__comic'
            ).get(usuario__username=username)
        except Perfil.DoesNotExist:
            return Response(
                {'error': 'Usuario no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = PerfilPublicoSerializer(perfil, context={'request': request})
        return Response(serializer.data)