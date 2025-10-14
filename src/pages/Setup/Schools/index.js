import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, Nav, NavItem, NavLink, TabContent, TabPane
} from "reactstrap";
import DataTable from "react-data-table-component";
import Select from "react-select";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import CreatableSelect from 'react-select/creatable';

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

//redux
import {
    getSchools as onGetSchools,
    deleteSchool as onDeleteSchool,
    CreateOrUpdateSchool as onCreateOrUpdateSchool
} from "../../../slices/thunks";

// Import other thunks for dropdowns
import {
    getStaffs as onGetStaffs,
    getProgramsCategories as onGetProgramsCategories
} from "../../../slices/thunks";

// Selectors
const selectSchoolsData = createSelector(
    (state) => state.Setups,
    (schoolsData) => schoolsData.schoolsData.schools || []
);

const selectStaffData = createSelector(
    (state) => state.Setups,
    (staffData) => staffData.staffData.staff || []
);

const selectCategoriesData = createSelector(
    (state) => state.Setups,
    (categoriesData) => categoriesData.pr_categoriesData.categories || []
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

const SchoolsPage = () => {
    document.title = "Schools | simad University";

    const dispatch = useDispatch();
    const schoolsData = useSelector(selectSchoolsData);
    const staffData = useSelector(selectStaffData);
    const categoriesData = useSelector(selectCategoriesData);

    // State management
    const [schools, setSchools] = useState([]);
    const [staff, setStaff] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [filteredSchools, setFilteredSchools] = useState([]);
    const [activeTab, setActiveTab] = useState('1');

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        category: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        tagline: "",
        shortDescription: "",
        logoUrl: "",
        coverImage: "",
        dean: "",
        category: "",
        contactInfo: {
            phone: "",
            email: "",
            location: "",
            website: ""
        },
        facts_and_figures: {
            academic_staff: "",
            student_population: "",
            founded_year: ""
        },
        mission: "",
        vision: "",
        student_testimonials: [{
            student_name: "",
            message: "",
            student_program_shortName: ""
        }],
        programs_sec_title: "",
        programs_sec_icon: "",
        programs_sec_subtitle: "",
        vison_and_mission_sec_title: "",
        vison_and_mission_sec_subtitle: "",
        vison_and_mission_sec_icon: "",
        dean_message_sec_title: "",
        dean_message_sec_subtitle: "",
        dean_message_sec_icon: "",
        dean_message_sec_text: "",
        facts_message_sec_title: "",
        facts_message_sec_subtitle: "",
        facts_message_sec_icon: "",
        testimonials_message_sec_title: "",
        testimonials_message_sec_subtitle: "",
        testimonials_message_sec_icon: "",
        contact_message_sec_title: "",
        contact_message_sec_subtitle: "",
        contact_message_sec_icon: "",
        order: 0
    });
    const [logoFiles, setLogoFiles] = useState([]);
    const [coverImageFiles, setCoverImageFiles] = useState([]);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetSchools());
            await dispatch(onGetStaffs());
            await dispatch(onGetProgramsCategories());
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error("Failed to load data");
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
        const initialSchools = Array.isArray(schoolsData) ? schoolsData : [];
        const initialStaff = Array.isArray(staffData) ? staffData : [];
        const initialCategories = Array.isArray(categoriesData) ? categoriesData : [];

        setSchools(initialSchools);
        setFilteredSchools(initialSchools);
        setStaff(initialStaff);
        setCategories(initialCategories);
    }, [schoolsData, staffData, categoriesData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        const filtered = schools.filter(school => {
            const matchesSearch = !value ||
                school.name?.toLowerCase().includes(value.toLowerCase()) ||
                school.tagline?.toLowerCase().includes(value.toLowerCase()) ||
                school.shortDescription?.toLowerCase().includes(value.toLowerCase());

            const matchesCategory = !filters.category ||
                school.category?._id === (name === 'category' ? value : filters.category);

            return matchesSearch && matchesCategory;
        });
        setFilteredSchools(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle nested object changes
    const handleNestedChange = (parentField, field, value) => {
        setFormData(prev => ({
            ...prev,
            [parentField]: {
                ...prev[parentField],
                [field]: value
            }
        }));
    };

    // Handle array field changes
    const handleArrayFieldChange = (field, index, subField, value) => {
        setFormData(prev => {
            const updatedArray = [...prev[field]];
            updatedArray[index] = {
                ...updatedArray[index],
                [subField]: value
            };
            return {
                ...prev,
                [field]: updatedArray
            };
        });
    };

    // Add new item to array
    const addArrayItem = (field, template) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], { ...template }]
        }));
    };

    // Remove item from array
    const removeArrayItem = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    // Handle file upload for logo
    const handleLogoFileUpdate = (fileItems) => {
        setLogoFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                logoUrl: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                logoUrl: ""
            }));
        }
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

    // Validate form
    const validateForm = () => {
        const requiredFields = ['name', 'category'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Validate email format if provided
        if (formData.contactInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactInfo.email)) {
            toast.warning('Please enter a valid email address');
            return false;
        }

        // Validate website format if provided
        if (formData.contactInfo.website && !/^https?:\/\/.+\..+/.test(formData.contactInfo.website)) {
            toast.warning('Please enter a valid website URL');
            return false;
        }

        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            tagline: "",
            shortDescription: "",
            logoUrl: "",
            coverImage: "",
            dean: "",
            category: "",
            contactInfo: {
                phone: "",
                email: "",
                location: "",
                website: ""
            },
            facts_and_figures: {
                academic_staff: "",
                student_population: "",
                founded_year: ""
            },
            mission: "",
            vision: "",
            student_testimonials: [{
                student_name: "",
                message: "",
                student_program_shortName: ""
            }],
            programs_sec_title: "",
            programs_sec_icon: "",
            programs_sec_subtitle: "",
            vison_and_mission_sec_title: "",
            vison_and_mission_sec_subtitle: "",
            vison_and_mission_sec_icon: "",
            dean_message_sec_title: "",
            dean_message_sec_subtitle: "",
            dean_message_sec_icon: "",
            dean_message_sec_text: "",
            facts_message_sec_title: "",
            facts_message_sec_subtitle: "",
            facts_message_sec_icon: "",
            testimonials_message_sec_title: "",
            testimonials_message_sec_subtitle: "",
            testimonials_message_sec_icon: "",
            contact_message_sec_title: "",
            contact_message_sec_subtitle: "",
            contact_message_sec_icon: "",
            order: 0
        });
        setLogoFiles([]);
        setCoverImageFiles([]);
        setSelectedSchool(null);
        setActiveTab('1');
    };

    // Create new school
    const createSchool = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = [
                'name', 'tagline', 'shortDescription', 'dean', 'category',
                'mission', 'vision', 'programs_sec_title', 'programs_sec_icon', 'programs_sec_subtitle',
                'vison_and_mission_sec_title', 'vison_and_mission_sec_subtitle', 'vison_and_mission_sec_icon',
                'dean_message_sec_title', 'dean_message_sec_subtitle', 'dean_message_sec_icon', 'dean_message_sec_text',
                'facts_message_sec_title', 'facts_message_sec_subtitle', 'facts_message_sec_icon',
                'testimonials_message_sec_title', 'testimonials_message_sec_subtitle', 'testimonials_message_sec_icon',
                'contact_message_sec_title', 'contact_message_sec_subtitle', 'contact_message_sec_icon',
                'order'
            ];

            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append contact info
            Object.keys(formData.contactInfo).forEach(field => {
                submitData.append(`contactInfo[${field}]`, formData.contactInfo[field] || '');
            });

            // Append facts and figures
            Object.keys(formData.facts_and_figures).forEach(field => {
                submitData.append(`facts_and_figures[${field}]`, formData.facts_and_figures[field] || '');
            });

            // Append testimonials
            formData.student_testimonials.forEach((testimonial, index) => {
                submitData.append(`student_testimonials[${index}][student_name]`, testimonial.student_name || '');
                submitData.append(`student_testimonials[${index}][message]`, testimonial.message || '');
                submitData.append(`student_testimonials[${index}][student_program_shortName]`, testimonial.student_program_shortName || '');
            });

            // Append logo file if exists
            if (formData.logoUrl instanceof File) {
                submitData.append('logo', formData.logoUrl);
            }

            // Append cover image file if exists
            if (formData.coverImage instanceof File) {
                submitData.append('coverImage', formData.coverImage);
            }

            await dispatch(onCreateOrUpdateSchool(submitData));

            handleModalClose();
            resetForm();
        } catch (error) {
            console.error("Error creating school:", error);

        }
    };

    // Update school
    const updateSchool = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedSchool) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = [
                'name', 'tagline', 'shortDescription', 'dean', 'category',
                'mission', 'vision', 'programs_sec_title', 'programs_sec_icon', 'programs_sec_subtitle',
                'vison_and_mission_sec_title', 'vison_and_mission_sec_subtitle', 'vison_and_mission_sec_icon',
                'dean_message_sec_title', 'dean_message_sec_subtitle', 'dean_message_sec_icon', 'dean_message_sec_text',
                'facts_message_sec_title', 'facts_message_sec_subtitle', 'facts_message_sec_icon',
                'testimonials_message_sec_title', 'testimonials_message_sec_subtitle', 'testimonials_message_sec_icon',
                'contact_message_sec_title', 'contact_message_sec_subtitle', 'contact_message_sec_icon',
                'order'
            ];

            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append contact info
            Object.keys(formData.contactInfo).forEach(field => {
                submitData.append(`contactInfo[${field}]`, formData.contactInfo[field] || '');
            });

            // Append facts and figures
            Object.keys(formData.facts_and_figures).forEach(field => {
                submitData.append(`facts_and_figures[${field}]`, formData.facts_and_figures[field] || '');
            });

            // Append testimonials
            formData.student_testimonials.forEach((testimonial, index) => {
                submitData.append(`student_testimonials[${index}][student_name]`, testimonial.student_name || '');
                submitData.append(`student_testimonials[${index}][message]`, testimonial.message || '');
                submitData.append(`student_testimonials[${index}][student_program_shortName]`, testimonial.student_program_shortName || '');
            });

            // Append logo file if exists
            if (formData.logoUrl instanceof File) {
                submitData.append('logo', formData.logoUrl);
            }

            // Append cover image file if exists
            if (formData.coverImage instanceof File) {
                submitData.append('coverImage', formData.coverImage);
            }

            // Append ID for update
            submitData.append('_id', selectedSchool._id);

            await dispatch(onCreateOrUpdateSchool(submitData));

            handleModalClose();
            resetForm();
        } catch (error) {
            console.error("Error updating school:", error);

        }
    };

    const handleModalClose = () => {
        setLogoFiles([]);
        setCoverImageFiles([]);
        setModal(false);
    };

    // Delete school
    const deleteSchool = async () => {
        if (!selectedSchool) return;

        try {
            await dispatch(onDeleteSchool(selectedSchool._id));

            setDeleteModal(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting school:", error);

        }
    };

    // Open modal for edit
    const handleEdit = (school) => {
        setSelectedSchool(school);

        setFormData({
            name: school.name || "",
            tagline: school.tagline || "",
            shortDescription: school.shortDescription || "",
            logoUrl: school.logoUrl || "",
            coverImage: school.coverImage || "",
            dean: school.dean?._id || "",
            category: school.category?._id || "",
            contactInfo: {
                phone: school.contactInfo?.phone || "",
                email: school.contactInfo?.email || "",
                location: school.contactInfo?.location || "",
                website: school.contactInfo?.website || ""
            },
            facts_and_figures: {
                academic_staff: school.facts_and_figures?.academic_staff || "",
                student_population: school.facts_and_figures?.student_population || "",
                founded_year: school.facts_and_figures?.founded_year || ""
            },
            mission: school.mission || "",
            vision: school.vision || "",
            student_testimonials: school.student_testimonials?.length > 0 ? school.student_testimonials : [{
                student_name: "",
                message: "",
                student_program_shortName: ""
            }],
            programs_sec_title: school.programs_sec_title || "",
            programs_sec_icon: school.programs_sec_icon || "",
            programs_sec_subtitle: school.programs_sec_subtitle || "",
            vison_and_mission_sec_title: school.vison_and_mission_sec_title || "",
            vison_and_mission_sec_subtitle: school.vison_and_mission_sec_subtitle || "",
            vison_and_mission_sec_icon: school.vison_and_mission_sec_icon || "",
            dean_message_sec_title: school.dean_message_sec_title || "",
            dean_message_sec_subtitle: school.dean_message_sec_subtitle || "",
            dean_message_sec_icon: school.dean_message_sec_icon || "",
            dean_message_sec_text: school.dean_message_sec_text || "",
            facts_message_sec_title: school.facts_message_sec_title || "",
            facts_message_sec_subtitle: school.facts_message_sec_subtitle || "",
            facts_message_sec_icon: school.facts_message_sec_icon || "",
            testimonials_message_sec_title: school.testimonials_message_sec_title || "",
            testimonials_message_sec_subtitle: school.testimonials_message_sec_subtitle || "",
            testimonials_message_sec_icon: school.testimonials_message_sec_icon || "",
            contact_message_sec_title: school.contact_message_sec_title || "",
            contact_message_sec_subtitle: school.contact_message_sec_subtitle || "",
            contact_message_sec_icon: school.contact_message_sec_icon || "",
            order: school.order || 0
        });

        setIsEdit(true);
        setModal(true);
        setActiveTab('1');
    };

    // Open modal for view
    const handleView = (school) => {
        setSelectedSchool(school);
        setViewModal(true);
        setActiveTab('1');
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedSchool(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    // Format options for dropdowns
    const staffOptions = staff.map(staffMember => ({
        value: staffMember._id,
        label: `${staffMember.name} - ${staffMember.title}`
    }));

    const categoryOptions = categories.map(category => ({
        value: category._id,
        label: category.name
    }));

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
                    {row.logoUrl ? (
                        <img
                            src={row.logoUrl}
                            alt={row.name}
                            className="rounded-circle"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
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
            name: 'School Name',
            selector: row => row.name,
            wrap: true,
        },
        {
            name: 'Tagline',
            cell: row => (
                <div className="text-truncate" style={{ maxWidth: '150px' }}>
                    {row.tagline || 'N/A'}
                </div>
            ),
        },
        {
            name: 'Category',
            cell: row => row.category?.name || 'N/A',
        },
        {
            name: 'Dean',
            cell: row => row.dean?.name || 'N/A',
        },
        {
            name: 'Order',
            selector: row => row.order,
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
                            setSelectedSchool(row);
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
                <BreadCrumb title="Schools" pageTitle="Academics" />

                {/* Stats Cards */}
                <Row className="mb-4">
                    <Col xl={3} md={6}>
                        <Card className="card-animate">
                            <CardBody>
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        <p className="text-uppercase fw-medium text-muted mb-0">Total Schools</p>
                                        <h4 className="mb-0">{schools.length}</h4>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">Active Categories</p>
                                        <h4 className="mb-0">{new Set(schools.map(s => s.category?._id)).size}</h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-success-subtle text-success rounded-circle fs-2">
                                                <i className="ri-bookmark-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">With Deans</p>
                                        <h4 className="mb-0">
                                            {schools.filter(s => s.dean).length}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-info-subtle text-info rounded-circle fs-2">
                                                <i className="ri-user-line"></i>
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
                                        <p className="text-uppercase fw-medium text-muted mb-0">With Testimonials</p>
                                        <h4 className="mb-0">
                                            {schools.filter(s => s.student_testimonials?.length > 0).length}
                                        </h4>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <div className="avatar-sm">
                                            <span className="avatar-title bg-warning-subtle text-warning rounded-circle fs-2">
                                                <i className="ri-chat-quote-line"></i>
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
                                    <Label className="form-label">Search Schools</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by name, tagline, or description..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="form-control"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup className="mb-0">
                                    <Label className="form-label">Category</Label>
                                    <Select
                                        options={categoryOptions}
                                        value={categoryOptions.find(option => option.value === filters.category)}
                                        onChange={(selected) => setFilters(prev => ({
                                            ...prev,
                                            category: selected ? selected.value : ""
                                        }))}
                                        isClearable
                                        placeholder="Filter by category..."
                                        className="react-select"
                                        classNamePrefix="select"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <Button
                                    color="primary"
                                    className="w-100 mb-3"
                                    onClick={() => setFilters({
                                        search: '',
                                        category: ''
                                    })}
                                >
                                    <i className="ri-refresh-line me-1"></i>
                                    Reset
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Schools Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center bg-light">
                        <h5 className="card-title mb-0 flex-grow-1">
                            <i className="ri-building-line align-middle me-2"></i>
                            Schools List
                            <Badge color="primary" className="ms-2">{filteredSchools.length}</Badge>
                        </h5>
                        <Button color="primary" onClick={handleCreate} className="shadow-sm">
                            <i className="ri-add-line me-1 align-middle"></i>
                            Add School
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredSchools}
                                pagination
                                // highlightOnHover
                                responsive
                                // striped
                                noDataComponent={
                                    <div className="text-center py-5">
                                        <i className="ri-inbox-line display-4 text-muted"></i>
                                        <h5 className="mt-3">No schools found</h5>
                                        <p className="text-muted">Try adjusting your search criteria or add a new school.</p>
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
            <Modal isOpen={modal} toggle={handleModalClose} unmountOnClose={false} size="xl" scrollable>
                <ModalHeader toggle={handleModalClose} className="bg-light">
                    <i className={`ri-${isEdit ? 'pencil' : 'add'}-line me-2`}></i>
                    {isEdit ? 'Edit School' : 'Create New School'}
                </ModalHeader>
                <Form noValidate onSubmit={isEdit ? updateSchool : createSchool}>
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
                                        <i className="ri-contacts-line me-1" /> Contact & Facts
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '3' ? 'active' : ''}
                                        onClick={() => setActiveTab('3')}
                                    >
                                        <i className="ri-file-paper-line me-1" /> Mission & Vision
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '4' ? 'active' : ''}
                                        onClick={() => setActiveTab('4')}
                                    >
                                        <i className="ri-chat-quote-line me-1" /> Testimonials
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '5' ? 'active' : ''}
                                        onClick={() => setActiveTab('5')}
                                    >
                                        <i className="ri-settings-3-line me-1" /> Section Settings
                                    </NavLink>
                                </NavItem>

                            </Nav>
                        </div>
                        <TabContent activeTab={activeTab}>
                            {/* Tab 1: Basic Information */}
                            <TabPane tabId="1">
                                <Row>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>School Logo</Label>
                                            <FilePond
                                                files={logoFiles}
                                                onupdatefiles={handleLogoFileUpdate}
                                                allowMultiple={false}
                                                maxFiles={1}
                                                name="logo"
                                                labelIdle='Drag & Drop your logo or <span class="filepond--label-action">Browse</span>'
                                                acceptedFileTypes={['image/*']}
                                                imagePreviewHeight={100}
                                                credits={false}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Cover Image</Label>
                                            <FilePond
                                                files={coverImageFiles}
                                                onupdatefiles={handleCoverImageFileUpdate}
                                                allowMultiple={false}
                                                maxFiles={1}
                                                name="coverImage"
                                                labelIdle='Drag & Drop cover image or <span class="filepond--label-action">Browse</span>'
                                                acceptedFileTypes={['image/*']}
                                                imagePreviewHeight={100}
                                                credits={false}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>School Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter school name"
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Tagline</Label>
                                            <Input
                                                name="tagline"
                                                value={formData.tagline}
                                                onChange={handleInputChange}
                                                placeholder="Enter school tagline"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Category <span className="text-danger">*</span></Label>
                                            <Select
                                                value={categoryOptions.find(option => option.value === formData.category) || null}
                                                onChange={(selected) => setFormData(prev => ({
                                                    ...prev,
                                                    category: selected ? selected.value : ""
                                                }))}
                                                options={categoryOptions}
                                                placeholder="Select category"
                                                isClearable
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Dean</Label>
                                            <Select
                                                value={staffOptions.find(option => option.value === formData.dean) || null}
                                                onChange={(selected) => setFormData(prev => ({
                                                    ...prev,
                                                    dean: selected ? selected.value : ""
                                                }))}
                                                options={staffOptions}
                                                placeholder="Select dean"
                                                isClearable
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Order</Label>
                                            <Input
                                                type="number"
                                                name="order"
                                                value={formData.order}
                                                onChange={handleInputChange}
                                                min="0"
                                                placeholder="Display order"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Short Description</Label>
                                            <Input
                                                type="textarea"
                                                name="shortDescription"
                                                value={formData.shortDescription}
                                                onChange={handleInputChange}
                                                placeholder="Enter short description about the school"
                                                rows="3"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 2: Contact & Facts */}
                            <TabPane tabId="2">
                                <Row>
                                    <Col md={12}>
                                        <h6>Contact Information</h6>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Phone</Label>
                                            <Input
                                                value={formData.contactInfo.phone}
                                                onChange={(e) => handleNestedChange('contactInfo', 'phone', e.target.value)}
                                                placeholder="Enter phone number"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                value={formData.contactInfo.email}
                                                onChange={(e) => handleNestedChange('contactInfo', 'email', e.target.value)}
                                                placeholder="Enter email address"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Location</Label>
                                            <Input
                                                value={formData.contactInfo.location}
                                                onChange={(e) => handleNestedChange('contactInfo', 'location', e.target.value)}
                                                placeholder="Enter location"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Website</Label>
                                            <Input
                                                type="url"
                                                value={formData.contactInfo.website}
                                                onChange={(e) => handleNestedChange('contactInfo', 'website', e.target.value)}
                                                placeholder="https://example.com"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Facts & Figures</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Academic Staff</Label>
                                            <Input
                                                type="number"
                                                value={formData.facts_and_figures.academic_staff}
                                                onChange={(e) => handleNestedChange('facts_and_figures', 'academic_staff', e.target.value)}
                                                placeholder="Number of staff"
                                                min="0"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Student Population</Label>
                                            <Input
                                                value={formData.facts_and_figures.student_population}
                                                onChange={(e) => handleNestedChange('facts_and_figures', 'student_population', e.target.value)}
                                                placeholder="e.g., 1000+ students"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Founded Year</Label>
                                            <Input
                                                value={formData.facts_and_figures.founded_year}
                                                onChange={(e) => handleNestedChange('facts_and_figures', 'founded_year', e.target.value)}
                                                placeholder="e.g., 1995"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 3: Mission & Vision */}
                            <TabPane tabId="3">
                                <Row>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Mission</Label>
                                            <Input
                                                type="textarea"
                                                name="mission"
                                                value={formData.mission}
                                                onChange={handleInputChange}
                                                placeholder="Enter school mission"
                                                rows="4"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Vision</Label>
                                            <Input
                                                type="textarea"
                                                name="vision"
                                                value={formData.vision}
                                                onChange={handleInputChange}
                                                placeholder="Enter school vision"
                                                rows="4"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 4: Testimonials */}
                            <TabPane tabId="4">
                                {formData.student_testimonials.map((testimonial, index) => (
                                    <Card key={index} className="mb-3">
                                        <CardHeader className="d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0">Testimonial #{index + 1}</h6>
                                            {formData.student_testimonials.length > 1 && (
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    onClick={() => removeArrayItem('student_testimonials', index)}
                                                >
                                                    <i className="ri-delete-bin-line" />
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardBody>
                                            <Row>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Student Name</Label>
                                                        <Input
                                                            value={testimonial.student_name}
                                                            onChange={(e) => handleArrayFieldChange('student_testimonials', index, 'student_name', e.target.value)}
                                                            placeholder="Enter student name"
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Program</Label>
                                                        <Input
                                                            value={testimonial.student_program_shortName}
                                                            onChange={(e) => handleArrayFieldChange('student_testimonials', index, 'student_program_shortName', e.target.value)}
                                                            placeholder="Enter program name"
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={12}>
                                                    <FormGroup>
                                                        <Label>Testimonial Message</Label>
                                                        <Input
                                                            type="textarea"
                                                            value={testimonial.message}
                                                            onChange={(e) => handleArrayFieldChange('student_testimonials', index, 'message', e.target.value)}
                                                            placeholder="Enter testimonial message"
                                                            rows="3"
                                                        />
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>
                                ))}
                                <Button
                                    color="light"
                                    onClick={() => addArrayItem('student_testimonials', {
                                        student_name: "",
                                        message: "",
                                        student_program_shortName: ""
                                    })}
                                >
                                    <i className="ri-add-line me-1" /> Add Another Testimonial
                                </Button>
                            </TabPane>

                            {/* Tab 5: Section Settings */}
                            <TabPane tabId="5">
                                <Row>
                                    <Col md={12}>
                                        <h6>Programs Section</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Title</Label>
                                            <Input
                                                name="programs_sec_title"
                                                value={formData.programs_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Section title"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Icon Class</Label>
                                            <Input
                                                name="programs_sec_icon"
                                                value={formData.programs_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-book-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Subtitle</Label>
                                            <Input
                                                name="programs_sec_subtitle"
                                                value={formData.programs_sec_subtitle}
                                                onChange={handleInputChange}
                                                placeholder="Section subtitle"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Vision & Mission Section</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Title</Label>
                                            <Input
                                                name="vison_and_mission_sec_title"
                                                value={formData.vison_and_mission_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Section title"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Icon Class</Label>
                                            <Input
                                                name="vison_and_mission_sec_icon"
                                                value={formData.vison_and_mission_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-eye-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Subtitle</Label>
                                            <Input
                                                name="vison_and_mission_sec_subtitle"
                                                value={formData.vison_and_mission_sec_subtitle}
                                                onChange={handleInputChange}
                                                placeholder="Section subtitle"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Dean's Message Section</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Title</Label>
                                            <Input
                                                name="dean_message_sec_title"
                                                value={formData.dean_message_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Section title"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Icon Class</Label>
                                            <Input
                                                name="dean_message_sec_icon"
                                                value={formData.dean_message_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-user-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Subtitle</Label>
                                            <Input
                                                name="dean_message_sec_subtitle"
                                                value={formData.dean_message_sec_subtitle}
                                                onChange={handleInputChange}
                                                placeholder="Section subtitle"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Message Text</Label>
                                            <Input
                                                type="textarea"
                                                name="dean_message_sec_text"
                                                value={formData.dean_message_sec_text}
                                                onChange={handleInputChange}
                                                placeholder="Dean's message text"
                                                rows="3"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Facts Section</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Title</Label>
                                            <Input
                                                name="facts_message_sec_title"
                                                value={formData.facts_message_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Section title"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Icon Class</Label>
                                            <Input
                                                name="facts_message_sec_icon"
                                                value={formData.facts_message_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-bar-chart-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Subtitle</Label>
                                            <Input
                                                name="facts_message_sec_subtitle"
                                                value={formData.facts_message_sec_subtitle}
                                                onChange={handleInputChange}
                                                placeholder="Section subtitle"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Testimonials Section</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Title</Label>
                                            <Input
                                                name="testimonials_message_sec_title"
                                                value={formData.testimonials_message_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Section title"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Icon Class</Label>
                                            <Input
                                                name="testimonials_message_sec_icon"
                                                value={formData.testimonials_message_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-chat-quote-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Subtitle</Label>
                                            <Input
                                                name="testimonials_message_sec_subtitle"
                                                value={formData.testimonials_message_sec_subtitle}
                                                onChange={handleInputChange}
                                                placeholder="Section subtitle"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Contact Section</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Title</Label>
                                            <Input
                                                name="contact_message_sec_title"
                                                value={formData.contact_message_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Section title"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Icon Class</Label>
                                            <Input
                                                name="contact_message_sec_icon"
                                                value={formData.contact_message_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-contacts-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Subtitle</Label>
                                            <Input
                                                name="contact_message_sec_subtitle"
                                                value={formData.contact_message_sec_subtitle}
                                                onChange={handleInputChange}
                                                placeholder="Section subtitle"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>
                        </TabContent>
                    </ModalBody>
                    <ModalFooter>
                        <div className="w-100 d-flex justify-content-between">
                            <div>
                                {activeTab !== '1' && (
                                    <Button color="light" onClick={() => setActiveTab((parseInt(activeTab) - 1).toString())}>
                                        <i className="ri-arrow-left-line me-1" /> Previous
                                    </Button>
                                )}
                            </div>
                            <div>
                                {activeTab !== '5' ? (
                                    <Button color="primary" onClick={() => setActiveTab((parseInt(activeTab) + 1).toString())}>
                                        Next <i className="ri-arrow-right-line ms-1" />
                                    </Button>
                                ) : (
                                    <Button color="success" type="submit">
                                        {isEdit ? 'Update School' : 'Add School'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* View Modal */}
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl" centered className="modal-fullscreen-lg-down">
                <ModalHeader toggle={() => setViewModal(false)} className="bg-light border-bottom">
                    <div className="d-flex align-items-center">
                        <div className="flex-shrink-0">
                            {selectedSchool?.logoUrl ? (
                                <img
                                    src={selectedSchool.logoUrl}
                                    alt={selectedSchool.name}
                                    className="rounded me-3"
                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="avatar-title bg-primary bg-opacity-10 text-primary rounded me-3">
                                    <i className="ri-building-line fs-5" />
                                </div>
                            )}
                        </div>
                        <div className="flex-grow-1">
                            <h5 className="modal-title mb-0">{selectedSchool?.name}</h5>
                            <small className="text-muted">School Details</small>
                        </div>
                    </div>
                </ModalHeader>
                <ModalBody className="p-0">
                    {selectedSchool && (
                        <div className="school-details-container">
                            {/* Header Section with Cover Image */}
                            {selectedSchool.coverImage && (
                                <div className="school-cover-section position-relative">
                                    <img
                                        src={selectedSchool.coverImage}
                                        alt="Cover"
                                        className="img-fluid w-100"
                                        style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                                    />
                                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-25 d-flex align-items-center justify-content-center">
                                        <div className="text-center text-white">
                                            <h3 className="mb-1 text-white">{selectedSchool.name}</h3>
                                            {selectedSchool.tagline && (
                                                <p className="mb-0 fs-5">{selectedSchool.tagline}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step Navigation */}
                            <div className="step-arrow-nav border-bottom bg-white sticky-top" style={{ top: 0, zIndex: 1020 }}>
                                <Nav className="nav-pills custom-nav nav-justified" role="tablist">
                                    <NavItem>
                                        <NavLink
                                            className={`d-flex align-items-center justify-content-center py-3 ${activeTab === '1' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('1')}
                                        >
                                            <i className="ri-building-line me-2 fs-5"></i>
                                            <span>Basic Info</span>
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={`d-flex align-items-center justify-content-center py-3 ${activeTab === '2' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('2')}
                                        >
                                            <i className="ri-contacts-line me-2 fs-5"></i>
                                            <span>Contact & Facts</span>
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={`d-flex align-items-center justify-content-center py-3 ${activeTab === '3' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('3')}
                                        >
                                            <i className="ri-file-paper-line me-2 fs-5"></i>
                                            <span>Mission & Vision</span>
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={`d-flex align-items-center justify-content-center py-3 ${activeTab === '4' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('4')}
                                        >
                                            <i className="ri-chat-quote-line me-2 fs-5"></i>
                                            <span>Testimonials</span>
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={`d-flex align-items-center justify-content-center py-3 ${activeTab === '5' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('5')}
                                        >
                                            <i className="ri-settings-3-line me-2 fs-5"></i>
                                            <span>Section Settings</span>
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                            </div>

                            {/* Tab Content */}
                            <div className="tab-content p-4" style={{ maxHeight: 'calc(70vh - 140px)', overflowY: 'auto' }}>
                                <TabContent activeTab={activeTab}>
                                    {/* Tab 1: Basic Information */}
                                    <TabPane tabId="1">
                                        <Row className="g-4">
                                            <Col lg={4}>
                                                <Card className="border-0 shadow-sm">
                                                    <CardBody className="text-center p-4">
                                                        {selectedSchool.logoUrl ? (
                                                            <img
                                                                src={selectedSchool.logoUrl}
                                                                alt={selectedSchool.name}
                                                                className="rounded-circle mb-3 img-thumbnail border"
                                                                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div className="avatar-title bg-light text-secondary rounded-circle display-4 mb-3" style={{ width: '120px', height: '120px', lineHeight: '120px' }}>
                                                                <i className="ri-building-line" />
                                                            </div>
                                                        )}
                                                        <h5 className="mb-2">{selectedSchool.name}</h5>
                                                        {selectedSchool.tagline && (
                                                            <p className="text-primary mb-3">{selectedSchool.tagline}</p>
                                                        )}
                                                        <div className="d-flex justify-content-center gap-2 mb-3">
                                                            <Badge color="primary" className="fs-6">Order: {selectedSchool.order}</Badge>
                                                            {selectedSchool.category && (
                                                                <Badge color="success" className="fs-6">{selectedSchool.category.name}</Badge>
                                                            )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col lg={8}>
                                                <Card className="border-0 shadow-sm">
                                                    <CardHeader className="bg-light">
                                                        <h6 className="mb-0">
                                                            <i className="ri-information-line me-2"></i>
                                                            School Information
                                                        </h6>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <Row className="g-3">
                                                            <Col sm={6}>
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-bookmark-line text-primary me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Category</small>
                                                                        <strong>{selectedSchool.category?.name || 'Not specified'}</strong>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col sm={6}>
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-user-line text-primary me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Dean</small>
                                                                        <strong>{selectedSchool.dean?.name || 'Not assigned'}</strong>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            <Col sm={6}>
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-list-ordered text-primary me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Display Order</small>
                                                                        <strong>{selectedSchool.order}</strong>
                                                                    </div>
                                                                </div>
                                                            </Col>
                                                            {selectedSchool.facts_and_figures?.founded_year && (
                                                                <Col sm={6}>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="ri-calendar-line text-primary me-3 fs-5"></i>
                                                                        <div>
                                                                            <small className="text-muted d-block">Founded</small>
                                                                            <strong>{selectedSchool.facts_and_figures.founded_year}</strong>
                                                                        </div>
                                                                    </div>
                                                                </Col>
                                                            )}
                                                        </Row>
                                                    </CardBody>
                                                </Card>

                                                {selectedSchool.shortDescription && (
                                                    <Card className="border-0 shadow-sm mt-3">
                                                        <CardHeader className="bg-light">
                                                            <h6 className="mb-0">
                                                                <i className="ri-file-text-line me-2"></i>
                                                                Description
                                                            </h6>
                                                        </CardHeader>
                                                        <CardBody>
                                                            <p className="mb-0">{selectedSchool.shortDescription}</p>
                                                        </CardBody>
                                                    </Card>
                                                )}
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* Tab 2: Contact & Facts */}
                                    <TabPane tabId="2">
                                        <Row className="g-4">
                                            <Col lg={6}>
                                                <Card className="border-0 shadow-sm h-100">
                                                    <CardHeader className="bg-light">
                                                        <h6 className="mb-0">
                                                            <i className="ri-contacts-line me-2"></i>
                                                            Contact Information
                                                        </h6>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <div className="space-y-3">
                                                            {selectedSchool.contactInfo?.phone && (
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-phone-line text-success me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Phone</small>
                                                                        <strong>{selectedSchool.contactInfo.phone}</strong>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedSchool.contactInfo?.email && (
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-mail-line text-success me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Email</small>
                                                                        <strong>{selectedSchool.contactInfo.email}</strong>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedSchool.contactInfo?.location && (
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-map-pin-line text-success me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Location</small>
                                                                        <strong>{selectedSchool.contactInfo.location}</strong>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedSchool.contactInfo?.website && (
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-global-line text-success me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Website</small>
                                                                        <a href={selectedSchool.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                                            <strong>{selectedSchool.contactInfo.website}</strong>
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!selectedSchool.contactInfo?.phone && !selectedSchool.contactInfo?.email &&
                                                                !selectedSchool.contactInfo?.location && !selectedSchool.contactInfo?.website && (
                                                                    <div className="text-center text-muted py-4">
                                                                        <i className="ri-information-line display-4"></i>
                                                                        <p className="mt-2 mb-0">No contact information available</p>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col lg={6}>
                                                <Card className="border-0 shadow-sm h-100">
                                                    <CardHeader className="bg-light">
                                                        <h6 className="mb-0">
                                                            <i className="ri-bar-chart-line me-2"></i>
                                                            Facts & Figures
                                                        </h6>
                                                    </CardHeader>
                                                    <CardBody>
                                                        <div className="space-y-3">
                                                            {selectedSchool.facts_and_figures?.academic_staff && (
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-user-star-line text-warning me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Academic Staff</small>
                                                                        <strong>{selectedSchool.facts_and_figures.academic_staff}</strong>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedSchool.facts_and_figures?.student_population && (
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-group-line text-warning me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Student Population</small>
                                                                        <strong>{selectedSchool.facts_and_figures.student_population}</strong>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedSchool.facts_and_figures?.founded_year && (
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ri-calendar-line text-warning me-3 fs-5"></i>
                                                                    <div>
                                                                        <small className="text-muted d-block">Founded Year</small>
                                                                        <strong>{selectedSchool.facts_and_figures.founded_year}</strong>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!selectedSchool.facts_and_figures?.academic_staff &&
                                                                !selectedSchool.facts_and_figures?.student_population &&
                                                                !selectedSchool.facts_and_figures?.founded_year && (
                                                                    <div className="text-center text-muted py-4">
                                                                        <i className="ri-bar-chart-line display-4"></i>
                                                                        <p className="mt-2 mb-0">No facts & figures available</p>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* Tab 3: Mission & Vision */}
                                    <TabPane tabId="3">
                                        <Row className="g-4">
                                            <Col lg={6}>
                                                <Card className="border-0 shadow-sm h-100">
                                                    <CardHeader className="bg-light">
                                                        <h6 className="mb-0">
                                                            <i className="ri-target-line text-info me-2"></i>
                                                            Mission Statement
                                                        </h6>
                                                    </CardHeader>
                                                    <CardBody>
                                                        {selectedSchool.mission ? (
                                                            <div className="mission-content">
                                                                {selectedSchool.mission.split('\n').map((paragraph, index) => (
                                                                    <p key={index} className="mb-3">{paragraph}</p>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-muted py-4">
                                                                <i className="ri-information-line display-4"></i>
                                                                <p className="mt-2 mb-0">No mission statement provided</p>
                                                            </div>
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                            <Col lg={6}>
                                                <Card className="border-0 shadow-sm h-100">
                                                    <CardHeader className="bg-light">
                                                        <h6 className="mb-0">
                                                            <i className="ri-eye-line text-info me-2"></i>
                                                            Vision Statement
                                                        </h6>
                                                    </CardHeader>
                                                    <CardBody>
                                                        {selectedSchool.vision ? (
                                                            <div className="vision-content">
                                                                {selectedSchool.vision.split('\n').map((paragraph, index) => (
                                                                    <p key={index} className="mb-3">{paragraph}</p>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="text-center text-muted py-4">
                                                                <i className="ri-information-line display-4"></i>
                                                                <p className="mt-2 mb-0">No vision statement provided</p>
                                                            </div>
                                                        )}
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </TabPane>

                                    {/* Tab 4: Testimonials */}
                                    <TabPane tabId="4">
                                        {selectedSchool.student_testimonials?.length > 0 ? (
                                            <Row className="g-4">
                                                {selectedSchool.student_testimonials.map((testimonial, index) => (
                                                    <Col lg={6} key={index}>
                                                        <Card className="border-0 shadow-sm testimonial-card h-100">
                                                            <CardBody className="p-4">
                                                                <div className="d-flex align-items-start mb-3">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="avatar-sm">
                                                                            <div className="avatar-title bg-primary bg-opacity-10 text-primary rounded-circle">
                                                                                <i className="ri-user-line"></i>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 ms-3">
                                                                        <h6 className="mb-1">{testimonial.student_name}</h6>
                                                                        <p className="text-primary mb-0 small">{testimonial.student_program_shortName}</p>
                                                                    </div>
                                                                </div>
                                                                <blockquote className="mb-0">
                                                                    <i className="ri-double-quotes-l text-muted me-1"></i>
                                                                    <span className="fst-italic">{testimonial.message}</span>
                                                                    <i className="ri-double-quotes-r text-muted ms-1"></i>
                                                                </blockquote>
                                                            </CardBody>
                                                        </Card>
                                                    </Col>
                                                ))}
                                            </Row>
                                        ) : (
                                            <Card className="border-0 shadow-sm">
                                                <CardBody className="text-center py-5">
                                                    <i className="ri-chat-quote-line display-4 text-muted"></i>
                                                    <h5 className="mt-3 text-muted">No Testimonials</h5>
                                                    <p className="text-muted mb-0">No student testimonials have been added for this school.</p>
                                                </CardBody>
                                            </Card>
                                        )}
                                    </TabPane>

                                    {/* Tab 5: Section Settings */}
                                    <TabPane tabId="5">
                                        <Row className="g-4">
                                            {[
                                                {
                                                    title: 'Programs Section',
                                                    data: selectedSchool.programs_sec_title || selectedSchool.programs_sec_icon || selectedSchool.programs_sec_subtitle,
                                                    fields: [
                                                        { label: 'Title', value: selectedSchool.programs_sec_title },
                                                        { label: 'Icon', value: selectedSchool.programs_sec_icon },
                                                        { label: 'Subtitle', value: selectedSchool.programs_sec_subtitle }
                                                    ],
                                                    icon: 'ri-book-line',
                                                    color: 'primary'
                                                },
                                                {
                                                    title: 'Vision & Mission Section',
                                                    data: selectedSchool.vison_and_mission_sec_title || selectedSchool.vison_and_mission_sec_icon || selectedSchool.vison_and_mission_sec_subtitle,
                                                    fields: [
                                                        { label: 'Title', value: selectedSchool.vison_and_mission_sec_title },
                                                        { label: 'Icon', value: selectedSchool.vison_and_mission_sec_icon },
                                                        { label: 'Subtitle', value: selectedSchool.vison_and_mission_sec_subtitle }
                                                    ],
                                                    icon: 'ri-eye-line',
                                                    color: 'success'
                                                },
                                                {
                                                    title: 'Dean\'s Message Section',
                                                    data: selectedSchool.dean_message_sec_title || selectedSchool.dean_message_sec_icon || selectedSchool.dean_message_sec_subtitle || selectedSchool.dean_message_sec_text,
                                                    fields: [
                                                        { label: 'Title', value: selectedSchool.dean_message_sec_title },
                                                        { label: 'Icon', value: selectedSchool.dean_message_sec_icon },
                                                        { label: 'Subtitle', value: selectedSchool.dean_message_sec_subtitle },
                                                        { label: 'Message', value: selectedSchool.dean_message_sec_text }
                                                    ],
                                                    icon: 'ri-user-line',
                                                    color: 'info'
                                                },
                                                {
                                                    title: 'Facts Section',
                                                    data: selectedSchool.facts_message_sec_title || selectedSchool.facts_message_sec_icon || selectedSchool.facts_message_sec_subtitle,
                                                    fields: [
                                                        { label: 'Title', value: selectedSchool.facts_message_sec_title },
                                                        { label: 'Icon', value: selectedSchool.facts_message_sec_icon },
                                                        { label: 'Subtitle', value: selectedSchool.facts_message_sec_subtitle }
                                                    ],
                                                    icon: 'ri-bar-chart-line',
                                                    color: 'warning'
                                                },
                                                {
                                                    title: 'Testimonials Section',
                                                    data: selectedSchool.testimonials_message_sec_title || selectedSchool.testimonials_message_sec_icon || selectedSchool.testimonials_message_sec_subtitle,
                                                    fields: [
                                                        { label: 'Title', value: selectedSchool.testimonials_message_sec_title },
                                                        { label: 'Icon', value: selectedSchool.testimonials_message_sec_icon },
                                                        { label: 'Subtitle', value: selectedSchool.testimonials_message_sec_subtitle }
                                                    ],
                                                    icon: 'ri-chat-quote-line',
                                                    color: 'danger'
                                                },
                                                {
                                                    title: 'Contact Section',
                                                    data: selectedSchool.contact_message_sec_title || selectedSchool.contact_message_sec_icon || selectedSchool.contact_message_sec_subtitle,
                                                    fields: [
                                                        { label: 'Title', value: selectedSchool.contact_message_sec_title },
                                                        { label: 'Icon', value: selectedSchool.contact_message_sec_icon },
                                                        { label: 'Subtitle', value: selectedSchool.contact_message_sec_subtitle }
                                                    ],
                                                    icon: 'ri-contacts-line',
                                                    color: 'secondary'
                                                }
                                            ].map((section, index) => (
                                                <Col lg={6} key={index}>
                                                    <Card className={`border-0 shadow-sm border-${section.data ? section.color : 'light'}`}>
                                                        <CardHeader className={`bg-${section.color} bg-opacity-10 border-0`}>
                                                            <h6 className="mb-0">
                                                                <i className={`${section.icon} text-${section.color} me-2`}></i>
                                                                {section.title}
                                                            </h6>
                                                        </CardHeader>
                                                        <CardBody>
                                                            {section.data ? (
                                                                <div className="space-y-2">
                                                                    {section.fields.map((field, fieldIndex) => (
                                                                        field.value && (
                                                                            <div key={fieldIndex}>
                                                                                <small className="text-muted d-block">{field.label}</small>
                                                                                <strong>{field.value}</strong>
                                                                            </div>
                                                                        )
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center text-muted py-2">
                                                                    <small>No settings configured</small>
                                                                </div>
                                                            )}
                                                        </CardBody>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    </TabPane>
                                </TabContent>
                            </div>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter className="bg-light border-top">
                    <Button color="light" onClick={() => setViewModal(false)} className="d-flex align-items-center">
                        <i className="ri-close-line me-2"></i>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteSchool}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default SchoolsPage;
