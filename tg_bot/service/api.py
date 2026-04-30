import os
import aiohttp
from typing import Dict, Optional

API_BASE_URL = os.getenv('API_BASE_URL', default="http://127.0.0.1:8000/api")
user_session: Dict[int, Dict[str, str]] = {}


class DjangoApiClient:
    def __init__(self, tg_user_id: int):
        self.tg_user_id = tg_user_id
        self.session_data = user_session.get(tg_user_id, {})

    def _headers(self) -> dict:
        token = self.session_data.get("access")
        return {"Authorization": f"Bearer {token}"} if token else {}

    def is_logged_in(self) -> bool:
        return bool(self.session_data.get("access"))

    def get_role(self) -> Optional[str]:
        return self.session_data.get("role")

    def is_admin(self) -> bool:
        return self.get_role() == "admin"

    def logout(self):
        user_session.pop(self.tg_user_id, None)
        self.session_data = {}

    async def login(self, username: str, password: str) -> dict:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_BASE_URL}/login/",
                json={"username": username, "password": password}
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    user_session[self.tg_user_id] = data
                    self.session_data = data
                    return data
                return {}

    async def register(self, payload: dict) -> tuple[bool, dict]:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_BASE_URL}/register/client/",
                json=payload
            ) as resp:
                data = await resp.json()
                return resp.status == 201, data

    async def get_hostels(self, search: str = None) -> list:
        params = {"search": search} if search else {}
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{API_BASE_URL}/hostels/",
                headers=self._headers(),
                params=params
            ) as resp:
                return await resp.json() if resp.status == 200 else []

    async def get_hostel(self, hostel_id: int) -> Optional[dict]:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{API_BASE_URL}/hostels/{hostel_id}/",
                headers=self._headers()
            ) as resp:
                return await resp.json() if resp.status == 200 else None

    async def get_hostel_availability(self, hostel_id: int, date: str = None) -> Optional[dict]:
        params = {"date": date} if date else {}
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{API_BASE_URL}/hostels/{hostel_id}/availability/",
                headers=self._headers(),
                params=params
            ) as resp:
                return await resp.json() if resp.status == 200 else None

    async def get_rooms(self, hostel_id: int, check_in: str = None, check_out: str = None) -> list:
        params = {"hostel": hostel_id}
        if check_in:
            params["check_in"] = check_in
        if check_out:
            params["check_out"] = check_out
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{API_BASE_URL}/rooms/",
                headers=self._headers(),
                params=params
            ) as resp:
                return await resp.json() if resp.status == 200 else []

    async def get_bookings(self) -> list:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{API_BASE_URL}/bookings/",
                headers=self._headers()
            ) as resp:
                return await resp.json() if resp.status == 200 else []

    async def get_pending_bookings(self) -> list:
        bookings = await self.get_bookings()
        return [b for b in bookings if b.get("approved") is None]

    async def create_booking(self, payload: dict) -> tuple[bool, dict]:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_BASE_URL}/bookings/",
                headers=self._headers(),
                json=payload
            ) as resp:
                data = await resp.json()
                return resp.status == 201, data

    async def cancel_booking(self, booking_id: int) -> tuple[bool, str]:
        async with aiohttp.ClientSession() as session:
            async with session.delete(
                f"{API_BASE_URL}/bookings/{booking_id}/",
                headers=self._headers()
            ) as resp:
                if resp.status == 204:
                    return True, ""
                data = await resp.json()
                return False, data.get("error", "Невідома помилка")

    async def approve_booking(self, booking_id: int, approved: bool) -> tuple[bool, dict]:
        async with aiohttp.ClientSession() as session:
            async with session.patch(
                f"{API_BASE_URL}/bookings/{booking_id}/",
                headers=self._headers(),
                json={"approved": approved}
            ) as resp:
                data = await resp.json()
                return resp.status == 200, data


    async def get_me(self) -> Optional[dict]:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{API_BASE_URL}/clients/me/",
                headers=self._headers()
            ) as resp:
                return await resp.json() if resp.status == 200 else None

    async def get_notifications(self) -> list:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{API_BASE_URL}/notofications/",
                headers=self._headers()
            ) as resp:
                if resp.status != 200:
                    return []
                data = await resp.json()
                return data.get("results", data) if isinstance(data, dict) else data

    async def get_unread_notifications(self) -> list:
        notifications = await self.get_notifications()
        return [n for n in notifications if not n.get("is_read")]

    async def mark_notification_read(self, notification_id: int) -> bool:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_BASE_URL}/notofications/{notification_id}/read/",
                headers=self._headers()
            ) as resp:
                return resp.status == 200

    async def mark_all_notifications_read(self) -> bool:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{API_BASE_URL}/notofications/read-all/",
                headers=self._headers()
            ) as resp:
                return resp.status == 200