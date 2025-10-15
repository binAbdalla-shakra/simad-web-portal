// src/slices/settings/reducer.js
import { createSlice } from "@reduxjs/toolkit";
import { getUsersData, getUniversityInfo, getRoles, getAccreditations, getSenateMembers, getUniversity, getWhySimad, getHistory } from './thunk';
export const initialState = {
    usersData: [],
    uniData: [],
    rolesData: [],
    accreditationsData: [],
    senateData: [],
    universityData: [],
    whySimadData: [],
    historyData: [],
    error: {},
};

const SettingSlice = createSlice({
    name: 'SettingSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getUsersData.fulfilled, (state, action) => {
            state.usersData = action.payload;
        });
        builder.addCase(getUsersData.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });


        builder.addCase(getRoles.fulfilled, (state, action) => {
            state.rolesData = action.payload;
        });
        builder.addCase(getRoles.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });


        // university
        builder.addCase(getUniversityInfo.fulfilled, (state, action) => {
            state.uniData = action.payload;
        });
        builder.addCase(getUniversityInfo.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });

        builder.addCase(getAccreditations.fulfilled, (state, action) => {
            state.accreditationsData = action.payload;
        });
        builder.addCase(getAccreditations.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });


        builder.addCase(getSenateMembers.fulfilled, (state, action) => {
            state.senateData = action.payload;
        });
        builder.addCase(getSenateMembers.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });

        builder.addCase(getUniversity.fulfilled, (state, action) => {
            state.universityData = action.payload;
        });
        builder.addCase(getUniversity.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });


        builder.addCase(getWhySimad.fulfilled, (state, action) => {
            state.whySimadData = action.payload;
        });
        builder.addCase(getWhySimad.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });

        builder.addCase(getHistory.fulfilled, (state, action) => {
            state.historyData = action.payload;
        });
        builder.addCase(getHistory.rejected, (state, action) => {
            state.error = action.payload.error || null;
        });

    }
});

export default SettingSlice.reducer;