import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();

    // Перевіряємо, чи є в браузері наш ключ (токен)
    const token = localStorage.getItem('token');

    // Функція для виходу з акаунту
    const handleLogout = () => {
        localStorage.removeItem('token'); // Викидаємо ключ у смітник
        navigate('/login'); // Перекидаємо користувача на сторінку входу
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
                <Box>
                    {token ? (
                        // ЯКЩО КОРИСТУВАЧ УВІЙШОВ (є токен):
                        <>
                            <Button color="inherit" component={Link} to="/profile" sx={{ mr: 1 }}>
                                Мої бронювання
                            </Button>
                            <Button color="inherit" variant="outlined" onClick={handleLogout}>
                                Вийти
                            </Button>
                        </>
                    ) : (
                        // ЯКЩО КОРИСТУВАЧ ГІСТЬ (немає токена):
                        <Button color="inherit" component={Link} to="/login" variant="outlined">
                            Увійти / Реєстрація
                        </Button>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}