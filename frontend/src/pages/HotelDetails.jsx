import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Grid, Paper, Divider, Button } from '@mui/material';
import api from '../api'; // Наш файл з токенами

export default function HotelDetails() {
    const { id } = useParams(); // Дістаємо ID готелю з URL (наприклад, /hostel/5)
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHotelDetails = async () => {
            try {
                // Робимо GET-запит за конкретним готелем
                const response = await api.get(`hostels/${id}/`);
                setHotel(response.data);
            } catch (error) {
                console.error("Помилка завантаження деталей:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHotelDetails();
    }, [id]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (!hotel) return <Typography variant="h5" align="center" mt={5}>Готель не знайдено 😢</Typography>;

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 10 }}>
            {/* ЗАГОЛОВОК І ГОЛОВНЕ ФОТО */}
            <Typography variant="h3" fontWeight="bold" gutterBottom>{hotel.name}</Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                📍 {hotel.city}, {hotel.address}
            </Typography>

            <Box
                component="img"
                src={hotel.main_image}
                alt={hotel.name}
                sx={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: 3, mb: 4 }}
            />

            <Grid container spacing={4}>
                {/* ЛІВА КОЛОНКА: Опис та Галерея */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, mb: 4, boxShadow: 2 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Про готель</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                            {hotel.about}
                        </Typography>
                    </Paper>

                    {/* ТУТ БУДЕ ГАЛЕРЕЯ ФОТОГРАФІЙ */}
                    <Paper sx={{ p: 3, mb: 4, boxShadow: 2 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Галерея</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {hotel.gallery_images && hotel.gallery_images.length > 0 ? (
                            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
                                {hotel.gallery_images.map(img => (
                                    <Box key={img.id} component="img" src={img.image} sx={{ width: 200, height: 150, borderRadius: 2, objectFit: 'cover' }} />
                                ))}
                            </Box>
                        ) : (
                            <Typography color="text.secondary">Фотографій поки немає.</Typography>
                        )}
                    </Paper>

                    {/* ТУТ БУДУТЬ ВІДГУКИ */}
                    <Paper sx={{ p: 3, boxShadow: 2 }}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Відгуки клієнтів ⭐</Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Typography color="text.secondary">
                            (Незабаром тут з'являться відгуки реальних відвідувачів)
                        </Typography>
                    </Paper>
                </Grid>

                {/* ПРАВА КОЛОНКА: Кнопка швидкого бронювання */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, boxShadow: 3, position: 'sticky', top: 20 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>Готові зупинитися тут?</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Перегляньте доступні кімнати та забронюйте ідеальний варіант.
                        </Typography>
                        <Button
                            component={Link}
                            to={`/hotels/${hotel.id}`}
                            variant="contained"
                            color="warning"
                            fullWidth
                            size="large"
                        >
                            Забронювати номер
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}