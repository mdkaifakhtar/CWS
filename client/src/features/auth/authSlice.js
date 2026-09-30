import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

const storedUser = localStorage.getItem('cw_user');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: localStorage.getItem('cw_token') || null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
};

const extractError = (err) =>
  err.response?.data?.message || err.message || 'Something went wrong. Please try again.';

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/auth/register', payload);
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const loginUser = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/auth/login', payload);
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const registerVendor = createAsyncThunk('auth/registerVendor', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/vendor/register', payload);
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.get('/auth/me');
    return data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

const persistSession = (state) => {
  localStorage.setItem('cw_token', state.token);
  localStorage.setItem('cw_user', JSON.stringify(state.user));
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = 'idle';
      localStorage.removeItem('cw_token');
      localStorage.removeItem('cw_user');
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.data;
        state.token = action.payload.token;
        persistSession(state);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(registerVendor.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerVendor.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.data.user;
        state.token = action.payload.token;
        persistSession(state);
      })
      .addCase(registerVendor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.data;
        state.token = action.payload.token;
        persistSession(state);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload.data;
        localStorage.setItem('cw_user', JSON.stringify(state.user));
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('cw_token');
        localStorage.removeItem('cw_user');
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
