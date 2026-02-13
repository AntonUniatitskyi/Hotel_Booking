from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password

class Client(models.Model):
    fullname = models.CharField(max_length=100, verbose_name="Прізвище та імя")
    email = models.EmailField(max_length=100, verbose_name="Електронна пошта", unique=True)
    age = models.PositiveIntegerField(verbose_name="Вік")
    password = models.CharField(max_length=255, verbose_name="Пароль")
    last_login = models.DateTimeField(null=True, blank=True, verbose_name="Останній вхід")

    def set_password(self, raw_password):
        """Хеширует пароль перед сохранением"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Проверяет пароль с хешированным значением"""
        return check_password(raw_password, self.password)
    
    def update_last_login(self):
        """Обновляет время последнего входа"""
        self.last_login = timezone.now()
        self.save()

    def __str__(self) -> str:
        return f"{self.fullname}"


class Hostel(models.Model):
    name = models.CharField(max_length=100, verbose_name="Назва готелю")
    about = models.TextField(verbose_name="Опис готелю")
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    adress = models.TextField(max_length=200, verbose_name="Адреса хостелу")

    def get_room(self):
        return self.room_set.order_by('bed')

    def __str__(self) -> str:
        return f"{self.name}"
    
    def get_comments(self):
        return self.comment_set.all()

class Room(models.Model):
    number = models.PositiveIntegerField(verbose_name="Кімната")
    price = models.PositiveIntegerField(verbose_name="Ціна")
    bed = models.PositiveIntegerField(verbose_name="Кількість спальних місць")
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE)

    def get_image(self):
        return self.images.all()

    def __str__(self) -> str:
        return f"{self.number}"
    
class RoomImage(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="images", verbose_name="Кімната")
    image = models.ImageField(verbose_name="Фото кімнати", blank=True, upload_to='media/', null=True)

    def __str__(self):
        return f"Фото кімнати №{self.room.number}"
    
class Booking(models.Model):
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True)
    room = models.ForeignKey(Room, on_delete=models.CASCADE)
    price = models.PositiveIntegerField(verbose_name="Ціна")
    start_date = models.DateField(verbose_name="Дата початку")
    last_date = models.DateField(verbose_name="Дата кінця")
    created_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(null=True)

    def __str__(self) -> str:
        return f"{self.client}, {self.room}, {self.price}, {self.start_date}, {self.last_date}, {self.created_at}"
    
class Comment(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True)
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE)
    comment = models.TextField(max_length=300, verbose_name="Ваш коментар")
    comment_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.comment}, {self.comment_date}"
    
class PromoParticipant(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, error_messages={'unique': 'Учасник з таким Email вже зареєстрований. Спробуйте інший Email.'})
    phone = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name