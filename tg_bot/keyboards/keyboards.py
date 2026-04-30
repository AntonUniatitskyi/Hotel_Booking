from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder


def main_menu_client() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Готелі"), KeyboardButton(text="Мої броні")],
            [KeyboardButton(text="Сповіщення"), KeyboardButton(text="Мій профіль", style="primary")],
            [KeyboardButton(text="Вийти", style="danger")],
        ],
        resize_keyboard=True,
    )

def main_menu_admin()->ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Нові заявки"), KeyboardButton(text="Мої готелі")],
            [KeyboardButton(text="Сповіщення"), KeyboardButton(text="Профіль", style="primary")],
            [KeyboardButton(text="Вийти", style="danger")],
        ],
        resize_keyboard=True,
    )

def auth_menu() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Увійти"), KeyboardButton(text="Реєстрація")],
        ],
        resize_keyboard=True,
    )

def cancel_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Скасувати", style="danger")]
        ],
        resize_keyboard=True
    )

def back_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text="⬅️ Назад")]],
        resize_keyboard=True
    )

def hostel_list_keyboard(hostels: list) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for hostel in hostels:
        builder.button(
            text=f"🏨 {hostel['name']} — {hostel['city']}",
            callback_data=f"hostel_{hostel['id']}"
        )
    builder.adjust(1)
    return builder.as_markup()

def hostel_detail_keyboard(hostel_id: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="🛏 Переглянути номери", callback_data=f"rooms_{hostel_id}")
    builder.button(text="⬅️ Назад до списку", callback_data="back_to_hostels")
    builder.adjust(1)
    return builder.as_markup()

def rooms_keyboard(rooms: list, hostel_id: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for room in rooms:
        builder.button(
            text=f"№{room['number']} | {room['bed']} місць | {room['price']}₴/ніч",
            callback_data=f"book_{room['id']}"
        )
    builder.button(text="⬅️ Назад", callback_data=f"hostel_{hostel_id}")
    builder.adjust(1)
    return builder.as_markup()

def booking_actions_keyboard(booking_id: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="❌ Скасувати бронювання", callback_data=f"cancel_booking_{booking_id}")
    builder.adjust(1)
    return builder.as_markup()

def confirm_cancel_keyboard(booking_id: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Так, скасувати", callback_data=f"confirm_cancel_{booking_id}")
    builder.button(text="🔙 Ні, повернутись", callback_data="back_to_bookings")
    builder.adjust(2)
    return builder.as_markup()

def admin_booking_keyboard(booking_id: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Підтвердити", callback_data=f"approve_{booking_id}")
    builder.button(text="❌ Відхилити", callback_data=f"reject_{booking_id}")
    builder.adjust(2)
    return builder.as_markup()

def admin_hostels_keyboard(hostels: list) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for hostel in hostels:
        builder.button(
            text=f"🏨 {hostel['name']}",
            callback_data=f"admin_hostel_{hostel['id']}"
        )
    builder.adjust(1)
    return builder.as_markup()

def admin_hostel_detail_keyboard(hostel_id: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="📅 Доступність на сьогодні", callback_data=f"availability_{hostel_id}")
    builder.button(text="⬅️ Назад", callback_data="back_to_admin_hostels")
    builder.adjust(1)
    return builder.as_markup()
