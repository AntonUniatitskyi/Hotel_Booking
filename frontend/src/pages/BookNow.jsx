import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Container, Card, CardMedia, TextField,  CardContent, Button, CircularProgress, Divider, Chip, Grid } from '@mui/material';
import axios from 'axios';

export default function BookNow() {
    const { id } = useParams();
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [lastDate, setLastDate] = useState('');

    // Дістаємо "бейджик" користувача
    const userRole = localStorage.getItem('role');

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "https://placehold.co/600x400?text=No+Image";
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:8000${imagePath}`;
    };

    const handleBookRoom = async (roomId) => {
        // Захист від "хитрих" адмінів
        if (userRole === 'admin') {
            alert("Адміністратори не можуть створювати бронювання з клієнтського сайту.");
            return;
        }

        const token = localStorage.getItem('token');

        if (!token) {
            alert("Будь ласка, увійдіть в акаунт або зареєструйтесь, щоб забронювати кімнату.");
            return;
        }

        if (!startDate || !lastDate) {
            alert("Будь ласка, оберіть дати заїзду та виїзду перед бронюванням!");
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:8000/api/bookings/',
                {
                    room: roomId,
                    start_date: startDate,
                    last_date: lastDate
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            console.log("Відповідь бекенду:", response.data);
            alert("🎉 Кімната успішно забронювана!");

        } catch (error) {
            console.error("Помилка бронювання:", error.response?.data);
            alert("Помилка бронювання! Відкрий консоль (F12), щоб дізнатися деталі.");
        }
    };

    useEffect(() => {
        axios.get(`http://localhost:8000/api/hostels/${id}/`)
            .then(response => {
                setHotel(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Помилка:", error);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    }

    if (!hotel) {
        return <Typography variant="h5" align="center" sx={{ mt: 10 }}>Готель не знайдено :(</Typography>;
    }

    return (
        <Container sx={{ mt: 4, mb: 8 }}>
            {/* ЗАГОЛОВОК І ГОЛОВНЕ ФОТО */}
            <Typography variant="h3" fontWeight="bold" gutterBottom>
                {hotel.name}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
                📍 {hotel.city}, {hotel.address}
            </Typography>

            <Box
                component="img"
                src={getImageUrl(hotel.main_image)}
                alt={hotel.name}
                sx={{ width: '100%', height: { xs: '300px', md: '500px' }, objectFit: 'cover', borderRadius: 3, mb: 4, boxShadow: 3 }}
            />

            {/* ОПИС */}
            <Typography variant="h5" fontWeight="bold" gutterBottom>Про готель</Typography>
            <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-line' }}>
                {hotel.about || "Опис поки відсутній."}
            </Typography>

            <Divider sx={{ mb: 4 }} />

            {/* ДОСТУПНІ КІМНАТИ */}
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                Доступні кімнати ({hotel.free_seats} вільних місць)
            </Typography>

            {/* ЛОГІКА РОЛЕЙ: Показуємо вибір дат ТІЛЬКИ для клієнтів (не адмінів) */}
            {userRole === 'admin' ? (
                <Typography variant="body1" color="error" sx={{ mb: 4, fontWeight: 'bold', p: 2, bgcolor: '#ffebee', borderRadius: 2 }}>
                    👑 Ви переглядаєте цю сторінку як Адміністратор. Функція бронювання прихована.
                </Typography>
            ) : (
                <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
                    <TextField
                        label="Дата заїзду"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        sx={{ minWidth: 200 }}
                    />
                    <TextField
                        label="Дата виїзду"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={lastDate}
                        onChange={(e) => setLastDate(e.target.value)}
                        sx={{ minWidth: 200 }}
                    />
                </Box>
            )}

            {hotel.rooms && hotel.rooms.length > 0 ? (
                <Grid container spacing={3}>
                    {hotel.rooms.map((room) => (
                        <Grid item xs={12} sm={6} md={4} key={room.id}>
                            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 2 }}>
                                <CardMedia
                                    component="img"
                                    height="200"
                                    image={getImageUrl(room.preview)}
                                    alt={`Кімната ${room.number}`}
                                />
                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" fontWeight="bold">Кімната №{room.number}</Typography>
                                    <Box sx={{ mt: 1, mb: 2 }}>
                                        <Chip label={`🛏️ ${room.bed} місця`} color="info" size="small" sx={{ mr: 1 }} />
                                        <Chip label={`💰 ${room.price} грн/ніч`} color="success" size="small" />
                                    </Box>

                                    {room.images && room.images.length > 0 && (
                                        <Box sx={{ mt: 2, mb: 2 }}>
                                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                                                Додаткові фото:
                                            </Typography>
                                            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                                                {room.images.map((imgItem) => (
                                                    <Box
                                                        key={imgItem.id}
                                                        component="img"
                                                        src={getImageUrl(imgItem.image)}
                                                        alt="Фото кімнати"
                                                        sx={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 1, flexShrink: 0, boxShadow: 1 }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}

                                    {/* ЛОГІКА РОЛЕЙ: Ховаємо кнопку від адміна */}
                                    {userRole !== 'admin' && (
                                        <Button
                                            variant="contained"
                                            color="warning"
                                            fullWidth
                                            sx={{ mt: 'auto', borderRadius: 2 }}
                                            onClick={() => handleBookRoom(room.id)}
                                        >
                                            Забронювати
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Typography variant="body1" color="text.secondary">У цьому готелі поки немає доданих кімнат.</Typography>
            )}
        </Container>
    );
}