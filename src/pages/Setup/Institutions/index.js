import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane, Alert, Spinner
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";

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
    getInstitutions as onGetInstitutions,
    deleteInstitution as onDeleteInstitution,
    createOrUpdateInstitution as onCreateOrUpdateInstitution
} from "../../../slices/thunks";

// Selectors
const selectInstitutionsData = createSelector(
    (state) => state.Setups,
    (institutionsData) => institutionsData.institutionsData.institutions || []
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

const InstitutionsPage = () => {
    document.title = "Institutions | simad University";

    const dispatch = useDispatch();
    const institutionsData = useSelector(selectInstitutionsData);

    // State management
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedInstitution, setSelectedInstitution] = useState(null);
    const [filteredInstitutions, setFilteredInstitutions] = useState([]);
    const [activeTab, setActiveTab] = useState('1');
    const [formAlert, setFormAlert] = useState({ show: false, message: '', type: '' });

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: 'all'
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        shortDescription: "",
        coverImage: "",
        image: "",
        overview: {
            heading: "",
            content: ""
        },
        visionMission: {
            heading: "Vision & Mission",
            content: ""
        },
        keyPrograms: {
            heading: "Key Programs & Research",
            programs: [""]
        }
    });

    const [coverImageFiles, setCoverImageFiles] = useState([]);
    const [imageFiles, setImageFiles] = useState([]);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetInstitutions());
        } catch (error) {
            console.error("Error loading institutions:", error);
            toast.error("Failed to load institutions");
            setFormAlert({
                show: true,
                message: 'Failed to load institutions. Please try again.',
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
        const initialInstitutions = Array.isArray(institutionsData) ? institutionsData : [];
        setInstitutions(initialInstitutions);
        setFilteredInstitutions(initialInstitutions);
    }, [institutionsData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        const filtered = institutions.filter(institution => {
            const matchesSearch = !value ||
                institution.name?.toLowerCase().includes(value.toLowerCase()) ||
                institution.shortDescription?.toLowerCase().includes(value.toLowerCase()) ||
                institution.slug?.toLowerCase().includes(value.toLowerCase());

            return matchesSearch;
        });
        setFilteredInstitutions(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle nested object changes
    const handleNestedChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Handle array field changes
    // Handle array field changes
    const handleArrayFieldChange = (field, index, value) => {
        setFormData(prev => {
            // Handle nested array fields like 'keyPrograms.programs'
            if (field.includes('.')) {
                const [parentField, childField] = field.split('.');
                const updatedParent = { ...prev[parentField] };
                const updatedArray = [...updatedParent[childField]];
                updatedArray[index] = value;

                return {
                    ...prev,
                    [parentField]: {
                        ...updatedParent,
                        [childField]: updatedArray
                    }
                };
            } else {
                // Handle regular array fields
                const updatedArray = [...prev[field]];
                updatedArray[index] = value;
                return {
                    ...prev,
                    [field]: updatedArray
                };
            }
        });
    };

    // Add new item to array
    // Add new item to array
    const addArrayItem = (field, template = "") => {
        setFormData(prev => {
            // Handle nested array fields like 'keyPrograms.programs'
            if (field.includes('.')) {
                const [parentField, childField] = field.split('.');
                const updatedParent = { ...prev[parentField] };
                const updatedArray = [...updatedParent[childField], template];

                return {
                    ...prev,
                    [parentField]: {
                        ...updatedParent,
                        [childField]: updatedArray
                    }
                };
            } else {
                // Handle regular array fields
                return {
                    ...prev,
                    [field]: [...prev[field], template]
                };
            }
        });
    };

    // Remove item from array
    // Remove item from array
    const removeArrayItem = (field, index) => {
        setFormData(prev => {
            // Handle nested array fields like 'keyPrograms.programs'
            if (field.includes('.')) {
                const [parentField, childField] = field.split('.');
                const updatedParent = { ...prev[parentField] };
                const updatedArray = updatedParent[childField].filter((_, i) => i !== index);

                return {
                    ...prev,
                    [parentField]: {
                        ...updatedParent,
                        [childField]: updatedArray
                    }
                };
            } else {
                // Handle regular array fields
                return {
                    ...prev,
                    [field]: prev[field].filter((_, i) => i !== index)
                };
            }
        });
    };

    // Handle file upload for cover image
    const handleCoverImageFileUpdate = (fileItems) => {
        setCoverImageFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                coverImage: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                coverImage: ""
            }));
        }
    };

    // Handle file upload for main image
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

    // Generate slug from name
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Auto-generate slug when name changes
    useEffect(() => {
        if (formData.name && !isEdit) {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(prev.name)
            }));
        }
    }, [formData.name, isEdit]);

    // Validate form
    const validateForm = () => {
        const requiredFields = ['name', 'slug'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Validate slug format
        if (formData.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
            toast.warning('Slug can only contain lowercase letters, numbers, and hyphens');
            return false;
        }

        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            shortDescription: "",
            coverImage: "",
            image: "",
            overview: {
                heading: "",
                content: ""
            },
            visionMission: {
                heading: "Vision & Mission",
                content: ""
            },
            keyPrograms: {
                heading: "Key Programs & Research",
                programs: [""]
            }
        });
        setCoverImageFiles([]);
        setImageFiles([]);
        setSelectedInstitution(null);
        setActiveTab('1');
        setFormAlert({ show: false, message: '', type: '' });
    };

    // Handle modal close
    const handleModalClose = () => {
        setCoverImageFiles([]);
        setImageFiles([]);
        setModal(false);
        resetForm();
    };

    // Create new institution
    const createInstitution = async (e) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = [
                'name', 'slug', 'shortDescription'
            ];

            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append nested objects
            submitData.append('overview[heading]', formData.overview.heading || '');
            submitData.append('overview[content]', formData.overview.content || '');
            submitData.append('visionMission[heading]', formData.visionMission.heading || '');
            submitData.append('visionMission[content]', formData.visionMission.content || '');
            submitData.append('keyPrograms[heading]', formData.keyPrograms.heading || '');

            // Append key programs array
            formData.keyPrograms.programs.forEach((program, index) => {
                if (program.trim()) {
                    submitData.append(`keyPrograms[programs][${index}]`, program);
                }
            });

            // Append cover image file if exists
            if (formData.coverImage instanceof File) {
                submitData.append('coverImage', formData.coverImage);
            }

            // Append main image file if exists
            if (formData.image instanceof File) {
                submitData.append('image', formData.image);
            }

            await dispatch(onCreateOrUpdateInstitution(submitData)).unwrap();
            handleModalClose();
            fetchData();
        } catch (error) {
            // Failed: keep the modal open and the entered data intact so the
            // user can fix the issue and resubmit instead of losing their input.
            console.error("Error creating institution:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update institution
    const updateInstitution = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedInstitution || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = [
                'name', 'slug', 'shortDescription'
            ];

            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append nested objects
            submitData.append('overview[heading]', formData.overview.heading || '');
            submitData.append('overview[content]', formData.overview.content || '');
            submitData.append('visionMission[heading]', formData.visionMission.heading || '');
            submitData.append('visionMission[content]', formData.visionMission.content || '');
            submitData.append('keyPrograms[heading]', formData.keyPrograms.heading || '');

            // Append key programs array
            formData.keyPrograms.programs.forEach((program, index) => {
                if (program.trim()) {
                    submitData.append(`keyPrograms[programs][${index}]`, program);
                }
            });

            // Append cover image file if exists
            if (formData.coverImage instanceof File) {
                submitData.append('coverImage', formData.coverImage);
            }

            // Append main image file if exists
            if (formData.image instanceof File) {
                submitData.append('image', formData.image);
            }

            // Append ID for update
            submitData.append('_id', selectedInstitution._id);

            await dispatch(onCreateOrUpdateInstitution(submitData)).unwrap();

            handleModalClose();
            fetchData();
        } catch (error) {
            console.error("Error updating institution:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete institution
    const deleteInstitution = async () => {
        if (!selectedInstitution) return;

        try {
            await dispatch(onDeleteInstitution(selectedInstitution._id));
            setDeleteModal(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting institution:", error);
        }
    };

    // Open modal for edit
    const handleEdit = (institution) => {
        setSelectedInstitution(institution);

        setFormData({
            name: institution.name || "",
            slug: institution.slug || "",
            shortDescription: institution.shortDescription || "",
            coverImage: institution.coverImage || "",
            image: institution.image || "",
            overview: institution.overview || {
                heading: "",
                content: ""
            },
            visionMission: institution.visionMission || {
                heading: "Vision & Mission",
                content: ""
            },
            keyPrograms: institution.keyPrograms || {
                heading: "Key Programs & Research",
                programs: [""]
            }
        });

        setIsEdit(true);
        setModal(true);
        setActiveTab('1');
    };

    // Open modal for view
    const handleView = (institution) => {
        setSelectedInstitution(institution);
        setViewModal(true);
        setActiveTab('1');
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedInstitution(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
        },
        {
            name: 'Logo',
            cell: (row) => (
                <div className="avatar-xs">
                    {row.image ? (
                        <img
                            src={row.image}
                            alt={row.name}
                            className="avatar-title bg-light rounded-circle"
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                    ) : (
                        <div className="avatar-title bg-light text-secondary rounded-circle">
                            <i className="ri-building-line" />
                        </div>
                    )}
                </div>
            ),
        },
        {
            name: 'Institution Name',
            selector: row => row.name,
            wrap: true,
        },
        {
            name: 'Slug',
            selector: row => row.slug,
        },
        {
            name: 'Short Description',
            cell: row => (
                <div className="text-truncate" style={{ maxWidth: '200px' }}>
                    {row.shortDescription || 'N/A'}
                </div>
            ),
        },
        // {
        //     name: 'KeyPrograms',
        //     cell: row => row.keyPrograms?.programs?.length || 0,
        //     center: true
        // },
        {
            name: 'Created',
            cell: row => new Date(row.createdAt).toLocaleDateString(),
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
                    <Button
                        color="outline-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedInstitution(row);
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
                <BreadCrumb title="Institutions" pageTitle="Academics" />



                {/* Stats Cards */}
                <Row className="mb-4" style={{ display: "none" }}>
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Institutions</p>
                                        <h4 className="mb-0">{institutions.length}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-2">
                                                <i className="ri-building-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Active Programs</p>
                                        <h4 className="mb-0">
                                            {institutions.reduce((total, inst) => total + (inst.keyPrograms?.programs?.length || 0), 0)}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                                                <i className="ri-book-mark-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">With Cover Images</p>
                                        <h4 className="mb-0">
                                            {institutions.filter(inst => inst.coverImage).length}
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
                                            {institutions.filter(inst =>
                                                new Date(inst.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
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
                                    <Label className="form-label">Search Institutions</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by name, slug, or description..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Sort By</Label>
                                    <Select
                                        options={[
                                            { value: 'name', label: 'Name (A-Z)' },
                                            { value: 'createdAt', label: 'Recently Added' },
                                            { value: 'programs', label: 'Most Programs' }
                                        ]}
                                        onChange={(opt) => {
                                            // Handle sorting logic here
                                        }}
                                        placeholder="Sort institutions..."
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
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

                {/* Institutions Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-building-line align-middle me-2"></i>
                            Institutions List
                            <Badge color="primary" className="ms-2">{filteredInstitutions.length}</Badge>
                        </h5>
                        <Button color="primary" onClick={handleCreate} className="shadow-sm">
                            <i className="ri-add-line me-1 align-middle"></i>
                            Add Institution
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredInstitutions}
                                pagination
                                responsive
                                noDataComponent={
                                    <NoDataFound title="No institutions found" message="Try adjusting your search criteria or add a new institution." />
                                }
                                customStyles={{
                                    headCells: {
                                        style: {
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
            <Modal isOpen={modal} toggle={handleModalClose} size="xl" centered scrollable>
                <ModalHeader toggle={handleModalClose} className="bg-light">
                    <i className={`ri-${isEdit ? 'pencil' : 'add'}-line me-2`}></i>
                    {isEdit ? 'Edit Institution' : 'Create New Institution'}
                </ModalHeader>
                <Form noValidate onSubmit={isEdit ? updateInstitution : createInstitution}>
                    <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Step Navigation */}
                        <div className="step-arrow-nav mb-4">
                            <Nav className="nav-pills custom-nav nav-justified" role="tablist">
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '1' ? 'active' : ''}
                                        onClick={() => setActiveTab('1')}
                                    >
                                        <i className="ri-building-line me-1" /> Basic Info
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '2' ? 'active' : ''}
                                        onClick={() => setActiveTab('2')}
                                    >
                                        <i className="ri-information-line me-1" /> Overview
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '3' ? 'active' : ''}
                                        onClick={() => setActiveTab('3')}
                                    >
                                        <i className="ri-eye-line me-1" /> Vision & Mission
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '4' ? 'active' : ''}
                                        onClick={() => setActiveTab('4')}
                                    >
                                        <i className="ri-book-mark-line me-1" /> Key Programs
                                    </NavLink>
                                </NavItem>
                            </Nav>
                        </div>

                        <TabContent activeTab={activeTab}>
                            {/* Tab 1: Basic Information */}
                            <TabPane tabId="1">
                                <Row>
                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Basic Information</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Institution Name <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g., Faculty of Computer Science"
                                                        className="form-control-lg"
                                                        required
                                                    />
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Slug <span className="text-danger">*</span>
                                                    </Label>
                                                    <Input
                                                        name="slug"
                                                        value={formData.slug}
                                                        onChange={handleInputChange}
                                                        placeholder="institution-slug"
                                                        className="form-control-lg"
                                                        required
                                                    />
                                                    <small className="text-muted">
                                                        Unique URL identifier for the institution
                                                    </small>
                                                </FormGroup>

                                                <FormGroup>
                                                    <Label className="form-label">
                                                        Short Description <span className="text-muted fs-12">(optional)</span>
                                                    </Label>
                                                    <Input
                                                        type="textarea"
                                                        name="shortDescription"
                                                        value={formData.shortDescription}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g., A leading center for technology and innovation education"
                                                        rows="3"
                                                        className="form-control-lg"
                                                    />
                                                    <div className="text-end">
                                                        <small className={`text-${formData.shortDescription.length > 200 ? 'danger' : 'muted'}`}>
                                                            {formData.shortDescription.length}/200
                                                        </small>
                                                    </div>
                                                </FormGroup>
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col lg={6}>
                                        <Card className="border">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">Media</h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <Label className="form-label">Cover Image</Label>
                                                    <FilePond
                                                        files={coverImageFiles}
                                                        onupdatefiles={handleCoverImageFileUpdate}
                                                        allowMultiple={false}
                                                        maxFiles={1}
                                                        name="coverImage"
                                                        labelIdle='<div class="text-center"><i class="ri-landscape-line display-4 text-muted"></i><p class="mt-2">Drag & Drop cover image or <span class="filepond--label-action">Browse</span></p></div>'
                                                        acceptedFileTypes={['image/*']}
                                                        imagePreviewHeight={150}
                                                        credits={false}
                                                        className="filepond-border"
                                                    />
                                                    <small className="text-muted">
                                                        Recommended size: 1200x400px
                                                    </small>
                                                </FormGroup>

                                                <FormGroup className="mt-3">
                                                    <Label className="form-label">Institution Logo/Image</Label>
                                                    <FilePond
                                                        files={imageFiles}
                                                        onupdatefiles={handleImageFileUpdate}
                                                        allowMultiple={false}
                                                        maxFiles={1}
                                                        name="image"
                                                        labelIdle='<div class="text-center"><i class="ri-image-line display-4 text-muted"></i><p class="mt-2">Drag & Drop logo/image or <span class="filepond--label-action">Browse</span></p></div>'
                                                        acceptedFileTypes={['image/*']}
                                                        imagePreviewHeight={100}
                                                        credits={false}
                                                        className="filepond-border"
                                                    />
                                                    <small className="text-muted">
                                                        Recommended size: 300x300px
                                                    </small>
                                                </FormGroup>

                                                {/* Image Previews */}
                                                {formData.coverImage && !coverImageFiles.length && (
                                                    <div className="mt-2">
                                                        <Label>Current Cover Image:</Label>
                                                        <img
                                                            src={formData.coverImage}
                                                            alt="Cover preview"
                                                            className="img-thumbnail mt-1"
                                                            style={{ maxHeight: '150px' }}
                                                        />
                                                    </div>
                                                )}

                                                {formData.image && !imageFiles.length && (
                                                    <div className="mt-2">
                                                        <Label>Current Logo/Image:</Label>
                                                        <img
                                                            src={formData.image}
                                                            alt="Logo preview"
                                                            className="img-thumbnail mt-1"
                                                            style={{ maxHeight: '100px' }}
                                                        />
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 2: Overview */}
                            <TabPane tabId="2">
                                <Card className="border">
                                    <CardHeader className="bg-light">
                                        <h6 className="mb-0">Overview Section</h6>
                                    </CardHeader>
                                    <CardBody>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Section Heading <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.overview.heading}
                                                onChange={(e) => handleNestedChange('overview', 'heading', e.target.value)}
                                                placeholder="About Our Institution"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>

                                        <FormGroup>
                                            <Label className="form-label">
                                                Content <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                value={formData.overview.content}
                                                onChange={(e) => handleNestedChange('overview', 'content', e.target.value)}
                                                placeholder="Provide a comprehensive overview of the institution..."
                                                rows="6"
                                                className="form-control-lg"
                                            />
                                            <div className="text-end">
                                                <small className={`text-${formData.overview.content.length > 1000 ? 'danger' : 'muted'}`}>
                                                    {formData.overview.content.length}/1000
                                                </small>
                                            </div>
                                        </FormGroup>
                                    </CardBody>
                                </Card>
                            </TabPane>

                            {/* Tab 3: Vision & Mission */}
                            <TabPane tabId="3">
                                <Card className="border">
                                    <CardHeader className="bg-light">
                                        <h6 className="mb-0">Vision & Mission Section</h6>
                                    </CardHeader>
                                    <CardBody>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Section Heading <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.visionMission.heading}
                                                onChange={(e) => handleNestedChange('visionMission', 'heading', e.target.value)}
                                                placeholder="Vision & Mission"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>

                                        <FormGroup>
                                            <Label className="form-label">
                                                Content <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                value={formData.visionMission.content}
                                                onChange={(e) => handleNestedChange('visionMission', 'content', e.target.value)}
                                                placeholder="Describe the institution's vision and mission..."
                                                rows="6"
                                                className="form-control-lg"
                                            />
                                            <div className="text-end">
                                                <small className={`text-${formData.visionMission.content.length > 1000 ? 'danger' : 'muted'}`}>
                                                    {formData.visionMission.content.length}/1000
                                                </small>
                                            </div>
                                        </FormGroup>
                                    </CardBody>
                                </Card>
                            </TabPane>

                            {/* Tab 4: Key Programs */}
                            <TabPane tabId="4">
                                <Card className="border">
                                    <CardHeader className="bg-light">
                                        <h6 className="mb-0">Key Programs & Research Section</h6>
                                    </CardHeader>
                                    <CardBody>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Section Heading <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.keyPrograms.heading}
                                                onChange={(e) => handleNestedChange('keyPrograms', 'heading', e.target.value)}
                                                placeholder="Key Programs & Research"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>

                                        <div className="mt-4">
                                            <h6>Programs List</h6>
                                            {formData.keyPrograms.programs.map((program, index) => (
                                                <div key={index} className="d-flex gap-2 mb-2 align-items-start">
                                                    <div className="flex-grow-1">
                                                        <Input
                                                            value={program}
                                                            onChange={(e) => handleArrayFieldChange('keyPrograms.programs', index, e.target.value)}
                                                            placeholder="Enter program or research area"
                                                            className="form-control-lg"
                                                        />
                                                    </div>
                                                    {formData.keyPrograms.programs.length > 1 && (
                                                        <Button
                                                            color="outline-danger"
                                                            size="sm"
                                                            onClick={() => removeArrayItem('keyPrograms.programs', index)}
                                                            className="mt-1"
                                                        >
                                                            <i className="ri-delete-bin-line" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                color="light"
                                                onClick={() => addArrayItem('keyPrograms.programs', "")}
                                                className="mt-2"
                                            >
                                                <i className="ri-add-line me-1" /> Add Program
                                            </Button>
                                        </div>
                                    </CardBody>
                                </Card>
                            </TabPane>
                        </TabContent>
                    </ModalBody>
                    <ModalFooter className="bg-light">
                        <div className="w-100 d-flex justify-content-between">
                            <div>
                                {activeTab !== '1' && (
                                    <Button color="light" onClick={() => setActiveTab((parseInt(activeTab) - 1).toString())}>
                                        <i className="ri-arrow-left-line me-1" /> Previous
                                    </Button>
                                )}
                            </div>
                            <div>
                                {activeTab !== '4' ? (
                                    <Button color="primary" onClick={() => setActiveTab((parseInt(activeTab) + 1).toString())}>
                                        Next <i className="ri-arrow-right-line ms-1" />
                                    </Button>
                                ) : (
                                    <Button color="success" type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Spinner size="sm" className="me-1" />
                                                {isEdit ? 'Updating...' : 'Creating...'}
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-save-line me-1"></i>
                                                {isEdit ? 'Update Institution' : 'Create Institution'}
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl" centered scrollable>
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light">
                    <i className="ri-building-line me-2"></i>
                    Institution Details - {selectedInstitution?.name}
                </ModalHeader>
                <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedInstitution && (
                        <>
                            {/* Step Navigation for View */}
                            <div className="step-arrow-nav mb-4">
                                <Nav className="nav-pills custom-nav nav-justified" role="tablist">
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '1' ? 'active' : ''}
                                            onClick={() => setActiveTab('1')}
                                        >
                                            <i className="ri-building-line me-1" /> Basic Info
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '2' ? 'active' : ''}
                                            onClick={() => setActiveTab('2')}
                                        >
                                            <i className="ri-information-line me-1" /> Overview
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '3' ? 'active' : ''}
                                            onClick={() => setActiveTab('3')}
                                        >
                                            <i className="ri-eye-line me-1" /> Vision & Mission
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '4' ? 'active' : ''}
                                            onClick={() => setActiveTab('4')}
                                        >
                                            <i className="ri-book-mark-line me-1" /> Key Programs
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                            </div>

                            <TabContent activeTab={activeTab}>
                                {/* Tab 1: Basic Information */}
                                <TabPane tabId="1">
                                    <Row>
                                        <Col md={4} className="text-center mb-4">
                                            {selectedInstitution.image ? (
                                                <img
                                                    src={selectedInstitution.image}
                                                    alt={selectedInstitution.name}
                                                    className="rounded-circle img-thumbnail mb-3"
                                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center mb-3"
                                                    style={{ width: '150px', height: '150px', margin: '0 auto' }}>
                                                    <i className="ri-building-line display-4 text-muted"></i>
                                                </div>
                                            )}
                                            <h4>{selectedInstitution.name}</h4>
                                            <Badge color="primary" className="fs-6">{selectedInstitution.slug}</Badge>
                                        </Col>
                                        <Col md={8}>
                                            <h6>Short Description</h6>
                                            <p className="text-muted mb-4">
                                                {selectedInstitution.shortDescription || 'No description provided.'}
                                            </p>

                                            {selectedInstitution.coverImage && (
                                                <div className="mt-4">
                                                    <h6>Cover Image</h6>
                                                    <img
                                                        src={selectedInstitution.coverImage}
                                                        alt="Cover"
                                                        className="img-fluid rounded"
                                                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                                                    />
                                                </div>
                                            )}

                                            <div className="mt-4">
                                                <h6>Metadata</h6>
                                                <Row>
                                                    <Col sm={6}>
                                                        <p><strong>Created:</strong> {new Date(selectedInstitution.createdAt).toLocaleDateString()}</p>
                                                    </Col>
                                                    <Col sm={6}>
                                                        <p><strong>Last Updated:</strong> {new Date(selectedInstitution.updatedAt).toLocaleDateString()}</p>
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 2: Overview */}
                                <TabPane tabId="2">
                                    {selectedInstitution.overview?.heading || selectedInstitution.overview?.content ? (
                                        <div>
                                            <h4 className="text-primary">{selectedInstitution.overview.heading}</h4>
                                            <div className="mt-3">
                                                {selectedInstitution.overview.content?.split('\n').map((paragraph, index) => (
                                                    <p key={index} className="mb-3">{paragraph}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <i className="ri-information-line display-4 text-muted"></i>
                                            <h5 className="mt-3">No Overview Content</h5>
                                            <p className="text-muted">Overview section has not been configured for this institution.</p>
                                        </div>
                                    )}
                                </TabPane>

                                {/* Tab 3: Vision & Mission */}
                                <TabPane tabId="3">
                                    {selectedInstitution.visionMission?.content ? (
                                        <div>
                                            <h4 className="text-primary">{selectedInstitution.visionMission.heading}</h4>
                                            <div className="mt-3">
                                                {selectedInstitution.visionMission.content?.split('\n').map((paragraph, index) => (
                                                    <p key={index} className="mb-3">{paragraph}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <i className="ri-eye-line display-4 text-muted"></i>
                                            <h5 className="mt-3">No Vision & Mission Content</h5>
                                            <p className="text-muted">Vision & Mission section has not been configured for this institution.</p>
                                        </div>
                                    )}
                                </TabPane>

                                {/* Tab 4: Key Programs */}
                                <TabPane tabId="4">
                                    {selectedInstitution.keyPrograms?.programs?.length > 0 ? (
                                        <div>
                                            <h4 className="text-primary">{selectedInstitution.keyPrograms.heading}</h4>
                                            <Row className="mt-4">
                                                {selectedInstitution.keyPrograms.programs.map((program, index) => (
                                                    <Col md={6} key={index} className="mb-3">
                                                        <Card className="border">
                                                            <CardBody className="d-flex align-items-center">
                                                                <i className="ri-book-mark-line text-primary me-3 fs-4"></i>
                                                                <div>
                                                                    <h6 className="mb-0">{program}</h6>
                                                                </div>
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <i className="ri-book-mark-line display-4 text-muted"></i>
                                            <h5 className="mt-3">No Key Programs</h5>
                                            <p className="text-muted">Key programs have not been added for this institution.</p>
                                        </div>
                                    )}
                                </TabPane>
                            </TabContent>
                        </>
                    )}
                </ModalBody>
                <ModalFooter className="bg-light">
                    <Button color="light" onClick={() => setViewModal(false)}>
                        <i className="ri-close-line me-1"></i>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteInstitution}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText={
                    selectedInstitution ?
                        `Are you sure you want to delete "${selectedInstitution.name}"? This action cannot be undone and all associated data will be permanently removed.`
                        : ""
                }
            />

            <ToastContainer />
        </div>
    );
};

export default InstitutionsPage;