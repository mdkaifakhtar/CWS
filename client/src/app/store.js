import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import catalogReducer from '../features/booking/catalogSlice';
import bookingReducer from '../features/booking/bookingSlice';
import userReducer from '../features/booking/userSlice';
import vehicleReducer from '../features/booking/vehicleSlice';
import vendorReducer from '../features/vendor/vendorSlice';
import adminReducer from '../features/admin/adminSlice';
import notificationsReducer from '../features/notifications/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    catalog: catalogReducer,
    booking: bookingReducer,
    user: userReducer,
    vehicles: vehicleReducer,
    vendor: vendorReducer,
    admin: adminReducer,
    notifications: notificationsReducer,
  },
});
