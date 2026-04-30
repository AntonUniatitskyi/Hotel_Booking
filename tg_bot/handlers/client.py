from datetime import datetime
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from service.api import DjangoApiClient
from keyboards.keyboards import (
    hostel_list_keyboard, hostel_detail_keyboard, rooms_keyboard,
    booking_actions_keyboard, confirm_cancel_keyboard, cancel_keyboard,
    main_menu_client,
)

router = Router()

class BookingStates(StatesGroup):
    waiting_check_in = State()
    waiting_check_out = State()
    waiting_request_text = State()
    confirm = State()

@router.message(F.text == "Готелі")
async def hostels_list(message: Message):
    api = DjangoApiClient(message.from_user.id)
    if not api.is_logged_in():
        await message.answer("⚠️ Спочатку увійдіть у систему.")
        return

    hostels = await api.get_hostels()
    if not hostels:
        await message.answer("😔 Хостелів поки немає.")
        return

    await message.answer(
        f"🏨 Знайдено хостелів: {len(hostels)}\nОберіть хостел:",
        reply_markup=hostel_list_keyboard(hostels)
    )

@router.callback_query(F.data == "back_to_hostels")
async def back_to_hostels(callback: CallbackQuery):
    await callback.answer()
    api = DjangoApiClient(callback.from_user.id)
    hostels = await api.get_hostels()
    await callback.message.edit_text(
        f"🏨 Знайдено хостелів: {len(hostels)}\nОберіть хостел:",
        reply_markup=hostel_list_keyboard(hostels)
    )

@router.callback_query(F.data.startswith("hostel_"))
async def hostel_detail(callback: CallbackQuery):
    await callback.answer()
    hostel_id = int(callback.data.split("_")[1])
    api = DjangoApiClient(callback.from_user.id)
    h = await api.get_hostel(hostel_id)

    if not h:
        await callback.message.answer("❌ Помилка завантаження хостелу.")
        return

    avg = h.get("average_rating", 0)
    stars = "⭐" * int(avg) if avg else "немає оцінок"

    text = (
        f"🏨 <b>{h['name']}</b>\n"
        f"📍 {h['city']}, {h['address']}\n\n"
        f"📝 {h['about']}\n\n"
        f"🛏 Вільних місць: {h.get('free_seats', 0)}\n"
        f"⭐ Рейтинг: {stars} ({avg})"
    )
    await callback.message.edit_text(
        text,
        reply_markup=hostel_detail_keyboard(hostel_id),
        parse_mode="HTML"
    )

