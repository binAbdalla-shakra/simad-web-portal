import { UserAPI, RoleAPI, accreditationAPI, senateAPI, profileAPI, universityAPI, whySimadAPI, historyAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-toastify";


export const {
    list: getUsersData,
    create: addUser,
    update: updateUser,
    delete: deleteUser
} = makeCRUDThunks("setting/user", UserAPI);

export const {
    list: getRoles,
    create: addRole,
    update: updateRole,
    delete: deleteRole
} = makeCRUDThunks("setting/role", RoleAPI);


// University
export const {
    list: getUniversityInfo,
} = makeCRUDThunks("setting/uniInfo", profileAPI);


export const {
    list: getAccreditations,
    delete: deleteAccreditation,
} = makeCRUDThunks("setting/accreditationAPI", accreditationAPI);

export const createOrUpdateAccreditation = createAsyncThunk(
    "setting/accreditationAPI",
    async (data, { dispatch, rejectWithValue }) => {
        try {
            const res = await accreditationAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getAccreditations());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to complete an action';
            toast.error(errorMessage);


        }
    }
);



export const {
    list: getSenateMembers,
    delete: deleteSenateMember,
} = makeCRUDThunks("setting/senateAPI", senateAPI);

export const createOrUpdateSenateMember = createAsyncThunk(
    "setting/senateAPI",
    async (data, { dispatch, rejectWithValue }) => {
        try {
            const res = await senateAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getSenateMembers());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to complete an action';
            toast.error(errorMessage);


        }
    }
);




export const {
    list: getUniversity,
} = makeCRUDThunks("setting/universityAPI", universityAPI);

export const createOrUpdateUniversity = createAsyncThunk(
    "setting/universityAPI",
    async (data, { dispatch, rejectWithValue }) => {
        try {
            const res = await universityAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getUniversity());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to complete an action';
            toast.error(errorMessage);


        }
    }
);





export const {
    list: getWhySimad,
    delete: deleteWhySimad,
} = makeCRUDThunks("setting/whySimadAPI", whySimadAPI);

export const createOrUpdateWhySimad = createAsyncThunk(
    "setting/whySimadAPI",
    async (data, { dispatch, rejectWithValue }) => {
        try {
            const res = await whySimadAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getWhySimad());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to complete an action';
            toast.error(errorMessage);


        }
    }
);




export const {
    list: getHistory,
    delete: deleteHistory,
} = makeCRUDThunks("setting/historyAPI", historyAPI);

export const createOrUpdateHistory = createAsyncThunk(
    "setting/historyAPI",
    async (data, { dispatch, rejectWithValue }) => {
        try {
            const res = await historyAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getHistory());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to complete an action';
            toast.error(errorMessage);


        }
    }
);
