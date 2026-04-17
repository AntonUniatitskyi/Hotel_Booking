import { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        age: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLogin) {
            // --- РЕЄСТРАЦІЯ ---
            try {
                const dataToSend = {
                    ...formData,
                    age: parseInt(formData.age, 10) || 0 // Конвертуємо рядок у число!
                };

                // URL реєстрації залишився старим
                const response = await axios.post('http://localhost:8000/api/register/client/', dataToSend);
                console.log("Відповідь бекенду:", response.data);

                alert("Реєстрація успішна! Тепер увійдіть зі своїми даними.");
                setIsLogin(true); // Перекидаємо на форму входу

            } catch (error) {
                console.error("Помилка реєстрації:", error.response?.data);
                alert("Помилка реєстрації! Перевірте правильність введених даних.");
            }

        } else {
            // --- ВХІД (НОВИЙ ЄДИНИЙ URL) ---
            try {
                // Відправляємо тільки логін і пароль на нову адресу
                const response = await axios.post('http://localhost:8000/api/login/', {
                    username: formData.username,
                    password: formData.password
                });

                const token = response.data.access || response.data.token || response.data.access_token;
                const refresh = response.data.refresh;

                if (token) {
                    localStorage.setItem('token', token);
                    if (refresh) localStorage.setItem('refresh', refresh);

                    // ТИМЧАСОВО: Записуємо всім статус клієнта, щоб просто розблокувати сайт
                    localStorage.setItem('role', 'client');
                }

                alert("Ви успішно увійшли!");
                window.location.href = '/'; // Жорстко перекидаємо на головну

            } catch (error) {
                console.error("Помилка логіну:", error.response?.data);
                alert("Невірний логін або пароль!");
            }
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 10, mb: 10 }}>
            <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    {isLogin ? 'Вхід' : 'Реєстрація'}
                </Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Логін (Username)"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                    />

                    {!isLogin && (
                        <>
                            <TextField margin="normal" required fullWidth label="Ім'я" name="first_name" value={formData.first_name} onChange={handleChange} />
                            <TextField margin="normal" required fullWidth label="Прізвище" name="last_name" value={formData.last_name} onChange={handleChange} />
                            <TextField margin="normal" required fullWidth label="Вік" name="age" type="number" value={formData.age} onChange={handleChange} />
                            <TextField margin="normal" required fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                        </>
                    )}

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Пароль"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 3, mb: 2, py: 1.5 }}>
                        {isLogin ? 'Увійти' : 'Зареєструватися'}
                    </Button>

                    <Button fullWidth variant="text" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Немає акаунту? Зареєструйтесь" : "Вже є акаунт? Увійдіть"}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}