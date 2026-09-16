import React, { useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardHeader, Table } from 'reactstrap';
import ReactApexChart from 'react-apexcharts';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

import BreadCrumb from '../../Components/Common/BreadCrumb';
import useChartColors from '../../Components/Common/useChartColors';
import {
    getProgramsBySchool,
    getUsersByRole,
    getPartnersByCategory,
    getContentActivity,
} from '../../slices/thunks';

const BarReportCard = ({ title, chartId, data, labelKey, colors }) => {
    const chartColors = useChartColors(chartId);
    const categories = data.map((d) => d[labelKey]);
    const series = [{ name: 'Count', data: data.map((d) => d.count) }];

    return (
        <Card>
            <CardHeader><h5 className="card-title mb-0">{title}</h5></CardHeader>
            <CardBody>
                <div id={chartId} data-colors={colors} className="d-none"></div>
                {data.length === 0 ? (
                    <p className="text-muted mb-0">No data yet.</p>
                ) : (
                    <ReactApexChart
                        options={{
                            chart: { type: 'bar', toolbar: { show: false } },
                            plotOptions: { bar: { borderRadius: 4, horizontal: true } },
                            colors: chartColors,
                            xaxis: { categories },
                            dataLabels: { enabled: true },
                        }}
                        series={series}
                        type="bar"
                        height={Math.max(220, data.length * 45)}
                    />
                )}
            </CardBody>
        </Card>
    );
};

const Reports = () => {
    document.title = "Reports | Simad University";
    const dispatch = useDispatch();

    const selectReports = createSelector(
        (state) => state.Reports,
        (r) => r
    );
    const {
        programsBySchool,
        usersByRole,
        partnersByCategory,
        contentActivity,
    } = useSelector(selectReports);

    useEffect(() => {
        dispatch(getProgramsBySchool());
        dispatch(getUsersByRole());
        dispatch(getPartnersByCategory());
        dispatch(getContentActivity());
    }, [dispatch]);

    const activityColors = useChartColors("reports-content-activity");

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Reports" pageTitle="Overview" />

                <Row>
                    <Col xl={6}>
                        <BarReportCard
                            title="Programs by School"
                            chartId="reports-programs-by-school"
                            data={programsBySchool}
                            labelKey="school"
                            colors='["--vz-primary"]'
                        />
                    </Col>
                    <Col xl={6}>
                        <BarReportCard
                            title="Users by Role"
                            chartId="reports-users-by-role"
                            data={usersByRole}
                            labelKey="role"
                            colors='["--vz-info"]'
                        />
                    </Col>
                </Row>

                <Row>
                    <Col xl={6}>
                        <BarReportCard
                            title="Partners by Category"
                            chartId="reports-partners-by-category"
                            data={partnersByCategory}
                            labelKey="category"
                            colors='["--vz-warning"]'
                        />
                    </Col>
                </Row>

                <Row>
                    <Col xl={12}>
                        <Card>
                            <CardHeader><h5 className="card-title mb-0">Content Activity (last 6 months)</h5></CardHeader>
                            <CardBody>
                                <div id="reports-content-activity" data-colors='["--vz-primary", "--vz-success"]' className="d-none"></div>
                                <ReactApexChart
                                    options={{
                                        chart: { type: 'line', toolbar: { show: false } },
                                        colors: activityColors,
                                        xaxis: { categories: contentActivity.map((m) => m.month) },
                                        stroke: { curve: 'smooth', width: 3 },
                                        legend: { position: 'top' },
                                    }}
                                    series={[
                                        { name: 'News', data: contentActivity.map((m) => m.news) },
                                        { name: 'Events', data: contentActivity.map((m) => m.events) },
                                    ]}
                                    type="line"
                                    height={300}
                                />

                                <div className="table-responsive mt-3">
                                    <Table className="table-sm align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Month</th>
                                                <th>News</th>
                                                <th>Events</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contentActivity.map((m) => (
                                                <tr key={m.month}>
                                                    <td>{m.month}</td>
                                                    <td>{m.news}</td>
                                                    <td>{m.events}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Reports;
