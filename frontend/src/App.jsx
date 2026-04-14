import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import HotelDetails from './pages/HotelDetails';
import Auth from './pages/Auth'; // Наш новий компонент
import Profile from './pages/Profile';
import LiveNotifications from './components/LiveNotifications';

const NotFound = () => <h1>404 - Сторінка не знайдена</h1>;

function App() {
    return (
        <BrowserRouter>
            <CssBaseline />
            < Navbar/>
            <LiveNotifications />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/hotels/:id" element={<HotelDetails />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
