import { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Button, Box, CircularProgress,
    Tabs, Tab, TextField, Switch, FormControlLabel, Divider, IconButton,
    Select, MenuItem, InputLabel, FormControl,
    Dialog, DialogTitle, DialogContent, DialogActions // НОВІ ІМПОРТИ
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; // ІКОНКА РЕДАГУВАННЯ
import api from '../api';

export default function AdminDashboard() {
    const [currentTab, setCurrentTab] = useState(0);

    const [bookings, setBookings] = useState([]);
    const [myHostels, setMyHostels] = useState([]);
    const [loading, setLoading] = useState(true);

    const [hostelForm, setHostelForm] = useState({
        name: '', about: '', city: '', address: '', is_active: true, main_image: null
    });

    const [roomForm, setRoomForm] = useState({
        number: '', price: '', bed: '', hostel: '', preview: null
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // === СТАН ДЛЯ МОДАЛЬНОГО ВІКНА РЕДАГУВАННЯ ===
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingHotel, setEditingHotel] = useState(null);

    // ==========================================
    // ЗАВАНТАЖЕННЯ ДАНИХ
    // ==========================================
    const loadAllData = async () => {
        setLoading(true);
        try {
            const bookingsRes = await api.get('bookings/');
            setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data.results || []);

            const hostelsRes = await api.get('hostels/');
            setMyHostels(Array.isArray(hostelsRes.data) ? hostelsRes.data : hostelsRes.data.results || []);
        } catch (error) {
            console.error("Помилка завантаження даних:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAllData(); }, []);

    // ... (Логіка заявок handleStatusChange залишається без змін) ...
    const handleStatusChange = async (bookingId, isApproved) => {
        try {
            await api.patch(`bookings/${bookingId}/`, { approved: isApproved });
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, approved: isApproved } : b));
        } catch (error) {
            console.error(error);
            alert("Помилка зміни статусу");
        }
    };

    // ==========================================
    // ЛОГІКА: КЕРУВАННЯ ГОТЕЛЯМИ (ВИДАЛЕННЯ ТА РЕДАГУВАННЯ)
    // ==========================================
    const handleDeleteHostel = async (id) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цей готель? Це видалить і всі кімнати в ньому!")) return;
        try {
            await api.delete(`hostels/${id}/`);
            setMyHostels(prev => prev.filter(h => h.id !== id));
            alert("Готель видалено успішно");
        } catch (error) {
            console.error(error);
            alert("Помилка при видаленні. Можливо, немає прав.");
        }
    };

    // Відкриваємо модалку і записуємо дані обраного готелю
    const handleOpenEditModal = (hotel) => {
        setEditingHotel({ ...hotel, main_image: null }); // Скидаємо файл, бо з беку прийшов URL
        setIsEditModalOpen(true);
    };

    // Зміна полів у модалці
    const handleEditChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditingHotel(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    // Відправка оновлених даних (PATCH запит)
    const handleSaveEdit = async () => {
        setIsSubmitting(true);
        const formData = new FormData();

        formData.append('name', editingHotel.name);
        formData.append('about', editingHotel.about);
        formData.append('address', editingHotel.address);
        formData.append('is_active', editingHotel.is_active);
        if (editingHotel.city) formData.append('city', editingHotel.city);

        // Додаємо картинку ТІЛЬКИ якщо адмін вибрав НОВИЙ файл
        if (editingHotel.main_image instanceof File) {
            formData.append('main_image', editingHotel.main_image);
        }

        try {
            const response = await api.patch(`hostels/${editingHotel.id}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Оновлюємо список готелів локально
            setMyHostels(prev => prev.map(h => h.id === editingHotel.id ? response.data : h));
            setIsEditModalOpen(false);
            alert("Готель успішно оновлено! ✏️");
        } catch (error) {
            console.error(error);
            alert("Помилка оновлення готелю.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... (Логіка створення готелю і кімнати handleCreateHostel / handleCreateRoom залишається без змін) ...
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
            alert("Помилка створення готелю");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRoomChange = (e) => {
        const { name, value } = e.target;
        setRoomForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('number', roomForm.number);
        formData.append('price', roomForm.price);
        formData.append('bed', roomForm.bed);
        formData.append('hostel', roomForm.hostel);
        if (roomForm.preview) formData.append('preview', roomForm.preview);

        try {
            await api.post('rooms/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("Кімнату успішно додано! 🛏️");
            setRoomForm({ number: '', price: '', bed: '', hostel: '', preview: null });
        } catch (error) {
            console.error(error);
            alert("Помилка створення кімнати. Перевірте дані.");
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
                <TableContainer component={Paper}>
                    {/* ... (Твій існуючий код таблиці заявок) ... */}
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
                            {bookings.map((b) => (
                                <TableRow key={b.id}>
                                    <TableCell>#{b.id}</TableCell>
                                    <TableCell>{b.client_details?.fullname}</TableCell>
                                    <TableCell>{b.room_details?.hostel_name}</TableCell>
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
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ВКЛАДКА 1: МОЇ ГОТЕЛІ */}
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
                                        {/* КНОПКА РЕДАГУВАННЯ */}
                                        <IconButton color="primary" onClick={() => handleOpenEditModal(h)}>
                                            <EditIcon />
                                        </IconButton>
                                        {/* КНОПКА ВИДАЛЕННЯ */}
                                        <IconButton color="error" onClick={() => handleDeleteHostel(h.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ВКЛАДКА 2: ДОДАТИ ГОТЕЛЬ */}
            {currentTab === 2 && (
                <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                    <Box component="form" onSubmit={handleCreateHostel} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField required label="Назва" name="name" value={hostelForm.name} onChange={handleHostelChange} />
                        <TextField required label="Про готель" name="about" multiline rows={3} value={hostelForm.about} onChange={handleHostelChange} />
                        <TextField label="Місто" name="city" value={hostelForm.city} onChange={handleHostelChange} />
                        <TextField required label="Адреса" name="address" value={hostelForm.address} onChange={handleHostelChange} />
                        <FormControlLabel control={<Switch checked={hostelForm.is_active} name="is_active" onChange={handleHostelChange} />} label="Активний" />
                        <input type="file" onChange={(e) => setHostelForm(prev => ({ ...prev, main_image: e.target.files[0] }))} />
                        <Button type="submit" variant="contained" disabled={isSubmitting}>Створити</Button>
                    </Box>
                </Paper>
            )}

            {/* ВКЛАДКА 3: ДОДАТИ КІМНАТУ */}
            {currentTab === 3 && (
                <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
                    {/* ... (Твій існуючий код форми кімнати) ... */}
                    {myHostels.length === 0 ? (
                        <Typography color="error" align="center">Спочатку створіть хоча б один готель!</Typography>
                    ) : (
                        <Box component="form" onSubmit={handleCreateRoom} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControl fullWidth required>
                                <InputLabel id="hostel-select-label">Оберіть готель</InputLabel>
                                <Select labelId="hostel-select-label" name="hostel" value={roomForm.hostel} label="Оберіть готель" onChange={handleRoomChange}>
                                    {myHostels.map(hostel => <MenuItem key={hostel.id} value={hostel.id}>{hostel.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField required label="Номер кімнати" name="number" type="number" value={roomForm.number} onChange={handleRoomChange} />
                            <TextField required label="Ціна (грн)" name="price" type="number" value={roomForm.price} onChange={handleRoomChange} />
                            <TextField required label="Місць" name="bed" type="number" value={roomForm.bed} onChange={handleRoomChange} />
                            <input type="file" accept="image/*" onChange={(e) => setRoomForm(prev => ({ ...prev, preview: e.target.files[0] }))} />
                            <Button type="submit" variant="contained" color="success" disabled={isSubmitting}>Зберегти кімнату</Button>
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
                            <FormControlLabel
                                control={<Switch checked={editingHotel.is_active} name="is_active" onChange={handleEditChange} />}
                                label="Активний (видимий для всіх)"
                            />

                            <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Змінити головне фото (залиште пустим, щоб зберегти старе)
                                </Typography>
                                <Button variant="outlined" component="label">
                                    {editingHotel.main_image instanceof File ? editingHotel.main_image.name : "Вибрати новий файл"}
                                    <input type="file" hidden accept="image/*" onChange={(e) => setEditingHotel(prev => ({ ...prev, main_image: e.target.files[0] }))} />
                                </Button>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setIsEditModalOpen(false)} color="inherit">Скасувати</Button>
                    <Button onClick={handleSaveEdit} variant="contained" color="primary" disabled={isSubmitting}>
                        {isSubmitting ? <CircularProgress size={24} /> : "Зберегти зміни"}
                    </Button>
                </DialogActions>
            </Dialog>

        </Container>
    );
}