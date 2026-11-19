# comics/serializers.py
from rest_framework import serializers
from .models import Perfil, Comic, ComicAutor, Etiqueta, ComicExterno, ComicEtiqueta, Capitulo, NivelRecompensa, PaginaAvance, Donacion, PaginaCapitulo      

from django.contrib.auth.models import User

from django.utils import timezone

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
    
    

class ComicUpdateSerializer(serializers.ModelSerializer):
    etiquetas = serializers.ListField(
        child=serializers.CharField(), required=False, write_only=True
    )

    class Meta:
        model = Comic
        fields = [
            'titulo', 'sinopsis', 'portada', 'numero_paginas',
            'meta_recaudacion', 'estado', 'crowdfunding_activo',
            'fecha_inicio', 'fecha_fin',
            'etiquetas',
        ]
        extra_kwargs = {
            'portada': {'required': False},
            'titulo': {'required': False},
            'sinopsis': {'required': False},
        }

    def update(self, instance, validated_data):
        nombres_etiquetas = validated_data.pop('etiquetas', None)

        # Si NO envían portada nueva, no borrar la existente
        if 'portada' not in validated_data or validated_data['portada'] is None:
            validated_data.pop('portada', None)

        # Actualizar campos normales
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Reemplazar etiquetas si vienen
        if nombres_etiquetas is not None:
            ComicEtiqueta.objects.filter(comic=instance).delete()
            for nombre in nombres_etiquetas:
                etiqueta, _ = Etiqueta.objects.get_or_create(nombre=nombre)
                ComicEtiqueta.objects.get_or_create(comic=instance, etiqueta=etiqueta)

        return instance


# =====================================================================
# CREAR CAPÍTULO
# =====================================================================

class CapituloCreateSerializer(serializers.ModelSerializer):
    
    paginas_count = serializers.SerializerMethodField()

    
    class Meta:
        model = Capitulo
        fields = ['id', 'numero', 'titulo', 'contenido',
                  'fecha_publicacion', 'es_gratis', 'paginas_count']
        read_only_fields = ['id', 'paginas_count']
        
        
    def get_paginas_count(self, obj):
        if not obj.pk:
            return 0
        return obj.paginas.count()


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
    
    apoyos = serializers.SerializerMethodField()

    dias_restantes = serializers.SerializerMethodField()
    
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
            'apoyos',
            'dias_restantes',
        ]

    def get_dias_restantes(self, obj):
        if not obj.fecha_fin:
            return None
        delta = obj.fecha_fin - timezone.now()
        return max(0, delta.days)
    
    
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

    def get_apoyos(self, obj):
        return obj.donaciones.filter(
            estado_pago=Donacion.EstadoPago.COMPLETADO
        ).count()
        

        
        
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
    
    
    



class PerfilUpdateSerializer(serializers.ModelSerializer):
    gustos = serializers.ListField(
        child=serializers.CharField(), required=False, write_only=True
    )
    comics_leidos = serializers.ListField(
        child=serializers.CharField(), required=False, write_only=True
    )
    usuario_email = serializers.CharField(source='usuario.email', read_only=True)
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    es_creador = serializers.BooleanField(read_only=True)

    class Meta:
        model = Perfil
        fields = [
            'id', 'nickname', 'edad', 'bio', 'avatar',
            'gustos', 'comics_leidos',
            'usuario_email', 'usuario_username', 'es_creador',
        ]

    def validate_nickname(self, value):
        perfil_actual = self.instance
        qs = Perfil.objects.filter(nickname=value)
        if perfil_actual:
            qs = qs.exclude(pk=perfil_actual.pk)
        if qs.exists():
            raise serializers.ValidationError('Este nickname ya está en uso.')
        return value

    def to_representation(self, instance):
        """Salida con nombres, no con IDs, para que el front lo use directo."""
        return {
            'id': instance.id,
            'username': instance.usuario.username,
            'email': instance.usuario.email,
            'nickname': instance.nickname,
            'edad': instance.edad,
            'bio': instance.bio,
            'es_creador': instance.es_creador,
            'generos': [e.nombre for e in instance.gustos.all()],
            'leidos': [c.nombre for c in instance.comics_leidos.all()],
        }

    def update(self, instance, validated_data):
        nombres_gustos = validated_data.pop('gustos', None)
        titulos_leidos = validated_data.pop('comics_leidos', None)

        # Campos directos
        for attr in ('nickname', 'edad', 'bio'):
            if attr in validated_data:
                setattr(instance, attr, validated_data[attr])

        # Avatar: si viene None, se conserva
        if validated_data.get('avatar') is not None:
            instance.avatar = validated_data['avatar']

        instance.save()

        # Gustos: reemplazo completo si vienen
        if nombres_gustos is not None:
            etiquetas = Etiqueta.objects.filter(nombre__in=nombres_gustos)
            instance.gustos.set(etiquetas)

        # Cómics leídos
        if titulos_leidos is not None:
            comics_obj = ComicExterno.objects.filter(nombre__in=titulos_leidos)
            instance.comics_leidos.set(comics_obj)

        return instance
    
    
