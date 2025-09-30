//Include Both Helper File with needed methods
// import { getFirebaseBackend } from "../../../helpers/firebase_helper";
import {
  login, changePassword
} from "../../../helpers/backend_helper";

import { loginSuccess, logoutUserSuccess, apiError, reset_login_flag } from './reducer';

export const loginUser = (user, history) => async (dispatch) => {
  try {
    let response;
    response = login({
      username: user.username,
      password: user.password,
    });
    var data = await response;

    if (data) {
      sessionStorage.setItem("authUser", JSON.stringify(data));

      var finallogin = JSON.stringify(data);
      finallogin = JSON.parse(finallogin)
      data = finallogin.data;

      if (data.status === "success") {
        if (user.password === process.env.REACT_APP_DEFAULT_PASS) {
          history('/create-new-pass')
        }
        else {
          dispatch(loginSuccess(data));
          history('/auth-twostep')
        }

      } else {
        dispatch(apiError(finallogin));
      }
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};


export const changeUserPassword = (user, history) => async (dispatch) => {
  try {
    let response;
    response = changePassword({
      userId: user.id,
      currentPassword: user.currentPassword,
      newPassword: user.confirm_password,
    });
    var data = await response;
    if (data) {
      if (data.success) {
        sessionStorage.removeItem("authUser");
        history('/login')
      }
    }
  } catch (error) {
    dispatch(apiError(error));
  }
};

export const logoutUser = () => async (dispatch) => {
  try {
    sessionStorage.removeItem("authUser");


  } catch (error) {
    dispatch(apiError(error));
  }
};

export const logoutCurrentUser = (navigate) => async (dispatch) => {
  try {
    // console.log("clicked logout");
    sessionStorage.removeItem("authUser");
    navigate("/login");
  } catch (error) {
    console.log("error is:", error);
    // dispatch(apiError(error));
  }
};



export const resetLoginFlag = () => async (dispatch) => {
  try {
    const response = dispatch(reset_login_flag());
    return response;
  } catch (error) {
    dispatch(apiError(error));
  }
};