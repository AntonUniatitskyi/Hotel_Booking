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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit'; // НОВА ІКОНКА ДЛЯ РЕДАГУВАННЯ
import api from '../api';

export default function UserProfile() {
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(true);

    const [userInfo, setUserInfo] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [messages, setMessages] = useState([]);

    // Стейти для видалення акаунта
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Стейти для деталей бронювання
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isBookingDetailsModalOpen, setIsBookingDetailsModalOpen] = useState(false);

    // Стейти для скасування бронювання
    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);

    // НОВІ СТЕЙТИ: Редагування профілю
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        first_name: '',
        last_name: '',
        age: ''
    });

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
    // ЛОГІКА: РЕДАГУВАННЯ ПРОФІЛЮ
    // ==========================================
    const handleOpenEditProfile = () => {
        setProfileForm({
            first_name: userInfo?.first_name || '',
            last_name: userInfo?.last_name || '',
            age: userInfo?.age || ''
        });
        setIsEditProfileModalOpen(true);
    };

    const handleProfileFormChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            // Формуємо об'єкт тільки з тими даними, які ми хочемо оновити
            const payload = {
                first_name: profileForm.first_name,
                last_name: profileForm.last_name,
                age: profileForm.age ? parseInt(profileForm.age) : null
            };

            const response = await api.patch('clients/me/', payload);

            // Оновлюємо стейт новими даними, що повернув бекенд
            setUserInfo(response.data);
            setIsEditProfileModalOpen(false);
            // Опціонально: можна додати alert("Дані успішно оновлено!");
        } catch (error) {
            console.error("Помилка оновлення профілю:", error);
            alert("Не вдалося оновити дані. Перевірте правильність введених значень.");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    // ==========================================
    // ЛОГІКА: ВІДКРИТТЯ ДЕТАЛЕЙ ТА СКАСУВАННЯ
    // ==========================================
    const handleOpenBookingDetails = (booking) => {
        setSelectedBooking(booking);
        setIsBookingDetailsModalOpen(true);
    };

    const handleInitiateCancel = (bookingId) => {
        setBookingToCancel(bookingId);
        setIsCancelConfirmModalOpen(true);
    };

    const confirmCancelBooking = async () => {
        if (!bookingToCancel) return;
        try {
            await api.delete(`bookings/${bookingToCancel}/`);
            setBookings(prevBookings => prevBookings.filter(b => b.id !== bookingToCancel));
            alert("Бронювання успішно скасовано!");
            setIsBookingDetailsModalOpen(false);
        } catch (error) {
            console.error("Помилка скасування:", error);
            if (error.response && error.response.status === 400) {
                alert(`❌ ${error.response.data.error || "Не вдалося скасувати бронь."}`);
            } else {
                alert("Сталася помилка при скасуванні. Перевірте консоль.");
            }
        } finally {
            setIsCancelConfirmModalOpen(false);
            setBookingToCancel(null);
        }
    };

    // ==========================================
    // ЛОГІКА: ВИДАЛЕННЯ АКАУНТА
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
            setIsDeleteDialogOpen(false);
        }
    };

    const downloadPDF = async (bookingId) => {
        try {
            const response = await api.get(`bookings/${bookingId}/download_invoice/`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice_booking_${bookingId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Помилка завантаження PDF:", error);
            alert("Не вдалося завантажити квитанцію.");
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

                    {/* ЗАГОЛОВОК З КНОПКОЮ РЕДАГУВАННЯ */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h5" fontWeight="bold">Особиста інформація</Typography>
                        <Button
                            startIcon={<EditIcon />}
                            variant="outlined"
                            size="small"
                            onClick={handleOpenEditProfile}
                        >
                            Редагувати
                        </Button>
                    </Box>
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

                    <Box sx={{ mt: 5, pt: 3, borderTop: '1px solid', borderColor: 'error.light' }}>
                        <Typography variant="subtitle1" color="error" fontWeight="bold" gutterBottom>Небезпечна зона</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Видалення облікового запису призведе до безповоротної втрати всіх ваших даних, історії сповіщень та поточних бронювань.
                        </Typography>
                        <Button variant="outlined" color="error" onClick={() => setIsDeleteDialogOpen(true)}>
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
                                                <Typography variant="body1" color="text.secondary">{booking.start_date} — {booking.last_date}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5, minWidth: '180px' }}>
                                                {renderStatus(booking.approved)}
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                    <Button size="small" variant="outlined" color="primary" startIcon={<InfoOutlinedIcon />} onClick={() => handleOpenBookingDetails(booking)}>
                                                        Деталі
                                                    </Button>
                                                    <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleInitiateCancel(booking.id)}>
                                                        Скасувати
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
            {/* МОДАЛКА: РЕДАГУВАННЯ ПРОФІЛЮ */}
            {/* ======================================================= */}
            <Dialog open={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Редагувати профіль</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                            label="Ім'я"
                            name="first_name"
                            value={profileForm.first_name}
                            onChange={handleProfileFormChange}
                            fullWidth
                        />
                        <TextField
                            label="Прізвище"
                            name="last_name"
                            value={profileForm.last_name}
                            onChange={handleProfileFormChange}
                            fullWidth
                        />
                        <TextField
                            label="Вік"
                            name="age"
                            type="number"
                            value={profileForm.age}
                            onChange={handleProfileFormChange}
                            fullWidth
                        />
                        <Typography variant="caption" color="text.secondary">
                            * Електронну пошту неможливо змінити після реєстрації.
                        </Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsEditProfileModalOpen(false)} color="inherit">
                        Скасувати
                    </Button>
                    <Button
                        onClick={handleSaveProfile}
                        variant="contained"
                        color="primary"
                        disabled={isUpdatingProfile}
                    >
                        {isUpdatingProfile ? <CircularProgress size={24} color="inherit" /> : "Зберегти зміни"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ======================================================= */}
            {/* МОДАЛКА: ДЕТАЛІ БРОНЮВАННЯ */}
            {/* ======================================================= */}
            <Dialog open={isBookingDetailsModalOpen} onClose={() => setIsBookingDetailsModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Деталі бронювання #{selectedBooking?.id}
                    {renderStatus(selectedBooking?.approved)}
                </DialogTitle>
                <DialogContent dividers>
                    {selectedBooking && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Готель</Typography>
                                <Typography variant="h6">{selectedBooking.room_details?.hostel_name}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Кімната</Typography>
                                    <Typography variant="body1">№{selectedBooking.room_details?.number}</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Ціна</Typography>
                                    <Typography variant="body1" color="primary" fontWeight="bold">{selectedBooking.price} грн</Typography>
                                </Box>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Дати перебування</Typography>
                                <Typography variant="body1">{selectedBooking.start_date} — {selectedBooking.last_date}</Typography>
                            </Box>
                            {selectedBooking.request_text && (
                                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Ваші побажання</Typography>
                                    <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>"{selectedBooking.request_text}"</Typography>
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                    <Box>
                        {selectedBooking?.approved === true && (
                            <Button variant="contained" color="primary" startIcon={<ReceiptLongIcon />} onClick={() => downloadPDF(selectedBooking.id)}>
                                Квитанція
                            </Button>
                        )}
                    </Box>
                    <Button onClick={() => setIsBookingDetailsModalOpen(false)} color="inherit" variant="outlined">
                        Закрити
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ======================================================= */}
            {/* МОДАЛКА: ПІДТВЕРДЖЕННЯ СКАСУВАННЯ */}
            {/* ======================================================= */}
            <Dialog open={isCancelConfirmModalOpen} onClose={() => setIsCancelConfirmModalOpen(false)}>
                <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>Підтвердження скасування</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Ви дійсно хочете скасувати це бронювання? Якщо до дати заїзду залишилося менше 24 годин, скасування може бути відхилено системою.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsCancelConfirmModalOpen(false)} color="inherit">Ні, залишити</Button>
                    <Button onClick={confirmCancelBooking} color="error" variant="contained">Так, скасувати</Button>
                </DialogActions>
            </Dialog>

            {/* ======================================================= */}
            {/* МОДАЛКА: ВИДАЛЕННЯ АКАУНТА */}
            {/* ======================================================= */}
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
                <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>⚠️ Видалення акаунта</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 3 }}>
                        Усі ваші дані, історія бронювань та сповіщення будуть видалені назавжди. Цю дію <b>неможливо</b> скасувати.<br/><br/>
                        Для підтвердження, будь ласка, введіть свій пароль:
                    </DialogContentText>
                    <TextField
                        autoFocus fullWidth variant="outlined" label="Ваш пароль"
                        type={showDeletePassword ? 'text' : 'password'}
                        value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowDeletePassword(!showDeletePassword)} edge="end">
                                        {showDeletePassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button onClick={() => setIsDeleteDialogOpen(false)} color="inherit">Скасувати</Button>
                    <Button onClick={confirmDeleteAccount} color="error" variant="contained" disabled={!deletePassword || isDeleting}>
                        {isDeleting ? <CircularProgress size={24} color="inherit" /> : "Видалити назавжди"}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}