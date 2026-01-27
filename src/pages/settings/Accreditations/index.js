import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge,
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";

// Import FilePond for file uploads
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

// Redux thunks
import {
    getAccreditations as onGetAccreditations,
    deleteAccreditation as onDeleteAccreditation,
    createOrUpdateAccreditation as onCreateOrUpdateAccreditation
} from "../../../slices/thunks";

// Selectors
const selectAccreditationsData = createSelector(
    (state) => state.Settings,
    (accreditationsData) => accreditationsData.accreditationsData.accreditations || []
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

const AccreditationsPage = () => {
    document.title = "Accreditations | simad University";

    const dispatch = useDispatch();
    const accreditationsData = useSelector(selectAccreditationsData);

    // State management
    const [accreditations, setAccreditations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedAccreditation, setSelectedAccreditation] = useState(null);
    const [filteredAccreditations, setFilteredAccreditations] = useState([]);
    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: 'all'
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        logo: "",
        message: "",
        validity: "",
        order: 0,
        isActive: true
    });

    const [logoFiles, setLogoFiles] = useState([]);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetAccreditations());
        } catch (error) {
            console.error("Error loading accreditations:", error);
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
        const initialAccreditations = Array.isArray(accreditationsData) ? accreditationsData : [];
        setAccreditations(initialAccreditations);
        setFilteredAccreditations(initialAccreditations);
    }, [accreditationsData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        const filtered = accreditations.filter(accreditation => {
            const matchesSearch = !value ||
                accreditation.name?.toLowerCase().includes(value.toLowerCase()) ||
                accreditation.message?.toLowerCase().includes(value.toLowerCase()) ||
                accreditation.validity?.toLowerCase().includes(value.toLowerCase());

            const matchesStatus = filters.status === 'all' ||
                (filters.status === 'active' ? accreditation.isActive : !accreditation.isActive);

            return matchesSearch && matchesStatus;
        });
        setFilteredAccreditations(filtered);
    };

    // Handle select filter changes
    const handleSelectFilterChange = (name, selectedOption) => {
        setFilters(prev => ({
            ...prev,
            [name]: selectedOption?.value || "all"
        }));

        const filtered = accreditations.filter(accreditation => {
            const matchesSearch = !filters.search ||
                accreditation.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                accreditation.message?.toLowerCase().includes(filters.search.toLowerCase()) ||
                accreditation.validity?.toLowerCase().includes(filters.search.toLowerCase());

            const matchesStatus = selectedOption?.value === 'all' ||
                (selectedOption?.value === 'active' ? accreditation.isActive : !accreditation.isActive);

            return matchesSearch && matchesStatus;
        });
        setFilteredAccreditations(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle file upload for logo
    const handleLogoFileUpdate = (fileItems) => {
        setLogoFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                logo: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                logo: ""
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const requiredFields = ['name', 'message', 'validity'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            logo: "",
            message: "",
            validity: "",
            order: 0,
            isActive: true
        });
        setLogoFiles([]);
        setSelectedAccreditation(null);
    };

    // Handle modal close
    const handleModalClose = () => {
        setLogoFiles([]);
        setModal(false);
        resetForm();
    };

    // Create new accreditation
    const createAccreditation = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['name', 'message', 'validity', 'order', 'isActive'];
            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append logo file if exists
            if (formData.logo instanceof File) {
                submitData.append('logo', formData.logo);
            }

            await dispatch(onCreateOrUpdateAccreditation(submitData));

            handleModalClose();
            fetchData();
        } catch (error) {
            console.error("Error creating accreditation:", error);
        }
    };

    // Update accreditation
    const updateAccreditation = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedAccreditation) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['name', 'message', 'validity', 'order', 'isActive'];
            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append logo file if exists
            if (formData.logo instanceof File) {
                submitData.append('logo', formData.logo);
            }

            // Append ID for update
            submitData.append('_id', selectedAccreditation._id);


            await dispatch(onCreateOrUpdateAccreditation(submitData));

            handleModalClose();
            fetchData();
        } catch (error) {
            console.error("Error updating accreditation:", error);
        }
    };

    // Delete accreditation
    const deleteAccreditation = async () => {
        if (!selectedAccreditation) return;

        try {
            await dispatch(onDeleteAccreditation(selectedAccreditation._id));
            setDeleteModal(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting accreditation:", error);
        }
    };

    // Open modal for edit
    const handleEdit = (accreditation) => {
        setSelectedAccreditation(accreditation);

        setFormData({
            name: accreditation.name || "",
            logo: accreditation.logo || "",
            message: accreditation.message || "",
            validity: accreditation.validity || "",
            order: accreditation.order || 0,
            isActive: accreditation.isActive ?? true
        });

        setIsEdit(true);
        setModal(true);
    };

    // Open modal for view
    const handleView = (accreditation) => {
        setSelectedAccreditation(accreditation);
        setViewModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedAccreditation(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    // Toggle accreditation status
    const toggleAccreditationStatus = async (accreditation) => {
        try {
            const submitData = new FormData();
            submitData.append('_id', accreditation._id);
            submitData.append('name', accreditation.name);
            submitData.append('message', accreditation.message);
            submitData.append('validity', accreditation.validity);
            submitData.append('order', accreditation.order);
            submitData.append('isActive', !accreditation.isActive);

            await dispatch(onCreateOrUpdateAccreditation(submitData));

            toast.success(`Accreditation ${!accreditation.isActive ? 'activated' : 'deactivated'} successfully!`);
            fetchData();
        } catch (error) {
            console.error("Error toggling accreditation status:", error);
            toast.error("Failed to update accreditation status");
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
            name: 'Logo',
            cell: (row) => (
                <div className="avatar-md">
                    {row.logo ? (
                        <img
                            src={row.logo}
                            alt={row.name}
                            className="rounded"
                            style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                        />
                    ) : (
                        <div className="avatar-title bg-light text-secondary rounded d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                            <i className="ri-award-line fs-4" />
                        </div>
                    )}
                </div>
            ),
        },
        {
            name: 'Accreditation Name',
            selector: row => row.name,
            wrap: true,
        },
        {
            name: 'Validity',
            selector: row => row.validity,
            wrap: true,
        },
        {
            name: 'Message',
            cell: row => (
                <div className="text-truncate" style={{ maxWidth: '200px' }}>
                    {row.message}
                </div>
            ),
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
                        onClick={() => toggleAccreditationStatus(row)}
                        title={row.isActive ? 'Deactivate' : 'Activate'}
                        className="btn-icon"
                    >
                        <i className={`ri-${row.isActive ? 'pause' : 'play'}-circle-line`} />
                    </Button> */}
                    <Button
                        color="outline-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedAccreditation(row);
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
                <BreadCrumb title="Accreditations" pageTitle="University Info" />


                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Accreditations</p>
                                        <h4 className="mb-0">{accreditations.length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                <i className="ri-award-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Active Accreditations</p>
                                        <h4 className="mb-0">
                                            {accreditations.filter(acc => acc.isActive).length}
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">With Logos</p>
                                        <h4 className="mb-0">
                                            {accreditations.filter(acc => acc.logo).length}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                <i className="ri-image-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Recently Added</p>
                                        <h4 className="mb-0">
                                            {accreditations.filter(acc =>
                                                new Date(acc.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                            ).length}
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
                            <Col md={5}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Search Accreditations</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by name, message, or validity..."
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
                            <Col md={2}>
                                <Button
                                    color="light"
                                    className="w-100 mb-3"
                                    onClick={() => setFilters({
                                        search: '',
                                        status: 'all'
                                    })}
                                >
                                    <i className="ri-refresh-line me-1"></i>
                                    Reset
                                </Button>
                            </Col>
                            <Col md={2}>
                                <Button
                                    color="primary"
                                    className="w-100 mb-3"
                                    onClick={handleCreate}
                                >
                                    <i className="ri-add-line me-1"></i>
                                    Add New
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Accreditations Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-award-line align-middle me-2"></i>
                            Accreditations List
                            <Badge color="primary" className="ms-2">{filteredAccreditations.length}</Badge>
                        </h5>
                        <Button color="primary" onClick={handleCreate} className="shadow-sm">
                            <i className="ri-add-line me-1 align-middle"></i>
                            Add Accreditation
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredAccreditations}
                                pagination
                                // highlightOnHover
                                responsive
                                // striped
                                noDataComponent={
                                    <div className="text-center py-5">
                                        <i className="ri-inbox-line display-4 text-muted"></i>
                                        <h5 className="mt-3">No accreditations found</h5>
                                        <p className="text-muted">Try adjusting your search criteria or add a new accreditation.</p>
                                    </div>
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
            <Modal isOpen={modal} toggle={handleModalClose} size="xl" centered>
                <ModalHeader toggle={handleModalClose} className="bg-light">
                    <i className={`ri-${isEdit ? 'pencil' : 'add'}-line me-2`}></i>
                    {isEdit ? 'Edit Accreditation' : 'Add New Accreditation'}
                </ModalHeader>
                <Form noValidate onSubmit={isEdit ? updateAccreditation : createAccreditation}>
                    <ModalBody>
                        <Row className="g-3">
                            <Col md={12}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Accreditation Logo
                                    </Label>
                                    <FilePond
                                        files={logoFiles}
                                        onupdatefiles={handleLogoFileUpdate}
                                        allowMultiple={false}
                                        maxFiles={1}
                                        name="logo"
                                        labelIdle='<div class="text-center"><i class="ri-image-line display-4 text-muted"></i><p class="mt-2">Drag & Drop logo or <span class="filepond--label-action">Browse</span></p></div>'
                                        acceptedFileTypes={['image/*']}
                                        imagePreviewHeight={100}
                                        credits={false}
                                        className="filepond-border"
                                    />
                                    <small className="text-muted">
                                        Recommended size: 200x200px, PNG format with transparent background
                                    </small>
                                </FormGroup>

                                {/* Logo Preview */}
                                {formData.logo && !logoFiles.length && (
                                    <div className="mt-2">
                                        <Label>Current Logo:</Label>
                                        <div className="mt-1">
                                            <img
                                                src={formData.logo}
                                                alt="Current logo"
                                                className="img-thumbnail"
                                                style={{ maxHeight: '100px' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Col>

                            <Col md={12}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Accreditation Name <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter accreditation name"
                                        className="form-control-lg"
                                        required
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={10}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Validity Period <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        name="validity"
                                        value={formData.validity}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 2023-2026, Permanent, 5 Years"
                                        className="form-control-lg"
                                        required
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={2}>
                                <FormGroup>
                                    <Label className="form-label">Display Order</Label>
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
                                        Lower numbers appear first
                                    </small>
                                </FormGroup>
                            </Col>

                            <Col md={12}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Accreditation Message <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="textarea"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Enter accreditation description or message"
                                        rows="4"
                                        className="form-control-lg"
                                        required
                                    />
                                    <div className="text-end">
                                        <small className={`text-${formData.message.length > 1000 ? 'danger' : 'muted'}`}>
                                            {formData.message.length}/1000
                                        </small>
                                    </div>
                                </FormGroup>
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
                                        Activate this accreditation
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
                        <Button color="primary" type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <i className="ri-loader-4-line spin me-1"></i>
                                    {isEdit ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <i className="ri-save-line me-1"></i>
                                    {isEdit ? 'Update Accreditation' : 'Create Accreditation'}
                                </>
                            )}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" centered>
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                    <i className="ri-award-line me-2"></i>
                    Accreditation Details - {selectedAccreditation?.name}
                </ModalHeader>
                <ModalBody>
                    {selectedAccreditation && (
                        <Row className="g-4">
                            <Col md={4} className="text-center">
                                {selectedAccreditation.logo ? (
                                    <img
                                        src={selectedAccreditation.logo}
                                        alt={selectedAccreditation.name}
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '150px', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div className="avatar-title bg-light text-secondary rounded d-flex align-items-center justify-content-center mx-auto" style={{ width: '150px', height: '150px' }}>
                                        <i className="ri-award-line display-4" />
                                    </div>
                                )}
                                <h5 className="mt-3">{selectedAccreditation.name}</h5>
                                <Badge color={selectedAccreditation.isActive ? 'success' : 'danger'} className="fs-6">
                                    {selectedAccreditation.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                            </Col>
                            <Col md={8}>
                                <div className="space-y-3">
                                    <div>
                                        <small className="text-muted d-block">Validity Period</small>
                                        <h6 className="text-primary">{selectedAccreditation.validity}</h6>
                                    </div>
                                    <div>
                                        <small className="text-muted d-block">Display Order</small>
                                        <strong>{selectedAccreditation.order}</strong>
                                    </div>
                                    <div>
                                        <small className="text-muted d-block">Accreditation Message</small>
                                        <p className="mb-0">{selectedAccreditation.message}</p>
                                    </div>
                                    <div className="row mt-3">
                                        <Col sm={6}>
                                            <small className="text-muted d-block">Created</small>
                                            <strong>{new Date(selectedAccreditation.createdAt).toLocaleDateString()}</strong>
                                        </Col>
                                        <Col sm={6}>
                                            <small className="text-muted d-block">Last Updated</small>
                                            <strong>{new Date(selectedAccreditation.updatedAt).toLocaleDateString()}</strong>
                                        </Col>
                                    </div>
                                </div>
                            </Col>
                        </Row>
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
                onDeleteClick={deleteAccreditation}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText={
                    selectedAccreditation ?
                        `Are you sure you want to delete "${selectedAccreditation.name}"? This action cannot be undone and the accreditation will be permanently removed from the system.`
                        : ""
                }
            />

            <ToastContainer />
        </div>
    );
};

export default AccreditationsPage;