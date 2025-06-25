// src/main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ErrorBoundary from './components/Common/ErrorBoundary/ErrorBoundary';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ErrorBoundary>
            <Router>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </Router>
        </ErrorBoundary>
    </StrictMode>,
);