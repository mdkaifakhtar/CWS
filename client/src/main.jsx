import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from './app/store';
import { registerAuthDispatch } from './api/axiosClient';
import { logout } from './features/auth/authSlice';
import App from './App';
import './index.css';

// See axiosClient.js — this closes the loop so a 401 response actually
// updates Redux (and therefore the whole app), not just localStorage.
registerAuthDispatch(store.dispatch, logout);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0A0A0B',
              color: '#F7FAFB',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#D9F520', secondary: '#0A0A0B' } },
            error: { iconTheme: { primary: '#F4A100', secondary: '#F7FAFB' } },
          }}
        />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
