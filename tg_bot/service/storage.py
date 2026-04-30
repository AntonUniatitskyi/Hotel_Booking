user_sessions:dict[int, dict] = {}

def save_session(user_id: int, data: dict):
    user_sessions[user_id] = data

def get_session(user_id: int) -> dict | None:
    return user_sessions.get(user_id)

def clear_session(user_id: int):
    user_sessions.pop(user_id, None)

def is_logged_in(user_id: int) -> bool:
    return user_id in user_sessions

def is_admin(user_id: int) -> bool:
    session = get_session(user_id)
    return session and session.get("role") == "admin"
