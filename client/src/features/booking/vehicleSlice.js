import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

const extractError = (err) => err.response?.data?.message || 'Something went wrong';

export const fetchMyVehicles = createAsyncThunk('vehicles/fetchMine', async () => {
  const { data } = await axiosClient.get('/vehicles');
  return data.data;
});

export const addVehicle = createAsyncThunk('vehicles/add', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.post('/vehicles', payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const updateVehicle = createAsyncThunk('vehicles/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.put(`/vehicles/${id}`, payload);
    return data.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const deleteVehicle = createAsyncThunk('vehicles/delete', async (id) => {
  await axiosClient.delete(`/vehicles/${id}`);
  return id;
});

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState: { items: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyVehicles.pending, (state) => { state.status = 'loading'; })
      .addCase(fetchMyVehicles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateVehicle.fulfilled, (state, action) => {
        state.items = state.items.map((v) => (v._id === action.payload._id ? action.payload : v));
      })
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.items = state.items.filter((v) => v._id !== action.payload);
      });
  },
});

export default vehicleSlice.reducer;
