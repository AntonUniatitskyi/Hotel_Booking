from aiogram import Router, F
from aiogram.types import Message, CallbackQuery

from service.api import DjangoApiClient
from keyboards.keyboards import (
    admin_booking_keyboard, admin_hostels_keyboard,
    admin_hostel_detail_keyboard, main_menu_admin
)

router = Router()


def _require_admin(user_id: int) -> bool:
    api = DjangoApiClient(user_id)
    return api.is_logged_in() and api.is_admin()

@router.message(F.text == "Нові заявки")
async def pending_bookings(message: Message):
    if not _require_admin(message.from_user.id):
        await message.answer("⚠️ Доступ тільки для адміністраторів.")
        return

    api = DjangoApiClient(message.from_user.id)
    bookings = await api.get_bookings()

    if bookings is None or isinstance(bookings, dict) and "error" in bookings:
        await message.answer("❌ Не вдалося завантажити заявки.")
        return

    pending = [b for b in bookings if b.get("approved") is None]

    if not pending:
        await message.answer("✅ Нових заявок немає.")
        return

    await message.answer(f"📋 Нових заявок: {len(pending)}")

    for booking in pending:
        room = booking.get("room_details", {})
        client = booking.get("client_details", {})

        text = (
            f"📌 <b>Заявка #{booking['id']}</b>\n\n"
            f"👤 Клієнт: {client.get('last_name', '')} {client.get('first_name', '')}\n"
            f"📧 Email: {client.get('email', '—')}\n\n"
            f"🏨 Хостел: {room.get('hostel_name', '—')}\n"
            f"🛏 Номер №{room.get('number', '—')} ({room.get('bed', '—')} місць)\n"
            f"📅 {booking['start_date']} – {booking['last_date']}\n"
            f"💰 Сума: {booking['price']}₴"
        )
        if booking.get("request_text"):
            text += f"\n\n💬 Побажання: {booking['request_text']}"

        await message.answer(
            text,
            reply_markup=admin_booking_keyboard(booking["id"]),
            parse_mode="HTML"
        )


@router.callback_query(F.data.startswith("approve_"))
async def approve_booking(callback: CallbackQuery):
    await callback.answer()
    booking_id = int(callback.data.split("_")[1])
    api = DjangoApiClient(callback.from_user.id)

    success, _ = await api.approve_booking(booking_id, approved=True)

    if success:
        await callback.message.edit_text(
            callback.message.text + "\n\n✅ <b>Підтверджено!</b>",
            parse_mode="HTML"
        )
    else:
        await callback.message.answer("❌ Помилка підтвердження.")


@router.callback_query(F.data.startswith("reject_"))
async def reject_booking(callback: CallbackQuery):
    await callback.answer()
    booking_id = int(callback.data.split("_")[1])
    api = DjangoApiClient(callback.from_user.id)

    success, _ = await api.approve_booking(booking_id, approved=False)

    if success:
        await callback.message.edit_text(
            callback.message.text + "\n\n❌ <b>Відхилено.</b>",
            parse_mode="HTML"
        )
    else:
        await callback.message.answer("❌ Помилка відхилення.")

@router.message(F.text == "Мої готелі")
async def admin_hostels(message: Message):
    if not _require_admin(message.from_user.id):
        await message.answer("⚠️ Доступ тільки для адміністраторів.")
        return

    api = DjangoApiClient(message.from_user.id)
    hostels = await api.get_hostels()

    if hostels is None or (isinstance(hostels, dict) and "error" in hostels):
        await message.answer("❌ Не вдалося завантажити готелі.")
        return

    if not hostels:
        await message.answer("😔 У вас немає доданих готелів.")
        return

    await message.answer(
        f"🏨 Ваші готелі ({len(hostels)}):",
        reply_markup=admin_hostels_keyboard(hostels)
    )


@router.callback_query(F.data == "back_to_admin_hostels")
async def back_to_admin_hostels(callback: CallbackQuery):
    await callback.answer()
    api = DjangoApiClient(callback.from_user.id)
    hostels = await api.get_hostels()

    if hostels:
        await callback.message.edit_text(
            f"🏨 Ваші готелі ({len(hostels)}):",
            reply_markup=admin_hostels_keyboard(hostels)
        )


@router.callback_query(F.data.startswith("admin_hostel_"))
async def admin_hostel_detail(callback: CallbackQuery):
    await callback.answer()
    hostel_id = int(callback.data.split("_")[2])
    api = DjangoApiClient(callback.from_user.id)
    h = await api.get_hostel(hostel_id)

    if not h or (isinstance(h, dict) and "error" in h):
        await callback.message.answer("❌ Помилка завантаження даних.")
        return

    total_rooms = len(h.get("rooms", []))
    free = h.get("free_seats", 0)

    text = (
        f"🏨 <b>{h['name']}</b>\n"
        f"📍 {h['city']}, {h['address']}\n\n"
        f"🛏 Всього місць: {free}\n"
        f"🚪 Кімнат: {total_rooms}\n"
        f"{'✅ Активний' if h.get('is_active') else '❌ Неактивний'}"
    )
    await callback.message.edit_text(
        text,
        reply_markup=admin_hostel_detail_keyboard(hostel_id),
        parse_mode="HTML"
    )


@router.callback_query(F.data.startswith("availability_"))
async def hostel_availability(callback: CallbackQuery):
    await callback.answer()
    hostel_id = int(callback.data.split("_")[1])
    api = DjangoApiClient(callback.from_user.id)
    data = await api.get_hostel_availability(hostel_id)

    if not data or (isinstance(data, dict) and "error" in data):
        await callback.message.answer("❌ Помилка отримання даних про доступність.")
        return

    free = data.get("total_free_seats", 0)
    booked = data.get("total_booked_seats", 0)
    date = data.get("date", "сьогодні")

    free_rooms = data.get("free_rooms", [])
    booked_rooms = data.get("booked_rooms", [])

    text = (
        f"📅 <b>Доступність на {date}</b>\n\n"
        f"🟢 Вільних місць: {free}\n"
        f"🔴 Зайнятих місць: {booked}\n\n"
    )

    if free_rooms:
        text += "🟢 <b>Вільні кімнати:</b>\n"
        for r in free_rooms:
            text += f"  • №{r['number']} ({r['bed']} місць, {r['price']}₴/ніч)\n"

    if booked_rooms:
        text += "\n🔴 <b>Зайняті кімнати:</b>\n"
        for r in booked_rooms:
            text += f"  • №{r['number']} ({r['bed']} місць)\n"

    await callback.message.edit_text(
        text,
        reply_markup=admin_hostel_detail_keyboard(hostel_id),
        parse_mode="HTML"
    )