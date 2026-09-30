import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

export const fetchHomeFeed = createAsyncThunk('catalog/home', async () => {
  const { data } = await axiosClient.get('/catalog/home');
  return data.data;
});

export const fetchCategories = createAsyncThunk('catalog/categories', async () => {
  const { data } = await axiosClient.get('/catalog/categories');
  return data.data;
});

export const fetchVehicleTypes = createAsyncThunk('catalog/vehicleTypes', async () => {
  const { data } = await axiosClient.get('/catalog/vehicle-types');
  return data.data;
});

export const searchServices = createAsyncThunk('catalog/search', async (params) => {
  const { data } = await axiosClient.get('/catalog/services', { params });
  return data;
});

const catalogSlice = createSlice({
  name: 'catalog',
  initialState: {
    categories: [],
    vehicleTypes: [],
    home: { featuredVendors: [], popularServices: [], categories: [] },
    searchResults: [],
    pagination: { total: 0, page: 1, pages: 1 },
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeFeed.fulfilled, (state, action) => {
        state.home = action.payload;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchVehicleTypes.fulfilled, (state, action) => {
        state.vehicleTypes = action.payload;
      })
      .addCase(searchServices.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchServices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.searchResults = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchServices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export default catalogSlice.reducer;
