import { createSlice } from "@reduxjs/toolkit";
import {
    getProgramsBySchool,
    getUsersByRole,
    getPartnersByCategory,
    getContentActivity,
} from "./thunk";

export const initialState = {
    programsBySchool: [],
    usersByRole: [],
    partnersByCategory: [],
    contentActivity: [],
    loading: false,
    error: {},
};

const ReportsSlice = createSlice({
    name: "ReportsSlice",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getProgramsBySchool.fulfilled, (state, action) => {
            state.programsBySchool = action.payload;
        });
        builder.addCase(getUsersByRole.fulfilled, (state, action) => {
            state.usersByRole = action.payload;
        });
        builder.addCase(getPartnersByCategory.fulfilled, (state, action) => {
            state.partnersByCategory = action.payload;
        });
        builder.addCase(getContentActivity.fulfilled, (state, action) => {
            state.contentActivity = action.payload;
        });
    }
});

export default ReportsSlice.reducer;
