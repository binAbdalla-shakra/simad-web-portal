import { combineReducers } from "redux";

// Front
import LayoutReducer from "./layouts/reducer";

// Authentication
import LoginReducer from "./auth/login/reducer";
import AccountReducer from "./auth/register/reducer";
import ForgetPasswordReducer from "./auth/forgetpwd/reducer";
import ProfileReducer from "./auth/profile/reducer";


import SettingsReducer from "./settings/reducer";

import SetupReducer from "./setups/reducer";

import ContentManagementReducer from "./ContentManagement/reducer";

import DashboardReducer from "./dashboard/reducer";
import ReportsReducer from "./reports/reducer";

const rootReducer = combineReducers({
    Layout: LayoutReducer,
    Login: LoginReducer,
    Account: AccountReducer,
    ForgetPassword: ForgetPasswordReducer,
    Profile: ProfileReducer,
    Settings: SettingsReducer,
    Setups: SetupReducer,
    ContentManagement: ContentManagementReducer,
    Dashboard: DashboardReducer,
    Reports: ReportsReducer,
});

export default rootReducer;