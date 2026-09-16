import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, Alert, Spinner
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";
import CreatableSelect from 'react-select/creatable';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import NoDataFound from "../../../Components/Common/NoDataFound";
import Loader from "../../../Components/Common/Loader";

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

// Redux thunks
import {
    getHistory as onGetHistory,
    deleteHistory as onDeleteHistory,
    createOrUpdateHistory as onCreateOrUpdateHistory
} from "../../../slices/thunks";

// Selectors
const selectHistoryData = createSelector(
    (state) => state.Settings,
    (historyData) => historyData.historyData.history || []
);

const resizeObserverErr = window.ResizeObserver;
window.ResizeObserver = class extends resizeObserverErr {
    constructor(callback) {
        super((...args) => {
            try {
                callback(...args);
            } catch (e) {
                // ignore ResizeObserver errors
            }
        });
    }
};

const HistoryPage = () => {
    document.title = "University History | simad University";

    const dispatch = useDispatch();
    const historyData = useSelector(selectHistoryData);

    // State management
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedHistory, setSelectedHistory] = useState(null);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [formAlert, setFormAlert] = useState({ show: false, message: '', type: '' });

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: 'all'
    });

    // Form state
    const [formData, setFormData] = useState({
        year: "",
        events: [""],
        order: 0,
        isActive: true
    });

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetHistory());
        } catch (error) {
            console.error("Error loading history:", error);
            toast.error("Failed to load history");
            setFormAlert({
                show: true,
                message: 'Failed to load history. Please try again.',
                type: 'danger'
            });
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Load data
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Update lists when data changes
    useEffect(() => {
        const initialHistory = Array.isArray(historyData) ? historyData : [];
        setHistory(initialHistory);
        setFilteredHistory(initialHistory);
    }, [historyData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        const filtered = history.filter(historyItem => {
            const matchesSearch = !value ||
                historyItem.year?.toLowerCase().includes(value.toLowerCase()) ||
                historyItem.events?.some(event => event.toLowerCase().includes(value.toLowerCase()));

            const matchesStatus = filters.status === 'all' ||
                (filters.status === 'active' ? historyItem.isActive : !historyItem.isActive);

            return matchesSearch && matchesStatus;
        });
        setFilteredHistory(filtered);
    };

    // Handle select filter changes
    const handleSelectFilterChange = (name, selectedOption) => {
        setFilters(prev => ({
            ...prev,
            [name]: selectedOption?.value || "all"
        }));

        const filtered = history.filter(historyItem => {
            const matchesSearch = !filters.search ||
                historyItem.year?.toLowerCase().includes(filters.search.toLowerCase()) ||
                historyItem.events?.some(event => event.toLowerCase().includes(filters.search.toLowerCase()));

            const matchesStatus = selectedOption?.value === 'all' ||
                (selectedOption?.value === 'active' ? historyItem.isActive : !historyItem.isActive);

            return matchesSearch && matchesStatus;
        });
        setFilteredHistory(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle events array changes
    const handleEventChange = (index, value) => {
        setFormData(prev => {
            const updatedEvents = [...prev.events];
            updatedEvents[index] = value;
            return {
                ...prev,
                events: updatedEvents
            };
        });
    };

    // Add new event field
    const addEventField = () => {
        setFormData(prev => ({
            ...prev,
            events: [...prev.events, ""]
        }));
    };

    // Remove event field
    const removeEventField = (index) => {
        setFormData(prev => ({
            ...prev,
            events: prev.events.filter((_, i) => i !== index)
        }));
    };

    // Validate form
    const validateForm = () => {
        const requiredFields = ['year'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Validate that at least one event is provided
        const validEvents = formData.events.filter(event => event.trim() !== '');
        if (validEvents.length === 0) {
            toast.warning('Please add at least one historical event');
            return false;
        }

        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            year: "",
            events: [""],
            order: 0,
            isActive: true
        });
        setSelectedHistory(null);
        setFormAlert({ show: false, message: '', type: '' });
    };

    // Handle modal close
    const handleModalClose = () => {
        setModal(false);
        resetForm();
    };

    // Create new history entry
    const createHistory = async (e) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['year', 'order', 'isActive'];
            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append events (only non-empty ones)
            formData.events
                .filter(event => event.trim() !== '')
                .forEach((event, index) => {
                    submitData.append(`events[${index}]`, event);
                });

            await dispatch(onCreateOrUpdateHistory(submitData)).unwrap();

            handleModalClose();
            fetchData();
        } catch (error) {
            // Failed: keep the modal open and the entered data intact so the
            // user can fix the issue and resubmit instead of losing their input.
            console.error("Error creating history entry:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update history entry
    const updateHistory = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedHistory || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['year', 'order', 'isActive'];
            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append events (only non-empty ones)
            formData.events
                .filter(event => event.trim() !== '')
                .forEach((event, index) => {
                    submitData.append(`events[${index}]`, event);
                });

            // Append ID for update
            submitData.append('_id', selectedHistory._id);

            await dispatch(onCreateOrUpdateHistory(submitData)).unwrap();

            handleModalClose();
            fetchData();
        } catch (error) {
            console.error("Error updating history entry:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete history entry
    const deleteHistory = async () => {
        if (!selectedHistory) return;

        try {
            await dispatch(onDeleteHistory(selectedHistory._id));
            setDeleteModal(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting history entry:", error);
        }
    };

    // Open modal for edit
    const handleEdit = (historyItem) => {
        setSelectedHistory(historyItem);

        setFormData({
            year: historyItem.year || "",
            events: historyItem.events?.length > 0 ? historyItem.events : [""],
            order: historyItem.order || 0,
            isActive: historyItem.isActive ?? true
        });

        setIsEdit(true);
        setModal(true);
    };

    // Open modal for view
    const handleView = (historyItem) => {
        setSelectedHistory(historyItem);
        setViewModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedHistory(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    // Toggle history status
    const toggleHistoryStatus = async (historyItem) => {
        try {
            const submitData = new FormData();
            submitData.append('_id', historyItem._id);
            submitData.append('year', historyItem.year);
            submitData.append('order', historyItem.order);
            submitData.append('isActive', !historyItem.isActive);

            // Append events
            historyItem.events.forEach((event, index) => {
                submitData.append(`events[${index}]`, event);
            });

            await dispatch(onCreateOrUpdateHistory(submitData)).unwrap();

            fetchData();
        } catch (error) {
            console.error("Error toggling history status:", error);
        }
    };

    // Status options for filter
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ];

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
        },
        {
            name: 'Year',
            selector: row => row.year,
        },
        {
            name: 'Events',
            cell: row => (
                <div>
                    {row.events?.slice(0, 2).map((event, index) => (
                        <div key={index} className="text-truncate" style={{ maxWidth: '300px' }}>
                            • {event}
                        </div>
                    ))}
                    {row.events?.length > 2 && (
                        <Badge color="info" className="mt-1">
                            +{row.events.length - 2} more events
                        </Badge>
                    )}
                </div>
            ),
            minWidth: '350px'
        },
        {
            name: 'Events Count',
            cell: row => (
                <Badge color="primary" className="px-3 py-2">
                    {row.events?.length || 0}
                </Badge>
            ),
            center: true
        },
        {
            name: 'Order',
            selector: row => row.order,
        },
        {
            name: 'Status',
            cell: row => (
                <Badge
                    color={row.isActive ? 'success' : 'danger'}
                    className="px-3 py-2"
                    style={{
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                    }}
                >
                    <i className={`ri-${row.isActive ? 'check' : 'close'}-circle-fill me-1`}></i>
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
            center: true
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-1">
                    <Button
                        color="outline-info"
                        size="sm"
                        onClick={() => handleView(row)}
                        title="View Details"
                        className="btn-icon"
                    >
                        <i className="ri-eye-line" />
                    </Button>
                    <Button
                        color="outline-primary"
                        size="sm"
                        onClick={() => handleEdit(row)}
                        title="Edit"
                        className="btn-icon"
                    >
                        <i className="ri-pencil-line" />
                    </Button>
                    {/* <Button
                        color={row.isActive ? "outline-warning" : "outline-success"}
                        size="sm"
                        onClick={() => toggleHistoryStatus(row)}
                        title={row.isActive ? 'Deactivate' : 'Activate'}
                        className="btn-icon"
                    >
                        <i className={`ri-${row.isActive ? 'pause' : 'play'}-circle-line`} />
                    </Button> */}
                    <Button
                        color="outline-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedHistory(row);
                            setDeleteModal(true);
                        }}
                        title="Delete"
                        className="btn-icon"
                    >
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="University History" pageTitle="University Info" />

                {/* Alert */}
                {formAlert.show && (
                    <Alert color={formAlert.type} className="mb-3">
                        {formAlert.message}
                    </Alert>
                )}

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Years</p>
                                        <h4 className="mb-0">{history.length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                <i className="ri-calendar-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Active Years</p>
                                        <h4 className="mb-0">
                                            {history.filter(item => item.isActive).length}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                                                <i className="ri-checkbox-circle-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Events</p>
                                        <h4 className="mb-0">
                                            {history.reduce((total, item) => total + (item.events?.length || 0), 0)}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                <i className="ri-list-check"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Timeline Span</p>
                                        <h4 className="mb-0">
                                            {history.length > 0 ?
                                                `${Math.min(...history.map(h => parseInt(h.year)))} - ${Math.max(...history.map(h => parseInt(h.year)))}`
                                                : 'N/A'
                                            }
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                                                <i className="ri-time-line"></i>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>

                {/* Filter Controls */}
                <Card className="mb-4">
                    <CardBody className="p-3">
                        <Row className="g-3 align-items-end">
                            <Col md={6}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Search History</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by year or events..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Status</Label>
                                    <Select
                                        options={statusOptions}
                                        value={statusOptions.find(opt => opt.value === filters.status)}
                                        onChange={(opt) => handleSelectFilterChange('status', opt)}
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={1}>
                                <Button
                                    color="light"
                                    className="w-100 mb-3"
                                    onClick={() => setFilters({
                                        search: '',
                                        status: 'all'
                                    })}
                                >
                                    <i className="ri-refresh-line"></i>
                                </Button>
                            </Col>
                            <Col md={2}>
                                <Button
                                    color="primary"
                                    className="w-100 mb-3"
                                    onClick={handleCreate}
                                >
                                    <i className="ri-add-line me-1"></i>
                                    Add Year
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* History Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-history-line align-middle me-2"></i>
                            University History Timeline
                            <Badge color="primary" className="ms-2">{filteredHistory.length}</Badge>
                        </h5>
                        <Button color="primary" onClick={handleCreate} className="shadow-sm">
                            <i className="ri-add-line me-1 align-middle"></i>
                            Add Historical Year
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredHistory}
                                pagination
                                // highlightOnHover
                                responsive
                                // striped
                                noDataComponent={
                                    <NoDataFound title="No history entries found" message="Try adjusting your search criteria or add a new historical year." />
                                }
                                customStyles={{
                                    headCells: {
                                        style: {
                                            // backgroundColor: '#f8f9fa',
                                            fontWeight: '600',
                                            fontSize: '0.875rem',
                                        },
                                    },
                                    cells: {
                                        style: {
                                            fontSize: '0.875rem',
                                            padding: '12px 8px',
                                        },
                                    },
                                }}
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={handleModalClose} size="lg" centered>
                <ModalHeader toggle={handleModalClose} className="bg-light">
                    <i className={`ri-${isEdit ? 'pencil' : 'add'}-line me-2`}></i>
                    {isEdit ? 'Edit History Entry' : 'Add New History Entry'}
                </ModalHeader>
                <Form noValidate onSubmit={isEdit ? updateHistory : createHistory}>
                    <ModalBody>
                        <Row className="g-3">
                            <Col md={6}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Year <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        name="year"
                                        value={formData.year}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 1999, 2005, 2020"
                                        className="form-control-lg"
                                        required
                                    />
                                    <small className="text-muted">
                                        Enter the year when these events occurred
                                    </small>
                                </FormGroup>
                            </Col>

                            <Col md={6}>
                                <FormGroup>
                                    <Label className="form-label">Display Order <span className="text-muted fs-12">(optional)</span></Label>
                                    <Input
                                        type="number"
                                        name="order"
                                        value={formData.order}
                                        onChange={handleInputChange}
                                        min="0"
                                        placeholder="0"
                                        className="form-control-lg"
                                    />
                                    <small className="text-muted">
                                        Lower numbers appear first in timeline
                                    </small>
                                </FormGroup>
                            </Col>

                            <Col md={12}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Label className="form-label mb-0">
                                        Historical Events <span className="text-danger">*</span>
                                    </Label>
                                    <Button
                                        color="light"
                                        size="sm"
                                        onClick={addEventField}
                                        type="button"
                                    >
                                        <i className="ri-add-line me-1"></i>
                                        Add Event
                                    </Button>
                                </div>

                                {formData.events.map((event, index) => (
                                    <div key={index} className="d-flex gap-2 mb-2 align-items-start">
                                        <div className="flex-grow-1">
                                            <Input
                                                value={event}
                                                onChange={(e) => handleEventChange(index, e.target.value)}
                                                placeholder="e.g., Simad University officially opened its doors"
                                                className="form-control-lg"
                                            />
                                        </div>
                                        {formData.events.length > 1 && (
                                            <Button
                                                color="outline-danger"
                                                size="sm"
                                                onClick={() => removeEventField(index)}
                                                className="mt-1"
                                                type="button"
                                            >
                                                <i className="ri-delete-bin-line" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <small className="text-muted">
                                    Add significant events that happened in this year
                                </small>
                            </Col>

                            <Col md={12}>
                                <FormGroup check>
                                    <Input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        id="isActive"
                                    />
                                    <Label for="isActive" check className="fw-medium">
                                        <i className="ri-checkbox-circle-line me-1"></i>
                                        Show this year in the timeline
                                    </Label>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <Button color="light" onClick={handleModalClose} className="me-2">
                            <i className="ri-close-line me-1"></i>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner size="sm" className="me-1" /> : <i className="ri-save-line me-1"></i>}
                            {isSubmitting ? 'Saving...' : (isEdit ? 'Update History' : 'Create History')}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" centered>
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                    <i className="ri-history-line me-2"></i>
                    History Details - {selectedHistory?.year}
                </ModalHeader>
                <ModalBody>
                    {selectedHistory && (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <div className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle display-4 mb-2" style={{ width: '80px', height: '80px', lineHeight: '80px', margin: '0 auto' }}>
                                    {selectedHistory.year}
                                </div>
                                <h4 className="mb-1">{selectedHistory.year}</h4>
                                <div className="d-flex justify-content-center gap-2">
                                    <Badge color={selectedHistory.isActive ? 'success' : 'danger'} className="fs-6">
                                        {selectedHistory.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <Badge color="info" className="fs-6">
                                        Order: {selectedHistory.order}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h6 className="text-primary mb-3">
                                    <i className="ri-list-check me-2"></i>
                                    Historical Events ({selectedHistory.events?.length || 0})
                                </h6>
                                <div className="space-y-2">
                                    {selectedHistory.events?.map((event, index) => (
                                        <Card key={index} className="border">
                                            <CardBody className="py-3">
                                                <div className="d-flex align-items-start">
                                                    <div className="flex-shrink-0">
                                                        <div className="avatar-xs">
                                                            <div className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle">
                                                                {index + 1}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex-grow-1 ms-3">
                                                        <p className="mb-0">{event}</p>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    ))}
                                </div>
                            </div>

                            <hr />

                            <div className="row">
                                <Col sm={6}>
                                    <small className="text-muted d-block">Created</small>
                                    <strong>{new Date(selectedHistory.createdAt).toLocaleDateString()}</strong>
                                </Col>
                                <Col sm={6}>
                                    <small className="text-muted d-block">Last Updated</small>
                                    <strong>{new Date(selectedHistory.updatedAt).toLocaleDateString()}</strong>
                                </Col>
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={() => setViewModal(false)} className="d-flex align-items-center">
                        <i className="ri-close-line me-2"></i>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteHistory}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText={
                    selectedHistory ?
                        `Are you sure you want to delete the history entry for ${selectedHistory.year}? This action cannot be undone and all events from this year will be permanently removed.`
                        : ""
                }
            />

            <ToastContainer />
        </div>
    );
};

export default HistoryPage;