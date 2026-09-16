import React, { lazy } from "react";
import { Navigate } from "react-router-dom";


// //AuthenticationInner pages
import SignIn from '../pages/AuthenticationInner/Login';
//pages
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Reports = lazy(() => import('../pages/Reports'));
const UniversityProfile = lazy(() => import('../pages/settings/University_Profile/index'));
const EditUniProfile = lazy(() => import('../pages/settings/University_Profile/EditUniProfile'));

const Accreditations = lazy(() => import('../pages/settings/Accreditations'));
const Senate = lazy(() => import('../pages/settings/Senates'));

const University = lazy(() => import('../pages/settings/University'));
const WhySimad = lazy(() => import('../pages/settings/Why-Simad'));

const History = lazy(() => import('../pages/settings/Histories'));

const Users = lazy(() => import('../pages/settings/Users'));
const Roles = lazy(() => import('../pages/settings/Roles'));

const ProgramCategories = lazy(() => import('../pages/Setup/programCategories'));
const Schools = lazy(() => import('../pages/Setup/Schools'));

const Departments = lazy(() => import('../pages/Setup/Departments'));
const Programs = lazy(() => import('../pages/Setup/Programs'));
const Staffs = lazy(() => import('../pages/Setup/Staffs'));
const Partners = lazy(() => import('../pages/Setup/Partners'));

const Institutions = lazy(() => import('../pages/Setup/Institutions'));

const PartnerCategories = lazy(() => import('../pages/Setup/PartnerCategories'));

const Events = lazy(() => import('../pages/ContentManagement/Events'));
const News = lazy(() => import('../pages/ContentManagement/News'));

const Facilities = lazy(() => import('../pages/ContentManagement/Facilities'));

import CreateNewPassword from '../pages/AuthenticationInner/ChangePassword';

import TwosVerify from '../pages/AuthenticationInner/TwoStepVerification';
import Cover404 from '../pages/AuthenticationInner/Errors/Cover404';
import Alt404 from '../pages/AuthenticationInner/Errors/Alt404';
import Error500 from '../pages/AuthenticationInner/Errors/Error500';

import Offlinepage from "../pages/AuthenticationInner/Errors/Offlinepage";



const authProtectedRoutes = [

  { path: "/dashboard", component: <Dashboard /> },
  
  //Pages
  { path: "/setting-profile", component: <UniversityProfile /> },
  { path: "/setting-edit-profile", component: <EditUniProfile /> },
  
  { path: "/setting-accreditations", component: <Accreditations /> },
  
  
  { path: "/setting-users", component: <Users /> },
  { path: "/setting-roles", component: <Roles /> },

  { path: "/setting-senate", component: <Senate /> },
  
  { path: "/setting-university", component: <University /> },
  
  { path: "/setting/why-simad", component: <WhySimad /> },
  
  { path: "/setting/history", component: <History /> },
  

  
  
  
  { path: "/reports", component: <Reports /> },
  
  { path: "/setup/parogram-categories", component: <ProgramCategories /> },

  { path: "/setup/schools", component: <Schools /> },
  
  { path: "/setup/departments", component: <Departments /> },
  
  { path: "/setup/programs", component: <Programs /> },
  
  { path: "/setup/staffs", component: <Staffs /> },
  { path: "/setup/partners", component: <Partners /> },
  
  { path: "/setup/institutions", component: <Institutions /> },
  
  
  { path: "/setup/partner-categories", component: <PartnerCategories /> },
  
  
  { path: "/content/events", component: <Events /> },
  { path: "/content/news", component: <News /> },
  { path: "/content/facilities", component: <Facilities /> },
  
  
  
  // this route should be at the end of all other routes
  // eslint-disable-next-line react/display-name
  {
    path: "/",
    exact: true,
    component: <Navigate to="/dashboard" />,
    
  },
  // { path: "*", component: <Navigate to="/not-found-404" /> },
];

const publicRoutes = [
  // Authentication Page
  { path: "/login", component: <SignIn /> },

  { path: "/create-new-pass", component: <CreateNewPassword /> },



  //AuthenticationInner pages
  { path: "/auth-twostep", component: <TwosVerify /> },
  { path: "/not-found-404", component: <Cover404 /> },
  { path: "/auth-404-alt", component: <Alt404 /> },
  { path: "/auth-500", component: <Error500 /> },

  { path: "/auth-offline", component: <Offlinepage /> },

];

export { authProtectedRoutes, publicRoutes };