import { createSlice } from "@reduxjs/toolkit";
import { getDashboardStats } from "./thunk";

export const initialState = {
    statsData: null,
    loading: false,
    error: {},
};

const DashboardSlice = createSlice({
    name: "DashboardSlice",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getDashboardStats.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getDashboardStats.fulfilled, (state, action) => {
            state.statsData = action.payload;
            state.loading = false;
        });
        builder.addCase(getDashboardStats.rejected, (state, action) => {
            state.error = action.payload?.error || null;
            state.loading = false;
        });
    }
});

export default DashboardSlice.reducer;
