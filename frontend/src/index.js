import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter as Router } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { StrictMode } from 'react';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    {/* Context Provider and Routing */}
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  </StrictMode>
);
