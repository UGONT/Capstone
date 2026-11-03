from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .services import get_agent_response


USUARIO_TEST_USERNAME = 'hu'   # fallback para testear sin login


def _get_user_for_chat(request):
    """Devuelve el user logueado o el de test como fallback."""
    if request.user and request.user.is_authenticated:
        return request.user
    try:
        return User.objects.get(username=USUARIO_TEST_USERNAME)
    except User.DoesNotExist:
        return None


@api_view(['POST'])
@permission_classes([AllowAny])
def chat_view(request):
    mensaje = request.data.get('mensaje', '').strip()
    if not mensaje:
        return Response(
            {'error': "El campo 'mensaje' es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usuario = _get_user_for_chat(request)
    user_id = usuario.id if usuario else None

    respuesta = get_agent_response(mensaje, user_id=user_id)
    return Response({'respuesta': respuesta, 'user_id': user_id})