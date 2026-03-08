from django.test import TestCase
from django.contrib.auth.models import User
from .models import Client, Hostel, Room, Booking
from datetime import date, timedelta
from rest_framework.exceptions import ValidationError
from .serializers import BookingSerializer
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
# Create your tests here.

class HotelModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', first_name='Test', last_name='User')
        self.client_profile = Client.objects.create(user=self.user, age=18)
        self.hostel = Hostel.objects.create(name="KPI Hostel", city="Kyiv", address="Polytechnic st.")
        self.room = Room.objects.create(number=101, price=500, bed=2, hostel=self.hostel)

    def test_client_properties(self):
        self.assertEqual(self.client_profile.fullname, "User Test")
        self.assertEqual(self.client_profile.first_name, "Test")

    def test_booking_creation(self):
        booking = Booking.objects.create(
            client=self.client_profile,
            room=self.room,
            price=1000,
            start_date=date.today(),
            last_date=date.today() + timedelta(days=2)
        )
        self.assertEqual(Booking.objects.count(), 1)
        self.assertIn("Test", str(booking))

class BookingSerializerTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='guest')
        self.guest_client = Client.objects.create(user=self.user, age=20)
        self.hostel = Hostel.objects.create(name="Test")
        self.room = Room.objects.create(number=1, price=100, bed=1, hostel=self.hostel)

    def test_invalid_dates(self):
        data = {
            "client": self.guest_client.pk,
            "room": self.room.pk,
            "start_date": date.today() + timedelta(days=5),
            "last_date": date.today() + timedelta(days=2),
        }
        serializer = BookingSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("start_date", serializer.errors)

class BookingAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='anton', password='password123')
        self.client_profile = Client.objects.create(user=self.user, age=19)
        self.hostel = Hostel.objects.create(name="Luxury", city="Kyiv")
        self.room = Room.objects.create(number=7, price=1000, bed=1, hostel=self.hostel)
        self.booking = Booking.objects.create(
            client=self.client_profile,
            room=self.room,
            price=1000,
            start_date=date.today(),
            last_date=date.today() + timedelta(days=2)
        )
        self.client.force_authenticate(user=self.user)
