import { createAsyncThunk } from "@reduxjs/toolkit";
import { EventsAPI, NewsAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";


export const {
    list: getNews,
    delete: deleteNews,
} = makeCRUDThunks("ContentManagement/newsInfo", NewsAPI);

export const CreateOrUpdateNews = createAsyncThunk(
    "ContentManagement/UpdatenewsInfo",
    async (data, { dispatch }) => {
        try {
            const res = await NewsAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getNews());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to take an action';
            toast.error(errorMessage);

            // Return error structure to handle in the reducer
            return {
                success: false,
                message: errorMessage,
                errors: error.response?.data?.errors || []
            };
        }
    }
);



export const {
    list: getEvents,
    delete: deleteEvent,
} = makeCRUDThunks("ContentManagement/eventInfo", EventsAPI);

export const CreateOrUpdateEvent = createAsyncThunk(
    "ContentManagement/createorupdateInfo",
    async (data, { dispatch }) => {
        try {
            const res = await EventsAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getEvents());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to take an action';
            toast.error(errorMessage);

            // Return error structure to handle in the reducer
            return {
                success: false,
                message: errorMessage,
                errors: error.response?.data?.errors || []
            };
        }
    }
);
