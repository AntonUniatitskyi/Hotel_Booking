__author__ = "Anton Uniatitskyi"
__version__ = "1.0.0"

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from config import BOT_TOKEN
from handlers import auth, cancel, client, notifications, admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

async def main():
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(cancel.router)
    dp.include_router(auth.router)
    dp.include_router(notifications.router)
    dp.include_router(admin.router)
    dp.include_router(client.router)

    logger.info("Starting bot...")
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())