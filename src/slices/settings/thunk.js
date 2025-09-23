// src/slices/settings/thunk.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserAPI, UniversityAPI } from "../../helpers/backend_helper";

// Users
export const getUsersData = createAsyncThunk("setting/getUsersData", async () => {
    const res = await UserAPI.list();
    if (!res.success) throw res;
    return res.data;
});

export const addUser = createAsyncThunk("setting/addUser", async (user, { dispatch }) => {
    const res = await UserAPI.create(user);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUsersData());
    return res;
});

export const updateUser = createAsyncThunk("setting/updateUser", async (user, { dispatch }) => {
    const res = await UserAPI.update(user);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUsersData());
    return res;
});

export const deleteUser = createAsyncThunk("setting/deleteUser", async (id, { dispatch }) => {
    const res = await UserAPI.delete(id);
    res.success ? toast.success(res.message) : toast.error(res.message);
    dispatch(getUsersData());
    return res;
});

// University
export const getUniversityInfo = createAsyncThunk("setting/getUniData", async () => {
    const res = await UniversityAPI.get();
    if (!res.success) throw res;
    return res.data;
});

// export const updateUniversity = createAsyncThunk("setting/updateUniData", async (uni, { dispatch }) => {
//     const res = await UniversityAPI.update(uni);
//     res.success ? toast.success(res.message) : toast.error(res.message);
//     dispatch(getUniversityInfo());
//     return res;
// });

export const updateUniversity = createAsyncThunk(
    "setting/updateUniData",
    async (data, { dispatch }) => {
        try {
            const res = await UniversityAPI.update(data);

            // Handle both response structures (axios response vs direct data)
            const responseData = res;
            console.log("thunk result: ", responseData);
            if (responseData.success) {
                toast.success(responseData.message);
            } else {
                toast.error(responseData.message);
            }

            dispatch(getUniversityInfo());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update university data';
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