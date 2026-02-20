from datetime import datetime, timedelta

from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from .permissions import IsAdminOrReadOnly, IsClientOrAdmin

from .models import Booking, Client, Hostel
from .serializers import (BookingSerializer, ClientSerializer,
                          HostelSerializer, RegisterSerializer, RoomSerializer)


class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer
    # Вимоги 4.1: Пошук по ключовому слову
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'about']
    permission_classes = [IsAdminOrReadOnly]

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        hostel = self.get_object()
        date_str = request.query_params.get('date')
        if date_str:
            try:
                check_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"error": "Неправильний формат дати. Використовуйте YYYY-MM-DD."}, status=400)
        else:
            check_date = timezone.now().date()

        active_bookings = Booking.objects.filter(
            room__hostel=hostel,
            start_date__lte=check_date,
            last_date__gte=check_date,
            approved=True
        )
        booked_room_ids = active_bookings.values_list('room_id', flat=True)

        all_rooms = hostel.rooms.all()
        booked_rooms = all_rooms.filter(id__in=booked_room_ids)
        free_rooms = all_rooms.exclude(id__in=booked_room_ids)

        return Response({
            "date": check_date,
            "total_free_seats": sum(r.bed for r in free_rooms),
            "total_booked_seats": sum(r.bed for r in booked_rooms),
            "free_rooms": RoomSerializer(free_rooms, many=True).data,
            "booked_rooms": RoomSerializer(booked_rooms, many=True).data,
            "booked_details": BookingSerializer(active_bookings, many=True).data
        })

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsClientOrAdmin]
    # Вимога 2.6, 2.7 та 4.2: Сортування за ПІБ та пошук за Email
    filter_backends = [filters.OrderingFilter, filters.SearchFilter]
    ordering_fields = ['user__first_name', 'user__last_name']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']

    def get_queryset(self):
        user = self.request.user
        # Проверяем аутентификацию и тип
        if user.is_authenticated and getattr(user, 'is_staff', False):
            return Client.objects.all()
        return Client.objects.filter(user=user)


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, IsClientOrAdmin]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['room__hostel', 'client']

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and getattr(user, 'is_staff', False):
            return Booking.objects.all()
        return Booking.objects.filter(client__user=user)

    def destroy(self, request, *args, **kwargs):
        booking = self.get_object()
        today = timezone.now().date()
        time_diff = booking.start_date - today

        if time_diff < timedelta(days=1):
            return Response(
                {"error": "Скасування неможливе: до заїзду залишилося менше 24 годин."},
                status=status.HTTP_400_BAD_REQUEST
            )

        self.perform_destroy(booking)
        return Response(
            {"message": "Бронювання успішно скасовано."},
            status=status.HTTP_204_NO_CONTENT
        )

    def perform_create(self, serializer):
        user = self.request.user
        client = getattr(user, 'client', None)

        if not getattr(user, 'is_staff', False) and client:
            serializer.save(client=client)
        else:
            serializer.save()


class RegisterView(generics.CreateAPIView):
    queryset = Client.objects.all()
    permission_classes = [AllowAny]  # Дозволяємо всім реєструватися
    serializer_class = RegisterSerializer
