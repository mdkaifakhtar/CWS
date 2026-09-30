import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cw_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// The store can't be imported directly here — authSlice (which the store
// includes) imports this file, so a top-level `import { store } from
// '../app/store'` would create a circular dependency. Instead, main.jsx
// registers the dispatch function once, right after the store is created.
let injectedDispatch = null;
let injectedLogoutAction = null;
export const registerAuthDispatch = (dispatch, logoutAction) => {
  injectedDispatch = dispatch;
  injectedLogoutAction = logoutAction;
};

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('cw_token');
      localStorage.removeItem('cw_token');
      localStorage.removeItem('cw_user');

      // Previously, only localStorage was cleared here, leaving Redux's
      // auth state (and therefore ProtectedRoute, the vendor dashboard,
      // and the notification bell) still believing the session was valid.
      // That mismatch is what caused repeated 401s: components stayed
      // mounted and kept firing authenticated requests with no token left
      // to send. Dispatching logout() here keeps Redux in sync, so
      // ProtectedRoute redirects to /login and every protected
      // component/poll actually stops.
      if (hadToken && injectedDispatch && injectedLogoutAction) {
        injectedDispatch(injectedLogoutAction());
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
