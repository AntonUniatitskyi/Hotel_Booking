import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookNow from './pages/BookNow.jsx';
import Auth from './pages/Auth';
import MyBookings from './pages/MyBookings.jsx';
import LiveNotifications from './components/LiveNotifications';
import HotelDetails from './pages/HotelDetails';
import Profile from './pages/Profile';



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
                <Route path="/hotels/:id" element={<BookNow />} />
                <Route path="/hostel/:id" element={<HotelDetails />} />

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