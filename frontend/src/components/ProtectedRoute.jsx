import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const userRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    console.log("ПЕРЕВІРКА ДОСТУПУ:", { token: !!token, role: userRole });

    if (!token) {
        console.log("Відмова: Токен відсутній");
        return <Navigate to="/login" replace />;
    }

    if (userRole !== 'admin') {
        console.log("Відмова: Роль не є адміном. Поточна роль:", userRole);
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;