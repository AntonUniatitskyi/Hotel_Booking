import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/',
});

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

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh');

                const res = await axios.post('http://localhost:8000/api/token/refresh/', {
                    refresh: refreshToken
                });

                localStorage.setItem('token', res.data.access);

                originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                return api(originalRequest);

            } catch (err) {
                console.error('Помилка оновлення токена:', err);

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