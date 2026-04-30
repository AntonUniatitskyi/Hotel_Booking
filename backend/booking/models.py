__author__ = "Anton Uniatitskyi"
__version__ = "1.0.0"

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.hashers import make_password, check_password

class Client(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='client'
    )
    age = models.PositiveIntegerField(verbose_name="Вік")
    last_login = models.DateTimeField(null=True, blank=True, verbose_name="Останній вхід")

    def update_last_login(self):
        """Обновляет время последнего входа"""
        self.last_login = timezone.now()
        self.save(update_fields=['last_login'])

    @property
    def first_name(self):
        return self.user.first_name

    @property
    def email(self):
        return self.user.email

    @property
    def last_name(self):
        return self.user.last_name

    @property
    def fullname(self):
        return f"{self.last_name} {self.first_name}"

    def __str__(self) -> str:
        return f"{self.fullname}"


class Hostel(models.Model):
    name = models.CharField(max_length=100, verbose_name="Назва готелю")
    about = models.TextField(verbose_name="Опис готелю")
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    city = models.CharField(max_length=100, verbose_name="Місто", default="Київ")
    address = models.CharField(max_length=255, verbose_name="Вулиця та номер будинку")
    main_image = models.ImageField(
        upload_to='hostels/main/',
        null=True,
        blank=True,
        verbose_name="Головне фото готелю"
    )
    is_active = models.BooleanField(default=False, verbose_name="Активний")

    def get_room(self):
        return self.rooms.order_by("bed")

    def __str__(self) -> str:
        return f"{self.name}"

    def get_comments(self):
        return self.comments.all()

class HostelImage(models.Model):
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name="gallery_images")
    image = models.ImageField(upload_to='hostels/gallery/', verbose_name="Фото території")

class Room(models.Model):
    number = models.PositiveIntegerField(verbose_name="Кімната")
    price = models.PositiveIntegerField(verbose_name="Ціна")
    bed = models.PositiveIntegerField(verbose_name="Кількість спальних місць")
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name="rooms")
    preview = models.ImageField(upload_to='rooms/previews/', null=True, blank=True, verbose_name="Головне фото кімнати")

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
    request_text = models.TextField(verbose_name="Текст заявки", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(
        choices=[
            (True, "Підтверджено"),
            (False, "Відхилено")
        ],
    null=True
    )

    def __str__(self) -> str:
        return f"{self.client}, {self.room}, {self.price}, {self.start_date}, {self.last_date}, {self.created_at}"

class Reviews(models.Model):
    hostel = models.ForeignKey(Hostel, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    text = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('hostel', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"Відгук від {self.user.username} на {self.hostel.name}"

class PromoParticipant(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True, error_messages={'unique': 'Учасник з таким Email вже зареєстрований. Спробуйте інший Email.'})
    phone = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']