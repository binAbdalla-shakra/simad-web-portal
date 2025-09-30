// src/slices/setups/reducer.js
import { createSlice } from "@reduxjs/toolkit";
import {
    getProgramsCategories,
    getSchools,
    getDepartments,
    getPrograms,
    getStaffs,
    getPartnersInfo,
    getPartnerCategories
} from "./thunk";

export const initialState = {
    pr_categoriesData: [],
    schoolsData: [],
    departmentsData: [],
    programsData: [],
    staffsData: [],
    partner_categoriesData: [],
    partnersData: [],

    error: {},
};
const SetupSlice = createSlice({
    name: 'SetupSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // === Program Categories ===
        builder.addCase(getProgramsCategories.fulfilled, (state, action) => {
            state.pr_categoriesData = action.payload;
        });
        builder.addCase(getProgramsCategories.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        // === Schools ===
        builder.addCase(getSchools.fulfilled, (state, action) => {
            state.schoolsData = action.payload;
        });
        builder.addCase(getSchools.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        // === Departments ===
        builder.addCase(getDepartments.fulfilled, (state, action) => {
            state.departmentsData = action.payload;
        });
        builder.addCase(getDepartments.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        // === Programs ===
        builder.addCase(getPrograms.fulfilled, (state, action) => {
            state.programsData = action.payload;
        });
        builder.addCase(getPrograms.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        // === Staffs ===
        builder.addCase(getStaffs.fulfilled, (state, action) => {
            state.staffsData = action.payload;
        });
        builder.addCase(getStaffs.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        // === partner ===
        builder.addCase(getPartnersInfo.fulfilled, (state, action) => {
            state.partnersData = action.payload;
        });
        builder.addCase(getPartnersInfo.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        builder.addCase(getPartnerCategories.fulfilled, (state, action) => {
            state.partner_categoriesData = action.payload;
        });
        builder.addCase(getPartnerCategories.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });



    }
});

export default SetupSlice.reducer;