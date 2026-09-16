import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { ReportsAPI } from "../../helpers/backend_helper";

const makeReportThunk = (name, fetcher) =>
    createAsyncThunk(`reports/${name}`, async (_, thunkAPI) => {
        try {
            const res = await fetcher();
            if (!res.success) throw res;
            return res.data;
        } catch (error) {
            toast.error(error?.message || `Failed to fetch ${name} report`);
            return thunkAPI.rejectWithValue(error);
        }
    });

export const getProgramsBySchool = makeReportThunk("programsBySchool", ReportsAPI.programsBySchool);
export const getUsersByRole = makeReportThunk("usersByRole", ReportsAPI.usersByRole);
export const getPartnersByCategory = makeReportThunk("partnersByCategory", ReportsAPI.partnersByCategory);
export const getContentActivity = makeReportThunk("contentActivity", ReportsAPI.contentActivity);
