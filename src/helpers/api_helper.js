// src/helpers/api_helper.js
import axios from "axios";
import { api } from "../config";

// Setup defaults
axios.defaults.baseURL = api.API_URL;
axios.defaults.headers.post["Content-Type"] = "application/json";
axios.defaults.withCredentials = true; // send the httpOnly refresh-token cookie

// Authorization
const token = JSON.parse(sessionStorage.getItem("authUser"))?.data?.accessToken || null;
if (token) axios.defaults.headers.common["Authorization"] = "Bearer " + token;

export const getLoggedinUser = () => {
  const user = sessionStorage.getItem("authUser");
  if (!user) {
    return null;
  } else {
    return JSON.parse(user);
  }
};

export const setAuthorization = (token) => {
  axios.defaults.headers.common["Authorization"] = "Bearer " + token;
};

// Persist a refreshed access token into the stored session so a page reload
// (or the next tab) keeps using it instead of the stale one.
const persistRefreshedToken = (accessToken) => {
  setAuthorization(accessToken);
  const stored = getLoggedinUser();
  if (stored?.data) {
    stored.data.accessToken = accessToken;
    sessionStorage.setItem("authUser", JSON.stringify(stored));
  }
};

const clearSessionAndRedirectToLogin = () => {
  sessionStorage.removeItem("authUser");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

// Queue of requests waiting on an in-flight refresh, so concurrent 401s
// trigger only one refresh call instead of one per request.
let isRefreshing = false;
let pendingRequests = [];

const resolvePendingRequests = (accessToken) => {
  pendingRequests.forEach((cb) => cb(accessToken));
  pendingRequests = [];
};

axios.interceptors.response.use(
  (response) => {
    // Always wrap successful responses in a unified format
    return {
      success: true,
      statusCode: response.status,
      data: response.data?.data || response.data,
      message: response.data?.message || "Success",
    };
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status || 500;
    const isAuthEndpoint =
      originalRequest?.url?.includes("/users/login") ||
      originalRequest?.url?.includes("/users/refresh-token");

    if (status === 401 && !isAuthEndpoint && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push((accessToken) => {
            if (!accessToken) return reject(error);
            originalRequest.headers["Authorization"] = "Bearer " + accessToken;
            resolve(axios(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshResponse = await axios.post(
          "/users/refresh-token",
          {},
          { withCredentials: true }
        );
        const newAccessToken = refreshResponse.data?.data?.accessToken;
        if (!newAccessToken) throw new Error("No access token returned from refresh");

        persistRefreshedToken(newAccessToken);
        resolvePendingRequests(newAccessToken);
        originalRequest.headers["Authorization"] = "Bearer " + newAccessToken;
        return axios(originalRequest);
      } catch (refreshError) {
        resolvePendingRequests(null);
        clearSessionAndRedirectToLogin();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    const backendMessage = error.response?.data?.message;

    let message;

    switch (status) {
      case 401:
        message = backendMessage || "Invalid credentials";
        break;
      case 404:
        message = backendMessage || "Data not found";
        break;
      case 500:
        message = backendMessage || "Something went wrong on the server";
        break;
      default:
        message = backendMessage || error.message || "An error occurred";
    }

    return Promise.reject({
      success: false,
      statusCode: status,
      data: null,
      message,
    });
  }
);

class APIClient {
  get = (url, params) => axios.get(url, { params });
  create = (url, data) => axios.post(url, data);
  update = (url, data) => axios.put(url, data);
  patch = (url, data) => axios.patch(url, data);
  delete = (url) => axios.delete(url);
}

export default new APIClient();
