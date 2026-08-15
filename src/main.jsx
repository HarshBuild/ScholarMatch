import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // initialise i18n before the app renders
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
