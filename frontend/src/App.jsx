// frontend/src/App.jsx
import React from 'react';
import WhatsAppLinker from './components/WhatsAppLinker'; // Crearemos este componente
import './App.css'; // Vite maneja la importación de CSS

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Prueba de Vinculación WhatsApp (Vite)</h1>
        <WhatsAppLinker />
      </header>
    </div>
  );
}

export default App;