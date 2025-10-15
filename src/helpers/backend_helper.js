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


export const profileAPI = {
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



export const accreditationAPI = {
    list: () => api.get(url.ACCREDITATION),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.ACCREDITATION, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.ACCREDITATION}/${id}`)
};


export const senateAPI = {
    list: () => api.get(url.SENATE),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.SENATE, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.SENATE}/${id}`)
};



export const universityAPI = {
    list: () => api.get(url.UNIVERSITY),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.UNIVERSITY, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    }
};


export const whySimadAPI = {
    list: () => api.get(url.WHYSIMAD),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.WHYSIMAD, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.WHYSIMAD}/${id}`)

};


export const historyAPI = {
    list: () => api.get(url.HISTORY),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.HISTORY, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.HISTORY}/${id}`)

};


// ================================== END OF SETTINGS URL ===================================================

// // ================================== SETUPS URL ===================================================

export const ProgramCategoryAPI = makeCRUD(url.PROGRAMS_CATEGORY);

export const StaffAPI = {
    list: () => api.get(url.STAFFS),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.STAFFS, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.STAFFS}/${id}`)
};


export const ProgramAPI = {
    list: () => api.get(url.PROGRAMS),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.PROGRAMS, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.PROGRAMS}/${id}`)
};


export const SchoolAPI = {
    list: () => api.get(url.SCHOOLS),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.SCHOOLS, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.SCHOOLS}/${id}`)
};




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



export const NewsAPI = {
    list: () => api.get(url.NEWS),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.NEWS, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.NEWS}/${id}`)
};

export const EventsAPI = {
    list: () => api.get(url.EVENTS),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.EVENTS, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.EVENTS}/${id}`)
};



export const FacilitiesAPI = {
    list: () => api.get(url.FACILITIES),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.FACILITIES, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.FACILITIES}/${id}`)
};




export const InstitutionsAPI = {
    list: () => api.get(url.INSTITUTIONS),
    createOrupdate: (payload) => {
        // For FormData, use post with multipart/form-data headers
        return axios.post(url.INSTITUTIONS, payload, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    delete: (id) => api.delete(`${url.INSTITUTIONS}/${id}`)
};



// // ================================== END OF SETUPS URL ===================================================

