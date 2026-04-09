from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Booking
from .services.notificate import create_notification

@receiver(pre_save, sender=Booking)
def track_approval_change(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_obj = Booking.objects.get(pk=instance.pk)
            if old_obj.approved != instance.approved:
                instance._approved_changed = True
            else:
                instance._approved_changed = False
        except Booking.DoesNotExist:
            instance._approved_changed = False
    else:
        instance._approved_changed = False

@receiver(post_save, sender=Booking)
def booking_notification_handler(sender, instance, created, **kwargs):
    hostel_name = instance.room.hostel.name
    room_number = instance.room.number
    if created:
        admin_user = instance.room.hostel.admin
        if admin_user:
            create_notification(
                recipient=admin_user,
                title="Нове бронювання",
                message=f"Отримано нову заявку на номер {room_number} у готелі «{hostel_name}»."
            )

    else:
        is_changed = getattr(instance, '_approved_changed', False)
        if is_changed:
            if instance.approved is True:
                create_notification(
                    recipient=instance.client.user,
                    title="Бронювання підтверджено",
                    message=f"Вашу заявку на номер {instance.room.number} у готелі «{hostel_name}» схвалено!"
                )
            elif instance.approved is False:
                create_notification(
                    recipient=instance.client.user,
                    title="Бронювання відхилено",
                    message=f"На жаль, вашу заявку на номер {instance.room.number} у готелі «{hostel_name}» відхилено."
                )