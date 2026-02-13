from rest_framework import serializers
from .models import Hostel, Room, Client, Booking
from django.utils import timezone

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'fullname', 'email', 'age', 'last_login']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'number', 'price', 'bed', 'hostel']

class HostelSerializer(serializers.ModelSerializer):
    free_seats = serializers.SerializerMethodField()
    rooms = RoomSerializer(many=True, read_only=True, source='room_set')

    class Meta:
        model = Hostel
        fields = ['id', 'name', 'about', 'adress', 'free_seats', 'rooms']

    def get_free_seats(self, obj):
        return sum(room.bed for room in obj.room_set.all())

class BookingSerializer(serializers.ModelSerializer):
    price = serializers.IntegerField(read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'client', 'room', 'start_date', 'last_date', 'total_price', 'approved']

    def validate(self, data):
        start = data['start_date']
        end = data['last_date']
        room = data['room']

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

        return data

    def create(self, validated_data):
        room = validated_data['room']
        start = validated_data['start_date']
        end = validated_data['last_date']

        days = (end - start).days
        if days == 0: days = 1

        validated_data['price'] = days * room.price

        return super().create(validated_data)
