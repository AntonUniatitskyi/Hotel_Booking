import asyncio
import logging
from aiogram import Router, F, Bot
from aiogram.types import Message
from service.api import DjangoApiClient
from service.storage import get_session, is_logged_in, user_sessions

router = Router()

_polling_tasks: set[int] = set()

async def notifications_polling(bot: Bot, user_id: int):
    while user_id in user_sessions:
        try:
            if not is_logged_in(user_id):
                break
            api = DjangoApiClient(user_id)
            notifications = await api.get_notifications()

            if isinstance(notifications, list):
                unread = [n for n in notifications if not n.get("is_read")]

                for notif in unread:
                    await bot.send_message(
                        user_id,
                        f"🔔 <b>{notif['title']}</b>\n\n{notif['message']}",
                        parse_mode="HTML"
                    )
                    await api.mark_notification_read(notif["id"])

        except Exception as e:
            logging.error(f"Помилка в polling для користувача {user_id}: {e}")

        await asyncio.sleep(30)

    _polling_tasks.discard(user_id)


def start_polling_for_user(bot: Bot, user_id: int):
    if user_id not in _polling_tasks:
        _polling_tasks.add(user_id)
        asyncio.create_task(notifications_polling(bot, user_id))


@router.message(F.text == "Сповіщення")
async def check_notifications(message: Message):
    api = DjangoApiClient(message.from_user.id)

    if not api.is_logged_in():
        await message.answer("⚠️ Спочатку увійдіть у систему.")
        return

    notifications = await api.get_notifications()

    if notifications is None or isinstance(notifications, dict) and "error" in notifications:
        await message.answer("❌ Не вдалося завантажити сповіщення.")
        return

    if not notifications:
        await message.answer("🔔 Сповіщень немає.")
        return

    unread = [n for n in notifications if not n.get("is_read")]
    read = [n for n in notifications if n.get("is_read")]

    if unread:
        await message.answer(f"🔔 Непрочитаних: {len(unread)}")
        for notif in unread:
            date_str = notif.get('created_at', '')[:10]

            await message.answer(
                f"🆕 <b>{notif['title']}</b>\n{notif['message']}\n"
                f"<i>{date_str}</i>",
                parse_mode="HTML"
            )
            await api.mark_notification_read(notif["id"])
    else:
        await message.answer(
            f"✅ Всі нові сповіщення прочитано.\n"
            f"Всього за історію: {len(read)}"
        )