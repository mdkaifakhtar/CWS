import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const fetchDashboardSummary = createAsyncThunk('user/dashboard', async () => {
  const { data } = await axiosClient.get('/users/dashboard');
  return data.data;
});

export const fetchAddresses = createAsyncThunk('user/addresses', async () => {
  const { data } = await axiosClient.get('/users/addresses');
  return data.data;
});

export const addAddress = createAsyncThunk('user/addAddress', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/users/addresses', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not save address');
  }
});

export const deleteAddress = createAsyncThunk('user/deleteAddress', async (addressId) => {
  const { data } = await axiosClient.delete(`/users/addresses/${addressId}`);
  return data.data;
});

export const fetchMyReviews = createAsyncThunk('user/myReviews', async () => {
  const { data } = await axiosClient.get('/reviews/my');
  return data.data;
});

export const submitReview = createAsyncThunk('user/submitReview', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/reviews', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not submit review');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    dashboard: null,
    addresses: [],
    reviews: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.addresses = action.payload;
      })
      .addCase(fetchMyReviews.fulfilled, (state, action) => {
        state.reviews = action.payload;
      });
  },
});

export default userSlice.reducer;
