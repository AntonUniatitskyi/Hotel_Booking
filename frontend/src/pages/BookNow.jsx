import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Container, Card, CardMedia, TextField,
    CardContent, Button, CircularProgress, Divider, Chip, Grid, Paper, InputAdornment,
    Snackbar, Alert // Додані імпорти для спливаючих повідомлень
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HotelIcon from '@mui/icons-material/Hotel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import api from '../api';

export default function BookNow() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [hotel, setHotel] = useState(null);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState('');
    const [lastDate, setLastDate] = useState('');
    const [requestText, setRequestText] = useState('');

    const [availableRooms, setAvailableRooms] = useState([]);
    const [isSearchingRooms, setIsSearchingRooms] = useState(false);
    const [bookingRoomId, setBookingRoomId] = useState(null);

    const userRole = localStorage.getItem('role');

    // ==========================================
    // СТЕЙТ ДЛЯ СНАКБАРІВ
    // ==========================================
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return "https://placehold.co/600x400?text=No+Image";
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:8000${imagePath}`;
    };

    // ==========================================
    // ЗАВАНТАЖЕННЯ ГОТЕЛЮ
    // ==========================================
    useEffect(() => {
        api.get(`hostels/${id}/`)
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
    // ПОШУК ВІЛЬНИХ КІМНАТ
    // ==========================================
    useEffect(() => {
        const fetchAvailableRooms = async () => {
            if (startDate && lastDate) {
                if (new Date(lastDate) <= new Date(startDate)) {
                    showMessage("Дата виїзду має бути пізнішою за дату заїзду!", "warning");
                    setLastDate('');
                    return;
                }

                setIsSearchingRooms(true);
                try {
                    const response = await api.get('rooms/', {
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
            showMessage("Адміністратори не можуть створювати бронювання з клієнтського сайту.", "error");
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            showMessage("Будь ласка, увійдіть в акаунт або зареєструйтесь, щоб забронювати кімнату.", "warning");
            return;
        }

        setBookingRoomId(roomId);
        try {
            await api.post('bookings/', {
                room: roomId,
                start_date: startDate,
                last_date: lastDate,
                request_text: requestText
            });

            showMessage("🎉 Кімната успішно забронювана!", "success");

            // Даємо користувачу прочитати повідомлення перед тим, як перекинути в профіль
            setTimeout(() => {
                navigate('/profile');
            }, 1500);

        } catch (error) {
            console.error("Помилка бронювання:", error.response?.data);
            showMessage("❌ Помилка бронювання! Можливо, хтось встиг забронювати її раніше.", "error");
            setBookingRoomId(null); // Знімаємо лоадер тільки якщо сталася помилка
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (!hotel) return <Typography variant="h5" align="center" sx={{ mt: 10 }}>Готель не знайдено :(</Typography>;

    return (
        <Box sx={{ pb: 10 }}>
            {/* HERO SECTION ГОТЕЛЮ */}
            <Box
                sx={{
                    position: 'relative',
                    backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.7)), url(${getImageUrl(hotel.main_image)})`,
                    height: { xs: '400px', md: '500px' },
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    color: 'white',
                    pb: 6,
                    px: { xs: 2, md: 8 },
                    mt: -4
                }}
            >
                <Container maxWidth="lg">
                    <Typography variant="h2" fontWeight="bold" sx={{ textShadow: '0px 2px 10px rgba(0,0,0,0.5)', mb: 1 }}>
                        {hotel.name}
                    </Typography>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, textShadow: '0px 1px 5px rgba(0,0,0,0.5)' }}>
                        <LocationOnIcon /> {hotel.city}, {hotel.address}
                    </Typography>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ mt: 5 }}>
                <Grid container spacing={5}>

                    {/* ЛІВА КОЛОНКА: Опис */}
                    <Grid item xs={12} md={4}>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>Про готель</Typography>
                        <Divider sx={{ mb: 3, width: '50px', borderWidth: 2, borderColor: 'primary.main', borderRadius: 2 }} />
                        <Typography variant="body1" sx={{ color: 'text.secondary', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                            {hotel.about || "Опис поки відсутній."}
                        </Typography>
                    </Grid>

                    {/* ПРАВА КОЛОНКА: Бронювання */}
                    <Grid item xs={12} md={8}>

                        {userRole === 'admin' ? (
                            <Paper sx={{ p: 4, bgcolor: '#fff3e0', border: '1px solid #ffe0b2', borderRadius: 4, textAlign: 'center' }}>
                                <Typography variant="h6" color="warning.dark" fontWeight="bold" gutterBottom>
                                    👑 Режим Адміністратора
                                </Typography>
                                <Typography variant="body1" color="warning.dark">
                                    Ви переглядаєте цю сторінку як Адміністратор. Функція бронювання прихована для вашого акаунта.
                                </Typography>
                            </Paper>
                        ) : (
                            <Box>
                                {/* КРОК 1: ДАТИ ТА ПОБАЖАННЯ */}
                                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e0e0e0', mb: 5, bgcolor: '#fafafa' }}>
                                    <Typography variant="h6" fontWeight="bold" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CheckCircleOutlineIcon color="primary" /> Крок 1: Ваші дати та побажання
                                    </Typography>

                                    <Grid container spacing={3} sx={{ mb: 3 }}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth label="Дата заїзду" type="date" InputLabelProps={{ shrink: true }}
                                                value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon color="disabled"/></InputAdornment> }}
                                                sx={{ bgcolor: 'white' }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth label="Дата виїзду" type="date" InputLabelProps={{ shrink: true }}
                                                value={lastDate} onChange={(e) => setLastDate(e.target.value)}
                                                inputProps={{ min: startDate || new Date().toISOString().split('T')[0] }}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthIcon color="disabled"/></InputAdornment> }}
                                                sx={{ bgcolor: 'white' }}
                                            />
                                        </Grid>
                                    </Grid>

                                    <TextField
                                        fullWidth multiline rows={2} label="Особливі побажання (необов'язково)"
                                        placeholder="Потрібне тихе місце, пізній заїзд тощо..."
                                        value={requestText} onChange={(e) => setRequestText(e.target.value)}
                                        sx={{ bgcolor: 'white' }}
                                    />
                                </Paper>

                                {/* КРОК 2: ВИБІР КІМНАТИ */}
                                <Typography variant="h6" fontWeight="bold" mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <HotelIcon color="primary" /> Крок 2: Оберіть номер
                                </Typography>

                                {!startDate || !lastDate ? (
                                    <Paper elevation={0} sx={{ p: 5, border: '2px dashed #ccc', borderRadius: 4, textAlign: 'center', bgcolor: 'transparent' }}>
                                        <Typography variant="body1" color="text.secondary">
                                            📅 Будь ласка, оберіть дати заїзду та виїзду вище, щоб побачити доступні номери.
                                        </Typography>
                                    </Paper>
                                ) : isSearchingRooms ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : availableRooms.length > 0 ? (
                                    <Grid container spacing={3}>
                                        {availableRooms.map((room) => (
                                            <Grid item xs={12} sm={6} key={room.id}>
                                                <Card
                                                    sx={{
                                                        height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 4,
                                                        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                                        '&:hover': { transform: 'translateY(-5px)', boxShadow: '0px 10px 30px rgba(0,0,0,0.1)' }
                                                    }}
                                                >
                                                    <Box sx={{ overflow: 'hidden' }}>
                                                        <CardMedia
                                                            component="img" height="220" image={getImageUrl(room.preview)} alt={`Кімната ${room.number}`}
                                                            sx={{ transition: 'transform 0.6s', '&:hover': { transform: 'scale(1.05)' } }}
                                                        />
                                                    </Box>
                                                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                                                        <Typography variant="h6" fontWeight="bold" gutterBottom>Кімната №{room.number}</Typography>

                                                        <Box sx={{ mt: 1, mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                            <Chip label={`🛏️ ${room.bed} місця`} sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 'bold' }} />
                                                            <Chip label={`💰 ${room.price} грн/ніч`} sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }} />
                                                        </Box>

                                                        <Button
                                                            variant="contained"
                                                            color="primary"
                                                            fullWidth
                                                            size="large"
                                                            disabled={bookingRoomId === room.id}
                                                            onClick={() => handleBookRoom(room.id)}
                                                            sx={{ mt: 'auto', py: 1.5 }}
                                                        >
                                                            {bookingRoomId === room.id ? <CircularProgress size={24} color="inherit" /> : "Забронювати"}
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                ) : (
                                    <Paper elevation={0} sx={{ p: 5, border: '1px solid #ffcdd2', borderRadius: 4, textAlign: 'center', bgcolor: '#ffebee' }}>
                                        <Typography variant="body1" color="error" fontWeight="bold">
                                            На жаль, на обрані дати ({startDate} — {lastDate}) немає вільних кімнат. Спробуйте змінити дати.
                                        </Typography>
                                    </Paper>
                                )}
                            </Box>
                        )}
                    </Grid>
                </Grid>
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