from django.forms import ModelForm, TextInput, EmailInput, NumberInput, PasswordInput, DateInput, Select, Textarea, FileInput, modelformset_factory
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import Client, Booking, Hostel, Room, RoomImage, Comment, PromoParticipant
from django import forms

class BookingForm(ModelForm):
    class Meta:
        model = Booking
        fields = ["client", "room", "start_date", "last_date", "price"]
        widgets = {
            "client": Select(attrs={
                'class': 'form-control form-control-my'
            }),
            "room": Select(attrs={
                'class': 'form-control form-control-my',
                'readonly': 'readonly',
            }),
            "start_date": DateInput(attrs={
                'class': 'form-control form-control-my',
                'type': 'date'
            }),
            "last_date": DateInput(attrs={
                'class': 'form-control form-control-my',
                'type': 'date'
            }),
            "price": TextInput(attrs={
                'class': 'form-control form-control-my',
                'readonly': 'readonly',
            })
        }

class RoomForm(ModelForm):
    class Meta:
        model = Room
        fields = ["number", "price", "bed", "hostel"]
        widgets = {
            "number": NumberInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Номер кімнати'
            }),
            "price": NumberInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Ціна в гривнях'
            }),
            "bed": NumberInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Кількіссть спальних місць'
            }),
            "hostel": Select(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Готель'
            })
        }

class RoomImageForm(ModelForm):
    class Meta:
        model = RoomImage
        fields = ["image"]
        widgets = {
            'image': FileInput(attrs={
                'class': 'form-control my form-control',
                'placeholder': 'Завантажити фото'
            })
        }

RoomImageFormSet = modelformset_factory(
    RoomImage,
    RoomImageForm,
    extra=4
)

class ClientForm(ModelForm):
    class Meta:
        model = Client
        fields = ["fullname", "email", "age", "password"]
        widgets = {
            "fullname": TextInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Прізвище та імя',
            }),
            "email": EmailInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Ваша пошта'
            }),
            "age": NumberInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Ваш вік'
            }),
            "password": PasswordInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Пароль'
            })
        }

class UserForm(UserCreationForm):
    class Meta:
        model = User
        fields = ["username", "email", "password1", "password2"]
        widgets = {
            "username": TextInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Імя користувача'
            }),
            "email": EmailInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Ваша пошта'
            }),
            "password1": PasswordInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Придумайте пароль'
            }),
            "password2": PasswordInput(attrs={
                'class': 'form-control-my form-control',
                'placeholder': 'Повторіть пароль'
            })
        }

class EmailPasswordForm(forms.Form):
    email = forms.EmailField(
        label="Електронна пошта", 
        widget=forms.EmailInput(attrs={
            'class': 'form-control-my form-control',
            'placeholder': 'Ваша пошта'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control-my form-control',
            'placeholder': 'Пароль'
        }),
        label="Пароль"
    )

class BookingApprovalForm(forms.ModelForm):
    class Meta:
        model = Booking
        fields = ['approved']
        widgets = {
            'approved': forms.Select(attrs={'style': 'font-size: 15px;'}, choices=[(True, 'Підтверджено'), (False, 'Відхилено')])
        }

class HostelForm(ModelForm):
    class Meta:
        model = Hostel
        fields = ["name", "about", "admin", "adress"]
        widgets = {
            "name": TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Назва готелю',
            }),
            "about": Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Про готель',
            }),
            "admin": Select(attrs={
                'class': 'form-control',
                'placeholder': 'Адмін',
            }),
            "adress": TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Адреса',
            })
        }

class CommentForm(ModelForm):
    class Meta:
        model = Comment
        fields = ["comment"]
        widgets = {
            "comment": Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'Ваш коментар',
                'style': 'height: 50px; background-color: azure;'
            })
        }

class PromoParticipantForm(ModelForm):
    class Meta:
        model = PromoParticipant
        fields = ['name', 'email', 'phone']
        widgets = {
            "name": TextInput(attrs={
                'class': 'form-control',
                'placeholder': "Ваше ім'я"
            }),
            "email": EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'Email'
            }),
            "phone": TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Телефон'
            }),
        }