import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (params) => {
  const { data } = await axiosClient.get('/notifications', { params });
  return data;
});

export const fetchUnreadCount = createAsyncThunk('notifications/unreadCount', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('cw_token');
  if (!token) return rejectWithValue('No token');
  try {
    const { data } = await axiosClient.get('/notifications/unread-count');
    return data.data.count;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Error fetching unread count');
  }
});

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id) => {
  const { data } = await axiosClient.put(`/notifications/${id}/read`);
  return data.data;
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await axiosClient.put('/notifications/read-all');
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    status: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.data;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        state.items = state.items.map((n) => (n._id === action.payload._id ? action.payload : n));
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;
