// frontend/src/components/WhatsAppLinker.jsx
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import {QRCodeSVG as QRCode }from 'qrcode.react';

// Lee la URL del backend desde las variables de entorno de Vite
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'; // Fallback por si no está definida

function WhatsAppLinker() {
    const [status, setStatus] = useState('disconnected');
    const [statusMessage, setStatusMessage] = useState('No conectado al servidor.');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [messages, setMessages] = useState([]);
    const socketRef = useRef(null);

    useEffect(() => {
        // Conectar a Socket.IO
        socketRef.current = io(BACKEND_URL);
        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setStatusMessage('Conectado al servidor. Listo para iniciar.');
            setStatus('connected_to_server');
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setStatus('disconnected');
            setStatusMessage('Desconectado del servidor.');
            setQrCodeUrl('');
        });

        socket.on('status_change', (data) => {
            console.log('Status Change:', data);
            setStatus(data.status);
            setStatusMessage(data.message || `Estado: ${data.status}`);
            if (data.status !== 'qr_received') {
                setQrCodeUrl('');
            }
        });

        socket.on('qr_code', (dataUrl) => {
            console.log('QR Code URL received');
            setQrCodeUrl(dataUrl);
            setStatus('qr_received');
            setStatusMessage('QR Recibido. Escanéalo con WhatsApp.');
        });

        socket.on('message_received', (message) => {
            console.log('Message received:', message);
            setMessages(prevMessages => [
                message,
                ...prevMessages.slice(0, 9) // Mantener últimos 10 mensajes
            ]);
        });

        // Limpiar al desmontar
        return () => {
            console.log("Disconnecting socket...");
            socket.disconnect();
        };
    }, []); // Ejecutar solo al montar/desmontar

    const handleInitiateLink = () => {
        if (socketRef.current && socketRef.current.connected) {
            console.log("Requesting WhatsApp client initialization...");
            setStatus('initializing');
            setStatusMessage('Solicitando inicio al servidor...');
            socketRef.current.emit('request_init');
        } else {
            setStatusMessage('No se puede iniciar, no hay conexión con el servidor.');
        }
    };

    // --- El JSX para renderizar es idéntico al ejemplo anterior ---
    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', marginTop: '20px' }}>
            <h2>Estado de Vinculación</h2>
            <p><strong>Estado:</strong> {status}</p>
            <p><em>{statusMessage}</em></p>

            {(status === 'disconnected' || status === 'connected_to_server' || status === 'auth_failure') && (
                <button onClick={handleInitiateLink} disabled={status === 'initializing'}>
                    {status === 'initializing' ? 'Iniciando...' : 'Iniciar Vinculación WhatsApp'}
                </button>
            )}

            {status === 'qr_received' && qrCodeUrl && (
                <div style={{ marginTop: '20px' }}>
                    <p>Escanea este código QR con la app de WhatsApp:</p>
                    <QRCode value={qrCodeUrl} size={256} />
                </div>
            )}

            {status === 'ready' && (
                <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <h3>Mensajes Recibidos (últimos 10)</h3>
                    {messages.length === 0 && <p><em>No se han recibido mensajes.</em></p>}
                    <ul style={{ listStyle: 'none', padding: 0, maxHeight: '200px', overflowY: 'auto' }}>
                        {messages.map((msg, index) => (
                            <li key={index} style={{ borderBottom: '1px dotted #eee', marginBottom: '5px', paddingBottom: '5px' }}>
                                <strong>De:</strong> {msg.from} <br />
                                <span>{msg.body}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default WhatsAppLinker;