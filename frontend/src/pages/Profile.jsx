import { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Box, CircularProgress,
    Tabs, Tab, Avatar, Grid, Card, CardContent, Divider, Chip, List, ListItem, ListItemText, ListItemIcon, Button // <--- ДОДАЛИ BUTTON СЮДИ!
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';
import api from '../api';

export default function UserProfile() {
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(true);

    const [userInfo, setUserInfo] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const fetchAllProfileData = async () => {
            setLoading(true);

            try {
                const infoRes = await api.get('clients/me/');
                setUserInfo(infoRes.data);
            } catch (error) {
                console.error("Помилка завантаження інфо профілю:", error);
            }

            try {
                const bookingsRes = await api.get('bookings/');
                setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data.results || []);
            } catch (error) {
                console.error("Помилка завантаження бронювань:", error);
            }

            try {
                const messagesRes = await api.get('notifications/');
                setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : messagesRes.data.results || []);
            } catch (error) {
                console.error("Помилка завантаження сповіщень:", error);
            }

            setLoading(false);
        };

        fetchAllProfileData();
    }, []);

    const renderStatus = (approved) => {
        if (approved === true) return <Chip label="Схвалено" color="success" size="small" />;
        if (approved === false) return <Chip label="Відхилено" color="error" size="small" />;
        return <Chip label="Очікує" color="warning" size="small" />;
    };

    // Розкоментована функція видалення
    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm(
            "⚠️ Ви впевнені, що хочете назавжди видалити свій акаунт?\nУсі ваші дані та бронювання будуть втрачені. Цю дію неможливо скасувати!"
        );

        if (!confirmDelete) return;

        try {
            await api.delete('clients/me/');

            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('role');
            localStorage.removeItem('user');

            alert("Ваш акаунт було успішно видалено. Шкода, що ви нас покидаєте! 😢");
            window.location.href = '/login';

        } catch (error) {
            console.error("Помилка видалення акаунта:", error);
            alert("Не вдалося видалити акаунт. Можливо, бекенд ще не підтримує цю функцію.");
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 10 }}>

            {/* ШАПКА ПРОФІЛЮ */}
            <Paper sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 3, mb: 4, borderRadius: 3, boxShadow: 3 }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 36 }}>
                    {userInfo?.first_name?.charAt(0) || '👤'}
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        {userInfo?.first_name} {userInfo?.last_name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {userInfo?.email}
                    </Typography>
                </Box>
            </Paper>

            {/* НАВІГАЦІЯ КАБІНЕТУ */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} variant="fullWidth">
                    <Tab icon={<PersonIcon />} label="Мої дані" iconPosition="start" />
                    <Tab icon={<HotelIcon />} label="Бронювання" iconPosition="start" />
                    <Tab icon={<NotificationsActiveIcon />} label="Сповіщення" iconPosition="start" />
                </Tabs>
            </Box>

            {/* ВКЛАДКА 0: ІНФОРМАЦІЯ */}
            {currentTab === 0 && (
                <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 2 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom>Особиста інформація</Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={6}>
                            <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
                                Ім'я та Прізвище
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                                {userInfo?.fullname || `${userInfo?.first_name} ${userInfo?.last_name}`}
                            </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
                                Електронна пошта
                            </Typography>
                            <Typography variant="h6" fontWeight="bold">
                                {userInfo?.email}
                            </Typography>
                        </Grid>

                        {userInfo?.age && (
                            <Grid item xs={12} sm={6}>
                                <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
                                    Вік
                                </Typography>
                                <Typography variant="h6" fontWeight="bold">
                                    {userInfo?.age} років
                                </Typography>
                            </Grid>
                        )}
                    </Grid>

                    {/* Розкоментований блок: НЕБЕЗПЕЧНА ЗОНА */}
                    <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'error.light' }}>
                        <Typography variant="subtitle1" color="error" fontWeight="bold" gutterBottom>
                            Небезпечна зона
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Видалення облікового запису призведе до безповоротної втрати всіх ваших даних, історії сповіщень та поточних бронювань.
                        </Typography>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleDeleteAccount}
                        >
                            Видалити акаунт назавжди
                        </Button>
                    </Box>
                </Paper>
            )}
            {/* ВКЛАДКА 1: БРОНЮВАННЯ */}
            {currentTab === 1 && (
                <Box>
                    {bookings.length === 0 ? (
                        <Typography align="center" color="text.secondary" mt={3}>Ви ще нічого не бронювали.</Typography>
                    ) : (
                        <Grid container spacing={2}>
                            {bookings.map(booking => (
                                <Grid item xs={12} key={booking.id}>
                                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="h6" fontWeight="bold">
                                                    {booking.room_details?.hostel_name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    Кімната №{booking.room_details?.number}
                                                </Typography>
                                                <Typography variant="body2">
                                                    <b>Дати:</b> {booking.start_date} — {booking.last_date}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="h6" color="primary.main" fontWeight="bold" gutterBottom>
                                                    {booking.price} грн
                                                </Typography>
                                                {renderStatus(booking.approved)}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Box>
            )}

            {/* ВКЛАДКА 2: СПОВІЩЕННЯ */}
            {currentTab === 2 && (
                <Paper sx={{ borderRadius: 2 }}>
                    {messages.length === 0 ? (
                        <Typography align="center" color="text.secondary" sx={{ p: 4 }}>У вас немає нових сповіщень.</Typography>
                    ) : (
                        <List>
                            {messages.map((msg, index) => (
                                <Box key={index}>
                                    <ListItem alignItems="flex-start" sx={{ p: 2 }}>
                                        <ListItemIcon>
                                            <NotificationsActiveIcon color={msg.title?.toLowerCase().includes('відхилено') ? 'error' : 'primary'} />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={<b>{msg.title || 'Нове сповіщення'}</b>}
                                            secondary={<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{msg.message}</Typography>}
                                        />
                                    </ListItem>
                                    {index !== messages.length - 1 && <Divider component="li" />}
                                </Box>
                            ))}
                        </List>
                    )}
                </Paper>
            )}

        </Container>
    );
}