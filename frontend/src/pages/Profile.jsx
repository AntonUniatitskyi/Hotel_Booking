import { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Box, CircularProgress,
    Tabs, Tab, Avatar, Grid, Card, CardContent, Divider, Chip, List, ListItem, ListItemText, ListItemIcon, Button,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, InputAdornment, IconButton,
    Snackbar, Alert, Badge
} from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import api from '../api';

export default function UserProfile() {
    const [currentTab, setCurrentTab] = useState(0);
    const [loading, setLoading] = useState(true);

    const [userInfo, setUserInfo] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [messages, setMessages] = useState([]);

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isBookingDetailsModalOpen, setIsBookingDetailsModalOpen] = useState(false);

    const [bookingToCancel, setBookingToCancel] = useState(null);
    const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);

    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', age: '' });

    const fetchAllProfileData = async () => {
        setLoading(true);
        try {
            const [infoRes, bookingsRes, messagesRes] = await Promise.all([
                api.get('clients/me/'),
                api.get('bookings/'),
                api.get('notofications/')
            ]);
            setUserInfo(infoRes.data);
            setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data.results || []);
            setMessages(Array.isArray(messagesRes.data) ? messagesRes.data : messagesRes.data.results || []);
        } catch (error) {
            console.error("Помилка завантаження даних:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllProfileData();
    }, []);

    const showNotify = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    const renderStatus = (approved) => {
        if (approved === true) return <Chip label="Схвалено" color="success" size="small" sx={{ fontWeight: 'bold' }} />;
        if (approved === false) return <Chip label="Відхилено" color="error" size="small" sx={{ fontWeight: 'bold' }} />;
        return <Chip label="Очікує" color="warning" size="small" sx={{ fontWeight: 'bold' }} />;
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.post(`notofications/${id}/read/`, { is_read: true });
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
            showNotify("Позначено як прочитане");
        } catch (error) {
            console.error(error);
            showNotify("Помилка при оновленні статусу", "error");
        }
    };

    const handleReadAll = async () => {
        try {
            await api.post('notofications/read-all/', { is_read: true });
            setMessages(prev => prev.map(m => ({ ...m, is_read: true })));
            showNotify("Всі сповіщення прочитані");
        } catch (error) {
            console.error(error);
            showNotify("Помилка", "error");
        }
    };


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
            const payload = {
                first_name: profileForm.first_name,
                last_name: profileForm.last_name,
                age: profileForm.age ? parseInt(profileForm.age) : null
            };
            const response = await api.patch('clients/me/', payload);
            setUserInfo(response.data);
            setIsEditProfileModalOpen(false);
            showNotify("Дані успішно оновлено!");
        } catch (error) {
            console.error(error);
            showNotify("Не вдалося оновити дані. Перевірте правильність введених значень.", "error");
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleInitiateCancel = (booking) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const startDate = new Date(booking.start_date);
        const endDate = new Date(booking.last_date);

        if (now > endDate) return showNotify("Це бронювання вже завершилось (дати минули). Скасування неможливе.", "error");
        if (now >= startDate && now <= endDate) return showNotify("Ви не можете скасувати бронювання, яке вже почалося.", "warning");

        const timeDiff = new Date(booking.start_date).getTime() - new Date().getTime();
        const hoursUntilCheckIn = timeDiff / (1000 * 3600);

        if (hoursUntilCheckIn > 0 && hoursUntilCheckIn <= 24) {
            return showNotify("Скасування неможливе: до заїзду залишилося менше 24 годин.", "error");
        }

        setBookingToCancel(booking.id);
        setIsCancelConfirmModalOpen(true);
    };


    const confirmCancelBooking = async () => {
        if (!bookingToCancel) return;
        try {
            await api.delete(`bookings/${bookingToCancel}/`);
            setBookings(prev => prev.filter(b => b.id !== bookingToCancel));
            showNotify("Бронювання успішно скасовано!");
            setIsBookingDetailsModalOpen(false);
        } catch (error) {
            console.error(error);
            const backendError = error.response?.data?.error || error.response?.data?.detail || "Не вдалося скасувати бронь.";
            showNotify(backendError, "error");
        } finally {
            setIsCancelConfirmModalOpen(false);
            setBookingToCancel(null);
        }
    };

    const confirmDeleteAccount = async () => {
        if (!deletePassword) return showNotify("Введіть пароль", "warning");
        setIsDeleting(true);
        try {
            await api.delete('clients/delete_me/', { data: { password: deletePassword } });
            localStorage.clear();
            window.location.href = '/login';
        } catch (error) {
            console.error(error);
            showNotify("Невірний пароль або помилка доступу", "error");
        } finally {
            setIsDeleting(false);
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
            showNotify("Не вдалося завантажити квитанцію.", "error");
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    const unreadCount = messages.filter(m => !m.is_read).length;

    return (
        <Container maxWidth="md" sx={{ mt: 5, mb: 10 }}>
            <Paper elevation={0} sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 3, mb: 4, borderRadius: 4, border: (theme) => theme.palette.mode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0' }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 36, fontWeight: 'bold' }}>
                    {userInfo?.first_name?.charAt(0) || '👤'}
                </Avatar>
                <Box>
                    <Typography variant="h4" fontWeight="bold">{userInfo?.first_name} {userInfo?.last_name}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">{userInfo?.email}</Typography>
                </Box>
            </Paper>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="fullWidth">
                    <Tab icon={<PersonIcon />} label="Профіль" iconPosition="start" />
                    <Tab icon={<HotelIcon />} label="Бронювання" iconPosition="start" />
                    <Tab
                        icon={<Badge badgeContent={unreadCount} color="error"><NotificationsActiveIcon /></Badge>}
                        label="Сповіщення"
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            {currentTab === 0 && (
                <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: (theme) => theme.palette.mode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold">Особиста інформація</Typography>
                        <Button startIcon={<EditIcon />} variant="outlined" onClick={handleOpenEditProfile}>Редагувати</Button>
                    </Box>
                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={6}>
                            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>ПІБ</Typography>
                            <Typography variant="body1" fontWeight="500">{userInfo?.fullname}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Вік</Typography>
                            <Typography variant="body1" fontWeight="500">{userInfo?.age || '—'}</Typography>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 4 }} />
                    <Box sx={{
                        p: 2,
                        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : '#fff5f5',
                        borderRadius: 3
                    }}>
                        <Typography variant="subtitle2" color="error" fontWeight="bold">Небезпечна зона</Typography>
                        <Button color="error" sx={{ mt: 1 }} onClick={() => setIsDeleteDialogOpen(true)}>Видалити акаунт</Button>
                    </Box>
                </Paper>
            )}

            {currentTab === 1 && (
                <Grid container spacing={3}>
                    {bookings.length === 0 ? (
                        <Typography sx={{ p: 4, width: '100%' }} align="center" color="text.secondary">
                            У вас немає активних бронювань
                        </Typography>
                    ) : (
                        bookings.map(b => {
                            let accentColor = '#ff9800';
                            if (b.approved === true) accentColor = '#4caf50';
                            if (b.approved === false) accentColor = '#f44336';

                            return (
                                <Grid item xs={12} sm={6} key={b.id}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            borderRadius: 4,
                                            // Магія динамічного фону
                                            bgcolor: 'background.paper',
                                            border: (theme) => theme.palette.mode === 'dark' ? '1px solid #333' : '1px solid #eaeaea',
                                            borderLeft: `8px solid ${accentColor}`,
                                            boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 4px 15px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.06)',
                                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 10px 30px rgba(0,0,0,0.6)' : '0 10px 30px rgba(0,0,0,0.12)'
                                            }
                                        }}
                                    >
                                        <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
                                            <Box>
                                                <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
                                                    {b.room_details?.hostel_name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, letterSpacing: 0.5 }}>
                                                    {b.start_date} — {b.last_date}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                                                {renderStatus(b.approved)}
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => { setSelectedBooking(b); setIsBookingDetailsModalOpen(true); }}
                                                        sx={{
                                                            border: (theme) => theme.palette.mode === 'dark' ? '1px solid #444' : '1px solid #e0e0e0',
                                                            '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.1)' : 'primary.50' }
                                                        }}
                                                    >
                                                        <InfoOutlinedIcon color="primary" fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleInitiateCancel(b)}
                                                        sx={{
                                                            border: (theme) => theme.palette.mode === 'dark' ? '1px solid #444' : '1px solid #e0e0e0',
                                                            '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.1)' : 'error.50' }
                                                        }}
                                                    >
                                                        <CancelIcon color="error" fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })
                    )}
                </Grid>
            )}

            {currentTab === 2 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <Button startIcon={<DoneAllIcon />} onClick={handleReadAll} disabled={unreadCount === 0}>Прочитати всі</Button>
                    </Box>
                    <Paper elevation={0} sx={{ borderRadius: 4, border: (theme) => theme.palette.mode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0', overflow: 'hidden' }}>
                        {messages.length === 0 ? (
                            <Typography sx={{ p: 4 }} align="center">Список порожній</Typography>
                        ) : (
                            <List disablePadding>
                                {messages.map((m, i) => (
                                    <Box key={m.id}>
                                        <ListItem
                                            sx={{
                                                bgcolor: m.is_read ? 'transparent' : 'rgba(255, 90, 95, 0.04)',
                                                p: 2.5
                                            }}
                                            secondaryAction={
                                                !m.is_read && (
                                                    <IconButton onClick={() => handleMarkAsRead(m.id)}>
                                                        <MarkEmailReadIcon fontSize="small" />
                                                    </IconButton>
                                                )
                                            }
                                        >
                                            <ListItemIcon>
                                                <NotificationsActiveIcon color={m.is_read ? 'disabled' : 'primary'} />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={<Typography fontWeight={m.is_read ? 500 : 700}>{m.title}</Typography>}
                                                secondary={m.message}
                                            />
                                        </ListItem>
                                        {i < messages.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Box>
            )}

            <Dialog open={isBookingDetailsModalOpen} onClose={() => setIsBookingDetailsModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Деталі бронювання</DialogTitle>
                <DialogContent dividers>
                    {selectedBooking && (
                        <Box sx={{ py: 1 }}>
                            <Typography variant="caption" color="text.secondary">ГОТЕЛЬ</Typography>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>{selectedBooking.room_details?.hostel_name}</Typography>
                            <Typography variant="caption" color="text.secondary">ДАТИ</Typography>
                            <Typography variant="body1" gutterBottom>{selectedBooking.start_date} — {selectedBooking.last_date}</Typography>
                            <Typography variant="caption" color="text.secondary">ЦІНА</Typography>
                            <Typography variant="h6" color="primary" fontWeight="bold">{selectedBooking.price} грн</Typography>

                            {selectedBooking.request_text && (
                                <Box sx={{
                                    p: 2,
                                    mt: 2,
                                    bgcolor: 'background.default', // Динамічний фон замість #f5f5f5
                                    borderRadius: 2
                                }}>
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
                    <Button onClick={() => setIsBookingDetailsModalOpen(false)} variant="outlined">Закрити</Button>
                </DialogActions>
            </Dialog>


            <Dialog open={isCancelConfirmModalOpen} onClose={() => setIsCancelConfirmModalOpen(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle>Скасувати бронювання?</DialogTitle>
                <DialogContent><DialogContentText>Це рішення неможливо буде змінити.</DialogContentText></DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsCancelConfirmModalOpen(false)}>Назад</Button>
                    <Button onClick={confirmCancelBooking} variant="contained" color="error">Так, скасувати</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isEditProfileModalOpen} onClose={() => setIsEditProfileModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Редагувати профіль</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField label="Ім'я" name="first_name" value={profileForm.first_name} onChange={handleProfileFormChange} fullWidth />
                        <TextField label="Прізвище" name="last_name" value={profileForm.last_name} onChange={handleProfileFormChange} fullWidth />
                        <TextField label="Вік" name="age" type="number" value={profileForm.age} onChange={handleProfileFormChange} fullWidth />
                        <Typography variant="caption" color="text.secondary">* Електронну пошту неможливо змінити після реєстрації.</Typography>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsEditProfileModalOpen(false)} color="inherit">Скасувати</Button>
                    <Button onClick={handleSaveProfile} variant="contained" color="primary" disabled={isUpdatingProfile}>
                        {isUpdatingProfile ? <CircularProgress size={24} color="inherit" /> : "Зберегти зміни"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 4 } }}>
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

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 3 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </Container>
    );
}