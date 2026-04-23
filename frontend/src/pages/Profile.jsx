import { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Box, CircularProgress,
    Tabs, Tab, Avatar, Grid, Card, CardContent, Divider, Chip, List, ListItem, ListItemText, ListItemIcon, Button,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, InputAdornment, IconButton
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CancelIcon from '@mui/icons-material/Cancel';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import api from '../api';

export default function UserProfile() {
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(true);

    const [userInfo, setUserInfo] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [messages, setMessages] = useState([]);

    // Стейти для модального вікна видалення акаунта
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // ==========================================
    // ЛОГІКА: СКАСУВАННЯ БРОНЮВАННЯ
    // ==========================================
    const handleCancelBooking = async (bookingId) => {
        const confirmCancel = window.confirm("Ви впевнені, що хочете скасувати це бронювання?");
        if (!confirmCancel) return;

        try {
            await api.delete(`bookings/${bookingId}/`);
            setBookings(prevBookings => prevBookings.filter(b => b.id !== bookingId));
            alert("Бронювання успішно скасовано!");
        } catch (error) {
            console.error("Помилка скасування:", error);
            if (error.response && error.response.status === 400) {
                alert(`❌ ${error.response.data.error || "Не вдалося скасувати бронь."}`);
            } else {
                alert("Сталася помилка при скасуванні. Перевірте консоль.");
            }
        }
    };

    useEffect(() => {
        const fetchAllProfileData = async () => {
            setLoading(true);
            try {
                const infoRes = await api.get('clients/me/');
                setUserInfo(infoRes.data);
            } catch (error) { console.error("Помилка інфо:", error); }

            try {
                const bookingsRes = await api.get('bookings/');
                setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data.results || []);
            } catch (error) { console.error("Помилка бронювань:", error); }

            try {
                const messagesRes = await api.get('notifications/');
                setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : messagesRes.data.results || []);
            } catch (error) { console.error("Помилка сповіщень:", error); }

            setLoading(false);
        };
        fetchAllProfileData();
    }, []);

    const renderStatus = (approved) => {
        if (approved === true) return <Chip label="Схвалено" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
        if (approved === false) return <Chip label="Відхилено" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
        return <Chip label="Очікує" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
    };

    // ==========================================
    // ЛОГІКА: ВИДАЛЕННЯ АКАУНТА (Через Dialog)
    // ==========================================
    const confirmDeleteAccount = async () => {
        if (!deletePassword) {
            alert("Будь ласка, введіть пароль.");
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete('clients/delete_me/', {
                data: { password: deletePassword }
            });

            localStorage.removeItem('token');
            localStorage.removeItem('refresh');
            localStorage.removeItem('role');
            localStorage.removeItem('user');

            alert("Ваш акаунт було успішно видалено. Шкода, що ви нас покидаєте! 😢");
            window.location.href = '/login';

        } catch (error) {
            console.error("Помилка видалення акаунта:", error);
            if (error.response && error.response.status === 403) {
                alert("❌ Невірний пароль! Або ви намагаєтесь видалити акаунт адміністратора.");
            } else if (error.response && error.response.status === 400) {
                alert("❌ Пароль не передано.");
            } else {
                alert("Не вдалося видалити акаунт. Перевірте з'єднання.");
            }
        } finally {
            setIsDeleting(false);
            setDeletePassword('');
            setIsDeleteDialogOpen(false); // Закриваємо модалку після помилки або успіху
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
                            <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>Ім'я та Прізвище</Typography>
                            <Typography variant="h6" fontWeight="bold">{userInfo?.fullname || `${userInfo?.first_name} ${userInfo?.last_name}`}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>Електронна пошта</Typography>
                            <Typography variant="h6" fontWeight="bold">{userInfo?.email}</Typography>
                        </Grid>
                        {userInfo?.age && (
                            <Grid item xs={12} sm={6}>
                                <Typography color="text.secondary" variant="body2" sx={{ mb: 0.5, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>Вік</Typography>
                                <Typography variant="h6" fontWeight="bold">{userInfo?.age} років</Typography>
                            </Grid>
                        )}
                    </Grid>

                    {/* НЕБЕЗПЕЧНА ЗОНА */}
                    <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'error.light' }}>
                        <Typography variant="subtitle1" color="error" fontWeight="bold" gutterBottom>Небезпечна зона</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Видалення облікового запису призведе до безповоротної втрати всіх ваших даних, історії сповіщень та поточних бронювань.
                        </Typography>
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={() => setIsDeleteDialogOpen(true)} // Відкриваємо модалку замість window.prompt
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
                                    <Card variant="outlined" sx={{ borderRadius: 3, boxShadow: 1 }}>
                                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, flexWrap: 'wrap', gap: 2 }}>
                                            <Box sx={{ pr: 3, flexGrow: 1 }}>
                                                <Typography variant="h6" fontWeight="bold">{booking.room_details?.hostel_name}</Typography>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>Кімната №{booking.room_details?.number}</Typography>
                                                <Typography variant="body1"><Box component="span" fontWeight="bold">Дати:</Box> {booking.start_date} — {booking.last_date}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5, minWidth: '180px' }}>
                                                <Typography variant="h5" color="primary.main" fontWeight="bold">{booking.price} грн</Typography>
                                                {renderStatus(booking.approved)}
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    {booking.approved === true && (
                                                        <Button
                                                            size="small" variant="outlined" startIcon={<ReceiptLongIcon />} sx={{ borderColor: '#ccc', color: '#555' }}
                                                            onClick={async () => {
                                                                try {
                                                                    const response = await api.get(`bookings/${booking.id}/download_invoice/`, { responseType: 'blob' });
                                                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                                                    const link = document.createElement('a');
                                                                    link.href = url;
                                                                    link.setAttribute('download', `invoice_booking_${booking.id}.pdf`);
                                                                    document.body.appendChild(link);
                                                                    link.click();
                                                                    link.parentNode.removeChild(link);
                                                                } catch (error) {
                                                                    alert("Не вдалося завантажити квитанцію.");
                                                                }
                                                            }}
                                                        >
                                                            КВИТАНЦІЯ
                                                        </Button>
                                                    )}
                                                    <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleCancelBooking(booking.id)}>
                                                        СКАСУВАТИ
                                                    </Button>
                                                </Box>
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

            {/* ======================================================= */}
            {/* МОДАЛЬНЕ ВІКНО ДЛЯ ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ АКАУНТА */}
            {/* ======================================================= */}
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>⚠️ Видалення акаунта</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Усі ваші дані, історія бронювань та сповіщення будуть видалені назавжди. Цю дію <b>неможливо</b> скасувати.
                        <br/><br/>
                        Для підтвердження, будь ласка, введіть свій пароль:
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        variant="outlined"
                        label="Ваш пароль"
                        // ТУТ МАГІЯ: змінюємо тип поля залежно від стейту showDeletePassword
                        type={showDeletePassword ? 'text' : 'password'}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                                        edge="end"
                                    >
                                        {/* Показуємо перекреслене або звичайне око */}
                                        {showDeletePassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setIsDeleteDialogOpen(false)} color="inherit">
                        Скасувати
                    </Button>
                    <Button
                        onClick={confirmDeleteAccount}
                        color="error"
                        variant="contained"
                        disabled={!deletePassword || isDeleting}
                    >
                        {isDeleting ? <CircularProgress size={24} color="inherit" /> : "Видалити назавжди"}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}