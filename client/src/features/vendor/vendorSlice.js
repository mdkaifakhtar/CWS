import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

const extractError = (err) => err.response?.data?.message || 'Something went wrong';

// --- Profile & dashboard ---
export const fetchVendorProfile = createAsyncThunk('vendor/fetchProfile', async () => {
  const { data } = await axiosClient.get('/vendor/me');
  return data.data;
});

export const updateVendorProfile = createAsyncThunk(
  'vendor/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put('/vendor/me', payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const fetchVendorDashboard = createAsyncThunk('vendor/fetchDashboard', async () => {
  const { data } = await axiosClient.get('/vendor/dashboard');
  return data.data;
});

export const fetchVendorReviews = createAsyncThunk('vendor/fetchReviews', async () => {
  const { data } = await axiosClient.get('/vendor/reviews');
  return data.data;
});

// --- Documents ---
export const uploadVendorDocuments = createAsyncThunk(
  'vendor/uploadDocuments',
  async ({ files, label, type }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      if (label) formData.append('label', label);
      if (type) formData.append('type', type);
      const { data } = await axiosClient.post('/vendor/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const deleteVendorDocument = createAsyncThunk('vendor/deleteDocument', async (docId) => {
  const { data } = await axiosClient.delete(`/vendor/documents/${docId}`);
  return data.data;
});

// --- Services ---
export const fetchVendorServices = createAsyncThunk('vendor/fetchServices', async () => {
  const { data } = await axiosClient.get('/vendor/services');
  return data.data;
});

export const createVendorService = createAsyncThunk(
  'vendor/createService',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post('/vendor/services', payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const updateVendorService = createAsyncThunk(
  'vendor/updateService',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put(`/vendor/services/${id}`, payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const toggleVendorServiceActive = createAsyncThunk('vendor/toggleService', async (id) => {
  const { data } = await axiosClient.put(`/vendor/services/${id}/toggle-active`);
  return data.data;
});

export const deleteVendorService = createAsyncThunk('vendor/deleteService', async (id) => {
  await axiosClient.delete(`/vendor/services/${id}`);
  return id;
});

// --- Bookings ---
export const fetchVendorBookings = createAsyncThunk('vendor/fetchBookings', async (params) => {
  const { data } = await axiosClient.get('/vendor/bookings', { params });
  return data;
});

export const fetchVendorBookingDetail = createAsyncThunk('vendor/fetchBookingDetail', async (id) => {
  const { data } = await axiosClient.get(`/vendor/bookings/${id}`);
  return data.data;
});

export const updateVendorBookingStatus = createAsyncThunk(
  'vendor/updateBookingStatus',
  async ({ id, status, reason }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put(`/vendor/bookings/${id}/status`, { status, reason });
      return data.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const vendorSlice = createSlice({
  name: 'vendor',
  initialState: {
    profile: null,
    dashboard: null,
    reviews: [],
    services: [],
    bookings: [],
    bookingsPagination: { total: 0, page: 1, pages: 1 },
    activeBooking: null,
    bookingStatusHistory: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendorProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updateVendorProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(fetchVendorDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      })
      .addCase(fetchVendorReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
      })
      .addCase(uploadVendorDocuments.fulfilled, (state, action) => {
        if (state.profile) state.profile.documents = action.payload;
      })
      .addCase(deleteVendorDocument.fulfilled, (state, action) => {
        if (state.profile) state.profile.documents = action.payload;
      })
      .addCase(fetchVendorServices.fulfilled, (state, action) => {
        state.services = action.payload;
      })
      .addCase(createVendorService.fulfilled, (state, action) => {
        state.services.unshift(action.payload);
      })
      .addCase(updateVendorService.fulfilled, (state, action) => {
        state.services = state.services.map((s) => (s._id === action.payload._id ? action.payload : s));
      })
      .addCase(toggleVendorServiceActive.fulfilled, (state, action) => {
        state.services = state.services.map((s) => (s._id === action.payload._id ? action.payload : s));
      })
      .addCase(deleteVendorService.fulfilled, (state, action) => {
        state.services = state.services.filter((s) => s._id !== action.payload);
      })
      .addCase(fetchVendorBookings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchVendorBookings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.bookings = action.payload.data;
        state.bookingsPagination = action.payload.pagination;
      })
      .addCase(fetchVendorBookingDetail.fulfilled, (state, action) => {
        state.activeBooking = action.payload.booking;
        state.bookingStatusHistory = action.payload.statusHistory;
      })
      .addCase(updateVendorBookingStatus.fulfilled, (state, action) => {
        state.activeBooking = action.payload;
        state.bookings = state.bookings.map((b) => (b._id === action.payload._id ? action.payload : b));
      });
  },
});

export default vendorSlice.reducer;
