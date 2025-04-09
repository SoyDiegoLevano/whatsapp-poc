# WhatsApp Linking Proof-of-Concept (POC)

Este proyecto es una demostración simple de cómo implementar la vinculación de una cuenta de WhatsApp mediante un código QR en una aplicación web. Utiliza un front-end creado con React (usando Vite) y un back-end con Node.js (usando Express). La comunicación en tiempo real para el estado y los mensajes básicos se maneja con Socket.IO.

**🚨 ADVERTENCIA IMPORTANTE 🚨**

* **ESTO ES SOLO UNA PRUEBA DE CONCEPTO (POC) Y NO ES APTO PARA PRODUCCIÓN.**
* Este proyecto utiliza la librería **NO OFICIAL** `whatsapp-web.js`, la cual funciona mediante ingeniería inversa de WhatsApp Web.
* **RIESGOS:**
    * `whatsapp-web.js` es **inestable** y puede dejar de funcionar en cualquier momento debido a actualizaciones de WhatsApp.
    * Su uso **viola los Términos de Servicio de WhatsApp** y puede resultar en el **BLOQUEO PERMANENTE** del número de teléfono que vincules.
    * Requiere mantener una sesión activa que puede ser frágil.
* **Alternativa para producción:** Para aplicaciones reales y comerciales, **DEBES** utilizar la **API Oficial de WhatsApp Business Cloud Platform** proporcionada por Meta. [Más información aquí](https://developers.facebook.com/docs/whatsapp/cloud-api/).
* **Usa este código bajo tu propio riesgo y solo con fines educativos o de experimentación.**

## Estructura del Proyecto
```
whatsapp-poc/
├── backend/        # Servidor Node.js/Express + whatsapp-web.js + Socket.IO
├── frontend/       # Aplicación React con Vite + Socket.IO Client + QR Code Lib
├── .gitignore      # Archivos y carpetas a ignorar por Git
└── README.md       # Este archivo
```

## Prerrequisitos

* Node.js (v16 o superior recomendado)
* npm o yarn

## Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone <URL-DE-TU-REPOSITORIO-GITHUB>
    cd whatsapp-poc
    ```

2.  **Instala las dependencias del Back-end:**
    ```bash
    cd backend
    npm install
    # o si usas yarn:
    # yarn install
    cd ..
    ```

3.  **Instala las dependencias del Front-end:**
    ```bash
    cd frontend
    npm install
    # o si usas yarn:
    # yarn install
    cd ..
    ```

4.  **(Opcional pero recomendado) Configura variables de entorno del Front-end:**
    * En la carpeta `frontend/`, renombra el archivo `.env.example` a `.env` (si no existe, créalo).
    * Asegúrate de que contenga la URL de tu backend:
        ```
        # frontend/.env
        VITE_BACKEND_URL=http://localhost:3001
        ```

## Ejecución

Necesitarás dos terminales para ejecutar el back-end y el front-end simultáneamente.

1.  **Terminal 1: Inicia el Servidor Back-end**
    ```bash
    cd backend
    npm run dev
    ```
    Esto iniciará el servidor (por defecto en `http://localhost:3001`) usando `nodemon` para reinicios automáticos en desarrollo.

2.  **Terminal 2: Inicia la Aplicación Front-end**
    ```bash
    cd frontend
    npm run dev
    ```
    Esto iniciará el servidor de desarrollo de Vite (normalmente en `http://localhost:5173` o un puerto similar) y debería abrir tu navegador.

3.  **Uso:**
    * Abre la URL del front-end en tu navegador (ej: `http://localhost:5173`).
    * Haz clic en el botón "Iniciar Vinculación WhatsApp".
    * El back-end iniciará una instancia de `whatsapp-web.js`.
    * Un código QR debería aparecer en la página web.
    * Abre WhatsApp en tu teléfono -> Configuración -> Dispositivos vinculados -> Vincular un dispositivo.
    * Escanea el código QR.
    * El estado en la página web debería actualizarse a "Listo" o similar.
    * Si envías un mensaje al número vinculado desde otro teléfono, debería aparecer en la sección "Mensajes Recibidos".

## Tecnologías Utilizadas

* **Back-end:**
    * Node.js
    * Express
    * Socket.IO
    * `whatsapp-web.js` (¡No oficial!)
    * `nodemon` (desarrollo)
    * `cors`
* **Front-end:**
    * React
    * Vite
    * Socket.IO Client
    * `qrcode.react` / `react-qr-code` (o la librería de QR que hayas elegido)
    * `axios` (opcional)
