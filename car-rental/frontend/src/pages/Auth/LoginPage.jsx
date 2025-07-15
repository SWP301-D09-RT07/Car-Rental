import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            // Lấy URL cần redirect từ localStorage
            const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
            // Xóa URL khỏi localStorage
            localStorage.removeItem('redirectAfterLogin');
            // Chuyển hướng về trang trước đó
            navigate(redirectPath);
        } catch (error) {
            setError(error.message);
        }
    };

    return (
        <div>
            {/* Render your form here */}
        </div>
    );
};

export default LoginPage; 