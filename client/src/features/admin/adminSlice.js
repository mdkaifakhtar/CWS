import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosClient from '../../api/axiosClient';

const extractError = (err) => err.response?.data?.message || 'Something went wrong';

export const fetchAdminDashboard = createAsyncThunk('admin/fetchDashboard', async () => {
  const { data } = await axiosClient.get('/admin/dashboard');
  return data.data;
});

export const fetchAdminVendors = createAsyncThunk('admin/fetchVendors', async (params) => {
  const { data } = await axiosClient.get('/admin/vendors', { params });
  return data;
});

export const fetchAdminVendorDetail = createAsyncThunk('admin/fetchVendorDetail', async (id) => {
  const { data } = await axiosClient.get(`/admin/vendors/${id}`);
  return data.data;
});

export const approveVendor = createAsyncThunk('admin/approveVendor', async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.put(`/admin/vendors/${id}/approve`);
    return data.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const rejectVendor = createAsyncThunk(
  'admin/rejectVendor',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put(`/admin/vendors/${id}/reject`, { reason });
      return data.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const suspendVendor = createAsyncThunk(
  'admin/suspendVendor',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put(`/admin/vendors/${id}/suspend`, { reason });
      return data.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const restoreVendor = createAsyncThunk('admin/restoreVendor', async (id, { rejectWithValue }) => {
  try {
    const { data } = await axiosClient.put(`/admin/vendors/${id}/restore`);
    return data.data;
  } catch (err) {
    return rejectWithValue(extractError(err));
  }
});

export const fetchDailySummary = createAsyncThunk('admin/fetchDailySummary', async (date) => {
  const { data } = await axiosClient.get('/admin/finance/daily-summary', { params: { date } });
  return data.data;
});

export const fetchBookingLedger = createAsyncThunk('admin/fetchBookingLedger', async (params) => {
  const { data } = await axiosClient.get('/admin/finance/ledger', { params });
  return data;
});

export const fetchVendorPerformance = createAsyncThunk('admin/fetchVendorPerformance', async (params) => {
  const { data } = await axiosClient.get('/admin/finance/vendor-performance', { params });
  return data.data;
});

export const fetchCollectionsOverview = createAsyncThunk('admin/fetchCollections', async () => {
  const { data } = await axiosClient.get('/admin/collections');
  return data.data;
});

export const fetchVendorCollectionHistory = createAsyncThunk('admin/fetchVendorCollectionHistory', async (vendorId) => {
  const { data } = await axiosClient.get(`/admin/collections/${vendorId}`);
  return data.data;
});

export const recordCollection = createAsyncThunk(
  'admin/recordCollection',
  async ({ vendorId, amount, notes }, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.post(`/admin/collections/${vendorId}`, { amount, notes });
      return data.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

export const fetchPlatformSettings = createAsyncThunk('admin/fetchSettings', async () => {
  const { data } = await axiosClient.get('/admin/settings');
  return data.data;
});

export const updatePlatformSettings = createAsyncThunk(
  'admin/updateSettings',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosClient.put('/admin/settings', payload);
      return data.data;
    } catch (err) {
      return rejectWithValue(extractError(err));
    }
  }
);

const applyVendorUpdate = (state, updatedVendor) => {
  state.vendors = state.vendors.map((v) => (v._id === updatedVendor._id ? updatedVendor : v));
  if (state.activeVendor?.vendor?._id === updatedVendor._id) {
    state.activeVendor.vendor = updatedVendor;
  }
};

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    dashboard: null,
    vendors: [],
    vendorsPagination: { total: 0, page: 1, pages: 1 },
    activeVendor: null,
    dailySummary: null,
    ledger: [],
    ledgerPagination: { total: 0, page: 1, pages: 1 },
    vendorPerformance: [],
    collections: [],
    activeVendorCollections: null,
    settings: null,
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.dashboard = action.payload;
      })
      .addCase(fetchAdminVendors.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAdminVendors.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.vendors = action.payload.data;
        state.vendorsPagination = action.payload.pagination;
      })
      .addCase(fetchAdminVendors.rejected, (state) => {
        state.status = 'failed';
      })
      .addCase(fetchAdminVendorDetail.fulfilled, (state, action) => {
        state.activeVendor = action.payload;
      })
      .addCase(approveVendor.fulfilled, applyVendorUpdate)
      .addCase(rejectVendor.fulfilled, applyVendorUpdate)
      .addCase(suspendVendor.fulfilled, applyVendorUpdate)
      .addCase(restoreVendor.fulfilled, applyVendorUpdate)
      .addCase(fetchDailySummary.fulfilled, (state, action) => {
        state.dailySummary = action.payload;
      })
      .addCase(fetchBookingLedger.fulfilled, (state, action) => {
        state.ledger = action.payload.data;
        state.ledgerPagination = action.payload.pagination;
      })
      .addCase(fetchVendorPerformance.fulfilled, (state, action) => {
        state.vendorPerformance = action.payload;
      })
      .addCase(fetchCollectionsOverview.fulfilled, (state, action) => {
        state.collections = action.payload;
      })
      .addCase(fetchVendorCollectionHistory.fulfilled, (state, action) => {
        state.activeVendorCollections = action.payload;
      })
      .addCase(recordCollection.fulfilled, (state, action) => {
        if (state.activeVendorCollections) {
          state.activeVendorCollections.entries.unshift(action.payload);
          state.activeVendorCollections.collected += action.payload.amount;
          state.activeVendorCollections.pendingCollection -= action.payload.amount;
        }
      })
      .addCase(fetchPlatformSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      })
      .addCase(updatePlatformSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export default adminSlice.reducer;
