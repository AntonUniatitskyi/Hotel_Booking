import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Avatar, IconButton, Tooltip } from '@mui/material';

export default function Navbar() {
    const location = useLocation(); // Хук, щоб знати, на якій ми зараз сторінці

    // Перевіряємо токени та роль
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Функція для повного виходу з акаунту
    const handleLogout = () => {
        // Чистимо абсолютно всі ключі
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem('role');
        localStorage.removeItem('user');

        // Робимо жорсткий редірект, щоб скинути всі стани (наприклад, з'єднання WebSocket)
        window.location.href = '/login';
    };

    return (
        <AppBar position="static">
            <Toolbar>
                {/* Логотип, який веде на головну */}
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}
                >
                    🏨 Hotel Booking
                </Typography>

                {/* Кнопки навігації */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {token ? (
                        // ==========================================
                        // ЯКЩО КОРИСТУВАЧ УВІЙШОВ (є токен):
                        // ==========================================
                        <>
                            {/* 👑 КНОПКА ТІЛЬКИ ДЛЯ АДМІНА */}
                            {role === 'admin' && (
                                <Button
                                    component={Link}
                                    to="/admin/dashboard"
                                    variant={location.pathname === '/admin/dashboard' ? "contained" : "outlined"}
                                    color="warning"
                                    sx={{
                                        fontWeight: 'bold',
                                        // Жовтий фон, якщо ми в адмінці, інакше прозорий
                                        bgcolor: location.pathname === '/admin/dashboard' ? 'warning.main' : 'transparent',
                                        color: location.pathname === '/admin/dashboard' ? 'black' : 'warning.main',
                                        borderColor: 'warning.main'
                                    }}
                                >
                                    👑 Адмін-панель
                                </Button>
                            )}

                            {/* ========================================== */}
                            {/* 🧳 КНОПКА ТІЛЬКИ ДЛЯ КЛІЄНТА */}
                            {/* ========================================== */}
                            {role !== 'admin' && (
                                <Tooltip title="Особистий кабінет">
                                    <IconButton component={Link} to="/profile" sx={{ p: 0 }}>
                                        <Avatar sx={{
                                            bgcolor: 'secondary.main',
                                            width: 40,
                                            height: 40,
                                            fontWeight: 'bold',
                                            border: location.pathname === '/profile' ? '2px solid white' : 'none'
                                        }}>
                                            {/* Якщо є ім'я в localStorage, можна вивести першу літеру, якщо ні - просто смайлик */}
                                            👤
                                        </Avatar>
                                    </IconButton>
                                </Tooltip>
                            )}

                            {/* Спільна кнопка виходу */}
                            <Button color="inherit" variant="outlined" onClick={handleLogout}>
                                Вийти
                            </Button>
                        </>
                    ) : (
                        // ==========================================
                        // ЯКЩО КОРИСТУВАЧ ГІСТЬ (немає токена):
                        // ==========================================
                        <Button color="inherit" component={Link} to="/login" variant="outlined">
                            Увійти / Реєстрація
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}