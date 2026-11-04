# comics/serializers.py
from rest_framework import serializers
from .models import Perfil, Comic, ComicAutor, Etiqueta, ComicExterno

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


class ComicSerializer(serializers.ModelSerializer):
    # Compatibilidad con el frontend actual
    descripcion = serializers.CharField(source='sinopsis')
    img = serializers.ImageField(source='portada', read_only=True)
    recaudado = serializers.IntegerField(source='recaudacion_actual')
    meta = serializers.IntegerField(source='meta_recaudacion')

    # Autores y etiquetas
    autores = AutorSerializer(many=True, read_only=True)
    etiquetas = serializers.SerializerMethodField()      # 👈 CAMBIA
    autor = serializers.SerializerMethodField()
    generos = serializers.SerializerMethodField()

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