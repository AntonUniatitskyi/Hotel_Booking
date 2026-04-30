from aiogram import Router, F
from aiogram.types import Message
from aiogram.fsm.context import FSMContext

from service.storage import is_logged_in, is_admin
from keyboards.keyboards import main_menu_client, main_menu_admin, auth_menu


router = Router()
@router.message(F.text == "Скасувати")
async def universal_cancel(message: Message, state: FSMContext):
    current_state = await state.get_state()
    await state.clear()

    user_id = message.from_user.id
    if not is_logged_in(user_id):
        await message.answer("Скасовано.", reply_markup=auth_menu())
        return

    if is_admin(user_id):
        await message.answer("Скасовано.", reply_markup=main_menu_admin())
    else:
        await message.answer("Скасовано.", reply_markup=main_menu_client())
