import '@picocss/pico/css/pico.min.css'; // Pico framework
import './App.css'; // Your custom layout styles

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);