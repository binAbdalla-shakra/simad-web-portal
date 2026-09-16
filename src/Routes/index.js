import React, { Suspense } from 'react';
import { Routes, Route } from "react-router-dom";
import { Spinner } from "reactstrap";

//Layouts
import NonAuthLayout from "../Layouts/NonAuthLayout";
import VerticalLayout from "../Layouts/index";

//routes
import { authProtectedRoutes, publicRoutes } from "./allRoutes";
import { AuthProtected } from './AuthProtected';

const RouteLoadingFallback = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <Spinner color="primary">Loading...</Spinner>
    </div>
);

const Index = () => {
    return (
        <React.Fragment>
            <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
                <Route>
                    {publicRoutes.map((route, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <NonAuthLayout>
                                    {route.component}
                                </NonAuthLayout>
                            }
                            key={idx}
                            exact={true}
                        />
                    ))}
                </Route>

                <Route>
                    {authProtectedRoutes.map((route, idx) => (
                        <Route
                            path={route.path}
                            element={
                                <AuthProtected>
                                    <VerticalLayout>{route.component}</VerticalLayout>
                                </AuthProtected>}
                            key={idx}
                            exact={true}
                        />
                    ))}
                </Route>
            </Routes>
            </Suspense>
        </React.Fragment>
    );
};

export default Index;