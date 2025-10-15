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
    getSenateMembers as onGetSenateMembers,
    deleteSenateMember as onDeleteSenateMember,
    createOrUpdateSenateMember as onCreateOrUpdateSenateMember
} from "../../../slices/thunks";

// Selectors
const selectSenateData = createSelector(
    (state) => state.Settings,
    (senateData) => senateData.senateData.senates || []
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

const SenatePage = () => {
    document.title = "Senate Members | simad University";

    const dispatch = useDispatch();
    const senateData = useSelector(selectSenateData);

    // State management
    const [senateMembers, setSenateMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [filteredMembers, setFilteredMembers] = useState([]);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        position: '',
        status: 'all'
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        position: "",
        image: "",
        message: "",
        bio: "",
        order: 0,
        isActive: true
    });

    const [imageFiles, setImageFiles] = useState([]);

    // Position options
    const positionOptions = [
        { value: '', label: 'All Positions' },
        { value: 'The Rector', label: 'The Rector' },
        { value: 'Senior Adviser of the Rector', label: 'Senior Adviser of the Rector' },
        { value: 'Deputy Rector for Student Affairs', label: 'Deputy Rector for Student Affairs' },
        { value: 'Deputy Rector for Admin & Finance', label: 'Deputy Rector for Admin & Finance' },
        { value: 'Deputy Rector for Institutional Development', label: 'Deputy Rector for Institutional Development' }
    ];

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetSenateMembers());
        } catch (error) {
            console.error("Error loading senate members:", error);

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
        const initialMembers = Array.isArray(senateData) ? senateData : [];
        setSenateMembers(initialMembers);
        setFilteredMembers(initialMembers);
    }, [senateData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        applyFilters({ ...filters, [name]: value });
    };

    // Handle select filter changes
    const handleSelectFilterChange = (name, selectedOption) => {
        const newFilters = {
            ...filters,
            [name]: selectedOption?.value || ""
        };
        setFilters(newFilters);
        applyFilters(newFilters);
    };

    // Apply all filters
    const applyFilters = (filterState) => {
        const filtered = senateMembers.filter(member => {
            const matchesSearch = !filterState.search ||
                member.name?.toLowerCase().includes(filterState.search.toLowerCase()) ||
                member.position?.toLowerCase().includes(filterState.search.toLowerCase()) ||
                member.message?.toLowerCase().includes(filterState.search.toLowerCase());

            const matchesPosition = !filterState.position ||
                member.position === filterState.position;

            const matchesStatus = filterState.status === 'all' ||
                (filterState.status === 'active' ? member.isActive : !member.isActive);

            return matchesSearch && matchesPosition && matchesStatus;
        });
        setFilteredMembers(filtered);
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
        const requiredFields = ['name', 'position', 'message', 'bio'];
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
            position: "",
            image: "",
            message: "",
            bio: "",
            order: 0,
            isActive: true
        });
        setImageFiles([]);
        setSelectedMember(null);
    };

    // Handle modal close
    const handleModalClose = () => {
        setImageFiles([]);
        setModal(false);
        resetForm();
    };

    // Create new senate member
    const createSenateMember = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['name', 'position', 'message', 'bio', 'order', 'isActive'];
            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append image file if exists
            if (formData.image instanceof File) {
                submitData.append('image', formData.image);
            }

            await dispatch(onCreateOrUpdateSenateMember(submitData));

            handleModalClose();
            fetchData();
        } catch (error) {
            console.error("Error creating senate member:", error);
        }
    };

    // Update senate member
    const updateSenateMember = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedMember) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['name', 'position', 'message', 'bio', 'order', 'isActive'];
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
            submitData.append('_id', selectedMember._id);

            await dispatch(onCreateOrUpdateSenateMember(submitData));

            handleModalClose();
            fetchData();
        } catch (error) {
            console.error("Error updating senate member:", error);
        }
    };

    // Delete senate member
    const deleteSenateMember = async () => {
        if (!selectedMember) return;

        try {
            await dispatch(onDeleteSenateMember(selectedMember._id));
            setDeleteModal(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting senate member:", error);
        }
    };

    // Open modal for edit
    const handleEdit = (member) => {
        setSelectedMember(member);

        setFormData({
            name: member.name || "",
            position: member.position || "",
            image: member.image || "",
            message: member.message || "",
            bio: member.bio || "",
            order: member.order || 0,
            isActive: member.isActive ?? true
        });

        setIsEdit(true);
        setModal(true);
    };

    // Open modal for view
    const handleView = (member) => {
        setSelectedMember(member);
        setViewModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedMember(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    // Toggle member status
    const toggleMemberStatus = async (member) => {
        try {
            const submitData = new FormData();
            submitData.append('_id', member._id);
            submitData.append('name', member.name);
            submitData.append('position', member.position);
            submitData.append('message', member.message);
            submitData.append('bio', member.bio);
            submitData.append('order', member.order);
            submitData.append('isActive', !member.isActive);

            await dispatch(onCreateOrUpdateSenateMember(submitData));

            fetchData();
        } catch (error) {
            console.error("Error toggling senate member status:", error);
        }
    };

    // Status options for filter
    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
    ];


    // Get position badge color
    const getPositionColor = (position) => {
        const colors = {
            'The Rector': 'success',
            'Senior Adviser of the Rector': 'primary',
            'Deputy Rector for Student Affairs': 'info',
            'Deputy Rector for Admin & Finance': 'warning',
            'Deputy Rector for Institutional Development': 'light'
        };
        return colors[position] || 'secondary';
    };

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
        },
        {
            name: 'Photo',
            cell: (row) => (
                <div className="avatar-md">
                    {row.image ? (
                        <img
                            src={row.image}
                            alt={row.name}
                            className="rounded-circle"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="avatar-title bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                            <i className="ri-user-line fs-4" />
                        </div>
                    )}
                </div>
            ),
        },
        {
            name: 'Name',
            selector: row => row.name,
            wrap: true,
        },
        {
            name: 'Position',
            cell: row => (
                <Badge
                    color={getPositionColor(row.position)}
                    className="px-3 py-2"
                    style={{
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                    }}
                >
                    {row.position}
                </Badge>
            ),
            minWidth: '300px'
        },
        // {
        //     name: 'Message',
        //     cell: row => (
        //         <div className="text-truncate" style={{ maxWidth: '200px' }}>
        //             {row.message}
        //         </div>
        //     ),
        // },
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
                        onClick={() => toggleMemberStatus(row)}
                        title={row.isActive ? 'Deactivate' : 'Activate'}
                        className="btn-icon"
                    >
                        <i className={`ri-${row.isActive ? 'pause' : 'play'}-circle-line`} />
                    </Button> */}
                    <Button
                        color="outline-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedMember(row);
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
                <BreadCrumb title="Senate Members" pageTitle="University Governance" />



                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Members</p>
                                        <h4 className="mb-0">{senateMembers.length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                <i className="ri-team-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Active Members</p>
                                        <h4 className="mb-0">
                                            {senateMembers.filter(member => member.isActive).length}
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Leadership</p>
                                        <h4 className="mb-0">
                                            {senateMembers.filter(member =>
                                                ['Chancellor', 'Vice Chancellor', 'Dean', 'Director'].includes(member.position)
                                            ).length}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                <i className="ri-user-star-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">With Photos</p>
                                        <h4 className="mb-0">
                                            {senateMembers.filter(member => member.image).length}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                                                <i className="ri-image-line"></i>
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
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Search Members</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by name, position, or message..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Position</Label>
                                    <Select
                                        options={positionOptions}
                                        value={positionOptions.find(opt => opt.value === filters.position)}
                                        onChange={(opt) => handleSelectFilterChange('position', opt)}
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
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
                                        position: '',
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
                                    Add Member
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Senate Members Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-team-line align-middle me-2"></i>
                            Senate Members List
                            <Badge color="primary" className="ms-2">{filteredMembers.length}</Badge>
                        </h5>
                        <Button color="primary" onClick={handleCreate} className="shadow-sm">
                            <i className="ri-add-line me-1 align-middle"></i>
                            Add Senate Member
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredMembers}
                                pagination
                                // highlightOnHover
                                responsive
                                // striped
                                noDataComponent={
                                    <div className="text-center py-5">
                                        <i className="ri-inbox-line display-4 text-muted"></i>
                                        <h5 className="mt-3">No senate members found</h5>
                                        <p className="text-muted">Try adjusting your search criteria or add a new senate member.</p>
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
                    {isEdit ? 'Edit Senate Member' : 'Add New Senate Member'}
                </ModalHeader>
                <Form noValidate onSubmit={isEdit ? updateSenateMember : createSenateMember}>
                    <ModalBody>
                        <Row className="g-3">
                            <Col md={12}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Member Photo
                                    </Label>
                                    <FilePond
                                        files={imageFiles}
                                        onupdatefiles={handleImageFileUpdate}
                                        allowMultiple={false}
                                        maxFiles={1}
                                        name="image"
                                        labelIdle='<div class="text-center"><i class="ri-user-line display-4 text-muted"></i><p class="mt-2">Drag & Drop photo or <span class="filepond--label-action">Browse</span></p></div>'
                                        acceptedFileTypes={['image/*']}
                                        imagePreviewHeight={150}
                                        credits={false}
                                        className="filepond-border"
                                    />
                                    <small className="text-muted">
                                        Recommended size: 400x400px, JPG or PNG format
                                    </small>
                                </FormGroup>

                                {/* Image Preview */}
                                {formData.image && !imageFiles.length && (
                                    <div className="mt-2">
                                        <Label>Current Photo:</Label>
                                        <div className="mt-1">
                                            <img
                                                src={formData.image}
                                                alt="Current member"
                                                className="img-thumbnail rounded-circle"
                                                style={{ maxHeight: '150px' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </Col>

                            <Col md={6}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Full Name <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        className="form-control-lg"
                                        required
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={4}>
                                <FormGroup>
                                    <Label className="form-label">
                                        Position <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="select"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleInputChange}
                                        className="form-control-lg"
                                        required
                                    >
                                        <option value="">Select Position</option>
                                        {positionOptions.filter(opt => opt.value).map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Input>
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
                                        Welcome Message <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="textarea"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Enter a brief welcome or leadership message"
                                        rows="3"
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
                                <FormGroup>
                                    <Label className="form-label">
                                        Biography <span className="text-danger">*</span>
                                    </Label>
                                    <Input
                                        type="textarea"
                                        name="bio"
                                        value={formData.bio}
                                        onChange={handleInputChange}
                                        placeholder="Enter detailed biography, qualifications, and achievements"
                                        rows="5"
                                        className="form-control-lg"
                                        required
                                    />
                                    <div className="text-end">
                                        <small className={`text-${formData.bio.length > 2000 ? 'danger' : 'muted'}`}>
                                            {formData.bio.length}/2000
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
                                        Activate this member
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
                                    {isEdit ? 'Update Member' : 'Create Member'}
                                </>
                            )}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl" centered>
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                    <i className="ri-user-line me-2"></i>
                    Senate Member Details - {selectedMember?.name}
                </ModalHeader>
                <ModalBody>
                    {selectedMember && (
                        <Row className="g-4">
                            <Col md={4} className="text-center">
                                {selectedMember.image ? (
                                    <img
                                        src={selectedMember.image}
                                        alt={selectedMember.name}
                                        className="img-fluid rounded-circle"
                                        style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="avatar-title bg-light text-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '200px', height: '200px' }}>
                                        <i className="ri-user-line display-1" />
                                    </div>
                                )}
                                <h4 className="mt-3 mb-1">{selectedMember.name}</h4>
                                <Badge color={getPositionColor(selectedMember.position)} className="fs-6 mb-2">
                                    {selectedMember.position}
                                </Badge>
                                <Badge color={selectedMember.isActive ? 'success' : 'danger'} className="fs-6 ms-2">
                                    {selectedMember.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <div className="mt-2">
                                    <small className="text-muted">Display Order: {selectedMember.order}</small>
                                </div>
                            </Col>
                            <Col md={8}>
                                <div className="space-y-4">
                                    <div>
                                        <h6 className="text-primary mb-2">
                                            <i className="ri-chat-quote-line me-2"></i>
                                            Welcome Message
                                        </h6>
                                        <p className="mb-0 fst-italic">"{selectedMember.message}"</p>
                                    </div>

                                    <div>
                                        <h6 className="text-primary mb-2">
                                            <i className="ri-file-text-line me-2"></i>
                                            Biography
                                        </h6>
                                        <p className="mb-0">{selectedMember.bio}</p>
                                    </div>

                                    <hr />

                                    <div className="row">
                                        <Col sm={6}>
                                            <small className="text-muted d-block">Created</small>
                                            <strong>{new Date(selectedMember.createdAt).toLocaleDateString()}</strong>
                                        </Col>
                                        <Col sm={6}>
                                            <small className="text-muted d-block">Last Updated</small>
                                            <strong>{new Date(selectedMember.updatedAt).toLocaleDateString()}</strong>
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
                onDeleteClick={deleteSenateMember}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText={
                    selectedMember ?
                        `Are you sure you want to delete "${selectedMember.name}"? This action cannot be undone and the senate member will be permanently removed from the system.`
                        : ""
                }
            />

            <ToastContainer />
        </div>
    );
};

export default SenatePage;