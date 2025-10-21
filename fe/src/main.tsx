import "bootstrap/dist/css/bootstrap.min.css";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {BrowserRouter} from 'react-router-dom';
import {AuthProvider} from './contexts/AuthContext';
import {CartProvider} from "./contexts/CartContext.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <BrowserRouter>
            <CartProvider>
                <AuthProvider>
                    <App/>
                </AuthProvider>
            </CartProvider>
        </BrowserRouter>
    </React.StrictMode>
);