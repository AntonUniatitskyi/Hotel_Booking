import axios from 'axios';

// Створюємо базовий екземпляр axios
const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
});

// ПЕРЕХОПЛЮВАЧ ЗАПИТІВ: Автоматично додаємо токен до кожного запиту
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token'); // Наш access токен
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ПЕРЕХОПЛЮВАЧ ВІДПОВІДЕЙ: Обробка помилки 401 та оновлення токена
api.interceptors.response.use(
    (response) => response, // Якщо все ок - просто віддаємо відповідь
    async (error) => {
        const originalRequest = error.config;

        // Якщо помилка 401 (токен протух) і ми ще не пробували його оновити
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh');

                // Пробуємо отримати новий токен
                const res = await axios.post('http://localhost:8000/api/token/refresh/', {
                    refresh: refreshToken
                });

                // Якщо успішно - зберігаємо новий токен
                localStorage.setItem('token', res.data.access);

                // Змінюємо заголовок в оригінальному запиті і повторюємо його
                originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                return api(originalRequest);

            } catch (err) {
                // Якщо і refresh токен протух - викидаємо юзера на сторінку логіну
                localStorage.removeItem('token');
                localStorage.removeItem('refresh');
                localStorage.removeItem('role');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;