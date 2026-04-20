from datetime import datetime, timedelta

from django.http import HttpResponse
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.decorators import action
from rest_framework.response import Response
from .permissions import IsAdminOrReadOnly, IsClientOrAdmin, IsAuthorOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Booking, Client, Hostel, Room, RoomImage, Reviews
from .serializers import (BookingSerializer, ClientSerializer,
                          HostelSerializer, RegisterSerializer,
                          RoomSerializer, NotificationSerializer,
                          ReviewsSerializer)

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from .services.pdf_service import InvoicePDFGenerator


class ReviewsPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class ReviewsViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewsSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    pagination_class = ReviewsPagination
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['hostel']

    def get_queryset(self):
        return Reviews.objects.select_related('user', 'hostel').all()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)


class RoomViewSet(viewsets.ModelViewSet):
    serializer_class = RoomSerializer
    filterset_fields = ['hostel']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Room.objects.all()

        if user.is_staff:
            return Room.objects.filter(hostel__admin=user)
        return Room.objects.all()

    def perform_create(self, serializer):
        hostel = serializer.validated_data.get('hostel')
        if not self.request.user.is_superuser:
            if hostel.admin != self.request.user:
                raise PermissionDenied("Ви не можете додавати номери до чужого готелю!")

        room = serializer.save()
        images_data = self.request.FILES.getlist('uploaded_images')
        for image_data in images_data:
            RoomImage.objects.create(room=room, image=image_data)

    def perform_update(self, serializer):
        room = self.get_object()
        if not self.request.user.is_superuser and room.hostel.admin != self.request.user:
            raise PermissionDenied("Ви не можете редагувати номери в чужому готелі!")

        serializer.save()


class HostelViewSet(viewsets.ModelViewSet):
    queryset = Hostel.objects.all()
    serializer_class = HostelSerializer
    # Вимоги 4.1: Пошук по ключовому слову
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'about', 'city', 'address']
    permission_classes = [IsAdminOrReadOnly]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Hostel.objects.all()
        if user.is_staff:
            return Hostel.objects.filter(admin=user)
        return Hostel.objects.filter(is_active=True)

    def perform_create(self, serializer):
        serializer.save(admin=self.request.user)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser])
    def upload_image(self, request, pk=None):
        hostel = self.get_object()
        images = request.FILES.getlist('images')

        if not images:
            return Response({"error": "Фото не передані"}, status=400)

        created= []
        for image in images:
            obj = HostelImage.objects.create(hostel=hostel, image=image)
            created.append(HostelImageSerializer(obj).data)

        return Response(created, status=201)

    @action(detail=True, methods=['delete'], url_path='delete_image/(?P<image_id>[^/.]+)')
    def delete_image(self, request, pk=None, image_id=None):
        hostel = self.get_object()
        image = get_object_or_404(HostelImage, id=image_id, hostel=hostel)
        image.delete()
        return Response(status=204)

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
        ).select_related('room__hostel', 'client__user')
        booked_room_ids = active_bookings.values_list('room_id', flat=True)

        all_rooms = hostel.rooms.select_related('hostel').prefetch_related('images').all()
        booked_rooms = all_rooms.filter(id__in=booked_room_ids)
        free_rooms = all_rooms.exclude(id__in=booked_room_ids)

        return Response({
            "date": check_date,
            "total_free_seats": free_rooms.aggregate(total=Sum('bed'))['total'] or 0,
            "total_booked_seats": booked_rooms.aggregate(total=Sum('bed'))['total'] or 0,
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
        if user.is_staff:
            return Client.objects.all()
        return Client.objects.filter(user=user)

    @action(detail=False, methods=['get', 'patch', 'put'], permission_classes=[IsAuthenticated])
    def me(self, request):
        user = request.user

        if user.is_staff and not hasattr(user, 'client'):
            return Response({
                "id": None,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "fullname": f"{user.last_name} {user.first_name}".strip(),
                "role": "admin",
                "message": "Ви адміністратор без профілю клієнта."
            })
        client = get_object_or_404(Client, user=user)
        if request.method == 'GET':
            serializer = self.get_serializer(client)
            data = serializer.data
            data['role'] = 'admin' if user.is_staff else 'client'
            return Response(data)

        partial = request.method == 'PATCH'
        serializer = self.get_serializer(client, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)


class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated, IsClientOrAdmin]

    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['room__hostel', 'client']

    def get_queryset(self):
        user = self.request.user
        base_qs = Booking.objects.select_related(
            'room__hostel__admin', 'client__user'
        )

        if user.is_superuser:
            return base_qs

        if user.is_staff:
            # Адмін бачить бронювання тільки ТИХ номерів,
            # які належать до ЙОГО готелів
            return base_qs.filter(room__hostel__admin=user)
        return base_qs.filter(client__user=user)

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

        if client:
            serializer.save(client=client)
        else:
            serializer.save()

    @action(detail=True, methods=['get'])
    def download_invoice(self, request, pk=None):
        booking = self.get_object()
        try:
            buffer = InvoicePDFGenerator(booking).generate()
        except Exception:
            return Response({"error": "Помилка генерації PDF"}, status=500)

        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="invoice_{booking.id}.pdf"'
        return response


class RegisterView(generics.CreateAPIView):
    queryset = Client.objects.all()
    permission_classes = [AllowAny]  # Дозволяємо всім реєструватися
    serializer_class = RegisterSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.notifications.all().order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='read')
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'прочитано'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='read-all')
    def mark_all_as_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'status': 'всі сповіщення прочитані'}, status=status.HTTP_200_OK)