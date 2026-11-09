# comics/serializers.py
from rest_framework import serializers
from .models import Perfil, Comic, ComicAutor, Etiqueta, ComicExterno, ComicEtiqueta, Capitulo, NivelRecompensa

from django.contrib.auth.models import User

class ComicExternoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComicExterno
        fields = ['id', 'nombre', 'autor', 'imagen_url']

class EtiquetaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etiqueta
        fields = ['id', 'nombre', 'tipo']

class AutorSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='autor.username', read_only=True)
    nickname = serializers.SerializerMethodField()
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)

    class Meta:
        model = ComicAutor
        fields = ['username', 'nickname', 'rol', 'rol_display', 'orden']

    def get_nickname(self, obj):
        if hasattr(obj.autor, 'perfil'):
            return obj.autor.perfil.nickname
        return obj.autor.username


# =====================================================================
# CREAR CÓMIC
# =====================================================================

class ComicCreateSerializer(serializers.ModelSerializer):
    # El front envía nombres de etiquetas, no IDs
    etiquetas = serializers.ListField(
        child=serializers.CharField(), required=False, write_only=True
    )
    # Duración en días → se calcula fecha_fin
    dias = serializers.IntegerField(required=False, write_only=True)

    class Meta:
        model = Comic
        fields = [
            'titulo', 'sinopsis', 'portada', 'numero_paginas',
            'meta_recaudacion', 'estado', 'crowdfunding_activo',
            'fecha_inicio', 'fecha_fin',
            'etiquetas', 'dias',
        ]
        extra_kwargs = {
            'portada': {'required': False},
            'estado': {'required': False},
            'fecha_inicio': {'required': False},
            'fecha_fin': {'required': False},
        }

    def create(self, validated_data):
        nombres_etiquetas = validated_data.pop('etiquetas', [])
        dias = validated_data.pop('dias', None)
        request = self.context.get('request')

        # Calcular fecha_inicio y fecha_fin
        from django.utils import timezone
        from datetime import timedelta

        if not validated_data.get('fecha_inicio'):
            validated_data['fecha_inicio'] = timezone.now()
        if dias and not validated_data.get('fecha_fin'):
            validated_data['fecha_fin'] = validated_data['fecha_inicio'] + timedelta(days=dias)

        # Estado por defecto si no viene
        validated_data.setdefault('estado', Comic.Estado.EN_CAMPANA)
        validated_data.setdefault('crowdfunding_activo', True)

        # Crear el cómic
        comic = Comic.objects.create(**validated_data)

        # El usuario logueado queda como autor_principal
        if request and request.user.is_authenticated:
            ComicAutor.objects.create(
                comic=comic,
                autor=request.user,
                rol=ComicAutor.Rol.AUTOR_PRINCIPAL,
                orden=0,
            )

        # Asociar etiquetas (crear si no existen)
        for nombre in nombres_etiquetas:
            etiqueta, _ = Etiqueta.objects.get_or_create(nombre=nombre)
            ComicEtiqueta.objects.get_or_create(comic=comic, etiqueta=etiqueta)

        return comic


# =====================================================================
# CREAR CAPÍTULO
# =====================================================================

class CapituloCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Capitulo
        fields = ['numero', 'titulo', 'contenido', 'fecha_publicacion', 'es_gratis']


# =====================================================================
# CREAR RECOMPENSA
# =====================================================================

class NivelRecompensaSerializer(serializers.ModelSerializer):
    class Meta:
        model = NivelRecompensa
        fields = ['id', 'titulo', 'descripcion', 'monto_minimo', 'stock', 'orden']




class ComicSerializer(serializers.ModelSerializer):
    # Compatibilidad con el frontend actual
    descripcion = serializers.CharField(source='sinopsis')
    img = serializers.ImageField(source='portada', read_only=True)
    recaudado = serializers.IntegerField(source='recaudacion_actual')
    meta = serializers.IntegerField(source='meta_recaudacion')

    # Autores y etiquetas
    autores = AutorSerializer(many=True, read_only=True)
    etiquetas = serializers.SerializerMethodField()     
    autor = serializers.SerializerMethodField()
    generos = serializers.SerializerMethodField()
    capitulos = CapituloCreateSerializer(many=True, read_only=True)         
    recompensas = NivelRecompensaSerializer(many=True, read_only=True) 

    class Meta:
        model = Comic
        fields = [
            'id',
            'titulo',
            'autor',
            'autores',
            'generos',
            'etiquetas',
            'descripcion',
            'img',
            'recaudado',
            'meta',
            'valoracion_promedio',
            'total_valoraciones',
            'estado',
            'crowdfunding_activo',
            'numero_paginas',
            'fecha_inicio',
            'fecha_fin',
            'capitulos', 
            'recompensas',
        ]

    def get_autor(self, obj):
        autores = obj.autores.select_related('autor').all()
        if not autores:
            return 'Anónimo'
        return ", ".join(
            (a.autor.perfil.nickname if hasattr(a.autor, 'perfil') else a.autor.username)
            for a in autores
        )

    def get_generos(self, obj):
        return [ce.etiqueta.nombre for ce in obj.etiquetas.select_related('etiqueta').all()]

    def get_etiquetas(self, obj):
        """Devuelve las etiquetas como objetos {id, nombre, tipo}."""
        return [
            {
                'id': ce.etiqueta.id,
                'nombre': ce.etiqueta.nombre,
                'tipo': ce.etiqueta.tipo,
            }
            for ce in obj.etiquetas.select_related('etiqueta').all()
        ]
        
        
class RegistroSerializer(serializers.Serializer):
    # Campos del User
    username = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)

    # Campos del Perfil
    nickname = serializers.CharField(max_length=50)
    edad = serializers.IntegerField(
        required=False, allow_null=True, min_value=1, max_value=120
    )
    es_creador = serializers.BooleanField(default=False)

    # Relaciones (IDs)
    gustos = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    comics_leidos = serializers.ListField(
        child=serializers.CharField(), required=False
    )

    def validate_username(self, value):
        if value and User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado.")
        return value

    def validate_nickname(self, value):
        if Perfil.objects.filter(nickname=value).exists():
            raise serializers.ValidationError("Este nickname ya está en uso.")
        return value

    def create(self, validated_data):
        # Extraer UNA SOLA VEZ los campos que no van al modelo directamente
        nombres_gustos = validated_data.pop('gustos', [])
        titulos_leidos = validated_data.pop('comics_leidos', [])
        password = validated_data.pop('password')  

        # Si no viene username, usar el email
        username = validated_data.get('username') or validated_data['email']

        # 1. Crear el User
        user = User.objects.create_user(
            username=username,
            email=validated_data['email'],
            password=password,                     
        )

        # 2. Crear/actualizar el Perfil (update_or_create por si hay señal)
        perfil, _ = Perfil.objects.update_or_create(
            usuario=user,
            defaults={
                'nickname': validated_data['nickname'],
                'edad': validated_data.get('edad'),
                'es_creador': validated_data.get('es_creador', False),
            },
        )

        # 3. Mapear nombres → objetos (solo los que existan)
        etiquetas = Etiqueta.objects.filter(nombre__in=nombres_gustos)
        perfil.gustos.set(etiquetas)

        comics_obj = ComicExterno.objects.filter(nombre__in=titulos_leidos)
        perfil.comics_leidos.set(comics_obj)

        return user
    
class LoginSerializer(serializers.Serializer):
    email = serializers.CharField()   # acepta email o username
    password = serializers.CharField(write_only=True)
    
    
    
