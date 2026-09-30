import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

const initialDraft = {
  serviceId: null,
  service: null, // cached service object for display
  vendorId: null,
  vendor: null, // cached vendor object for display
  vehicleId: null,
  scheduledDate: null,
  scheduledTimeSlot: null,
  specialInstructions: '',
};


export const submitBooking = createAsyncThunk('booking/submit', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/bookings', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not create booking');
  }
});

export const fetchMyBookings = createAsyncThunk('booking/myBookings', async (params) => {
  const { data } = await axiosClient.get('/bookings/my', { params });
  return data;
});

export const fetchBookingDetail = createAsyncThunk('booking/detail', async (id) => {
  const { data } = await axiosClient.get(`/bookings/${id}`);
  return data.data;
});

export const cancelBooking = createAsyncThunk('booking/cancel', async ({ id, reason }, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.put(`/bookings/${id}/cancel`, { reason });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not cancel booking');
  }
});

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    draft: { ...initialDraft },
    myBookings: [],
    pagination: { total: 0, page: 1, pages: 1 },
    activeBooking: null,
    statusHistory: [],
    submitStatus: 'idle',
    submitError: null,
    lastConfirmedBooking: null,
  },
  reducers: {
    startBookingDraft(state, action) {
      state.draft = { ...initialDraft, serviceId: action.payload.serviceId, service: action.payload.service };
    },
    updateBookingDraft(state, action) {
      state.draft = { ...state.draft, ...action.payload };
    },
    resetBookingDraft(state) {
      state.draft = { ...initialDraft };
      state.submitStatus = 'idle';
      state.submitError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitBooking.pending, (state) => {
        state.submitStatus = 'loading';
        state.submitError = null;
      })
      .addCase(submitBooking.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.lastConfirmedBooking = action.payload;
      })
      .addCase(submitBooking.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitError = action.payload;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.myBookings = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchBookingDetail.fulfilled, (state, action) => {
        state.activeBooking = action.payload.booking;
        state.statusHistory = action.payload.statusHistory;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.activeBooking = action.payload;
        state.myBookings = state.myBookings.map((b) => (b._id === action.payload._id ? action.payload : b));
      });
  },
});

export const { startBookingDraft, updateBookingDraft, resetBookingDraft } = bookingSlice.actions;
export default bookingSlice.reducer;
