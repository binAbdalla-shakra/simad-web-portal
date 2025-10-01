import { createAsyncThunk } from "@reduxjs/toolkit";
import { DepartmentAPI, PartnerAPI, PartnerCategoryAPI, ProgramAPI, ProgramCategoryAPI, SchoolAPI, StaffAPI } from "../../helpers/backend_helper";
import { makeCRUDThunks } from "../../helpers/thunk_factory";
import { toast } from "react-toastify";

export const {
    list: getProgramsCategories,
    create: addProgramCategory,
    update: updateProgramCategory,
    delete: deleteProgramCategory
} = makeCRUDThunks("setup/programCategory", ProgramCategoryAPI);

export const {
    list: getSchools,
    create: addSchool,
    update: updateSchool,
    delete: deleteSchool
} = makeCRUDThunks("setup/school", SchoolAPI);

export const {
    list: getDepartments,
    create: addDepartment,
    update: updateDepartment,
    delete: deleteDepartment
} = makeCRUDThunks("setup/department", DepartmentAPI);



export const {
    list: getPrograms,
    create: addProgram,
    update: updateProgram,
    delete: deleteProgram
} = makeCRUDThunks("setup/program", ProgramAPI);


export const {
    list: getStaffs,
    create: addStaff,
    update: updateStaff,
    delete: deleteStaff
} = makeCRUDThunks("setup/staff", StaffAPI);



export const {
    list: getPartnerCategories,
    create: addPartnerCategory,
    update: updatePartnerCategory,
    delete: deletePartnerCategory
} = makeCRUDThunks("setup/partnerCategory", PartnerCategoryAPI);


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

            // Return error structure to handle in the reducer
            return {
                success: false,
                message: errorMessage,
                errors: error.response?.data?.errors || []
            };
        }
    }
);










