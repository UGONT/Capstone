from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from .services import get_agent_response






@api_view(['POST'])
@permission_classes([IsAuthenticated])   
def chat_view(request):
    mensaje = request.data.get('mensaje', '').strip()
    if not mensaje:
        return Response(
            {'error': "El campo 'mensaje' es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # El user_id sale del token, no del body ni de un fallback
    respuesta = get_agent_response(mensaje, user_id=request.user.id)

    return Response({
        'respuesta': respuesta,
        'user_id': request.user.id,
    })