import { createAsyncThunk } from "@reduxjs/toolkit";
import { InstitutionsAPI, PartnerAPI, PartnerCategoryAPI, ProgramAPI, ProgramCategoryAPI, SchoolAPI, StaffAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";

export const {
    list: getProgramsCategories,
    create: addProgramCategory,
    update: updateProgramCategory,
    delete: deleteProgramCategory
} = makeCRUDThunks("setup/programCategory", ProgramCategoryAPI);


export const {
    list: getPartnerCategories,
    create: addPartnerCategory,
    update: updatePartnerCategory,
    delete: deletePartnerCategory
} = makeCRUDThunks("setup/partnerCategory", PartnerCategoryAPI);


export const {
    list: getStaffs,
    delete: deleteStaff,
} = makeCRUDThunks("setup/staff", StaffAPI);

export const CreateOrUpdateStaff = createAsyncThunk(
    "setup/staff",
    async (data, { dispatch }) => {
        try {
            const res = await StaffAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getStaffs());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to take an action';
            toast.error(errorMessage);
        }
    }
);

export const {
    list: getPrograms,
    delete: deleteProgram,
} = makeCRUDThunks("setup/program", ProgramAPI);

export const CreateOrUpdateProgram = createAsyncThunk(
    "setup/program",
    async (data, { dispatch }) => {
        try {
            const res = await ProgramAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getPrograms());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to take an action';
            toast.error(errorMessage);
        }
    }
);

export const {
    list: getSchools,
    delete: deleteSchool,
} = makeCRUDThunks("setup/school", SchoolAPI);

export const CreateOrUpdateSchool = createAsyncThunk(
    "setup/school",
    async (data, { dispatch }) => {
        try {
            const res = await SchoolAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getSchools());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to take an action';
            toast.error(errorMessage);
        }
    }
);


export const {
    list: getPartnersInfo,
    delete: deletePartner,
} = makeCRUDThunks("setup/partnerInfo", PartnerAPI);

export const CreateOrUpdatePartner = createAsyncThunk(
    "setup/updatepartnerInfo",
    async (data, { dispatch }) => {
        try {
            const res = await PartnerAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getPartnersInfo());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update partners data';
            toast.error(errorMessage);


        }
    }
);










export const {
    list: getInstitutions,
    delete: deleteInstitution,
} = makeCRUDThunks("setup/InstitutionsAPI", InstitutionsAPI);

export const createOrUpdateInstitution = createAsyncThunk(
    "setup/InstitutionsAPI",
    async (data, { dispatch }) => {
        try {
            const res = await InstitutionsAPI.createOrupdate(data);
            if (!res.success) throw res;
            toast.success(res.message);
            dispatch(getInstitutions());
            return res;
        } catch (error) {
            // Handle axios error response
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update institutions data';
            toast.error(errorMessage);


        }
    }
);



