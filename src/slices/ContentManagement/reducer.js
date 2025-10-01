// src/slices/setups/reducer.js
import { createSlice } from "@reduxjs/toolkit";
import {
    getEvents,
    getNews
} from "./thunk";

export const initialState = {

    eventsData: [],
    newsData: [],

    error: {},
};
const ContentManagementSlice = createSlice({
    name: 'ContentManagementSlice',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        // === events ===
        builder.addCase(getEvents.fulfilled, (state, action) => {
            state.eventsData = action.payload;
        });
        builder.addCase(getEvents.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

        // === News ===
        builder.addCase(getNews.fulfilled, (state, action) => {
            state.newsData = action.payload;
        });
        builder.addCase(getNews.rejected, (state, action) => {
            state.error = action.payload?.error || null;
        });

    }
});

export default ContentManagementSlice.reducer;