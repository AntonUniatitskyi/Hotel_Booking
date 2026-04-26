import { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Button, Box, CircularProgress,
    Tabs, Tab, TextField, Switch, FormControlLabel, Divider, IconButton,
    Select, MenuItem, InputLabel, FormControl, Grid, Avatar, // Додано Avatar
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AccountBoxIcon from '@mui/icons-material/AccountBox'; // НОВА ІКОНКА ПРОФІЛЮ КЛІЄНТА
import api from '../api';

export default function AdminDashboard() {
    const [currentTab, setCurrentTab] = useState(0);
    const [bookings, setBookings] = useState([]);
    const [myHostels, setMyHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ФІЛЬТРИ ДЛЯ ЗАЯВОК
    const [filterHotel, setFilterHotel] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterLastDate, setFilterLastDate] = useState('');
    const [filterClientName, setFilterClientName] = useState('');

    // Стейт для форм
    const [hostelForm, setHostelForm] = useState({
        name: '', about: '', city: '', address: '', is_active: true, main_image: null
    });
    const [roomForm, setRoomForm] = useState({
        number: '', price: '', bed: '', hostel: '', preview: null
    });

    // Модальне вікно редагування готелю
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingHotel, setEditingHotel] = useState(null);

    // НОВІ СТЕЙТИ: Модальне вікно профілю клієнта
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);

    // Галерея та завантаження
    const [uploadingImage, setUploadingImage] = useState(false);
    const [pendingGalleryFiles, setPendingGalleryFiles] = useState([]);

    // ==========================================
    // ЗАВАНТАЖЕННЯ ДАНИХ ТА ФІЛЬТРАЦІЯ
    // ==========================================
    const loadAllData = async () => {
        setLoading(true);
        try {
            const [bookingsRes, hostelsRes] = await Promise.all([
                api.get('bookings/'),
                api.get('hostels/')
            ]);
            setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data.results || []);
            setMyHostels(Array.isArray(hostelsRes.data) ? hostelsRes.data : hostelsRes.data.results || []);
        } catch (error) {
            console.error("Помилка завантаження даних:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAllData(); }, []);

    const fetchFilteredBookings = async () => {
        try {
            const params = {};
            if (filterHotel) params.room__hostel = filterHotel;
            if (filterStartDate) params.start_from = filterStartDate;
            if (filterLastDate) params.start_to = filterLastDate;

            const response = await api.get('bookings/', { params });
            setBookings(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error("Помилка фільтрації заявок:", error);
            alert("Помилка при завантаженні заявок.");
        }
    };

    const clearFilters = () => {
        setFilterHotel('');
        setFilterStartDate('');
        setFilterLastDate('');
        setFilterClientName('');
        api.get('bookings/').then(res => {
            setBookings(Array.isArray(res.data) ? res.data : res.data.results || []);
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
        } catch (error) {
            console.error(error);
            alert("Помилка зміни статусу");
        }
    };

    // Відкриття профілю клієнта
    const handleOpenClientProfile = (clientDetails) => {
        setSelectedClient(clientDetails);
        setIsClientModalOpen(true);
    };

    // ==========================================
    // ЛОГІКА: КЕРУВАННЯ ГАЛЕРЕЄЮ
    // ==========================================
    const handleSelectGalleryFiles = (e) => {
        const files = Array.from(e.target.files);
        setPendingGalleryFiles(prev => [...prev, ...files]);
        e.target.value = null;
    };

    const handleRemovePendingFile = (indexToRemove) => {
        setPendingGalleryFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleConfirmUploadGallery = async () => {
        if (pendingGalleryFiles.length === 0) return;
        setUploadingImage(true);

        const formData = new FormData();
        pendingGalleryFiles.forEach(file => {
            formData.append('images', file);
        });

        try {
            const response = await api.post(`hostels/${editingHotel.id}/upload_image/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const updatedGallery = [...(editingHotel.gallery_images || []), ...response.data];
            const updatedHotel = { ...editingHotel, gallery_images: updatedGallery };
            setEditingHotel(updatedHotel);
            setMyHostels(prev => prev.map(h => h.id === editingHotel.id ? updatedHotel : h));
            setPendingGalleryFiles([]);
        } catch (error) {
            console.error(error);
            alert("Помилка завантаження фото.");
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDeleteGalleryImage = async (imageId) => {
        if (!window.confirm("Видалити це фото назавжди?")) return;
        try {
            await api.delete(`hostels/${editingHotel.id}/delete_image/${imageId}/`);
            const updatedGallery = editingHotel.gallery_images.filter(img => img.id !== imageId);
            const updatedHotel = { ...editingHotel, gallery_images: updatedGallery };
            setEditingHotel(updatedHotel);
            setMyHostels(prev => prev.map(h => h.id === editingHotel.id ? updatedHotel : h));
        } catch (error) {
            console.error(error);
            alert("Помилка видалення фото.");
        }
    };

    // ==========================================
    // ЛОГІКА: РЕДАГУВАННЯ ТА СТВОРЕННЯ ГОТЕЛІВ
    // ==========================================
    const handleDeleteHostel = async (id) => {
        if (!window.confirm("Видалити цей готель та всі його кімнати?")) return;
        try {
            await api.delete(`hostels/${id}/`);
            setMyHostels(prev => prev.filter(h => h.id !== id));
        } catch (error) {
            console.error(error);
            alert("Помилка при видаленні.");
        }
    };

    const handleOpenEditModal = (hotel) => {
        setEditingHotel({ ...hotel });
        setPendingGalleryFiles([]);
        setIsEditModalOpen(true);
    };

    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditingHotel(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSaveEdit = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('name', editingHotel.name);
        formData.append('about', editingHotel.about);
        formData.append('address', editingHotel.address);
        formData.append('is_active', editingHotel.is_active);
        if (editingHotel.city) formData.append('city', editingHotel.city);
        if (editingHotel.main_image instanceof File) {
            formData.append('main_image', editingHotel.main_image);
        }

        try {
            const response = await api.patch(`hostels/${editingHotel.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMyHostels(prev => prev.map(h => h.id === editingHotel.id ? response.data : h));
            setIsEditModalOpen(false);
            alert("Дані готелю оновлено!");
        } catch (error) {
            console.error(error);
            alert("Помилка оновлення.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleHostelChange = (e) => {
        const { name, value, type, checked } = e.target;
        setHostelForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleCreateHostel = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();
        Object.keys(hostelForm).forEach(key => {
            if (hostelForm[key] !== null) formData.append(key, hostelForm[key]);
        });
        try {
            await api.post('hostels/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("Готель створено!");
            setHostelForm({ name: '', about: '', city: '', address: '', is_active: true, main_image: null });
            loadAllData();
            setCurrentTab(1);
        } catch (error) {
            console.error(error);
            alert("Помилка створення.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();
        Object.keys(roomForm).forEach(key => {
            if (roomForm[key]) formData.append(key, roomForm[key]);
        });
        try {
            await api.post('rooms/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("Кімнату додано!");
            setRoomForm({ number: '', price: '', bed: '', hostel: '', preview: null });
        } catch (error) {
            console.error(error);
            alert("Помилка створення кімнати.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 10 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>👑 Адмін-панель</Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable">
                    <Tab label="📝 Заявки" />
                    <Tab label="🏨 Мої готелі" />
                    <Tab label="➕ Додати готель" />
                    <Tab label="🛏️ Додати кімнату" />
                </Tabs>
            </Box>

            {/* ВКЛАДКА 0: ЗАЯВКИ */}
            {currentTab === 0 && (
                <Box>
                    {/* ПАНЕЛЬ ФІЛЬТРІВ */}
                    <Box sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <FilterAltIcon fontSize="small" /> Пошук та фільтрація
                        </Typography>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                                <FormControl fullWidth size="small" sx={{ bgcolor: 'white' }}>
                                    <InputLabel id="filter-hotel-label">Готель</InputLabel>
                                    <Select labelId="filter-hotel-label" value={filterHotel} label="Готель" onChange={(e) => setFilterHotel(e.target.value)}>
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
                                <TextField size="small" fullWidth label="Локальний пошук клієнта (ПІБ)" value={filterClientName} onChange={(e) => setFilterClientName(e.target.value)} sx={{ bgcolor: 'white' }} placeholder="Введіть ім'я..." />
                            </Grid>
                        </Grid>
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button variant="outlined" color="inherit" onClick={clearFilters}>Очистити</Button>
                            <Button variant="contained" color="primary" onClick={fetchFilteredBookings}>Застосувати фільтри</Button>
                        </Box>
                    </Box>

                    {/* ТАБЛИЦЯ ЗАЯВОК */}
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell><b>ID</b></TableCell>
                                    <TableCell><b>Клієнт</b></TableCell>
                                    <TableCell><b>Готель</b></TableCell>
                                    <TableCell><b>Статус</b></TableCell>
                                    <TableCell align="center"><b>Дії</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {displayedBookings.length > 0 ? (
                                    displayedBookings.map((b) => (
                                        <TableRow key={b.id}>
                                            <TableCell>#{b.id}</TableCell>
                                            <TableCell>
                                                {/* ІМ'Я КЛІЄНТА ТА КНОПКА ПЕРЕГЛЯДУ ПРОФІЛЮ */}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {b.client_details?.fullname}
                                                    </Typography>
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => handleOpenClientProfile(b.client_details)}
                                                        title="Переглянути профіль"
                                                    >
                                                        <AccountBoxIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>

                                                {b.request_text && (
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic', maxWidth: 200, whiteSpace: 'normal' }}>
                                                        "{b.request_text}"
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {b.room_details?.hostel_name}
                                                <Typography variant="caption" display="block" color="text.secondary">
                                                    (№{b.room_details?.number}) {b.start_date} — {b.last_date}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={b.approved === true ? "Схвалено" : b.approved === false ? "Відхилено" : "Очікує"}
                                                      color={b.approved === true ? "success" : b.approved === false ? "error" : "warning"} />
                                            </TableCell>
                                            <TableCell align="center">
                                                {b.approved === null && (
                                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                        <Button size="small" variant="contained" color="success" onClick={() => handleStatusChange(b.id, true)}>✓</Button>
                                                        <Button size="small" variant="outlined" color="error" onClick={() => handleStatusChange(b.id, false)}>✗</Button>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography color="text.secondary">Заявок за цими критеріями не знайдено.</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* ВКЛАДКА 1, 2, 3 ... (Код без змін) */}
            {currentTab === 1 && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><b>Фото</b></TableCell>
                                <TableCell><b>Назва</b></TableCell>
                                <TableCell><b>Адреса</b></TableCell>
                                <TableCell><b>Статус</b></TableCell>
                                <TableCell align="center"><b>Дії</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {myHostels.map((h) => (
                                <TableRow key={h.id}>
                                    <TableCell>
                                        <img src={h.main_image} alt={h.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                                    </TableCell>
                                    <TableCell><b>{h.name}</b></TableCell>
                                    <TableCell>{h.city}, {h.address}</TableCell>
                                    <TableCell><Chip label={h.is_active ? "Активний" : "Прихований"} color={h.is_active ? "success" : "default"} variant="outlined" /></TableCell>
                                    <TableCell align="center">
                                        <IconButton color="primary" onClick={() => handleOpenEditModal(h)}><EditIcon /></IconButton>
                                        <IconButton color="error" onClick={() => handleDeleteHostel(h.id)}><DeleteIcon /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {currentTab === 2 && (
                <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                    <Box component="form" onSubmit={handleCreateHostel} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField required label="Назва" name="name" value={hostelForm.name} onChange={handleHostelChange} />
                        <TextField required label="Про готель" name="about" multiline rows={3} value={hostelForm.about} onChange={handleHostelChange} />
                        <TextField label="Місто" name="city" value={hostelForm.city} onChange={handleHostelChange} />
                        <TextField required label="Адреса" name="address" value={hostelForm.address} onChange={handleHostelChange} />
                        <FormControlLabel control={<Switch checked={hostelForm.is_active} name="is_active" onChange={handleHostelChange} />} label="Активний" />
                        <Box sx={{ mt: 1, textAlign: 'center' }}>
                            {hostelForm.main_image && (
                                <img src={URL.createObjectURL(hostelForm.main_image)} alt="Preview" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
                            )}
                            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>
                                {hostelForm.main_image ? hostelForm.main_image.name : "Завантажити головне фото"}
                                <input type="file" hidden accept="image/*" onChange={(e) => setHostelForm(prev => ({ ...prev, main_image: e.target.files[0] }))} />
                            </Button>
                        </Box>
                        <Button type="submit" variant="contained" disabled={isSubmitting} size="large">Створити готель</Button>
                    </Box>
                </Paper>
            )}

            {currentTab === 3 && (
                <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                    {myHostels.length === 0 ? (
                        <Typography color="error" align="center">Спочатку створіть хоча б один готель!</Typography>
                    ) : (
                        <Box component="form" onSubmit={handleCreateRoom} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControl fullWidth required>
                                <InputLabel id="hostel-select-label">Оберіть готель</InputLabel>
                                <Select labelId="hostel-select-label" name="hostel" value={roomForm.hostel} label="Оберіть готель" onChange={(e) => setRoomForm(prev => ({ ...prev, hostel: e.target.value }))}>
                                    {myHostels.map(hostel => <MenuItem key={hostel.id} value={hostel.id}>{hostel.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField required label="Номер кімнати" name="number" type="number" value={roomForm.number} onChange={(e) => setRoomForm(prev => ({ ...prev, number: e.target.value }))} />
                            <TextField required label="Ціна (грн)" name="price" type="number" value={roomForm.price} onChange={(e) => setRoomForm(prev => ({ ...prev, price: e.target.value }))} />
                            <TextField required label="Місць" name="bed" type="number" value={roomForm.bed} onChange={(e) => setRoomForm(prev => ({ ...prev, bed: e.target.value }))} />
                            <Box sx={{ mt: 1, textAlign: 'center' }}>
                                {roomForm.preview && (
                                    <img src={URL.createObjectURL(roomForm.preview)} alt="Room Preview" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
                                )}
                                <Button variant="outlined" component="label" fullWidth color="success">
                                    {roomForm.preview ? roomForm.preview.name : "Завантажити фото кімнати"}
                                    <input type="file" hidden accept="image/*" onChange={(e) => setRoomForm(prev => ({ ...prev, preview: e.target.files[0] }))} />
                                </Button>
                            </Box>
                            <Button type="submit" variant="contained" color="success" disabled={isSubmitting} size="large">Зберегти кімнату</Button>
                        </Box>
                    )}
                </Paper>
            )}

            {/* ========================================================= */}
            {/* МОДАЛЬНЕ ВІКНО ДЛЯ РЕДАГУВАННЯ ГОТЕЛЮ */}
            {/* ========================================================= */}
            <Dialog open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle fontWeight="bold">Редагувати готель</DialogTitle>
                <DialogContent dividers>
                    {editingHotel && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <TextField required label="Назва" name="name" value={editingHotel.name} onChange={handleEditChange} fullWidth />
                            <TextField required label="Про готель" name="about" multiline rows={3} value={editingHotel.about} onChange={handleEditChange} fullWidth />
                            <TextField label="Місто" name="city" value={editingHotel.city || ''} onChange={handleEditChange} fullWidth />
                            <TextField required label="Адреса" name="address" value={editingHotel.address} onChange={handleEditChange} fullWidth />
                            <FormControlLabel control={<Switch checked={editingHotel.is_active} name="is_active" onChange={handleEditChange} />} label="Активний (видимий для всіх)" />

                            {/* ГАЛЕРЕЯ В МОДАЛЦІ */}
                            <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fafafa' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="bold">Галерея</Typography>
                                    <Button variant="contained" component="label" size="small" startIcon={<CloudUploadIcon />}>
                                        Обрати фото
                                        <input type="file" hidden accept="image/*" multiple onChange={handleSelectGalleryFiles} />
                                    </Button>
                                </Box>

                                {pendingGalleryFiles.length > 0 && (
                                    <Box sx={{ mb: 2, p: 2, border: '2px dashed #1976d2', borderRadius: 2, bgcolor: '#e3f2fd' }}>
                                        <Typography variant="caption" color="primary" fontWeight="bold" sx={{ display: 'block', mb: 1.5 }}>До завантаження ({pendingGalleryFiles.length}):</Typography>
                                        <Grid container spacing={2}>
                                            {pendingGalleryFiles.map((file, idx) => (
                                                <Grid item xs={4} sm={3} key={idx}>
                                                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', bgcolor: '#e0e0e0', borderRadius: 1 }}>
                                                        <img src={URL.createObjectURL(file)} alt="new preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
                                                        <IconButton size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, p: 0.5, bgcolor: 'white', boxShadow: 2, '&:hover': { bgcolor: '#ffebee' } }} onClick={() => handleRemovePendingFile(idx)}>
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                        <Button variant="contained" size="small" fullWidth sx={{ mt: 2 }} onClick={handleConfirmUploadGallery} disabled={uploadingImage}>
                                            {uploadingImage ? <CircularProgress size={20} color="inherit" /> : "🚀 Завантажити обрані"}
                                        </Button>
                                    </Box>
                                )}

                                <Divider sx={{ mb: 2 }} />

                                {/* ІСНУЮЧІ ФОТО */}
                                <Grid container spacing={2}>
                                    {editingHotel.gallery_images?.map((img) => (
                                        <Grid item xs={4} sm={3} key={img.id}>
                                            <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', bgcolor: '#e0e0e0', borderRadius: 1 }}>
                                                <img src={img.image} alt="gallery item" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', display: 'block' }} />
                                                <IconButton size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, p: 0.5, bgcolor: 'white', boxShadow: 2, '&:hover': { bgcolor: '#ffebee' } }} onClick={() => handleDeleteGalleryImage(img.id)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>

                            <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2, textAlign: 'center' }}>
                                <Box sx={{ mb: 1.5 }}>
                                    <img src={editingHotel.main_image instanceof File ? URL.createObjectURL(editingHotel.main_image) : editingHotel.main_image} alt="Main" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }} />
                                </Box>
                                <Button variant="outlined" component="label" size="small">
                                    {editingHotel.main_image instanceof File ? "Змінити обране" : "Змінити головне фото"}
                                    <input type="file" hidden accept="image/*" onChange={(e) => setEditingHotel(prev => ({ ...prev, main_image: e.target.files[0] }))} />
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsEditModalOpen(false)} color="inherit">Скасувати</Button>
                    <Button onClick={handleSaveEdit} variant="contained" color="primary" disabled={isSubmitting}>Зберегти зміни</Button>
                </DialogActions>
            </Dialog>

            {/* ========================================================= */}
            {/* НОВЕ МОДАЛЬНЕ ВІКНО: ПРОФІЛЬ КЛІЄНТА */}
            {/* ========================================================= */}
            <Dialog open={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                    Профіль клієнта
                </DialogTitle>
                <DialogContent dividers>
                    {selectedClient ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 2 }}>
                            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 36 }}>
                                {selectedClient.fullname?.charAt(0) || '👤'}
                            </Avatar>

                            <Typography variant="h5" fontWeight="bold" textAlign="center">
                                {selectedClient.fullname || 'Ім\'я не вказано'}
                            </Typography>

                            <Divider flexItem sx={{ my: 1 }} />

                            <Box sx={{ width: '100%', px: 2 }}>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        Електронна пошта
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedClient.email || 'Не вказано'}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        Вік
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedClient.age ? `${selectedClient.age} років` : 'Не вказано'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    ) : (
                        <Typography align="center" color="text.secondary">Дані відсутні</Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsClientModalOpen(false)} color="inherit" variant="outlined" fullWidth>
                        Закрити
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}