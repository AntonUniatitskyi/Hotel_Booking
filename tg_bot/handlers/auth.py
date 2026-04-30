from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from service.api import DjangoApiClient
from keyboards.keyboards import main_menu_client, main_menu_admin, auth_menu, cancel_keyboard

router = Router()


class LoginStates(StatesGroup):
    waiting_username = State()
    waiting_password = State()


class RegisterStates(StatesGroup):
    waiting_username = State()
    waiting_password = State()
    waiting_first_name = State()
    waiting_last_name = State()
    waiting_email = State()
    waiting_age = State()


@router.message(F.text == "/start")
async def cmd_start(message: Message, state: FSMContext):
    await state.clear()
    api = DjangoApiClient(message.from_user.id)
    if api.is_logged_in():
        name = api.session_data.get("first_name", "")
        menu = main_menu_admin() if api.is_admin() else main_menu_client()
        await message.answer(f"З поверненням, {name}! 👋", reply_markup=menu)
    else:
        await message.answer(
            "👋 Вітаю в системі бронювання готелів!\n\nОберіть дію:",
            reply_markup=auth_menu()
        )


@router.message(F.text == "Вийти")
async def logout(message: Message, state: FSMContext):
    await state.clear()
    DjangoApiClient(message.from_user.id).logout()
    await message.answer("Ви вийшли з акаунту. До побачення! 👋", reply_markup=auth_menu())

@router.message(F.text == "Увійти")
async def login_start(message: Message, state: FSMContext):
    await state.set_state(LoginStates.waiting_username)
    await message.answer("Введіть ваш логін або email:", reply_markup=cancel_keyboard())


@router.message(LoginStates.waiting_username)
async def login_username(message: Message, state: FSMContext):
    await state.update_data(username=message.text)
    await state.set_state(LoginStates.waiting_password)
    await message.answer("Введіть пароль:")


@router.message(LoginStates.waiting_password)
async def login_password(message: Message, state: FSMContext):
    data = await state.get_data()
    await state.clear()

    api = DjangoApiClient(message.from_user.id)
    session_data = await api.login(data["username"], message.text)

    if session_data:
        name = session_data.get("first_name", "")
        role_label = "адміністратор" if api.is_admin() else "клієнт"
        menu = main_menu_admin() if api.is_admin() else main_menu_client()
        await message.answer(
            f"✅ Вхід успішний!\n\n👤 {name}\n🎭 Роль: {role_label}",
            reply_markup=menu
        )
    else:
        await message.answer("❌ Невірний логін або пароль.", reply_markup=auth_menu())

@router.message(F.text == "Реєстрація")
async def register_start(message: Message, state: FSMContext):
    await state.set_state(RegisterStates.waiting_username)
    await message.answer("Придумайте логін (нікнейм):", reply_markup=cancel_keyboard())


@router.message(RegisterStates.waiting_username)
async def register_username(message: Message, state: FSMContext):
    await state.update_data(username=message.text)
    await state.set_state(RegisterStates.waiting_password)
    await message.answer("Придумайте пароль:")


@router.message(RegisterStates.waiting_password)
async def register_password(message: Message, state: FSMContext):
    await state.update_data(password=message.text)
    await state.set_state(RegisterStates.waiting_first_name)
    await message.answer("Введіть ваше ім'я:")


@router.message(RegisterStates.waiting_first_name)
async def register_first_name(message: Message, state: FSMContext):
    await state.update_data(first_name=message.text)
    await state.set_state(RegisterStates.waiting_last_name)
    await message.answer("Введіть ваше прізвище:")


@router.message(RegisterStates.waiting_last_name)
async def register_last_name(message: Message, state: FSMContext):
    await state.update_data(last_name=message.text)
    await state.set_state(RegisterStates.waiting_email)
    await message.answer("Введіть ваш email:")


@router.message(RegisterStates.waiting_email)
async def register_email(message: Message, state: FSMContext):
    await state.update_data(email=message.text)
    await state.set_state(RegisterStates.waiting_age)
    await message.answer("Введіть ваш вік:")


@router.message(RegisterStates.waiting_age)
async def register_age(message: Message, state: FSMContext):
    if not message.text.isdigit():
        await message.answer("⚠️ Вік має бути числом. Спробуйте ще раз:")
        return

    data = await state.get_data()
    data["age"] = int(message.text)
    await state.clear()

    api = DjangoApiClient(message.from_user.id)
    success, errors = await api.register(data)

    if success:
        await message.answer(
            "✅ Реєстрація успішна! Тепер увійдіть у свій акаунт.",
            reply_markup=auth_menu()
        )
    else:
        error_text = "\n".join(
            f"• {v[0] if isinstance(v, list) else v}"
            for v in errors.values()
        )
        await message.answer(f"❌ Помилка реєстрації:\n{error_text}", reply_markup=auth_menu())