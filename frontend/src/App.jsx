import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import HotelDetails from './pages/HotelDetails';
import Auth from './pages/Auth';
import Profile from './pages/Profile';
import LiveNotifications from './components/LiveNotifications';

// ДОДАЄМО НАШІ НОВІ ІМПОРТИ (перевір, щоб шляхи співпадали з твоїми папками):
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';

const NotFound = () => <h1>404 - Сторінка не знайдена</h1>;

function App() {
    return (
        <BrowserRouter>
            <CssBaseline />
            <Navbar />
            <LiveNotifications />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/hotels/:id" element={<HotelDetails />} />

                {/* --- ОСЬ НАШ ЗАХИЩЕНИЙ МАРШРУТ ДЛЯ АДМІНА --- */}
                <Route
                    path="/admin/dashboard"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;