from decouple import config
BOT_TOKEN = config('BOT_TOKEN')
API_BASE_URL = config('API_BASE_URL', default='http://localhost:8000')