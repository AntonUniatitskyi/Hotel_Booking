import { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper, FormControlLabel, Checkbox } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
    // Стан для перемикання між Входом та Реєстрацією
    const [isLogin, setIsLogin] = useState(true);

    // Стан для визначення, чи це вхід для адміністратора
    const [isAdminLogin, setIsAdminLogin] = useState(false);

    // Стан для даних форми
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        age: ''
    });

    const navigate = useNavigate();

    // Функція для оновлення даних при вводі
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Функція відправки даних на бекенд
    const handleSubmit = async (e) => {
        e.preventDefault();

        let url = '';
        let dataToSend = {};

        if (!isLogin) {
            // РЕЄСТРАЦІЯ (Доступна тільки для клієнтів)
            url = 'http://localhost:8000/api/register/client/';
            dataToSend = formData; // Відправляємо всі поля
        } else {
            // ВХІД (Перевіряємо чекбокс Адміна)
            url = isAdminLogin
                ? 'http://localhost:8000/api/login/admin/'
                : 'http://localhost:8000/api/login/client/';
            // При вході відправляємо лише логін та пароль
            dataToSend = { username: formData.username, password: formData.password };
        }

        try {
            const response = await axios.post(url, dataToSend);
            console.log("Відповідь бекенду:", response.data);

            if (isLogin) {
                // Зберігаємо токен
                const token = response.data.access || response.data.token || response.data.access_token;
                if (token) {
                    localStorage.setItem('token', token);
                    // НОВИЙ РЯДОК: Зберігаємо роль, щоб знати, хто є хто
                    localStorage.setItem('role', isAdminLogin ? 'admin' : 'client');
                }

                alert(isAdminLogin ? "Ви успішно увійшли як Адміністратор! 👑" : "Ви успішно увійшли!");
                navigate('/');
            } else {
                alert("Реєстрація успішна! Тепер увійдіть зі своїми даними.");
                setIsLogin(true); // Перекидаємо на форму входу
            }

        } catch (error) {
            console.error("Помилка:", error.response?.data);
            alert("Помилка авторизації! Перевірте правильність введених даних.");
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

                    {/* Ці поля показуємо ТІЛЬКИ при реєстрації */}
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

                    {/* Чекбокс для адміна показуємо ТІЛЬКИ при вході */}
                    {isLogin && (
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isAdminLogin}
                                    onChange={(e) => setIsAdminLogin(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="Увійти як адміністратор"
                            sx={{ mt: 1 }}
                        />
                    )}

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