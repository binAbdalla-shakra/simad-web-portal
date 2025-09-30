// src/helpers/backend_helper.js
import axios from "axios";
import api from "./api_helper";
import * as url from "./url_helper";

export const getLoggedInUser = () => {
    const user = localStorage.getItem("user");
    if (user) return JSON.parse(user);
    return null;
};

// //is user is logged in
export const isUserAuthenticated = () => {
    return getLoggedInUser() !== null;
};

// generic CRUD function
const makeCRUD = (endpoint) => ({
    list: () => api.get(endpoint),
    create: (payload) => api.create(endpoint, payload),
    update: (payload) => api.update(`${endpoint}/${payload._id}`, payload),
    delete: (id) => api.delete(`${endpoint}/${id}`)
});




// Auth
export const login = (data) => api.create(url.POST_LOGIN, data);
export const changePassword = (data) => api.patch(url.CHANGE_PASSWORD, data);


// ================================== SETTINGS URL ===================================================

//  User APIs
export const UserAPI = makeCRUD(url.USERS);

export const RoleAPI = makeCRUD(url.ROLES);


export const UniversityAPI = {
    list: () => api.get(url.UNIVERSITY_INFO),
    update: (uni) => {
        // Check if it's FormData (for file uploads) or regular data
        if (uni instanceof FormData) {
            // For FormData, use post with multipart/form-data headers
            return axios.post(url.UNIVERSITY_INFO, uni, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        } else {
            // For regular JSON data, use the existing api.update method
            return api.update(url.UNIVERSITY_INFO, uni);
        }
    }
};

// ================================== END OF SETTINGS URL ===================================================

// // ================================== SETUPS URL ===================================================

export const ProgramCategoryAPI = makeCRUD(url.PROGRAMS_CATEGORY);
export const SchoolAPI = makeCRUD(url.SCHOOLS);
export const DepartmentAPI = makeCRUD(url.DEPARTMENTS);
export const ProgramAPI = makeCRUD(url.PROGRAMS);
export const StaffAPI = makeCRUD(url.STAFFS);


export const PartnerCategoryAPI = makeCRUD(url.PARTNERS_CATEGORY);


export const PartnerAPI = {
    list: () => api.get(url.PARTNERS),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.PARTNERS, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.PARTNERS}/${id}`)
};


// // ================================== END OF SETUPS URL ===================================================

