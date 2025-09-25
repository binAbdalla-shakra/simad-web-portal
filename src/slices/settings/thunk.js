import { UserAPI, UniversityAPI, RoleAPI } from "../../helpers/backend_helper";
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
} = makeCRUDThunks("setting/uniInfo", UniversityAPI);

export const updateUniversity = createAsyncThunk(
    "setting/updateUniData",
    async (data, { dispatch }) => {
        try {
            const res = await UniversityAPI.update(data);

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
