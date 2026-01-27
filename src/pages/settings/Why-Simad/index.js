import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, Alert
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
    getWhySimad as onGetWhySimad,
    deleteWhySimad as onDeleteWhySimad,
    createOrUpdateWhySimad as onCreateOrUpdateWhySimad
} from "../../../slices/thunks";

// Selectors
const selectWhySimadData = createSelector(
    (state) => state.Settings,
    (whySimadData) => whySimadData.whySimadData.reasons || []
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

const WhySimadPage = () => {
    document.title = "Why SIMAD | simad University";

    const dispatch = useDispatch();
    const whySimadData = useSelector(selectWhySimadData);

    // State management
    const [reasons, setReasons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedReason, setSelectedReason] = useState(null);
    const [filteredReasons, setFilteredReasons] = useState([]);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: 'all'
    });

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        image: "",
        order: 0,
        isActive: true
    });

    const [imageFiles, setImageFiles] = useState([]);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetWhySimad());
        } catch (error) {
            console.error("Error loading reasons:", error);

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
        const initialReasons = Array.isArray(whySimadData) ? whySimadData : [];
        setReasons(initialReasons);
        setFilteredReasons(initialReasons);
    }, [whySimadData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        const filtered = reasons.filter(reason => {
            const matchesSearch = !value ||
                reason.title?.toLowerCase().includes(value.toLowerCase()) ||
                reason.description?.toLowerCase().includes(value.toLowerCase());

            const matchesStatus = filters.status === 'all' ||
                (filters.status === 'active' ? reason.isActive : !reason.isActive);

            return matchesSearch && matchesStatus;
        });
        setFilteredReasons(filtered);
    };

    // Handle select filter changes
    const handleSelectFilterChange = (name, selectedOption) => {
        setFilters(prev => ({
            ...prev,
            [name]: selectedOption?.value || "all"
        }));

        const filtered = reasons.filter(reason => {
            const matchesSearch = !filters.search ||
                reason.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
                reason.description?.toLowerCase().includes(filters.search.toLowerCase());

            const matchesStatus = selectedOption?.value === 'all' ||
                (selectedOption?.value === 'active' ? reason.isActive : !reason.isActive);

            return matchesSearch && matchesStatus;
        });
        setFilteredReasons(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle file upload for image
    const handleImageFileUpdate = (fileItems) => {
        setImageFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                image: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                image: ""
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const requiredFields = ['title', 'description'];
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
            title: "",
            description: "",
            image: "",
            order: 0,
            isActive: true
        });
        setImageFiles([]);
        setSelectedReason(null);
    };

    // Handle modal close
    const handleModalClose = () => {
        setImageFiles([]);
        setModal(false);
        resetForm();
    };

    // Create new reason
    const createReason = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['title', 'description', 'order', 'isActive'];
            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append image file if exists
            if (formData.image instanceof File) {
                submitData.append('image', formData.image);
            }

            await dispatch(onCreateOrUpdateWhySimad(submitData));

            handleModalClose();
            fetchData();
        } catch (error) {
            console.error("Error creating reason:", error);
        }
    };

    // Update reason
    const updateReason = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedReason) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['title', 'description', 'order', 'isActive'];
            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append image file if exists
            if (formData.image instanceof File) {
                submitData.append('image', formData.image);
            }

            // Append ID for update
            submitData.append('_id', selectedReason._id);

            await dispatch(onCreateOrUpdateWhySimad(submitData));

            handleModalClose();
            fetchData();
        } catch (error) {
            console.error("Error updating reason:", error);
        }
    };

    // Delete reason
    const deleteReason = async () => {
        if (!selectedReason) return;

        try {
            await dispatch(onDeleteWhySimad(selectedReason._id));
            setDeleteModal(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting reason:", error);
        }
    };

    // Open modal for edit
    const handleEdit = (reason) => {
        setSelectedReason(reason);

        setFormData({
            title: reason.title || "",
            description: reason.description || "",
            image: reason.image || "",
            order: reason.order || 0,
            isActive: reason.isActive ?? true
        });

        setIsEdit(true);
        setModal(true);
    };

    // Open modal for view
    const handleView = (reason) => {
        setSelectedReason(reason);
        setViewModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedReason(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    // Toggle reason status
    const toggleReasonStatus = async (reason) => {
        try {
            const submitData = new FormData();
            submitData.append('_id', reason._id);
            submitData.append('title', reason.title);
            submitData.append('description', reason.description);
            submitData.append('order', reason.order);
            submitData.append('isActive', !reason.isActive);

            await dispatch(onCreateOrUpdateWhySimad(submitData));

            fetchData();
        } catch (error) {
            console.error("Error toggling reason status:", error);
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
            name: 'Image',
            cell: (row) => (
                <div className="avatar-md">
                    {row.image ? (
                        <img
                            src={row.image}
                            alt={row.title}
                            className="rounded"
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="avatar-title bg-light text-secondary rounded d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                            <i className="ri-star-line fs-4" />
                        </div>
                    )}
                </div>
            ),
        },
        {
            name: 'Title',
            selector: row => row.title,
            wrap: true,
        },
        {
            name: 'Description',
            cell: row => (
                <div className="text-truncate" style={{ maxWidth: '300px' }}>
                    {row.description}
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
                        onClick={() => toggleReasonStatus(row)}
                        title={row.isActive ? 'Deactivate' : 'Activate'}
                        className="btn-icon"
                    >
                        <i className={`ri-${row.isActive ? 'pause' : 'play'}-circle-line`} />
                    </Button> */}
                    <Button
                        color="outline-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedReason(row);
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
                <BreadCrumb title="Why SIMAD" pageTitle="University Info" />



                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Reasons</p>
                                        <h4 className="mb-0">{reasons.length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                <i className="ri-star-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Active Reasons</p>
                                        <h4 className="mb-0">
                                            {reasons.filter(reason => reason.isActive).length}
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">With Images</p>
                                        <h4 className="mb-0">
                                            {reasons.filter(reason => reason.image).length}
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
                                            {reasons.filter(reason =>
                                                new Date(reason.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
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
                            <Col md={6}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Search Reasons</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by title or description..."
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
                                    Add Reason
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Reasons Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-star-line align-middle me-2"></i>
                            Why Choose SIMAD - Reasons List
                            <Badge color="primary" className="ms-2">{filteredReasons.length}</Badge>
                        </h5>
                        <Button color="primary" onClick={handleCreate} className="shadow-sm">
                            <i className="ri-add-line me-1 align-middle"></i>
                            Add New Reason
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredReasons}
                                pagination
                                // highlightOnHover
                                responsive
                                // striped
                                noDataComponent={
                                    <div className="text-center py-5">
                                        <i className="ri-inbox-line display-4 text-muted"></i>
                                        <h5 className="mt-3">No reasons found</h5>
                                        <p className="text-muted">Try adjusting your search criteria or add a new reason.</p>
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
                    {isEdit ? 'Edit Reason' : 'Add New Reason'}
                </ModalHeader>
                <Form noValidate onSubmit={isEdit ? updateReason : createReason}>
                    <ModalBody>
                        <Row className="g-3">
                            <Col md={12}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Reason Image
                                    </Label>
                                    <FilePond
                                        files={imageFiles}
                                        onupdatefiles={handleImageFileUpdate}
                                        allowMultiple={false}
                                        maxFiles={1}
                                        name="image"
                                        labelIdle='<div class="text-center"><i class="ri-image-line display-4 text-muted"></i><p class="mt-2">Drag & Drop image or <span class="filepond--label-action">Browse</span></p></div>'
                                        acceptedFileTypes={['image/*']}
                                        imagePreviewHeight={150}
                                        credits={false}
                                        className="filepond-border"
                                    />
                                    <small className="text-muted">
                                        Recommended size: 600x400px, JPG or PNG format
                                    </small>
                                </FormGroup>

                                {/* Image Preview */}
                                {formData.image && !imageFiles.length && (
                                    <div className="mt-2">
                                        <Label>Current Image:</Label>
                                        <div className="mt-1">
                                            <img
                                                src={formData.image}
                                                alt="Current reason"
                                                className="img-thumbnail"
                                                style={{ maxHeight: '150px' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Col>

                            <Col md={10}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Reason Title <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Quality Education, Expert Faculty, Modern Facilities"
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
                                        Description <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="textarea"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe why this makes SIMAD University special..."
                                        rows="5"
                                        className="form-control-lg"
                                        required
                                    />
                                    <div className="text-end">
                                        <small className={`text-${formData.description.length > 500 ? 'danger' : 'muted'}`}>
                                            {formData.description.length}/500
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
                                        Show this reason on the website
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
                        <Button color="primary" type="submit">
                            <i className="ri-save-line me-1"></i>
                            {isEdit ? 'Update Reason' : 'Create Reason'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg" centered>
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                    <i className="ri-star-line me-2"></i>
                    Reason Details - {selectedReason?.title}
                </ModalHeader>
                <ModalBody>
                    {selectedReason && (
                        <Row className="g-4">
                            <Col md={4} className="text-center">
                                {selectedReason.image ? (
                                    <img
                                        src={selectedReason.image}
                                        alt={selectedReason.title}
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="avatar-title bg-light text-secondary rounded d-flex align-items-center justify-content-center mx-auto" style={{ width: '200px', height: '200px' }}>
                                        <i className="ri-star-line display-1" />
                                    </div>
                                )}
                                <h5 className="mt-3">{selectedReason.title}</h5>
                                <Badge color={selectedReason.isActive ? 'success' : 'danger'} className="fs-6">
                                    {selectedReason.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <div className="mt-2">
                                    <small className="text-muted">Display Order: {selectedReason.order}</small>
                                </div>
                            </Col>
                            <Col md={8}>
                                <div className="space-y-3">
                                    <div>
                                        <h6 className="text-primary mb-2">
                                            <i className="ri-file-text-line me-2"></i>
                                            Description
                                        </h6>
                                        <p className="mb-0">{selectedReason.description}</p>
                                    </div>

                                    <hr />

                                    <div className="row">
                                        <Col sm={6}>
                                            <small className="text-muted d-block">Created</small>
                                            <strong>{new Date(selectedReason.createdAt).toLocaleDateString()}</strong>
                                        </Col>
                                        <Col sm={6}>
                                            <small className="text-muted d-block">Last Updated</small>
                                            <strong>{new Date(selectedReason.updatedAt).toLocaleDateString()}</strong>
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
                onDeleteClick={deleteReason}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText={
                    selectedReason ?
                        `Are you sure you want to delete "${selectedReason.title}"? This action cannot be undone and the reason will be permanently removed from the website.`
                        : ""
                }
            />

            <ToastContainer />
        </div>
    );
};

export default WhySimadPage;