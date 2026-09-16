import React, { useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, Spinner } from 'reactstrap';
import ReactApexChart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { Link } from 'react-router-dom';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import useChartColors from '../../Components/Common/useChartColors';
import { getDashboardStats } from '../../slices/thunks';

const StatCard = ({ title, value, icon, link, color = "primary" }) => (
    <Col xl={3} md={6}>
        <Card className="card-animate">
            <CardBody>
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">{title}</p>
                        <h4 className="fs-22 fw-semibold ff-secondary mb-0 mt-1">{value ?? 0}</h4>
                    </div>
                    <div className="avatar-sm flex-shrink-0">
                        <span className={`avatar-title bg-${color}-subtle text-${color} rounded-circle fs-3`}>
                            <i className={icon}></i>
                        </span>
                    </div>
                </div>
                {/* {link && (
                    <div className="mt-3">
                        <Link to={link} className="text-decoration-underline">View details</Link>
                    </div>
                )} */}
            </CardBody>
        </Card>
    </Col>
);

const Dashboard = () => {
    document.title = "Dashboard | Simad University";
    const dispatch = useDispatch();

    const selectDashboard = createSelector(
        (state) => state.Dashboard,
        (dashboard) => ({ statsData: dashboard.statsData, loading: dashboard.loading })
    );
    const { statsData, loading } = useSelector(selectDashboard);

    useEffect(() => {
        dispatch(getDashboardStats());
    }, [dispatch]);

    const counts = statsData?.counts || {};
    const recentNews = statsData?.recentActivity?.news || [];
    const recentEvents = statsData?.recentActivity?.events || [];

    const donutColors = useChartColors("dashboard-content-donut");

    const donutSeries = [
        counts.programs || 0,
        counts.staff || 0,
        counts.news || 0,
        counts.events || 0,
        counts.facilities || 0,
        counts.partners || 0,
    ];
    const donutOptions = {
        chart: { type: "donut", height: 320 },
        labels: ["Programs", "Staff", "News", "Events", "Facilities", "Partners"],
        colors: donutColors,
        legend: { position: "bottom" },
        dataLabels: { enabled: true },
    };

    return (
        <div className="page-content">
            <div id="dashboard-content-donut" data-colors='["--vz-primary", "--vz-success", "--vz-warning", "--vz-info", "--vz-danger", "--vz-secondary"]' className="d-none"></div>
            <Container fluid>
                <BreadCrumb title="Dashboard" pageTitle="Overview" />

                {loading && !statsData ? (
                    <div className="d-flex justify-content-center my-5">
                        <Spinner color="primary">Loading...</Spinner>
                    </div>
                ) : (
                    <>
                        <Row>
                            <StatCard title="Schools" value={counts.schools} icon="ri-building-line" link="/setup/schools" color="primary" />
                            <StatCard title="Programs" value={counts.programs} icon="ri-graduation-cap-line" link="/setup/programs" color="secondary" />
                            <StatCard title="Institutions" value={counts.institutions} icon="ri-government-line" link="/setup/institutions" color="info" />
                            <StatCard title="Staff" value={counts.staff} icon="ri-team-line" link="/setup/staffs" color="success" />
                        </Row>
                        <Row>
                            <StatCard title="Partners" value={counts.partners} icon="ri-handshake-line" link="/setup/partners" color="warning" />
                            <StatCard title="Events" value={counts.events} icon="ri-calendar-event-line" link="/content/events" color="danger" />
                            <StatCard title="News" value={counts.news} icon="ri-file-list-3-line" link="/content/news" color="primary" />
                            <StatCard title="Active Users" value={counts.activeUsers} icon="ri-user-settings-line" link="/setting-users" color="secondary" />
                        </Row>

                        <Row>
                            <Col xl={6}>
                                <Card>
                                    <CardBody>
                                        <h5 className="card-title mb-3">Content Distribution</h5>
                                        <ReactApexChart
                                            options={donutOptions}
                                            series={donutSeries}
                                            type="donut"
                                            height={320}
                                        />
                                    </CardBody>
                                </Card>
                            </Col>
                            <Col xl={6}>
                                <Card>
                                    <CardBody>
                                        <h5 className="card-title mb-3">Recent News</h5>
                                        {recentNews.length === 0 ? (
                                            <p className="text-muted mb-0">No news published yet.</p>
                                        ) : (
                                            <ul className="list-unstyled mb-4">
                                                {recentNews.map((item) => (
                                                    <li key={item._id} className="d-flex justify-content-between border-bottom py-2">
                                                        <span>{item.title}</span>
                                                        <span className="text-muted fs-13">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}

                                        <h5 className="card-title mb-3">Recent Events</h5>
                                        {recentEvents.length === 0 ? (
                                            <p className="text-muted mb-0">No events created yet.</p>
                                        ) : (
                                            <ul className="list-unstyled mb-0">
                                                {recentEvents.map((item) => (
                                                    <li key={item._id} className="d-flex justify-content-between border-bottom py-2">
                                                        <span>{item.title}</span>
                                                        <span className="text-muted fs-13">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </CardBody>
                                </Card>
                            </Col>
                        </Row>
                    </>
                )}
            </Container>
        </div>
    );
};

export default Dashboard;
