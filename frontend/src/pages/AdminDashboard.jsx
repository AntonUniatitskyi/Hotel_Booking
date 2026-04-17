import { useState, useEffect } from 'react';
import {
    Container, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Button, Box, CircularProgress,
    Tabs, Tab, TextField, Switch, FormControlLabel, Divider, IconButton,
    Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../api';

export default function AdminDashboard() {
    const [currentTab, setCurrentTab] = useState(0);

    const [bookings, setBookings] = useState([]);
    const [myHostels, setMyHostels] = useState([]);
    const [loading, setLoading] = useState(true);

    const [hostelForm, setHostelForm] = useState({
        name: '', about: '', city: '', address: '', is_active: true, main_image: null
    });

    // === СТАН ДЛЯ НОВОЇ КІМНАТИ ===
    const [roomForm, setRoomForm] = useState({
        number: '', price: '', bed: '', hostel: '', preview: null
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // ==========================================
    // ЛОГІКА: БРОНЮВАННЯ (Вкладка 0)
    // ==========================================
    const handleStatusChange = async (bookingId, isApproved) => {
        try {
            await api.patch(`bookings/${bookingId}/`, { approved: isApproved });
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, approved: isApproved } : b));
        } catch (error) {
            alert("Помилка зміни статусу");
        }
    };

    // ==========================================
    // ЛОГІКА: КЕРУВАННЯ ГОТЕЛЯМИ (Вкладка 1)
    // ==========================================
    const handleDeleteHostel = async (id) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цей готель? Це видалить і всі кімнати в ньому!")) return;
        try {
            await api.delete(`hostels/${id}/`);
            setMyHostels(prev => prev.filter(h => h.id !== id));
            alert("Готель видалено успішно");
        } catch (error) {
            alert("Помилка при видаленні. Можливо, немає прав.");
        }
    };

    // ==========================================
    // ЛОГІКА: СТВОРЕННЯ ГОТЕЛЮ (Вкладка 2)
    // ==========================================
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
            alert("Помилка створення готелю");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ==========================================
    // ЛОГІКА: СТВОРЕННЯ КІМНАТИ (Вкладка 3)
    // ==========================================
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
        formData.append('hostel', roomForm.hostel); // Передаємо ID обраного готелю

        if (roomForm.preview) {
            formData.append('preview', roomForm.preview);
        }

        try {
            await api.post('rooms/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert("Кімнату успішно додано! 🛏️");
            setRoomForm({ number: '', price: '', bed: '', hostel: '', preview: null });
        } catch (error) {
            console.error("Помилка додавання кімнати:", error.response?.data);
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
                    {/* ... (код таблиці заявок залишається без змін) ... */}
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
                                            <Box sx={{ display: 'flex', gap: 1 }}>
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
                    {/* ... (код таблиці готелів залишається без змін) ... */}
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><b>Фото</b></TableCell>
                                <TableCell><b>Назва</b></TableCell>
                                <TableCell><b>Адреса</b></TableCell>
                                <TableCell><b>Статус</b></TableCell>
                                <TableCell align="center"><b>Видалити</b></TableCell>
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
                                    <TableCell><Chip label={h.is_active ? "Активний" : "Прихований"} variant="outlined" /></TableCell>
                                    <TableCell align="center">
                                        <IconButton color="error" onClick={() => handleDeleteHostel(h.id)}><DeleteIcon /></IconButton>
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
                    {myHostels.length === 0 ? (
                        <Typography color="error" align="center">
                            Спочатку створіть хоча б один готель, щоб додавати до нього кімнати!
                        </Typography>
                    ) : (
                        <Box component="form" onSubmit={handleCreateRoom} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography variant="h6" gutterBottom>Нова кімната</Typography>

                            {/* Випадаючий список з готелями */}
                            <FormControl fullWidth required>
                                <InputLabel id="hostel-select-label">Оберіть готель</InputLabel>
                                <Select
                                    labelId="hostel-select-label"
                                    name="hostel"
                                    value={roomForm.hostel}
                                    label="Оберіть готель"
                                    onChange={handleRoomChange}
                                >
                                    {myHostels.map(hostel => (
                                        <MenuItem key={hostel.id} value={hostel.id}>
                                            {hostel.name} ({hostel.city})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField required label="Номер кімнати" name="number" type="number" value={roomForm.number} onChange={handleRoomChange} />
                            <TextField required label="Ціна (грн за ніч)" name="price" type="number" value={roomForm.price} onChange={handleRoomChange} />
                            <TextField required label="Кількість спальних місць" name="bed" type="number" value={roomForm.bed} onChange={handleRoomChange} />

                            <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 2, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Фото кімнати
                                </Typography>
                                <Button variant="outlined" component="label">
                                    {roomForm.preview ? roomForm.preview.name : "Вибрати файл"}
                                    <input type="file" hidden accept="image/*" onChange={(e) => setRoomForm(prev => ({ ...prev, preview: e.target.files[0] }))} />
                                </Button>
                            </Box>

                            <Button type="submit" variant="contained" color="success" size="large" disabled={isSubmitting}>
                                {isSubmitting ? <CircularProgress size={24} /> : "Зберегти кімнату"}
                            </Button>
                        </Box>
                    )}
                </Paper>
            )}
        </Container>
    );
}