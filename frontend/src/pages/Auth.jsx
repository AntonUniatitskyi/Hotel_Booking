import { useState } from 'react';
import { Box, TextField, Button, Typography, Container, Paper } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { InputAdornment, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

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
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isLogin) {
            // ================= РЕЄСТРАЦІЯ =================
            try {
                const dataToSend = {
                    ...formData,
                    age: parseInt(formData.age, 10) || 0 // Конвертуємо для строгого бекенду
                };

                await axios.post('http://localhost:8000/api/register/client/', dataToSend);

                alert("Реєстрація успішна! Тепер увійдіть зі своїми даними.");
                setIsLogin(true);

            } catch (error) {
                console.error("Помилка реєстрації:", error.response?.data);
                alert("Помилка реєстрації! Перевірте дані.");
            }

        } else {
            // ================= ВХІД =================
            try {
                const loginRes = await axios.post('http://localhost:8000/api/login/', {
                    username: formData.username,
                    password: formData.password
                });

                // БЕКЕНД ТЕПЕР ВІДДАЄ ВСЕ ОДРАЗУ! Забираємо наші дані:
                const token = loginRes.data.access || loginRes.data.token;
                const refresh = loginRes.data.refresh;
                const role = loginRes.data.role; // Беремо роль прямо з відповіді бекенду!

                if (token) {
                    localStorage.setItem('token', token);
                    if (refresh) localStorage.setItem('refresh', refresh);
                    localStorage.setItem('role', role); // Зберігаємо справжню роль
                }

                if (role === 'admin') {
                    alert("Вітаємо в системі, Адміністраторе! 👑");
                    window.location.href = '/admin/dashboard';
                } else {
                    alert("Ви успішно увійшли!");
                    window.location.href = '/';
                }

            } catch (error) {
                console.error("Помилка логіну:", error);
                alert("Невірний логін або пароль!");
                localStorage.clear();
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
                        fullWidth
                        label="Пароль"
                        name="password"
                        // 1. Динамічний тип
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        // 2. Додаємо іконку в кінець інпута
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
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