import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Container, Card, CardMedia, TextField, CardContent, Button, CircularProgress, Divider, Chip, Grid } from '@mui/material';
import axios from 'axios';

export default function BookNow() {
    const { id } = useParams(); // id готелю
    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState('');
    const [lastDate, setLastDate] = useState('');

    // Стейт для тексту заявки
    const [requestText, setRequestText] = useState('');

    // Стейти для вільних кімнат
    const [availableRooms, setAvailableRooms] = useState([]);
    const [isSearchingRooms, setIsSearchingRooms] = useState(false);

    const userRole = localStorage.getItem('role');

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "https://placehold.co/600x400?text=No+Image";
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:8000${imagePath}`;
    };

    // ==========================================
    // ЗАВАНТАЖЕННЯ ГОТЕЛЮ (тільки інфо)
    // ==========================================
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

    // ==========================================
    // ПОШУК ВІЛЬНИХ КІМНАТ (спрацьовує при зміні дат)
    // ==========================================
    useEffect(() => {
        const fetchAvailableRooms = async () => {
            if (startDate && lastDate) {
                if (new Date(lastDate) <= new Date(startDate)) {
                    alert("Дата виїзду має бути пізнішою за дату заїзду!");
                    setLastDate('');
                    return;
                }

                setIsSearchingRooms(true);
                try {
                    // ТУТ МАЄ БУТИ GET-ЗАПИТ НА /api/rooms/ (Пошук)
                    const response = await axios.get('http://localhost:8000/api/rooms/', {
                        params: {
                            hostel: id,
                            check_in: startDate,
                            check_out: lastDate
                        }
                    });

                    setAvailableRooms(Array.isArray(response.data) ? response.data : response.data.results || []);
                } catch (error) {
                    console.error("Помилка пошуку кімнат:", error);
                } finally {
                    setIsSearchingRooms(false);
                }
            } else {
                setAvailableRooms([]);
            }
        };

        fetchAvailableRooms();
    }, [startDate, lastDate, id]);

    // ==========================================
    // БРОНЮВАННЯ КІМНАТИ
    // ==========================================
    const handleBookRoom = async (roomId) => {
        if (userRole === 'admin') {
            alert("Адміністратори не можуть створювати бронювання з клієнтського сайту.");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert("Будь ласка, увійдіть в акаунт або зареєструйтесь, щоб забронювати кімнату.");
            return;
        }

        try {
            // ТУТ МАЄ БУТИ POST-ЗАПИТ НА /api/bookings/ (Створення)
            const response = await axios.post(
                'http://localhost:8000/api/bookings/',
                {
                    room: roomId,
                    start_date: startDate,
                    last_date: lastDate,
                    request_text: requestText // <--- ВІДПРАВЛЯЄМО КОМЕНТАР ТУТ!
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            console.log("Відповідь бекенду:", response.data);
            alert("🎉 Кімната успішно забронювана!");
            window.location.href = '/profile';

        } catch (error) {
            console.error("Помилка бронювання:", error.response?.data);
            alert("Помилка бронювання! Можливо, хтось встиг забронювати її раніше.");
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (!hotel) return <Typography variant="h5" align="center" sx={{ mt: 10 }}>Готель не знайдено :(</Typography>;

    return (
        <Container sx={{ mt: 4, mb: 8 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>{hotel.name}</Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>📍 {hotel.city}, {hotel.address}</Typography>

            <Box component="img" src={getImageUrl(hotel.main_image)} alt={hotel.name} sx={{ width: '100%', height: { xs: '300px', md: '500px' }, objectFit: 'cover', borderRadius: 3, mb: 4, boxShadow: 3 }} />

            <Typography variant="h5" fontWeight="bold" gutterBottom>Про готель</Typography>
            <Typography variant="body1" sx={{ mb: 4, whiteSpace: 'pre-line' }}>{hotel.about || "Опис поки відсутній."}</Typography>
            <Divider sx={{ mb: 4 }} />

            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>Бронювання номерів</Typography>

            {userRole === 'admin' ? (
                <Typography variant="body1" color="error" sx={{ mb: 4, fontWeight: 'bold', p: 2, bgcolor: '#ffebee', borderRadius: 2 }}>
                    👑 Ви переглядаєте цю сторінку як Адміністратор. Функція бронювання прихована.
                </Typography>
            ) : (
                <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 2, mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>Крок 1: Оберіть дати перебування та побажання</Typography>

                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
                        <TextField
                            label="Дата заїзду" type="date" InputLabelProps={{ shrink: true }}
                            value={startDate} onChange={(e) => setStartDate(e.target.value)}
                            inputProps={{ min: new Date().toISOString().split('T')[0] }}
                            sx={{ minWidth: 220, bgcolor: 'white' }}
                        />
                        <TextField
                            label="Дата виїзду" type="date" InputLabelProps={{ shrink: true }}
                            value={lastDate} onChange={(e) => setLastDate(e.target.value)}
                            inputProps={{ min: startDate || new Date().toISOString().split('T')[0] }}
                            sx={{ minWidth: 220, bgcolor: 'white' }}
                        />
                        {isSearchingRooms && <CircularProgress size={24} />}
                    </Box>

                    {/* ПОЛЕ ДЛЯ ТЕКСТУ ЗАЯВКИ */}
                    <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Особливі побажання (необов'язково)"
                        placeholder="Наприклад: Потрібне тихе місце, пізній заїзд тощо..."
                        value={requestText}
                        onChange={(e) => setRequestText(e.target.value)}
                        sx={{ bgcolor: 'white' }}
                    />
                </Box>
            )}

            {/* ВІДОБРАЖЕННЯ КІМНАТ */}
            {userRole !== 'admin' && (
                <Box>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>Крок 2: Оберіть вільну кімнату</Typography>

                    {!startDate || !lastDate ? (
                        <Typography variant="body1" color="text.secondary" sx={{ p: 4, border: '1px dashed grey', borderRadius: 2, textAlign: 'center' }}>
                            📅 Будь ласка, оберіть дати заїзду та виїзду, щоб побачити доступні номери.
                        </Typography>
                    ) : availableRooms.length > 0 ? (
                        <Grid container spacing={3}>
                            {availableRooms.map((room) => (
                                <Grid item xs={12} sm={6} md={4} key={room.id}>
                                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 2 }}>
                                        <CardMedia component="img" height="200" image={getImageUrl(room.preview)} alt={`Кімната ${room.number}`} />
                                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="h6" fontWeight="bold">Кімната №{room.number}</Typography>
                                            <Box sx={{ mt: 1, mb: 2 }}>
                                                <Chip label={`🛏️ ${room.bed} місця`} color="info" size="small" sx={{ mr: 1 }} />
                                                <Chip label={`💰 ${room.price} грн/ніч`} color="success" size="small" />
                                            </Box>
                                            <Button variant="contained" color="warning" fullWidth sx={{ mt: 'auto', borderRadius: 2 }} onClick={() => handleBookRoom(room.id)}>
                                                Забронювати на ці дати
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <Typography variant="body1" color="error" sx={{ p: 4, border: '1px solid #ffcdd2', bgcolor: '#ffebee', borderRadius: 2, textAlign: 'center' }}>
                            На жаль, на обрані дати ({startDate} — {lastDate}) в цьому готелі немає вільних кімнат. Спробуйте змінити дати.
                        </Typography>
                    )}
                </Box>
            )}
        </Container>
    );
}