class PaginaAvanceSerializer(serializers.ModelSerializer):
    img = serializers.ImageField(source='imagen', read_only=True)

    class Meta:
        model = PaginaAvance
        fields = ['id', 'img', 'orden', 'fecha_subida']
        
        
class DonacionSerializer(serializers.ModelSerializer):
    """Para GET (listar mis donaciones)."""
    comic_titulo = serializers.CharField(source='comic.titulo', read_only=True)
    comic_img = serializers.ImageField(source='comic.portada', read_only=True)
    nivel_recompensa_titulo = serializers.CharField(
        source='nivel_recompensa.titulo', read_only=True
    )

    class Meta:
        model = Donacion
        fields = [
            'id', 'comic', 'comic_titulo', 'comic_img',
            'monto', 'fecha', 'estado_pago',
            'es_anonima', 'mensaje', 'direccion_envio',
            'nivel_recompensa', 'nivel_recompensa_titulo',
        ]


class DonacionCreateSerializer(serializers.ModelSerializer):
    """Para POST (crear donación simulada)."""
    class Meta:
        model = Donacion
        fields = ['comic', 'monto', 'es_anonima', 'mensaje',
                  'direccion_envio', 'nivel_recompensa']
        extra_kwargs = {
            'nivel_recompensa': {'required': False, 'allow_null': True},
            'mensaje': {'required': False},
            'direccion_envio': {'required': False},
            'es_anonima': {'required': False},
        }

    def validate(self, data):
        comic = data['comic']

        # El cómic debe aceptar donaciones
        if not comic.crowdfunding_activo:
            raise serializers.ValidationError(
                {'comic': 'Este cómic no está aceptando donaciones.'}
            )
        if comic.estado not in [Comic.Estado.EN_CAMPANA, Comic.Estado.PUBLICADO]:
            raise serializers.ValidationError(
                {'comic': 'Este cómic no está en campaña activa.'}
            )
        if comic.fecha_fin and comic.fecha_fin < timezone.now():
            raise serializers.ValidationError(
                {'comic': 'La campaña ha terminado.'}
            )
        if data['monto'] < 1:
            raise serializers.ValidationError(
                {'monto': 'El monto debe ser mayor que cero.'}
            )

        # Auto-asignar recompensa si no viene y hay una que aplica
        if not data.get('nivel_recompensa'):
            recompensa = (
                comic.recompensas
                .filter(monto_minimo__lte=data['monto'])
                .order_by('-monto_minimo')
                .first()
            )
            if recompensa:
                data['nivel_recompensa'] = recompensa

        return data

    def create(self, validated_data):
        request = self.context['request']
        # Modo simulado: se marca como completada al instante.
        # Cuando se integre Transbank, este campo empieza en 'pendiente'.
        return Donacion.objects.create(
            usuario=request.user,
            estado_pago=Donacion.EstadoPago.COMPLETADO,
            **validated_data,
        )
        
class PaginaCapituloSerializer(serializers.ModelSerializer):
    img = serializers.ImageField(source='imagen', read_only=True)

    class Meta:
        model = PaginaCapitulo
        fields = ['id', 'img', 'orden', 'fecha_subida']