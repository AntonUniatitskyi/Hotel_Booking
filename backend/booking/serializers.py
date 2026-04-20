from rest_framework import serializers

from .models import Hostel, HostelImage, Room, Client, Booking, RoomImage, Notification, Reviews
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.db.models import Q, Sum, Avg

class HostelImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HostelImage
        fields = ['id', 'image']

class ReviewsSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Reviews
        fields = ['id', 'user_name', 'rating', 'text', 'created_at', 'hostel']
        read_only_fields = ['id', 'user_name', 'created_at']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Рейтинг має бути від 1 до 5.")
        return value

class RoomImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoomImage
        fields = ['id', 'image']

class ClientSerializer(serializers.ModelSerializer):
    first_name = serializers.ReadOnlyField()
    last_name = serializers.ReadOnlyField()
    email = serializers.ReadOnlyField()
    fullname = serializers.ReadOnlyField()
    class Meta:
        model = Client
        fields = ['id', 'first_name', 'last_name', 'email', 'fullname', 'age', 'last_login']

class RoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.ReadOnlyField(source='hostel.name')
    hostel_address = serializers.ReadOnlyField(source='hostel.address')
    hostel_city = serializers.ReadOnlyField(source='hostel.city')
    images = RoomImageSerializer(many=True, read_only=True)
    class Meta:
        model = Room
        fields = ['id', 'number', 'price', 'bed', 'hostel', 'hostel_name', 'hostel_city', 'hostel_address', 'preview', 'images']

class HostelSerializer(serializers.ModelSerializer):
    free_seats = serializers.SerializerMethodField()
    rooms = RoomSerializer(many=True, read_only=True)
    gallery_images = HostelImageSerializer(many=True, read_only=True)
    reviews = ReviewsSerializer(many=True, read_only=True)

    average_rating = serializers.SerializerMethodField()

    class Meta:
        model = Hostel
        fields = ['id', 'name', 'about', 'city', 'address', 'main_image', 'free_seats', 'rooms', 'gallery_images', 'is_active', 'reviews', 'average_rating']

    def get_free_seats(self, obj):
        return obj.rooms.aggregate(total=Sum('bed'))['total'] or 0

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(total=Avg('rating'))['total'] or 0
        return round(avg, 1) if avg else 0

class BookingSerializer(serializers.ModelSerializer):
    price = serializers.IntegerField(read_only=True)

    client_details = ClientSerializer(source='client', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'client', 'room', 'start_date', 'last_date', 'price', 'approved', 'client_details', 'room_details']

    def validate(self, attrs):
        instance = self.instance
        start = attrs.get('start_date', instance.start_date if instance else None)
        end = attrs.get('last_date', instance.last_date if instance else None)
        room = attrs.get('room', instance.room if instance else None)

        if start and end:
            if start >= end:
                raise serializers.ValidationError({"start_date": "Дата виїзду має бути пізніше дати заїзду."})

            if not instance and start < timezone.now().date():
                raise serializers.ValidationError({"start_date": "Не можна забронювати номер на минуле."})

        if room and start and end:
            overlap = Booking.objects.filter(
                room=room,
                start_date__lt=end,
                last_date__gt=start
            ).exclude(pk=instance.pk if instance else None)

            if overlap.exists():
                raise serializers.ValidationError("Ця кімната вже зайнята на обрані дати.")

        return attrs

    def create(self, validated_data):
        room = validated_data['room']
        start = validated_data['start_date']
        end = validated_data['last_date']

        days = (end - start).days
        if days == 0: days = 1

        validated_data['price'] = days * room.price

        return super().create(validated_data)

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()

    class Meta:
        model = Client
        fields = ['username', 'first_name', 'last_name', 'email', 'age', 'password']

    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        email = validated_data.pop('email')

        user = User.objects.create(
            username=username,
            first_name=first_name,
            last_name=last_name,
            email=email
        )
        user.set_password(password) # Хешируем пароль
        user.save()
        client = Client.objects.create(user=user, **validated_data)

        return client

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Користувач з таким нікнеймом вже існує.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Користувач з такою поштою вже існує.")
        return value


class UniversalTokenObtainSerializer(TokenObtainPairSerializer):
    username_field = 'username'

    def validate(self, attrs):
        login_input = attrs.get("username")
        password = attrs.get("password")

        if not login_input or not password:
            raise serializers.ValidationError({"detail": "Логін та пароль обов'язкові."})

        user = User.objects.filter(
            Q(username=login_input) | Q(email=login_input)
        ).first()

        if not user:
            raise serializers.ValidationError({"detail": "Користувача з такими даними не знайдено."})

        if not user.check_password(str(password)):
            raise serializers.ValidationError({"detail": "Невірний пароль."})
        attrs['username'] = user.username
        data = super().validate(attrs)

        if user.is_superuser or user.is_staff:
            data['role'] = 'admin'
        else:
            data['role'] = 'client'

        client_profile = getattr(user, 'client', None)
        if client_profile:
            client_profile.update_last_login()
            data['client_id'] = client_profile.id
            data['fullname'] = client_profile.fullname
            data['age'] = client_profile.age

        data['username'] = user.username
        data['email'] = user.email
        data['first_name'] = user.first_name
        data['last_name'] = user.last_name

        return data

class UniversalTokenObtainView(TokenObtainPairView):
    serializer_class = UniversalTokenObtainSerializer

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'title', 'message', 'created_at']

