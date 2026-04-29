import { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Button, Box, CircularProgress,
    Tabs, Tab, TextField, Switch, FormControlLabel, Divider, IconButton,
    Select, MenuItem, InputLabel, FormControl, Grid, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, Card, CardContent
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import DomainIcon from '@mui/icons-material/Domain';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import api from '../api';

export default function AdminDashboard() {
    const [currentTab, setCurrentTab] = useState(0);
    const [bookings, setBookings] = useState([]);
    const [myHostels, setMyHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // СНАКБАР
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // ФІЛЬТРИ ДЛЯ ЗАЯВОК
    const [filterHotel, setFilterHotel] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterLastDate, setFilterLastDate] = useState('');
    const [filterClientName, setFilterClientName] = useState('');

    // ФОРМИ
    const [hostelForm, setHostelForm] = useState({ name: '', about: '', city: '', address: '', is_active: true, main_image: null });
    const [roomForm, setRoomForm] = useState({ number: '', price: '', bed: '', hostel: '', preview: null });

    // МОДАЛКИ
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingHotel, setEditingHotel] = useState(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    // ГАЛЕРЕЯ
    const [uploadingImage, setUploadingImage] = useState(false);
    const [pendingGalleryFiles, setPendingGalleryFiles] = useState([]);
    const [myRooms, setMyRooms] = useState([]);
    const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [pendingRoomGalleryFiles, setPendingRoomGalleryFiles] = useState([]);
    const [uploadingRoomImage, setUploadingRoomImage] = useState(false);
    const showNotify = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

    // ==========================================
    // ЗАВАНТАЖЕННЯ ДАНИХ
    // ==========================================
    const loadAllData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, hostelsRes, roomsRes] = await Promise.all([
                api.get('bookings/'),
                api.get('hostels/'),
                api.get('rooms/') // Завантажуємо всі кімнати
            ]);
            setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data.results || []);
            setMyHostels(Array.isArray(hostelsRes.data) ? hostelsRes.data : hostelsRes.data.results || []);
            setMyRooms(Array.isArray(roomsRes.data) ? roomsRes.data : roomsRes.data.results || []);
        } catch (error) {
            console.error("Помилка завантаження даних:", error);
            showNotify("Помилка при завантаженні даних", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAllData(); }, []);

    // Статистика для Дашбордів
    const pendingCount = bookings.filter(b => b.approved === null).length;
    const totalHotels = myHostels.length;
    const totalBookings = bookings.length;

    // ==========================================
    // ЛОГІКА: ЗАЯВКИ
    // ==========================================
    const fetchFilteredBookings = async () => {
        try {
            const params = {};
            if (filterHotel) params.room__hostel = filterHotel;
            if (filterStartDate) params.start_from = filterStartDate;
            if (filterLastDate) params.start_to = filterLastDate;

            const response = await api.get('bookings/', { params });
            setBookings(Array.isArray(response.data) ? response.data : response.data.results || []);
            showNotify("Фільтри застосовано", "info");
        } catch (error) {
            console.error(error);
            showNotify("Помилка при завантаженні заявок", "error");
        }
    };

    const clearFilters = () => {
        setFilterHotel(''); setFilterStartDate(''); setFilterLastDate(''); setFilterClientName('');
        api.get('bookings/').then(res => {
            setBookings(Array.isArray(res.data) ? res.data : res.data.results || []);
            showNotify("Фільтри очищено", "info");
        });
    };

    const displayedBookings = bookings.filter(b => {
        if (!filterClientName) return true;
        const clientName = b.client_details?.fullname?.toLowerCase() || '';
        return clientName.includes(filterClientName.toLowerCase());
    });

    const handleStatusChange = async (bookingId, isApproved) => {
        try {
            await api.patch(`bookings/${bookingId}/`, { approved: isApproved });
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, approved: isApproved } : b));
            showNotify(`Статус заявки успішно ${isApproved ? 'схвалено' : 'відхилено'}`, isApproved ? 'success' : 'error');
        } catch (error) {
            console.error(error);
            showNotify("Помилка зміни статусу", "error");
        }
    };

    // ==========================================
    // ЛОГІКА: ГАЛЕРЕЯ ТА ГОТЕЛІ
    // ==========================================
    const handleSelectGalleryFiles = (e) => {
        setPendingGalleryFiles(prev => [...prev, ...Array.from(e.target.files)]);
        e.target.value = null;
    };

    const handleConfirmUploadGallery = async () => {
        if (pendingGalleryFiles.length === 0) return;
        setUploadingImage(true);
        const formData = new FormData();
        pendingGalleryFiles.forEach(file => formData.append('images', file));

        try {
            const response = await api.post(`hostels/${editingHotel.id}/upload_image/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updatedHotel = { ...editingHotel, gallery_images: [...(editingHotel.gallery_images || []), ...response.data] };
            setEditingHotel(updatedHotel);
            setMyHostels(prev => prev.map(h => h.id === editingHotel.id ? updatedHotel : h));
            setPendingGalleryFiles([]);
            showNotify("Фото успішно додані", "success");
        } catch (error) {
            console.error(error);
            showNotify("Помилка завантаження фото", "error");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDeleteGalleryImage = async (imageId) => {
        if (!window.confirm("Видалити це фото назавжди?")) return;
        try {
            await api.delete(`hostels/${editingHotel.id}/delete_image/${imageId}/`);
            const updatedHotel = { ...editingHotel, gallery_images: editingHotel.gallery_images.filter(img => img.id !== imageId) };
            setEditingHotel(updatedHotel);
            setMyHostels(prev => prev.map(h => h.id === editingHotel.id ? updatedHotel : h));
            showNotify("Фото видалено", "info");
        } catch (error) {
            console.error(error);
            showNotify("Помилка видалення фото", "error");
        }
    };

    const handleDeleteHostel = async (id) => {
        if (!window.confirm("Видалити цей готель та всі його кімнати?")) return;
        try {
            await api.delete(`hostels/${id}/`);
            setMyHostels(prev => prev.filter(h => h.id !== id));
            showNotify("Готель видалено", "success");
        } catch (error) {
            console.error(error);
            showNotify("Помилка при видаленні", "error");
        }
    };

    const handleSaveEdit = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', editingHotel.name);
        formData.append('about', editingHotel.about);
        formData.append('address', editingHotel.address);
        formData.append('is_active', editingHotel.is_active);
        if (editingHotel.city) formData.append('city', editingHotel.city);
        if (editingHotel.main_image instanceof File) formData.append('main_image', editingHotel.main_image);

        try {
            const response = await api.patch(`hostels/${editingHotel.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMyHostels(prev => prev.map(h => h.id === editingHotel.id ? response.data : h));
            setIsEditModalOpen(false);
            showNotify("Дані готелю оновлено!", "success");
        } catch (error) {
            console.error(error);
            showNotify("Помилка оновлення", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateHostel = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();
        Object.keys(hostelForm).forEach(key => { if (hostelForm[key] !== null) formData.append(key, hostelForm[key]); });
        try {
            await api.post('hostels/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showNotify("🎉 Готель успішно створено!", "success");
            setHostelForm({ name: '', about: '', city: '', address: '', is_active: true, main_image: null });
            loadAllData();
            setCurrentTab(1);
        } catch (error) {
            console.error(error);
            showNotify("Помилка створення готелю", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();
        Object.keys(roomForm).forEach(key => { if (roomForm[key]) formData.append(key, roomForm[key]); });
        try {
            await api.post('rooms/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            showNotify("🛏️ Кімнату успішно додано!", "success");
            setRoomForm({ number: '', price: '', bed: '', hostel: '', preview: null });
        } catch (error) {
            console.error(error);
            showNotify("Помилка створення кімнати", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // ЛОГІКА: РЕДАГУВАННЯ КІМНАТ ТА ЇХ ГАЛЕРЕЯ
    // ==========================================
    const handleDeleteRoom = async (id) => {
        if (!window.confirm("Видалити цю кімнату назавжди?")) return;
        try {
            await api.delete(`rooms/${id}/`);
            setMyRooms(prev => prev.filter(r => r.id !== id));
            showNotify("Кімнату видалено", "success");
        } catch (error) {
            console.error(error);
            showNotify("Помилка при видаленні кімнати", "error");
        }
    };

    const handleSaveEditRoom = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('number', editingRoom.number);
        formData.append('price', editingRoom.price);
        formData.append('bed', editingRoom.bed);
        formData.append('hostel', editingRoom.hostel);
        if (editingRoom.preview instanceof File) formData.append('preview', editingRoom.preview);

        try {
            const response = await api.patch(`rooms/${editingRoom.id}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setMyRooms(prev => prev.map(r => r.id === editingRoom.id ? response.data : r));
            setIsEditRoomModalOpen(false);
            showNotify("Дані кімнати оновлено!", "success");
        } catch (error) {
            console.error(error);
            showNotify("Помилка оновлення кімнати", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmUploadRoomGallery = async () => {
        if (pendingRoomGalleryFiles.length === 0) return;
        setUploadingRoomImage(true);
        const formData = new FormData();
        pendingRoomGalleryFiles.forEach(file => formData.append('images', file));

        try {
            const response = await api.post(`rooms/${editingRoom.id}/upload_image/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const updatedRoom = { ...editingRoom, gallery_images: [...(editingRoom.gallery_images || []), ...response.data] };
            setEditingRoom(updatedRoom);
            setMyRooms(prev => prev.map(r => r.id === editingRoom.id ? updatedRoom : r));
            setPendingRoomGalleryFiles([]);
            showNotify("Фото кімнати успішно додані", "success");
        } catch (error) {
            console.error(error);
            showNotify("Помилка завантаження фото кімнати", "error");
        } finally {
            setUploadingRoomImage(false);
        }
    };

    const handleDeleteRoomGalleryImage = async (imageId) => {
        if (!window.confirm("Видалити це фото кімнати назавжди?")) return;
        try {
            await api.delete(`rooms/${editingRoom.id}/delete_image/${imageId}/`);
            const updatedRoom = { ...editingRoom, gallery_images: editingRoom.gallery_images.filter(img => img.id !== imageId) };
            setEditingRoom(updatedRoom);
            setMyRooms(prev => prev.map(r => r.id === editingRoom.id ? updatedRoom : r));
            showNotify("Фото видалено", "info");
        } catch (error) {
            console.error(error);
            showNotify("Помилка видалення фото", "error");
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="xl" sx={{ mt: 5, mb: 10 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold">👑 Панель Управління</Typography>
            </Box>

            {/* СТАТИСТИКА (ДАШБОРДИ) */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 4, bgcolor: '#f8f9fa' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mr: 2 }}><DomainIcon fontSize="large" /></Avatar>
                            <Box>
                                <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Всього Готелів</Typography>
                                <Typography variant="h4" fontWeight="bold">{totalHotels}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 4, bgcolor: '#f8f9fa' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56, mr: 2 }}><AssignmentIcon fontSize="large" /></Avatar>
                            <Box>
                                <Typography color="text.secondary" variant="subtitle2" fontWeight="bold">Всі Заявки</Typography>
                                <Typography variant="h4" fontWeight="bold">{totalBookings}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={0} sx={{ border: '1px solid #ffcc80', borderRadius: 4, bgcolor: '#fff8e1' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
                            <Avatar sx={{ bgcolor: '#ffb300', width: 56, height: 56, mr: 2 }}><PendingActionsIcon fontSize="large" /></Avatar>
                            <Box>
                                <Typography color="warning.dark" variant="subtitle2" fontWeight="bold">Очікують Рішення</Typography>
                                <Typography variant="h4" fontWeight="bold" color="warning.dark">{pendingCount}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* НАВІГАЦІЯ */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
                <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable" sx={{ '& .MuiTab-root': { fontWeight: 'bold', fontSize: '1rem' } }}>
                    <Tab label="📝 Заявки на бронювання" />
                    <Tab label="🏨 Мої готелі" />
                    <Tab label="🔑 Мої кімнати" /> {/* <--- НОВА ВКЛАДКА */}
                    <Tab label="➕ Додати готель" />
                    <Tab label="🛏️ Додати кімнату" />
                </Tabs>
            </Box>

            {/* ВКЛАДКА 0: ЗАЯВКИ */}
            {currentTab === 0 && (
                <Box>
                    <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: '#fafafa', borderRadius: 4, border: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FilterAltIcon color="primary" /> Панель фільтрації
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                                    <InputLabel>Готель</InputLabel>
                                    <Select value={filterHotel} label="Готель" onChange={(e) => setFilterHotel(e.target.value)}>
                                        <MenuItem value=""><em>Всі готелі</em></MenuItem>
                                        {myHostels.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} sm={2.5}>
                                <TextField size="small" fullWidth type="date" label="З дати" InputLabelProps={{ shrink: true }} value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} sx={{ bgcolor: 'white' }} />
                            </Grid>
                            <Grid item xs={12} sm={2.5}>
                                <TextField size="small" fullWidth type="date" label="По дату" InputLabelProps={{ shrink: true }} value={filterLastDate} onChange={(e) => setFilterLastDate(e.target.value)} sx={{ bgcolor: 'white' }} />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField size="small" fullWidth label="Пошук клієнта (ПІБ)" value={filterClientName} onChange={(e) => setFilterClientName(e.target.value)} sx={{ bgcolor: 'white' }} />
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button variant="outlined" color="inherit" onClick={clearFilters} sx={{ borderRadius: 2 }}>Очистити</Button>
                            <Button variant="contained" color="primary" onClick={fetchFilteredBookings} sx={{ borderRadius: 2, boxShadow: 'none' }}>Застосувати фільтри</Button>
                        </Box>
                    </Paper>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0' }}>
                        <Table sx={{ minWidth: 650 }}>
                            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                <TableRow>
                                    <TableCell><b>ID</b></TableCell>
                                    <TableCell><b>Клієнт</b></TableCell>
                                    <TableCell><b>Деталі Бронювання</b></TableCell>
                                    <TableCell><b>Статус</b></TableCell>
                                    <TableCell align="center"><b>Дії</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {displayedBookings.length > 0 ? (
                                    displayedBookings.map((b) => (
                                        <TableRow key={b.id} hover>
                                            <TableCell>#{b.id}</TableCell>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight="bold">{b.client_details?.fullname}</Typography>
                                                    <IconButton size="small" color="primary" onClick={() => { setSelectedClient(b.client_details); setIsClientModalOpen(true); }}><AccountBoxIcon fontSize="small" /></IconButton>
                                                </Box>
                                                {b.request_text && <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>"{b.request_text}"</Typography>}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold">{b.room_details?.hostel_name}</Typography>
                                                <Typography variant="caption" color="text.secondary">Кімната №{b.room_details?.number} | {b.start_date} — {b.last_date}</Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={b.approved === true ? "Схвалено" : b.approved === false ? "Відхилено" : "Очікує"} color={b.approved === true ? "success" : b.approved === false ? "error" : "warning"} size="small" sx={{ fontWeight: 'bold' }} />
                                            </TableCell>
                                            <TableCell align="center">
                                                {b.approved === null && (
                                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                        <Button size="small" variant="contained" color="success" onClick={() => handleStatusChange(b.id, true)} sx={{ minWidth: '40px', p: 0.5 }}>✓</Button>
                                                        <Button size="small" variant="outlined" color="error" onClick={() => handleStatusChange(b.id, false)} sx={{ minWidth: '40px', p: 0.5 }}>✗</Button>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><Typography color="text.secondary">Заявок не знайдено.</Typography></TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* ВКЛАДКА 1: МОЇ ГОТЕЛІ */}
            {currentTab === 1 && (
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell><b>Фото</b></TableCell>
                                <TableCell><b>Назва</b></TableCell>
                                <TableCell><b>Локація</b></TableCell>
                                <TableCell><b>Статус</b></TableCell>
                                <TableCell align="center"><b>Дії</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {myHostels.map((h) => (
                                <TableRow key={h.id} hover>
                                    <TableCell><Avatar src={h.main_image} variant="rounded" sx={{ width: 60, height: 60 }} /></TableCell>
                                    <TableCell><Typography variant="body1" fontWeight="bold">{h.name}</Typography></TableCell>
                                    <TableCell>{h.city}, {h.address}</TableCell>
                                    <TableCell><Chip label={h.is_active ? "Активний" : "Прихований"} color={h.is_active ? "success" : "default"} variant="outlined" size="small" /></TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => { setEditingHotel({ ...h }); setPendingGalleryFiles([]); setIsEditModalOpen(true); }}><EditIcon /></IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteHostel(h.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ВКЛАДКА 2: МОЇ КІМНАТИ */}
            {currentTab === 2 && (
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 4, border: '1px solid #e0e0e0' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                            <TableRow>
                                <TableCell><b>Прев'ю</b></TableCell>
                                <TableCell><b>Готель</b></TableCell>
                                <TableCell><b>Кімната №</b></TableCell>
                                <TableCell><b>Характеристики</b></TableCell>
                                <TableCell align="center"><b>Дії</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {myRooms.map((r) => (
                                <TableRow key={r.id} hover>
                                    <TableCell><Avatar src={r.preview} variant="rounded" sx={{ width: 60, height: 60 }} /></TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold">
                                            {myHostels.find(h => h.id === r.hostel)?.name || `Готель ID: ${r.hostel}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell><Typography variant="body1" fontWeight="bold">№ {r.number}</Typography></TableCell>
                                    <TableCell>
                                        <Chip label={`🛏️ ${r.bed} місця`} size="small" sx={{ mr: 1, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 'bold' }} />
                                        <Chip label={`💰 ${r.price} грн`} size="small" sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'bold' }} />
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => { setEditingRoom({ ...r }); setPendingRoomGalleryFiles([]); setIsEditRoomModalOpen(true); }}><EditIcon /></IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteRoom(r.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {myRooms.length === 0 && (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>У вас ще немає створених кімнат.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ВКЛАДКА 3: ДОДАТИ ГОТЕЛЬ */}
            {currentTab === 3 && (
                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, maxWidth: 700, mx: 'auto', borderRadius: 4, border: '1px solid #e0e0e0' }}>
                    <Typography variant="h5" fontWeight="bold" mb={3}>Створення нового готелю</Typography>
                    <Box component="form" onSubmit={handleCreateHostel} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField required label="Назва готелю" name="name" value={hostelForm.name} onChange={(e) => setHostelForm(p => ({ ...p, name: e.target.value }))} sx={{ bgcolor: '#fafafa' }} />
                        <TextField required label="Опис" name="about" multiline rows={4} value={hostelForm.about} onChange={(e) => setHostelForm(p => ({ ...p, about: e.target.value }))} sx={{ bgcolor: '#fafafa' }} />
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}><TextField label="Місто" name="city" value={hostelForm.city} onChange={(e) => setHostelForm(p => ({ ...p, city: e.target.value }))} fullWidth sx={{ bgcolor: '#fafafa' }} /></Grid>
                            <Grid item xs={12} sm={6}><TextField required label="Адреса" name="address" value={hostelForm.address} onChange={(e) => setHostelForm(p => ({ ...p, address: e.target.value }))} fullWidth sx={{ bgcolor: '#fafafa' }} /></Grid>
                        </Grid>

                        <Box sx={{ border: '2px dashed #ccc', p: 3, borderRadius: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
                            {hostelForm.main_image && <img src={URL.createObjectURL(hostelForm.main_image)} alt="Preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />}
                            <Button variant="outlined" component="label" size="large" startIcon={<CloudUploadIcon />}>
                                {hostelForm.main_image ? "Змінити фото" : "Завантажити головне фото"}
                                <input type="file" hidden accept="image/*" onChange={(e) => setHostelForm(p => ({ ...p, main_image: e.target.files[0] }))} />
                            </Button>
                        </Box>

                        <FormControlLabel control={<Switch checked={hostelForm.is_active} onChange={(e) => setHostelForm(p => ({ ...p, is_active: e.target.checked }))} />} label={<Typography fontWeight="bold">Активний (видимий для всіх)</Typography>} />
                        <Button type="submit" variant="contained" disabled={isSubmitting} size="large" sx={{ py: 1.5, fontSize: '1.1rem' }}>Створити готель</Button>
                    </Box>
                </Paper>
            )}

            {/* ВКЛАДКА 4: ДОДАТИ КІМНАТУ */}
            {currentTab === 4 && (
                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, maxWidth: 700, mx: 'auto', borderRadius: 4, border: '1px solid #e0e0e0' }}>
                    <Typography variant="h5" fontWeight="bold" mb={3}>Додавання кімнати</Typography>
                    {myHostels.length === 0 ? (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>Спочатку створіть хоча б один готель!</Alert>
                    ) : (
                        <Box component="form" onSubmit={handleCreateRoom} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <FormControl fullWidth required sx={{ bgcolor: '#fafafa' }}>
                                <InputLabel>Оберіть готель</InputLabel>
                                <Select value={roomForm.hostel} label="Оберіть готель" onChange={(e) => setRoomForm(p => ({ ...p, hostel: e.target.value }))}>
                                    {myHostels.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={4}><TextField required label="Номер кімнати" type="number" value={roomForm.number} onChange={(e) => setRoomForm(p => ({ ...p, number: e.target.value }))} fullWidth sx={{ bgcolor: '#fafafa' }} /></Grid>
                                <Grid item xs={12} sm={4}><TextField required label="Місць" type="number" value={roomForm.bed} onChange={(e) => setRoomForm(p => ({ ...p, bed: e.target.value }))} fullWidth sx={{ bgcolor: '#fafafa' }} /></Grid>
                                <Grid item xs={12} sm={4}><TextField required label="Ціна (грн)" type="number" value={roomForm.price} onChange={(e) => setRoomForm(p => ({ ...p, price: e.target.value }))} fullWidth sx={{ bgcolor: '#fafafa' }} /></Grid>
                            </Grid>
                            <Box sx={{ border: '2px dashed #ccc', p: 3, borderRadius: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
                                {roomForm.preview && <img src={URL.createObjectURL(roomForm.preview)} alt="Room Preview" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />}
                                <Button variant="outlined" component="label" size="large" color="primary" startIcon={<CloudUploadIcon />}>
                                    {roomForm.preview ? "Змінити фото" : "Завантажити фото кімнати"}
                                    <input type="file" hidden accept="image/*" onChange={(e) => setRoomForm(p => ({ ...p, preview: e.target.files[0] }))} />
                                </Button>
                            </Box>
                            <Button type="submit" variant="contained" disabled={isSubmitting} size="large" sx={{ py: 1.5, fontSize: '1.1rem' }}>Зберегти кімнату</Button>
                        </Box>
                    )}
                </Paper>
            )}

            {/* Модалки (Редагування готелю та Профіль клієнта) залишаються з мінімальними візуальними правками (Border Radius) */}
            <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle fontWeight="bold">Редагувати готель</DialogTitle>
                <DialogContent dividers>
                    {editingHotel && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField required label="Назва" name="name" value={editingHotel.name} onChange={(e) => setEditingHotel(p => ({ ...p, name: e.target.value }))} fullWidth />
                            <TextField required label="Про готель" name="about" multiline rows={3} value={editingHotel.about} onChange={(e) => setEditingHotel(p => ({ ...p, about: e.target.value }))} fullWidth />
                            <TextField label="Місто" name="city" value={editingHotel.city || ''} onChange={(e) => setEditingHotel(p => ({ ...p, city: e.target.value }))} fullWidth />
                            <TextField required label="Адреса" name="address" value={editingHotel.address} onChange={(e) => setEditingHotel(p => ({ ...p, address: e.target.value }))} fullWidth />
                            <FormControlLabel control={<Switch checked={editingHotel.is_active} onChange={(e) => setEditingHotel(p => ({ ...p, is_active: e.target.checked }))} />} label="Активний" />

                            {/* ГАЛЕРЕЯ */}
                            <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">Галерея</Typography>
                                    <Button variant="contained" component="label" size="small" startIcon={<CloudUploadIcon />}>Обрати фото<input type="file" hidden accept="image/*" multiple onChange={handleSelectGalleryFiles} /></Button>
                                </Box>
                                {pendingGalleryFiles.length > 0 && (
                                    <Box sx={{ mb: 2, p: 2, border: '2px dashed #1976d2', borderRadius: 2, bgcolor: '#e3f2fd' }}>
                                        <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'block', mb: 1.5 }}>До завантаження:</Typography>
                                        <Grid container spacing={2}>
                                            {pendingGalleryFiles.map((file, idx) => (
                                                <Grid item xs={4} sm={3} key={idx}>
                                                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', bgcolor: '#e0e0e0', borderRadius: 1 }}>
                                                        <img src={URL.createObjectURL(file)} alt="new preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
                                                        <IconButton size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, p: 0.5, bgcolor: 'white', boxShadow: 2 }} onClick={() => setPendingGalleryFiles(p => p.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                        <Button variant="contained" size="small" fullWidth sx={{ mt: 2 }} onClick={handleConfirmUploadGallery} disabled={uploadingImage}>{uploadingImage ? <CircularProgress size={20} color="inherit" /> : "Завантажити обрані"}</Button>
                                    </Box>
                                )}
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    {editingHotel.gallery_images?.map((img) => (
                                        <Grid item xs={4} sm={3} key={img.id}>
                                            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', bgcolor: '#e0e0e0', borderRadius: 1 }}>
                                                <img src={img.image} alt="gallery item" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
                                                <IconButton size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, p: 0.5, bgcolor: 'white', boxShadow: 2 }} onClick={() => handleDeleteGalleryImage(img.id)}><DeleteIcon fontSize="small" /></IconButton>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setIsEditModalOpen(false)} color="inherit">Скасувати</Button><Button onClick={handleSaveEdit} variant="contained" color="primary" disabled={isSubmitting}>Зберегти зміни</Button></DialogActions>
            </Dialog>

            <Dialog open={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Профіль клієнта</DialogTitle>
                <DialogContent dividers>
                    {selectedClient ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 36 }}>{selectedClient.fullname?.charAt(0) || '👤'}</Avatar>
                            <Typography variant="h5" fontWeight="bold">{selectedClient.fullname || 'Не вказано'}</Typography>
                            <Divider flexItem sx={{ my: 1 }} />
                            <Box sx={{ width: '100%', px: 2 }}>
                                <Typography variant="body2" color="text.secondary" fontWeight="bold">Електронна пошта</Typography>
                                <Typography variant="body1" mb={2}>{selectedClient.email || 'Не вказано'}</Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight="bold">Вік</Typography>
                                <Typography variant="body1">{selectedClient.age ? `${selectedClient.age} років` : 'Не вказано'}</Typography>
                            </Box>
                        </Box>
                    ) : (<Typography align="center">Дані відсутні</Typography>)}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}><Button onClick={() => setIsClientModalOpen(false)} color="inherit" fullWidth>Закрити</Button></DialogActions>
            </Dialog>

            {/* ========================================================= */}
            {/* МОДАЛКА РЕДАГУВАННЯ КІМНАТИ ТА ЇЇ ГАЛЕРЕЇ */}
            {/* ========================================================= */}
            <Dialog open={isEditRoomModalOpen} onClose={() => setIsEditRoomModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle fontWeight="bold">Редагувати кімнату №{editingRoom?.number}</DialogTitle>
                <DialogContent dividers>
                    {editingRoom && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}><TextField required label="Номер" type="number" value={editingRoom.number} onChange={(e) => setEditingRoom(p => ({ ...p, number: e.target.value }))} fullWidth /></Grid>
                                <Grid item xs={12} sm={4}><TextField required label="Місць" type="number" value={editingRoom.bed} onChange={(e) => setEditingRoom(p => ({ ...p, bed: e.target.value }))} fullWidth /></Grid>
                                <Grid item xs={12} sm={4}><TextField required label="Ціна" type="number" value={editingRoom.price} onChange={(e) => setEditingRoom(p => ({ ...p, price: e.target.value }))} fullWidth /></Grid>
                            </Grid>
                            <FormControl fullWidth required>
                                <InputLabel>Прив'язка до готелю</InputLabel>
                                <Select value={editingRoom.hostel} label="Прив'язка до готелю" onChange={(e) => setEditingRoom(p => ({ ...p, hostel: e.target.value }))}>
                                    {myHostels.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
                                </Select>
                            </FormControl>

                            <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2, textAlign: 'center' }}>
                                <Box sx={{ mb: 1.5 }}>
                                    <img src={editingRoom.preview instanceof File ? URL.createObjectURL(editingRoom.preview) : editingRoom.preview} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />
                                </Box>
                                <Button variant="outlined" component="label" size="small">
                                    {editingRoom.preview instanceof File ? "Змінити обране" : "Змінити прев'ю"}
                                    <input type="file" hidden accept="image/*" onChange={(e) => setEditingRoom(p => ({ ...p, preview: e.target.files[0] }))} />
                                </Button>
                            </Box>

                            {/* ГАЛЕРЕЯ КІМНАТИ */}
                            <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">Галерея кімнати</Typography>
                                    <Button variant="contained" component="label" size="small" startIcon={<CloudUploadIcon />}>Обрати фото<input type="file" hidden accept="image/*" multiple onChange={(e) => { setPendingRoomGalleryFiles(prev => [...prev, ...Array.from(e.target.files)]); e.target.value = null; }} /></Button>
                                </Box>

                                {pendingRoomGalleryFiles.length > 0 && (
                                    <Box sx={{ mb: 2, p: 2, border: '2px dashed #1976d2', borderRadius: 2, bgcolor: '#e3f2fd' }}>
                                        <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'block', mb: 1.5 }}>До завантаження:</Typography>
                                        <Grid container spacing={2}>
                                            {pendingRoomGalleryFiles.map((file, idx) => (
                                                <Grid item xs={4} sm={3} key={idx}>
                                                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', bgcolor: '#e0e0e0', borderRadius: 1 }}>
                                                        <img src={URL.createObjectURL(file)} alt="new preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
                                                        <IconButton size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, p: 0.5, bgcolor: 'white', boxShadow: 2 }} onClick={() => setPendingRoomGalleryFiles(p => p.filter((_, i) => i !== idx))}><DeleteIcon fontSize="small" /></IconButton>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                        <Button variant="contained" size="small" fullWidth sx={{ mt: 2 }} onClick={handleConfirmUploadRoomGallery} disabled={uploadingRoomImage}>{uploadingRoomImage ? <CircularProgress size={20} color="inherit" /> : "Завантажити обрані"}</Button>
                                    </Box>
                                )}
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    {editingRoom.gallery_images?.map((img) => (
                                        <Grid item xs={4} sm={3} key={img.id}>
                                            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', bgcolor: '#e0e0e0', borderRadius: 1 }}>
                                                <img src={img.image} alt="gallery item" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
                                                <IconButton size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, p: 0.5, bgcolor: 'white', boxShadow: 2 }} onClick={() => handleDeleteRoomGalleryImage(img.id)}><DeleteIcon fontSize="small" /></IconButton>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsEditRoomModalOpen(false)} color="inherit">Скасувати</Button>
                    <Button onClick={handleSaveEditRoom} variant="contained" color="primary" disabled={isSubmitting}>Зберегти зміни</Button>
                </DialogActions>
            </Dialog>

            {/* СНАКБАР */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 3 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
}