import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { DashboardAPI } from "../../helpers/backend_helper";

export const getDashboardStats = createAsyncThunk("dashboard/stats", async (_, thunkAPI) => {
    try {
        const res = await DashboardAPI.stats();
        if (!res.success) throw res;
        return res.data;
    } catch (error) {
        toast.error(error?.message || "Failed to fetch dashboard stats");
        return thunkAPI.rejectWithValue(error);
    }
});
