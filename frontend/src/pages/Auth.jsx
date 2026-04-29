import { useState } from 'react';
import {
    Box, TextField, Button, Typography, Paper,
    InputAdornment, IconButton, Grid, Container,
    Snackbar, Alert // Імпортуємо компоненти для красивих сповіщень
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import api from '../api';

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

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // ==========================================
    // СТЕЙТ ДЛЯ СНАКБАРІВ (Спливаючих повідомлень)
    // ==========================================
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' // 'success' | 'error' | 'warning' | 'info'
    });

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!isLogin) {
            // ================= РЕЄСТРАЦІЯ =================
            try {
                const dataToSend = {
                    ...formData,
                    age: parseInt(formData.age, 10) || 0
                };

                await api.post('register/client/', dataToSend);

                showMessage("🎉 Реєстрація успішна! Тепер увійдіть зі своїми даними.", "success");
                setIsLogin(true);

            } catch (error) {
                console.error("Помилка реєстрації:", error.response?.data);
                showMessage("❌ Помилка реєстрації! Перевірте правильність введених даних.", "error");
            } finally {
                setIsLoading(false);
            }

        } else {
            // ================= ВХІД =================
            try {
                const loginRes = await api.post('login/', {
                    username: formData.username,
                    password: formData.password
                });

                const token = loginRes.data.access || loginRes.data.token;
                const refresh = loginRes.data.refresh;
                const role = loginRes.data.role;

                if (token) {
                    localStorage.setItem('token', token);
                    if (refresh) localStorage.setItem('refresh', refresh);
                    localStorage.setItem('role', role);
                }

                if (role === 'admin') {
                    showMessage("Вітаємо в системі, Адміністраторе! 👑", "success");
                    // Затримка, щоб адмін побачив повідомлення перед редіректом
                    setTimeout(() => {
                        window.location.href = '/admin/dashboard';
                    }, 1500);
                } else {
                    showMessage("Успішний вхід! Завантажуємо... 🚀", "success");
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 1500);
                }

            } catch (error) {
                console.error("Помилка логіну:", error);
                showMessage("❌ Невірний логін або пароль!", "error");
                localStorage.clear();
                setIsLoading(false); // Знімаємо лоадер тільки якщо помилка, при успіху хай крутиться до редіректу
            }
        }
    };

    return (
        <Box
            sx={{
                minHeight: '90vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                py: { xs: 4, md: 8 }
            }}
        >
            <Container maxWidth="lg">
                <Paper
                    elevation={0}
                    sx={{
                        display: 'flex',
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0px 20px 50px rgba(0,0,0,0.1)',
                        minHeight: '600px'
                    }}
                >
                    {/* ЛІВА ЧАСТИНА: Картинка (Схована на мобільних) */}
                    <Box
                        sx={{
                            width: { xs: '0%', md: '50%' },
                            display: { xs: 'none', md: 'block' },
                            position: 'relative',
                            backgroundImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* Темний градієнт та текст поверх фото */}
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7))',
                            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 6, color: 'white'
                        }}>
                            <Typography variant="h3" fontWeight="bold" gutterBottom>
                                {isLogin ? 'З поверненням!' : 'Почніть подорож'}
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                {isLogin
                                    ? 'Ваш наступний ідеальний відпочинок вже чекає на вас.'
                                    : 'Зареєструйтесь, щоб отримати доступ до найкращих готелів світу.'}
                            </Typography>
                        </Box>
                    </Box>

                    {/* ПРАВА ЧАСТИНА: Форма */}
                    <Box
                        sx={{
                            width: { xs: '100%', md: '50%' },
                            p: { xs: 4, sm: 6, md: 8 },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                            <Box sx={{ p: 2, borderRadius: '50%', bgcolor: 'rgba(255, 90, 95, 0.1)', color: 'primary.main' }}>
                                {isLogin ? <LockOutlinedIcon fontSize="large" /> : <PersonAddAltOutlinedIcon fontSize="large" />}
                            </Box>
                        </Box>

                        <Typography variant="h4" fontWeight="bold" align="center" gutterBottom>
                            {isLogin ? 'Вхід в акаунт' : 'Створення акаунту'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                            {isLogin ? 'Введіть свої дані для доступу' : 'Заповніть форму нижче, щоб приєднатися'}
                        </Typography>

                        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>

                            <TextField
                                margin="normal" required fullWidth
                                label="Логін (Username)" name="username"
                                value={formData.username} onChange={handleChange}
                                sx={{ bgcolor: '#fafafa' }}
                            />

                            {!isLogin && (
                                <>
                                    <Grid container spacing={2} sx={{ mt: 0 }}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField required fullWidth label="Ім'я" name="first_name" value={formData.first_name} onChange={handleChange} sx={{ bgcolor: '#fafafa' }} />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField required fullWidth label="Прізвище" name="last_name" value={formData.last_name} onChange={handleChange} sx={{ bgcolor: '#fafafa' }} />
                                        </Grid>
                                    </Grid>

                                    <Grid container spacing={2} sx={{ mt: 0 }}>
                                        <Grid item xs={12} sm={4}>
                                            <TextField required fullWidth label="Вік" name="age" type="number" value={formData.age} onChange={handleChange} sx={{ bgcolor: '#fafafa' }} />
                                        </Grid>
                                        <Grid item xs={12} sm={8}>
                                            <TextField required fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} sx={{ bgcolor: '#fafafa' }} />
                                        </Grid>
                                    </Grid>
                                </>
                            )}

                            <TextField
                                margin="normal" required fullWidth
                                label="Пароль" name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password} onChange={handleChange}
                                sx={{ bgcolor: '#fafafa', mb: 3 }}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                color="primary"
                                size="large"
                                disabled={isLoading}
                                sx={{ py: 1.5, mb: 2, fontSize: '1.1rem', boxShadow: '0px 8px 20px rgba(255, 90, 95, 0.3)' }}
                            >
                                {isLoading ? 'Зачекайте...' : (isLogin ? 'Увійти' : 'Зареєструватися')}
                            </Button>

                            <Button
                                fullWidth
                                variant="text"
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setFormData(prev => ({ ...prev, password: '' }));
                                }}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'transparent' } }}
                            >
                                {isLogin ? "Немає акаунту? Створіть його тут" : "Вже є акаунт? Увійдіть"}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>

            {/* КОМПОНЕНТ СНАКБАРУ */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', boxShadow: 3 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}