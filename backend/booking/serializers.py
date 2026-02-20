from rest_framework import serializers
from .models import Hostel, Room, Client, Booking
from django.utils import timezone
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.db.models import Q


class ClientSerializer(serializers.ModelSerializer):
    first_name = serializers.ReadOnlyField()
    last_name = serializers.ReadOnlyField()
    email = serializers.ReadOnlyField()
    fullname = serializers.ReadOnlyField()
    class Meta:
        model = Client
        fields = ['id', 'first_name', 'last_name', 'email', 'fullname', 'age', 'last_login']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'number', 'price', 'bed', 'hostel']

class HostelSerializer(serializers.ModelSerializer):
    free_seats = serializers.SerializerMethodField()
    rooms = RoomSerializer(many=True, read_only=True)

    class Meta:
        model = Hostel
        fields = ['id', 'name', 'about', 'adress', 'free_seats', 'rooms']

    def get_free_seats(self, obj):
        return sum(room.bed for room in obj.rooms.all())

class BookingSerializer(serializers.ModelSerializer):
    price = serializers.IntegerField(read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'client', 'room', 'start_date', 'last_date', 'price', 'approved']

    def validate(self, attrs):
        start = attrs['start_date']
        end = attrs['last_date']
        room = attrs['room']

        if start >= end:
            raise serializers.ValidationError("Дата виїзду має бути пізніше дати заїзду.")

        if start < timezone.now().date():
            raise serializers.ValidationError("Не можна забронювати номер на минуле.")

        overlap = Booking.objects.filter(
            room=room,
            start_date__lt=end,
            last_date__gt=start
        ).exclude(pk=self.instance.pk if self.instance else None)

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

class ClientTokenObtainSerializer(TokenObtainPairSerializer):
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

        # ВАЖНО: Подменяем 'username' на реальный username пользователя из базы.
        # Теперь super().validate найдет его и выдаст токен.
        attrs['username'] = user.username

        data = super().validate(attrs)

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

class ClientTokenObtainView(TokenObtainPairView):
    serializer_class = ClientTokenObtainSerializer
