from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from ..models import Notification


def create_notification(recipient, title, message):
    notification = Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message
    )

    channel_layer = get_channel_layer()
    group_name = f"user_{recipient.id}"

    async_to_sync(channel_layer.group_send)(
        group_name,
        {
            "type": "send_notification",
            "data": {
                "id": notification.id,
                "title": title,
                "message": message,
                "created_at": notification.created_at.strftime("%H:%M")
            }
        }
    )