@router.callback_query(F.data.startswith("rooms_"))
async def show_rooms(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    hostel_id = int(callback.data.split("_")[1])
    await state.update_data(hostel_id=hostel_id)
    await state.set_state(BookingStates.waiting_check_in)
    await callback.message.edit_text(
        "📅 Введіть дату заїзду у форматі <b>РРРР-ММ-ДД</b>\nНаприклад: 2026-06-01",
        parse_mode="HTML"
    )

@router.message(BookingStates.waiting_check_in)
async def booking_check_in(message: Message, state: FSMContext):
    try:
        # Надежная проверка даты
        check_in_date = datetime.strptime(message.text, "%Y-%m-%d").date()
        if check_in_date < datetime.now().date():
            await message.answer("⚠️ Дата заїзду не може бути у минулому. Введіть іншу дату:")
            return
    except ValueError:
        await message.answer("⚠️ Невірний формат. Введіть існуючу дату як РРРР-ММ-ДД:")
        return

    await state.update_data(check_in=message.text)
    await state.set_state(BookingStates.waiting_check_out)
    await message.answer(
        "📅 Введіть дату виїзду у форматі <b>РРРР-ММ-ДД</b>:",
        parse_mode="HTML",
        reply_markup=cancel_keyboard()
    )

@router.message(BookingStates.waiting_check_out)
async def booking_check_out(message: Message, state: FSMContext):
    try:
        check_out_date = datetime.strptime(message.text, "%Y-%m-%d").date()
    except ValueError:
        await message.answer("⚠️ Невірний формат. Введіть дату як РРРР-ММ-ДД:")
        return

    data = await state.get_data()
    check_in_date = datetime.strptime(data["check_in"], "%Y-%m-%d").date()

    if check_out_date <= check_in_date:
        await message.answer("⚠️ Дата виїзду має бути пізніше дати заїзду. Спробуйте ще раз:")
        return

    await state.update_data(check_out=message.text)

    api = DjangoApiClient(message.from_user.id)
    rooms = await api.get_rooms(
        hostel_id=data["hostel_id"],
        check_in=data["check_in"],
        check_out=message.text
    )

    if not rooms:
        await message.answer(
            "😔 На обрані дати вільних номерів немає. Спробуйте інші дати.",
            reply_markup=main_menu_client()
        )
        await state.clear()
        return

    await state.set_state(BookingStates.confirm)
    await message.answer(
        f"🛏 Вільні номери на {data['check_in']} – {message.text}:\nОберіть номер:",
        reply_markup=rooms_keyboard(rooms, data["hostel_id"])
    )

@router.callback_query(F.data.startswith("book_"))
async def book_room(callback: CallbackQuery, state: FSMContext):
    await callback.answer()
    room_id = int(callback.data.split("_")[1])
    await state.update_data(room_id=room_id)
    await state.set_state(BookingStates.waiting_request_text)
    await callback.message.edit_text(
        "📝 Додайте побажання до бронювання (або надішліть /skip щоб пропустити):"
    )

@router.message(BookingStates.waiting_request_text)
async def booking_request_text(message: Message, state: FSMContext):
    request_text = None if message.text == "/skip" else message.text
    data = await state.get_data()
    await state.clear()

    api = DjangoApiClient(message.from_user.id)
    payload = {
        "room": data["room_id"],
        "start_date": data["check_in"],
        "last_date": data["check_out"],
        "client": api.session_data.get("client_id"),
    }
    if request_text:
        payload["request_text"] = request_text

    success, result = await api.create_booking(payload)

    if success:
        room = result.get("room_details", {})
        await message.answer(
            f"✅ <b>Бронювання створено!</b>\n\n"
            f"🏨 {room.get('hostel_name', '—')}\n"
            f"🛏 Номер №{room.get('number', '—')}\n"
            f"📅 {result['start_date']} – {result['last_date']}\n"
            f"💰 Сума: {result['price']}₴\n"
            f"⏳ Статус: очікує підтвердження",
            reply_markup=main_menu_client(),
            parse_mode="HTML"
        )
    else:
        if isinstance(result, dict):
            error_text = "\n".join(
                f"• {v[0] if isinstance(v, list) else v}"
                for v in result.values()
            )
        else:
            error_text = str(result)
        await message.answer(f"❌ Помилка бронювання:\n{error_text}", reply_markup=main_menu_client())

@router.message(F.text == "Мої броні")
async def my_bookings(message: Message):
    api = DjangoApiClient(message.from_user.id)
    if not api.is_logged_in():
        await message.answer("⚠️ Спочатку увійдіть у систему.")
        return

    bookings = await api.get_bookings()
    if not bookings:
        await message.answer("📋 У вас немає бронювань.")
        return

    status_map = {True: "✅ Підтверджено", False: "❌ Відхилено", None: "⏳ Очікує"}
    for booking in bookings:
        room = booking.get("room_details", {})
        text = (
            f"📌 <b>Бронювання #{booking['id']}</b>\n"
            f"🏨 {room.get('hostel_name', '—')}\n"
            f"🛏 Номер №{room.get('number', '—')}\n"
            f"📅 {booking['start_date']} – {booking['last_date']}\n"
            f"💰 {booking['price']}₴\n"
            f"📊 {status_map.get(booking.get('approved'))}"
        )
        await message.answer(text, reply_markup=booking_actions_keyboard(booking["id"]), parse_mode="HTML")

@router.callback_query(F.data.startswith("cancel_booking_"))
async def cancel_booking_confirm(callback: CallbackQuery):
    await callback.answer()
    booking_id = int(callback.data.split("_")[2])
    await callback.message.edit_text(
        f"⚠️ Ви впевнені, що хочете скасувати бронювання #{booking_id}?",
        reply_markup=confirm_cancel_keyboard(booking_id)
    )

@router.callback_query(F.data.startswith("confirm_cancel_"))
async def cancel_booking_execute(callback: CallbackQuery):
    await callback.answer()
    booking_id = int(callback.data.split("_")[2])
    api = DjangoApiClient(callback.from_user.id)
    success, error_msg = await api.cancel_booking(booking_id)

    if success:
        await callback.message.edit_text(f"✅ Бронювання #{booking_id} скасовано.")
    else:
        await callback.message.edit_text(f"❌ {error_msg}")

@router.callback_query(F.data == "back_to_bookings")
async def back_to_bookings(callback: CallbackQuery):
    await callback.answer()
    await callback.message.delete()

@router.message(F.text == "Мій профіль")
@router.message(F.text == "👤 Мій профіль")
async def my_profile(message: Message):
    api = DjangoApiClient(message.from_user.id)
    if not api.is_logged_in():
        await message.answer("⚠️ Спочатку увійдіть у систему.")
        return

    data = await api.get_me()
    if not data:
        await message.answer("❌ Не вдалося завантажити профіль.")
        return

    await message.answer(
        f"👤 <b>Мій профіль</b>\n\n"
        f"📛 {data.get('last_name', '')} {data.get('first_name', '')}\n"
        f"📧 {data.get('email', '')}\n"
        f"🎂 Вік: {data.get('age', '—')}\n"
        f"🕐 Останній вхід: {data.get('last_login', '—')}",
        parse_mode="HTML"
    )