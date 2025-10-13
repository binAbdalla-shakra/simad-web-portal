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
            name: 'Name',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'Tagline',
            selector: row => row.tagline || 'N/A',
            wrap: true,
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
                <div className="d-flex gap-2">
                    <Button
                        color="soft-info"
                        size="sm"
                        onClick={() => handleView(row)}
                        title="View Details"
                    >
                        <i className="ri-eye-line" />
                    </Button>
                    <Button
                        color="soft-primary"
                        size="sm"
                        onClick={() => handleEdit(row)}
                        title="Edit"
                    >
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button
                        color="soft-danger"
                        size="sm"
                        onClick={() => {
                            setSelectedSchool(row);
                            setDeleteModal(true);
                        }}
                        title="Delete"
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

                {/* Filter Controls */}
                <Card className="mb-3">
                    <CardBody>
                        <Row>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Search</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by name, tagline, or description"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            {/* <Col md={4}>
                                <FormGroup>
                                    <Label>Category</Label>
                                    <Input
                                        type="select"
                                        name="category"
                                        value={filters.category}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Categories</option>
                                        {categoryOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col> */}
                        </Row>
                    </CardBody>
                </Card>

                {/* Schools Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Schools List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add School
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
                                highlightOnHover
                                responsive
                                noDataComponent="No schools found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={handleModalClose} unmountOnClose={false} size="xl" scrollable>
                <ModalHeader toggle={handleModalClose}>
                    {isEdit ? 'Edit School' : 'Add New School'}
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
            <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="xl" scrollable>
                <ModalHeader toggle={() => setViewModal(false)}>
                    School Details - {selectedSchool?.name}
                </ModalHeader>
                <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedSchool && (
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
                                        <Col md={4} className="text-center mb-3">
                                            {selectedSchool.logoUrl ? (
                                                <img
                                                    src={selectedSchool.logoUrl}
                                                    alt={selectedSchool.name}
                                                    className="img-thumbnail"
                                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="avatar-title bg-light text-secondary rounded-circle display-4">
                                                    <i className="ri-building-line" />
                                                </div>
                                            )}
                                            <h6 className="mt-2">School Logo</h6>
                                        </Col>
                                        <Col md={8}>
                                            <h4>{selectedSchool.name}</h4>
                                            {selectedSchool.tagline && (
                                                <h5 className="text-primary">{selectedSchool.tagline}</h5>
                                            )}
                                            <div className="mt-3">
                                                <p><strong>Category:</strong> {selectedSchool.category?.name || 'N/A'}</p>
                                                <p><strong>Dean:</strong> {selectedSchool.dean?.name || 'N/A'}</p>
                                                <p><strong>Order:</strong> {selectedSchool.order}</p>
                                            </div>
                                        </Col>
                                        <Col md={12} className="mt-3">
                                            {selectedSchool.coverImage && (
                                                <div className="mb-3">
                                                    <img
                                                        src={selectedSchool.coverImage}
                                                        alt="Cover"
                                                        className="img-fluid rounded"
                                                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                                                    />
                                                    <h6 className="text-center mt-2">Cover Image</h6>
                                                </div>
                                            )}
                                            {selectedSchool.shortDescription && (
                                                <div>
                                                    <h6>Description</h6>
                                                    <p>{selectedSchool.shortDescription}</p>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 2: Contact & Facts */}
                                <TabPane tabId="2">
                                    <Row>
                                        <Col md={6}>
                                            <h6>Contact Information</h6>
                                            <p><strong>Phone:</strong> {selectedSchool.contactInfo?.phone || 'N/A'}</p>
                                            <p><strong>Email:</strong> {selectedSchool.contactInfo?.email || 'N/A'}</p>
                                            <p><strong>Location:</strong> {selectedSchool.contactInfo?.location || 'N/A'}</p>
                                            <p><strong>Website:</strong> {selectedSchool.contactInfo?.website || 'N/A'}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6>Facts & Figures</h6>
                                            <p><strong>Academic Staff:</strong> {selectedSchool.facts_and_figures?.academic_staff || 'N/A'}</p>
                                            <p><strong>Student Population:</strong> {selectedSchool.facts_and_figures?.student_population || 'N/A'}</p>
                                            <p><strong>Founded Year:</strong> {selectedSchool.facts_and_figures?.founded_year || 'N/A'}</p>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 3: Mission & Vision */}
                                <TabPane tabId="3">
                                    <Row>
                                        <Col md={6}>
                                            <h6>Mission</h6>
                                            <p>{selectedSchool.mission || 'No mission provided'}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6>Vision</h6>
                                            <p>{selectedSchool.vision || 'No vision provided'}</p>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 4: Testimonials */}
                                <TabPane tabId="4">
                                    {selectedSchool.student_testimonials?.length > 0 ? (
                                        selectedSchool.student_testimonials.map((testimonial, index) => (
                                            <Card key={index} className="mb-3">
                                                <CardBody>
                                                    <h6>{testimonial.student_name}</h6>
                                                    <p className="text-primary mb-2">{testimonial.student_program_shortName}</p>
                                                    <p className="fst-italic">"{testimonial.message}"</p>
                                                </CardBody>
                                            </Card>
                                        ))
                                    ) : (
                                        <p>No testimonials recorded.</p>
                                    )}
                                </TabPane>

                                {/* Tab 5: Section Settings */}
                                <TabPane tabId="5">
                                    <Row>
                                        <Col md={6}>
                                            <h6>Programs Section</h6>
                                            <p><strong>Title:</strong> {selectedSchool.programs_sec_title || 'N/A'}</p>
                                            <p><strong>Icon:</strong> {selectedSchool.programs_sec_icon || 'N/A'}</p>
                                            <p><strong>Subtitle:</strong> {selectedSchool.programs_sec_subtitle || 'N/A'}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6>Vision & Mission Section</h6>
                                            <p><strong>Title:</strong> {selectedSchool.vison_and_mission_sec_title || 'N/A'}</p>
                                            <p><strong>Icon:</strong> {selectedSchool.vison_and_mission_sec_icon || 'N/A'}</p>
                                            <p><strong>Subtitle:</strong> {selectedSchool.vison_and_mission_sec_subtitle || 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mt-3">
                                            <h6>Dean's Message Section</h6>
                                            <p><strong>Title:</strong> {selectedSchool.dean_message_sec_title || 'N/A'}</p>
                                            <p><strong>Icon:</strong> {selectedSchool.dean_message_sec_icon || 'N/A'}</p>
                                            <p><strong>Subtitle:</strong> {selectedSchool.dean_message_sec_subtitle || 'N/A'}</p>
                                            <p><strong>Message:</strong> {selectedSchool.dean_message_sec_text || 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mt-3">
                                            <h6>Facts Section</h6>
                                            <p><strong>Title:</strong> {selectedSchool.facts_message_sec_title || 'N/A'}</p>
                                            <p><strong>Icon:</strong> {selectedSchool.facts_message_sec_icon || 'N/A'}</p>
                                            <p><strong>Subtitle:</strong> {selectedSchool.facts_message_sec_subtitle || 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mt-3">
                                            <h6>Testimonials Section</h6>
                                            <p><strong>Title:</strong> {selectedSchool.testimonials_message_sec_title || 'N/A'}</p>
                                            <p><strong>Icon:</strong> {selectedSchool.testimonials_message_sec_icon || 'N/A'}</p>
                                            <p><strong>Subtitle:</strong> {selectedSchool.testimonials_message_sec_subtitle || 'N/A'}</p>
                                        </Col>
                                        <Col md={6} className="mt-3">
                                            <h6>Contact Section</h6>
                                            <p><strong>Title:</strong> {selectedSchool.contact_message_sec_title || 'N/A'}</p>
                                            <p><strong>Icon:</strong> {selectedSchool.contact_message_sec_icon || 'N/A'}</p>
                                            <p><strong>Subtitle:</strong> {selectedSchool.contact_message_sec_subtitle || 'N/A'}</p>
                                        </Col>
                                    </Row>
                                </TabPane>
                            </TabContent>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="light" onClick={() => setViewModal(false)}>
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

// import React, { useState, useEffect } from 'react';
// import DataTable, { createTheme } from "react-data-table-component";
// import Select from "react-select";
// import {
//     Card, CardHeader, CardBody,
//     Col, Container, Row,
//     Form, Input, Label, FormGroup,
//     Modal, ModalBody, ModalFooter, ModalHeader,
//     Button, Badge
// } from "reactstrap";
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import BreadCrumb from "../../../Components/Common/BreadCrumb";
// import DeleteModal from "../../../Components/Common/DeleteModal";
// import Loader from "../../../Components/Common/Loader";
// import * as Yup from 'yup';
// import { useFormik } from 'formik';
// import { api } from "../../../config";
// import { createSelector } from 'reselect';
// import { useSelector } from 'react-redux';

// const Schools = () => {
//     document.title = "Schools | simad University";

//     const selectLayoutState = (state) => state.Layout;
//     const selectLayoutProperties = createSelector(
//         selectLayoutState,
//         (layout) => ({
//             layoutThemeType: layout.layoutThemeType,
//             layoutModeType: layout.layoutModeType,
//         })
//     );
//     // Inside your component
//     const {
//         layoutModeType,
//         layoutThemeType,
//     } = useSelector(selectLayoutProperties);

//     createTheme('customDark', {
//         text: {
//             primary: '#ffffff',
//             secondary: '#9e9e9e',
//         },
//         background: {
//             default: '#212529',
//         },
//         context: {
//             background: '#333',
//             text: '#FFFFFF',
//         },
//         divider: {
//             default: '#444',
//         },
//     }, 'dark'); // 'dark' makes it inherit dark base



//     // State management
//     const [schools, setSchools] = useState([]);
//     const [categories, setCategories] = useState([]);
//     const [staff, setStaff] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [modal, setModal] = useState(false);
//     const [viewModal, setViewModal] = useState(false);
//     const [deleteModal, setDeleteModal] = useState(false);
//     const [isEdit, setIsEdit] = useState(false);
//     const [selectedSchool, setSelectedSchool] = useState(null);

//     // Filters state
//     const [filters, setFilters] = useState({
//         search: '',
//         status: ''
//     });

//     // Options for selects
//     const statusOptions = [
//         { value: "", label: "All Statuses" },
//         { value: "Active", label: "Active" },
//         { value: "Inactive", label: "Inactive" }
//     ];

//     // Validation schema with Yup
//     const validationSchema = Yup.object().shape({
//         name: Yup.string()
//             .required("School name is required")
//             .min(3, "School name must be at least 3 characters")
//             .max(100, "School name must be less than 100 characters"),
//         tagline: Yup.string()
//             .max(200, "Tagline must be less than 200 characters"),
//         description: Yup.string(),
//         shortDescription: Yup.string()
//             .max(300, "Short description must be less than 300 characters"),
//         logoUrl: Yup.string(),
//         // .url("Logo URL must be a valid URL"),
//         coverImage: Yup.string(),
//         // .url("Cover image URL must be a valid URL"),
//         dean: Yup.string(),
//         category: Yup.string()
//             .required("Category is required"),
//         contactInfo: Yup.object().shape({
//             phone: Yup.string(),
//             email: Yup.string()
//                 .email("Contact email must be a valid email"),
//             location: Yup.string(),
//             website: Yup.string(),
//             // .url("Website must be a valid URL")
//         }),
//         mission: Yup.string(),
//         vision: Yup.string(),
//         isActive: Yup.boolean(),
//         order: Yup.number()
//             .min(0, "Order must be a positive number")
//             .integer("Order must be an integer")
//     });

//     // Formik setup
//     const formik = useFormik({
//         initialValues: {
//             name: "",
//             tagline: "",
//             description: "",
//             shortDescription: "",
//             logoUrl: "",
//             coverImage: "",
//             dean: "",
//             category: "",
//             contactInfo: {
//                 phone: "",
//                 email: "",
//                 location: "",
//                 website: ""
//             },
//             mission: "",
//             vision: "",
//             facilities: [],
//             isActive: true,
//             order: 0
//         },
//         validationSchema,
//         onSubmit: (values) => {
//             if (isEdit) {
//                 updateSchool(values);
//             } else {
//                 createSchool(values);
//             }
//         }
//     });

//     // Fetch schools from API
//     const fetchSchools = async () => {
//         setLoading(true);
//         try {
//             const response = await fetch(`${api.API_URL}/schools`);
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
//             const data = await response.json();
//             setSchools(data.data.schools || data);
//         } catch (error) {
//             console.error("Error fetching schools:", error);
//             toast.error(`Error loading schools: ${error.message}`);
//         } finally {
//             setLoading(false);
//         }
//     };

//     // Fetch categories from API
//     const fetchCategories = async () => {
//         try {
//             const response = await fetch(`${api.API_URL}/program-categories`);
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
//             const data = await response.json();
//             setCategories(data.data.categories || data);
//         } catch (error) {
//             console.error("Error fetching categories:", error);
//             toast.error(`Error loading categories: ${error.message}`);
//         }
//     };

//     // Fetch staff from API
//     const fetchStaff = async () => {
//         try {
//             const response = await fetch(`${api.API_URL}/staff`);
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
//             const data = await response.json();
//             setStaff(data.data.staff || data);
//         } catch (error) {
//             console.error("Error fetching staff:", error);
//             toast.error(`Error loading staff: ${error.message}`);
//         }
//     };

//     // Create new school
//     const createSchool = async (schoolData) => {
//         try {
//             const authUser = JSON.parse(sessionStorage.getItem("authUser"));
//             const dataToSend = {
//                 ...schoolData,
//                 createdBy: authUser?.username || "Admin"
//             };

//             const response = await fetch(`${api.API_URL}/schools`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(dataToSend)
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to create school');
//             }

//             toast.success("School created successfully");
//             fetchSchools();
//             setModal(false);
//             formik.resetForm();
//         } catch (error) {
//             toast.error(`Error creating school: ${error.message}`);
//         }
//     };

//     // Update school
//     const updateSchool = async (schoolData) => {
//         if (!selectedSchool) return;

//         try {
//             const authUser = JSON.parse(sessionStorage.getItem("authUser"));
//             const dataToSend = {
//                 ...schoolData,
//                 _id: selectedSchool._id,
//                 updatedBy: authUser?.username || "Admin"
//             };

//             const response = await fetch(`${api.API_URL}/schools/${selectedSchool._id}`, {
//                 method: 'PUT',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(dataToSend)
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to update school');
//             }

//             toast.success("School updated successfully");
//             fetchSchools();
//             setModal(false);
//         } catch (error) {
//             toast.error(`Error updating school: ${error.message}`);
//         }
//     };

//     // Delete school
//     const deleteSchool = async () => {
//         if (!selectedSchool) return;

//         try {
//             const response = await fetch(`${api.API_URL}/schools/${selectedSchool._id}`, {
//                 method: 'DELETE'
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Failed to delete school');
//             }

//             toast.success("School deleted successfully");
//             setDeleteModal(false);
//             fetchSchools();
//         } catch (error) {
//             toast.error(`Error deleting school: ${error.message}`);
//         }
//     };

//     // Open modal for edit
//     const handleEdit = (school) => {
//         setSelectedSchool(school);
//         formik.setValues({
//             name: school.name || "",
//             tagline: school.tagline || "",
//             description: school.description || "",
//             shortDescription: school.shortDescription || "",
//             logoUrl: school.logoUrl || "",
//             coverImage: school.coverImage || "",
//             dean: school.dean?._id || school.dean || "",
//             category: school.category?._id || school.category || "",
//             contactInfo: {
//                 phone: school.contactInfo?.phone || "",
//                 email: school.contactInfo?.email || "",
//                 location: school.contactInfo?.location || "",
//                 website: school.contactInfo?.website || ""
//             },
//             mission: school.mission || "",
//             vision: school.vision || "",
//             facilities: school.facilities || [],
//             isActive: school.isActive || true,
//             order: school.order || 0
//         });
//         setIsEdit(true);
//         setModal(true);
//     };

//     // Open modal for view
//     const handleView = (school) => {
//         setSelectedSchool(school);
//         setViewModal(true);
//     };

//     // Open modal for create
//     const handleCreate = () => {
//         setSelectedSchool(null);
//         formik.resetForm();
//         setIsEdit(false);
//         setModal(true);
//     };

//     // Handle filter changes
//     const handleFilterChange = (e) => {
//         const { name, value } = e.target;
//         setFilters(prev => ({ ...prev, [name]: value }));
//     };

//     // Handle select filter changes
//     const handleSelectFilterChange = (name, selectedOption) => {
//         setFilters(prev => ({
//             ...prev,
//             [name]: selectedOption?.value || ""
//         }));
//     };

//     // Filter schools based on filters
//     const filteredSchools = schools.filter(school => {
//         return (
//             (filters.search === '' ||
//                 school.name.toLowerCase().includes(filters.search.toLowerCase()) ||
//                 (school.tagline && school.tagline.toLowerCase().includes(filters.search.toLowerCase())) ||
//                 (school.shortDescription && school.shortDescription.toLowerCase().includes(filters.search.toLowerCase()))) &&
//             (filters.status === '' ||
//                 (filters.status === 'Active' ? school.isActive : !school.isActive))
//         );
//     });

//     // Table columns
//     const columns = [
//         {
//             name: '#',
//             cell: (row, index) => index + 1,
//             // width: '60px'
//         },
//         {
//             name: 'Name',
//             selector: row => row.name,

//         },
//         {
//             name: 'Tagline',
//             selector: row => row.tagline || '-',
//             wrap: true
//         },
//         {
//             name: 'Category',
//             selector: row => row.category?.name || '-',
//         },
//         {
//             name: 'Dean',
//             selector: row => row.dean?.name || '-',
//         },
//         {
//             name: 'Status',
//             cell: row => (
//                 <Badge color={row.isActive ? 'success' : 'danger'}>
//                     {row.isActive ? 'Active' : 'Inactive'}
//                 </Badge>
//             ),
//         },
//         {
//             name: 'Actions',
//             cell: row => (
//                 <div className="d-flex gap-2">
//                     <Button color="soft-info" size="sm" onClick={() => handleView(row)}>
//                         <i className="ri-eye-line" />
//                     </Button>
//                     <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
//                         <i className="ri-pencil-line" />
//                     </Button>
//                     <Button color="soft-danger" size="sm" onClick={() => {
//                         setSelectedSchool(row);
//                         setDeleteModal(true);
//                     }}>
//                         <i className="ri-delete-bin-line" />
//                     </Button>
//                 </div>
//             ),
//             // width: '140px'
//         }
//     ];

//     // Initial data load
//     useEffect(() => {
//         fetchSchools();
//         fetchCategories();
//         fetchStaff();
//     }, []);

//     return (
//         <div className="page-content">
//             <Container fluid>
//                 <BreadCrumb title="Schools" pageTitle="Academics" />

//                 {/* Filter Controls */}
//                 <Card className="mb-3">
//                     <CardBody>
//                         <Row>
//                             <Col md={4}>
//                                 <FormGroup>
//                                     <Label>Search</Label>
//                                     <Input
//                                         type="text"
//                                         name="search"
//                                         placeholder="Search by name, tagline or description"
//                                         value={filters.search}
//                                         onChange={handleFilterChange}
//                                     />
//                                 </FormGroup>
//                             </Col>
//                             <Col md={3}>
//                                 <FormGroup>
//                                     <Label>Status</Label>
//                                     <Select
//                                         options={statusOptions}
//                                         value={statusOptions.find(opt => opt.value === filters.status)}
//                                         onChange={(opt) => handleSelectFilterChange('status', opt)}
//                                         isClearable
//                                     />
//                                 </FormGroup>
//                             </Col>
//                             <Col md={3} className="d-flex align-items-end mb-3">
//                                 <Button color="primary" onClick={fetchSchools} disabled={loading}>
//                                     {loading ? 'Refreshing...' : 'Refresh Data'}
//                                 </Button>
//                             </Col>
//                         </Row>
//                     </CardBody>
//                 </Card>

//                 {/* Data Table */}
//                 <Card>
//                     <CardHeader className="d-flex justify-content-between align-items-center">
//                         <h5 className="mb-0">Schools List</h5>
//                         <Button color="primary" onClick={handleCreate}>
//                             <i className="ri-add-line me-1" /> Add School
//                         </Button>
//                     </CardHeader>
//                     <CardBody className='card-body'>
//                         {loading ? (
//                             <Loader />
//                         ) : (
//                             <DataTable
//                                 columns={columns}
//                                 data={filteredSchools}
//                                 pagination
//                                 responsive
//                                 noDataComponent="No schools found matching your criteria"
//                                 theme={layoutModeType == "dark" ? 'customDark' : 'default'}
//                             />
//                         )}
//                     </CardBody>
//                 </Card>
//             </Container>

//             {/* Add/Edit Modal */}
//             <Modal isOpen={modal} toggle={() => setModal(false)} size="xl" className="border-0">
//                 <ModalHeader toggle={() => setModal(false)}>
//                     {isEdit ? 'Edit School' : 'Add New School'}
//                 </ModalHeader>
//                 <Form onSubmit={formik.handleSubmit}>
//                     <ModalBody className="modal-body">
//                         <Row>

//                             <Col md={8}>
//                                 <FormGroup>
//                                     <Label>Name <span className="text-danger">*</span></Label>
//                                     <Input
//                                         name="name"
//                                         className="form-control"
//                                         placeholder="school name"

//                                         value={formik.values.name}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.name && !!formik.errors.name}
//                                     />
//                                     {formik.touched.name && formik.errors.name && (
//                                         <div className="text-danger small">{formik.errors.name}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={4}>
//                                 <FormGroup>
//                                     <Label>Order</Label>
//                                     <Input
//                                         type="number"
//                                         name="order"
//                                         value={formik.values.order}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         min="0"
//                                         invalid={formik.touched.order && !!formik.errors.order}
//                                     />
//                                     {formik.touched.order && formik.errors.order && (
//                                         <div className="text-danger small">{formik.errors.order}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={12}>
//                                 <FormGroup>
//                                     <Label>Tagline</Label>
//                                     <Input
//                                         name="tagline"
//                                         value={formik.values.tagline}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.tagline && !!formik.errors.tagline}
//                                     />
//                                     {formik.touched.tagline && formik.errors.tagline && (
//                                         <div className="text-danger small">{formik.errors.tagline}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={12} style={{ display: "none" }}>
//                                 <FormGroup>
//                                     <Label>Short Description</Label>
//                                     <Input
//                                         type="textarea"
//                                         name="shortDescription"
//                                         value={formik.values.shortDescription}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         rows="2"
//                                         invalid={formik.touched.shortDescription && !!formik.errors.shortDescription}
//                                     />
//                                     {formik.touched.shortDescription && formik.errors.shortDescription && (
//                                         <div className="text-danger small">{formik.errors.shortDescription}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={12} style={{ display: "none" }}>
//                                 <FormGroup>
//                                     <Label>Description</Label>
//                                     <Input
//                                         type="textarea"
//                                         name="description"
//                                         value={formik.values.description}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         rows="3"
//                                         invalid={formik.touched.description && !!formik.errors.description}
//                                     />
//                                     {formik.touched.description && formik.errors.description && (
//                                         <div className="text-danger small">{formik.errors.description}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={6}>
//                                 <FormGroup>
//                                     <Label>Logo URL</Label>
//                                     <Input
//                                         name="logoUrl"
//                                         value={formik.values.logoUrl}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.logoUrl && !!formik.errors.logoUrl}
//                                     />
//                                     {formik.touched.logoUrl && formik.errors.logoUrl && (
//                                         <div className="text-danger small">{formik.errors.logoUrl}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={6}>
//                                 <FormGroup>
//                                     <Label>Cover Image URL</Label>
//                                     <Input
//                                         name="coverImage"
//                                         value={formik.values.coverImage}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.coverImage && !!formik.errors.coverImage}
//                                     />
//                                     {formik.touched.coverImage && formik.errors.coverImage && (
//                                         <div className="text-danger small">{formik.errors.coverImage}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={6}>
//                                 <FormGroup>
//                                     <Label>Category <span className="text-danger">*</span></Label>
//                                     <Input
//                                         type="select"
//                                         name="category"
//                                         value={formik.values.category}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.category && !!formik.errors.category}
//                                     >
//                                         <option value="">Select Category</option>
//                                         {categories.map(cat => (
//                                             <option key={cat._id} value={cat._id}>{cat.name}</option>
//                                         ))}
//                                     </Input>
//                                     {formik.touched.category && formik.errors.category && (
//                                         <div className="text-danger small">{formik.errors.category}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={6}>
//                                 <FormGroup>
//                                     <Label>Dean</Label>
//                                     <Input
//                                         type="select"
//                                         name="dean"
//                                         value={formik.values.dean}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.dean && !!formik.errors.dean}
//                                     >
//                                         <option value="">Select Dean</option>
//                                         {staff.map(person => (
//                                             <option key={person._id} value={person._id}>{person.name}</option>
//                                         ))}
//                                     </Input>
//                                     {formik.touched.dean && formik.errors.dean && (
//                                         <div className="text-danger small">{formik.errors.dean}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={6}>
//                                 <FormGroup>
//                                     <Label>Contact Phone</Label>
//                                     <Input
//                                         name="contactInfo.phone"
//                                         value={formik.values.contactInfo.phone}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.contactInfo?.phone && !!formik.errors.contactInfo?.phone}
//                                     />
//                                     {formik.touched.contactInfo?.phone && formik.errors.contactInfo?.phone && (
//                                         <div className="text-danger small">{formik.errors.contactInfo.phone}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={6}>
//                                 <FormGroup>
//                                     <Label>Contact Email</Label>
//                                     <Input
//                                         type="email"
//                                         name="contactInfo.email"
//                                         value={formik.values.contactInfo.email}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.contactInfo?.email && !!formik.errors.contactInfo?.email}
//                                     />
//                                     {formik.touched.contactInfo?.email && formik.errors.contactInfo?.email && (
//                                         <div className="text-danger small">{formik.errors.contactInfo.email}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={6}>
//                                 <FormGroup>
//                                     <Label>Location</Label>
//                                     <Input
//                                         name="contactInfo.location"
//                                         value={formik.values.contactInfo.location}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.contactInfo?.location && !!formik.errors.contactInfo?.location}
//                                     />
//                                     {formik.touched.contactInfo?.location && formik.errors.contactInfo?.location && (
//                                         <div className="text-danger small">{formik.errors.contactInfo.location}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={6}>
//                                 <FormGroup>
//                                     <Label>Website</Label>
//                                     <Input
//                                         name="contactInfo.website"
//                                         value={formik.values.contactInfo.website}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         invalid={formik.touched.contactInfo?.website && !!formik.errors.contactInfo?.website}
//                                     />
//                                     {formik.touched.contactInfo?.website && formik.errors.contactInfo?.website && (
//                                         <div className="text-danger small">{formik.errors.contactInfo.website}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={12}>
//                                 <FormGroup>
//                                     <Label>Mission</Label>
//                                     <Input
//                                         type="textarea"
//                                         name="mission"
//                                         value={formik.values.mission}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         rows="2"
//                                         invalid={formik.touched.mission && !!formik.errors.mission}
//                                     />
//                                     {formik.touched.mission && formik.errors.mission && (
//                                         <div className="text-danger small">{formik.errors.mission}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={12}>
//                                 <FormGroup>
//                                     <Label>Vision</Label>
//                                     <Input
//                                         type="textarea"
//                                         name="vision"
//                                         value={formik.values.vision}
//                                         onChange={formik.handleChange}
//                                         onBlur={formik.handleBlur}
//                                         rows="2"
//                                         invalid={formik.touched.vision && !!formik.errors.vision}
//                                     />
//                                     {formik.touched.vision && formik.errors.vision && (
//                                         <div className="text-danger small">{formik.errors.vision}</div>
//                                     )}
//                                 </FormGroup>
//                             </Col>
//                             <Col md={12}>
//                                 <FormGroup check>
//                                     <Input
//                                         type="checkbox"
//                                         name="isActive"
//                                         checked={formik.values.isActive}
//                                         onChange={formik.handleChange}
//                                         id="isActive"
//                                     />
//                                     <Label for="isActive" check>
//                                         Active School
//                                     </Label>
//                                 </FormGroup>
//                             </Col>
//                         </Row>
//                     </ModalBody>
//                     <ModalFooter>
//                         <Button color="light" onClick={() => setModal(false)}>
//                             Cancel
//                         </Button>
//                         <Button color="primary" type="submit">
//                             {isEdit ? 'Update School' : 'Add School'}
//                         </Button>
//                     </ModalFooter>
//                 </Form>
//             </Modal>

//             {/* View Modal */}
//             <Modal isOpen={viewModal} toggle={() => setViewModal(false)} size="lg">
//                 <ModalHeader toggle={() => setViewModal(false)}>
//                     School Details
//                 </ModalHeader>
//                 <ModalBody>
//                     {selectedSchool && (
//                         <Row>
//                             <Col md={12} className="text-center mb-3">
//                                 {selectedSchool.logoUrl && (
//                                     <img
//                                         src={selectedSchool.logoUrl}
//                                         alt={`${selectedSchool.name} logo`}
//                                         className="img-fluid rounded"
//                                         style={{ maxHeight: '150px' }}
//                                     />
//                                 )}
//                                 <h3 className="mt-3">{selectedSchool.name}</h3>
//                                 <p className="text-muted">{selectedSchool.tagline}</p>
//                             </Col>

//                             <Col md={6}>
//                                 <h5>Basic Information</h5>
//                                 <p><strong>Category:</strong> {selectedSchool.category?.name || 'N/A'}</p>
//                                 <p><strong>Dean:</strong> {selectedSchool.dean?.name || 'N/A'}</p>
//                                 <p><strong>Status:</strong>
//                                     <Badge color={selectedSchool.isActive ? 'success' : 'danger'} className="ms-2">
//                                         {selectedSchool.isActive ? 'Active' : 'Inactive'}
//                                     </Badge>
//                                 </p>
//                                 <p><strong>Order:</strong> {selectedSchool.order}</p>
//                             </Col>

//                             <Col md={6}>
//                                 <h5>Contact Information</h5>
//                                 <p><strong>Phone:</strong> {selectedSchool.contactInfo?.phone || 'N/A'}</p>
//                                 <p><strong>Email:</strong> {selectedSchool.contactInfo?.email || 'N/A'}</p>
//                                 <p><strong>Location:</strong> {selectedSchool.contactInfo?.location || 'N/A'}</p>
//                                 <p><strong>Website:</strong> {selectedSchool.contactInfo?.website || 'N/A'}</p>
//                             </Col>

//                             <Col md={12} className="mt-3">
//                                 <h5>Description</h5>
//                                 <p>{selectedSchool.shortDescription || selectedSchool.description || 'No description available'}</p>
//                             </Col>

//                             {selectedSchool.mission && (
//                                 <Col md={6} className="mt-3">
//                                     <h5>Mission</h5>
//                                     <p>{selectedSchool.mission}</p>
//                                 </Col>
//                             )}

//                             {selectedSchool.vision && (
//                                 <Col md={6} className="mt-3">
//                                     <h5>Vision</h5>
//                                     <p>{selectedSchool.vision}</p>
//                                 </Col>
//                             )}

//                             {selectedSchool.facilities && selectedSchool.facilities.length > 0 && (
//                                 <Col md={12} className="mt-3">
//                                     <h5>Facilities</h5>
//                                     <ul>
//                                         {selectedSchool.facilities.map((facility, index) => (
//                                             <li key={index}>
//                                                 <strong>{facility.title}:</strong> {facility.description}
//                                             </li>
//                                         ))}
//                                     </ul>
//                                 </Col>
//                             )}
//                         </Row>
//                     )}
//                 </ModalBody>
//                 <ModalFooter>
//                     <Button color="light" onClick={() => setViewModal(false)}>
//                         Close
//                     </Button>
//                 </ModalFooter>
//             </Modal>

//             {/* Delete Confirmation Modal */}
//             <DeleteModal
//                 show={deleteModal}
//                 onDeleteClick={deleteSchool}
//                 onCloseClick={() => setDeleteModal(false)}
//             />

//             <ToastContainer />
//         </div>
//     );
// };

// export default Schools;