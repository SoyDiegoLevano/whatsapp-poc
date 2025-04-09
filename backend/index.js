// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode'); // Necesitamos qrcode para enviar como data URL

const app = express();
app.use(cors()); // Habilita CORS
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Origen de tu app React
        methods: ["GET", "POST"]
    }
});

let client;
let clientStatus = 'disconnected';
let qrCodeDataUrl = '';

function initializeWhatsAppClient(socket) {
    console.log('Initializing WhatsApp Client...');
    clientStatus = 'initializing';
    qrCodeDataUrl = '';
    if (socket) socket.emit('status_change', { status: clientStatus, message: 'Inicializando cliente...' });

    // Usa LocalAuth para guardar la sesión y no tener que escanear QR cada vez
    client = new Client({
        authStrategy: new LocalAuth({ clientId: "your-client-id" }), // Guarda sesión en .wwebjs_auth/
        puppeteer: {
            headless: true, // Ejecuta en segundo plano
            args: [
                '--no-sandbox', // Necesario en algunos entornos Linux/Docker
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                // '--single-process', // Descomentar si hay problemas
                '--disable-gpu'
            ]
        }
    });

    client.on('qr', (qr) => { // 'qr' aquí es la STRING que necesitamos
        console.log('QR String RECEIVED from WA:', qr.substring(0, 50) + '...'); // Muestra solo el inicio
        // YA NO generamos Data URL aquí
        // qrCodeDataUrl = await qrcode.toDataURL(qr); // <--- ELIMINA O COMENTA ESTA LÍNEA
    
        clientStatus = 'qr_received';
        if (socket) {
             // Envía la STRING 'qr' directamente al frontend
             socket.emit('qr_code', qr);
             socket.emit('status_change', { status: clientStatus, message: 'QR Recibido. Escanéalo.' });
        }
        // Ya no hay 'catch' necesario para toDataURL
    });

    client.on('ready', () => {
        console.log('WhatsApp Client is ready!');
        qrCodeDataUrl = ''; // Ya no es necesario
        clientStatus = 'ready';
        if (socket) socket.emit('status_change', { status: clientStatus, message: 'Cliente listo y vinculado.' });
        // Aquí podrías guardar en DB que el usuario está vinculado
    });

    client.on('authenticated', () => {
        console.log('AUTHENTICATED');
        clientStatus = 'authenticated';
        if (socket) socket.emit('status_change', { status: clientStatus, message: 'Autenticado.' });
    });

    client.on('auth_failure', msg => {
        console.error('AUTHENTICATION FAILURE', msg);
        clientStatus = 'auth_failure';
        if (socket) socket.emit('status_change', { status: clientStatus, message: 'Fallo de autenticación.' });
        // Podrías intentar reiniciar
    });

    client.on('disconnected', (reason) => {
        console.log('Client was logged out', reason);
        clientStatus = 'disconnected';
        if (socket) socket.emit('status_change', { status: clientStatus, message: 'Cliente desconectado.' });
        // Limpiar cliente y quizás intentar reconectar o requerir nueva vinculación
        client.destroy();
        client = null;
    });

    // Listener de mensajes (para el ejemplo de "chat")
    client.on('message', msg => {
        console.log('MESSAGE RECEIVED', msg.from, msg.body);
        // Emitir mensaje al front-end (¡simplificado!)
        if (socket) socket.emit('message_received', { from: msg.from, body: msg.body });
    });


    client.initialize().catch(err => {
        console.error("Error initializing client:", err);
        clientStatus = 'error';
        if (socket) socket.emit('status_change', { status: clientStatus, message: 'Error al inicializar.' });
    });
}

// Endpoint para que el front-end solicite iniciar la vinculación
// Usaremos Socket.IO para la comunicación principal, pero un endpoint puede ser útil
app.get('/api/whatsapp/init', (req, res) => {
    const socketId = req.query.socketId; // El front-end nos puede pasar su ID de socket
    const socket = io.sockets.sockets.get(socketId);

    if (clientStatus === 'disconnected' || clientStatus === 'error' || !client) {
        console.log('Request to init, starting client...');
        initializeWhatsAppClient(socket);
        res.json({ message: 'Initializing client. Check status via Socket.IO.' });
    } else if (clientStatus === 'qr_received' && qrCodeDataUrl) {
        res.json({ message: 'QR already generated. Check Socket.IO.' });
        if (socket) socket.emit('qr_code', qrCodeDataUrl); // Reenviar QR por si acaso
        if (socket) socket.emit('status_change', { status: clientStatus, message: 'QR Recibido. Escanéalo.' });
    } else if (clientStatus === 'ready' || clientStatus === 'authenticated') {
        res.status(400).json({ message: 'Client already linked.' });
        if (socket) socket.emit('status_change', { status: clientStatus, message: 'Cliente ya vinculado.' });
    } else {
        res.status(503).json({ message: `Client status: ${clientStatus}` });
        if (socket) socket.emit('status_change', { status: clientStatus, message: `Estado actual: ${clientStatus}` });
    }
});

// Endpoint para obtener el estado actual (alternativa si no se usa socket al inicio)
app.get('/api/whatsapp/status', (req, res) => {
    res.json({ status: clientStatus });
});

// Manejo de conexiones Socket.IO
io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Enviar estado actual al cliente que se conecta
    socket.emit('status_change', { status: clientStatus, message: `Conectado. Estado actual: ${clientStatus}` });
    if (clientStatus === 'qr_received' && qrCodeDataUrl) {
        socket.emit('qr_code', qrCodeDataUrl); // Enviar QR si ya existe al conectar
    }

    // Escuchar solicitud de inicialización desde este socket específico
    socket.on('request_init', () => {
        console.log(`Init request from socket ${socket.id}`);
        if (clientStatus === 'disconnected' || clientStatus === 'error' || !client) {
            initializeWhatsAppClient(socket); // Pasar el socket específico
        } else {
            // Enviar estado actual si ya está inicializando o listo
            socket.emit('status_change', { status: clientStatus, message: `Estado actual: ${clientStatus}` });
            if (clientStatus === 'qr_received' && qrCodeDataUrl) {
                socket.emit('qr_code', qrCodeDataUrl);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
    });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
    // Podrías decidir inicializar el cliente al arrancar el server,
    // pero hacerlo bajo demanda del front-end es más controlable para este POC.
    // initializeWhatsAppClient();
});