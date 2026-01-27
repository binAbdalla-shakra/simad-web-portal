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
    getStaffs as onGetStaff,
    deleteStaff as onDeleteStaff,
    CreateOrUpdateStaff as onCreateOrUpdateStaff
} from "../../../slices/thunks";
import { wrap } from 'lodash';

// Selectors
const selectStaffData = createSelector(
    (state) => state.Setups,
    (staffData) => staffData.staffData.staff || []
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


const StaffPage = () => {
    document.title = "Staff | simad University";

    const dispatch = useDispatch();
    const staffData = useSelector(selectStaffData);

    // State management
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [filteredStaff, setFilteredStaff] = useState([]);
    const [activeTab, setActiveTab] = useState('1');

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        title: '',
        isResearchContributor: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        title: "",
        bio: "",
        email: "",
        phone: "",
        officeLocation: "",
        photoUrl: "",
        isResearchContributor: false,
        researchInterests: [],
        professionalExperience: [{
            position: "",
            organization: "",
            startDate: "",
            endDate: "",
            isCurrent: false,
            description: "",
            achievements: [""]
        }],
        education: [{
            degree: "",
            fieldOfStudy: "",
            institution: "",
            graduationYear: new Date().getFullYear(),
            country: "",
            thesisTitle: ""
        }],
        publications: [{
            title: "",
            journalOrConference: "",
            publicationDate: "",
            authors: [""],
            link: "",
            isSelected: false
        }],
        awards: [{
            title: "",
            awardingBody: "",
            year: new Date().getFullYear(),
            description: ""
        }]
    });
    const [photoFiles, setPhotoFiles] = useState([]);

    // Fetch staff
    const fetchStaff = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetStaff());
        } catch (error) {
            console.error("Error loading staff:", error);

        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Load staff data
    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    // Update staff list when data changes
    useEffect(() => {
        const initialStaff = Array.isArray(staffData) ? staffData : [];
        setStaff(initialStaff);
        setFilteredStaff(initialStaff);
    }, [staffData]);


    useEffect(() => {
        return () => {
            // force clear research interests select
            setFormData(prev => ({ ...prev, researchInterests: [...prev.researchInterests] }));
        };
    }, []);


    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        const filtered = staff.filter(staffMember => {
            const matchesSearch = !value ||
                staffMember.name?.toLowerCase().includes(value.toLowerCase()) ||
                staffMember.email?.toLowerCase().includes(value.toLowerCase()) ||
                staffMember.title?.toLowerCase().includes(value.toLowerCase());

            const matchesTitle = !filters.title ||
                staffMember.title === (name === 'title' ? value : filters.title);

            const matchesResearch = filters.isResearchContributor === '' ||
                staffMember.isResearchContributor === (filters.isResearchContributor === 'true');

            return matchesSearch && matchesTitle && matchesResearch;
        });
        setFilteredStaff(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
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

    // Handle nested array changes (like achievements, authors)
    const handleNestedArrayChange = (field, index, subField, subIndex, value) => {
        setFormData(prev => {
            const updatedArray = [...prev[field]];
            const updatedSubArray = [...updatedArray[index][subField]];
            updatedSubArray[subIndex] = value;
            updatedArray[index] = {
                ...updatedArray[index],
                [subField]: updatedSubArray
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

    // Add nested array item
    const addNestedArrayItem = (field, index, subField, template = "") => {
        setFormData(prev => {
            const updatedArray = [...prev[field]];
            updatedArray[index] = {
                ...updatedArray[index],
                [subField]: [...updatedArray[index][subField], template]
            };
            return {
                ...prev,
                [field]: updatedArray
            };
        });
    };

    // Remove nested array item
    const removeNestedArrayItem = (field, index, subField, subIndex) => {
        setFormData(prev => {
            const updatedArray = [...prev[field]];
            const updatedSubArray = updatedArray[index][subField].filter((_, i) => i !== subIndex);
            updatedArray[index] = {
                ...updatedArray[index],
                [subField]: updatedSubArray
            };
            return {
                ...prev,
                [field]: updatedArray
            };
        });
    };

    // Handle file upload
    const handleFileUpdate = (fileItems) => {
        setPhotoFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                photoUrl: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                photoUrl: ""
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const requiredFields = ['name', 'title', 'bio', 'email'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            toast.warning('Please enter a valid email address');
            return false;
        }

        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            title: "",
            bio: "",
            email: "",
            phone: "",
            officeLocation: "",
            photoUrl: "",
            isResearchContributor: false,
            researchInterests: [],
            professionalExperience: [{
                position: "",
                organization: "",
                startDate: "",
                endDate: "",
                isCurrent: false,
                description: "",
                achievements: [""]
            }],
            education: [{
                degree: "",
                fieldOfStudy: "",
                institution: "",
                graduationYear: new Date().getFullYear(),
                country: "",
                thesisTitle: ""
            }],
            publications: [{
                title: "",
                journalOrConference: "",
                publicationDate: "",
                authors: [""],
                link: "",
                isSelected: false
            }],
            awards: [{
                title: "",
                awardingBody: "",
                year: new Date().getFullYear(),
                description: ""
            }]
        });
        setPhotoFiles([]);
        setSelectedStaff(null);
        setActiveTab('1');
    };

    // In the createStaff and updateStaff functions, replace with this:

    // Create new staff
    const createStaff = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['name', 'title', 'bio', 'email', 'phone', 'officeLocation'];
            basicFields.forEach(field => {
                submitData.append(field, formData[field]);
            });

            // Append boolean field
            submitData.append('isResearchContributor', formData.isResearchContributor);

            if (formData.isResearchContributor) {
                // Append research interests as array
                formData.researchInterests.forEach((interest, index) => {
                    if (interest.trim()) {
                        submitData.append(`researchInterests[${index}]`, interest);
                    }
                });

                // Append publications
                formData.publications.forEach((pub, index) => {
                    submitData.append(`publications[${index}][title]`, pub.title);
                    submitData.append(`publications[${index}][journalOrConference]`, pub.journalOrConference);
                    submitData.append(`publications[${index}][publicationDate]`, pub.publicationDate);
                    submitData.append(`publications[${index}][link]`, pub.link || '');
                    submitData.append(`publications[${index}][isSelected]`, pub.isSelected);

                    pub.authors.forEach((author, aIndex) => {
                        if (author.trim()) {
                            submitData.append(`publications[${index}][authors][${aIndex}]`, author);
                        }
                    });
                });
            }
            // Append photo file if exists
            if (formData.photoUrl instanceof File) {
                submitData.append('photo', formData.photoUrl);
            }

            // Append array fields as individual entries (not JSON strings)
            formData.professionalExperience.forEach((exp, index) => {
                submitData.append(`professionalExperience[${index}][position]`, exp.position);
                submitData.append(`professionalExperience[${index}][organization]`, exp.organization);
                submitData.append(`professionalExperience[${index}][startDate]`, exp.startDate);
                submitData.append(`professionalExperience[${index}][endDate]`, exp.endDate || '');
                submitData.append(`professionalExperience[${index}][isCurrent]`, exp.isCurrent);
                submitData.append(`professionalExperience[${index}][description]`, exp.description || '');

                // Append achievements as array
                exp.achievements.forEach((achievement, aIndex) => {
                    if (achievement.trim()) {
                        submitData.append(`professionalExperience[${index}][achievements][${aIndex}]`, achievement);
                    }
                });
            });

            formData.education.forEach((edu, index) => {
                submitData.append(`education[${index}][degree]`, edu.degree);
                submitData.append(`education[${index}][fieldOfStudy]`, edu.fieldOfStudy);
                submitData.append(`education[${index}][institution]`, edu.institution);
                submitData.append(`education[${index}][graduationYear]`, edu.graduationYear.toString());
                submitData.append(`education[${index}][country]`, edu.country || '');
                submitData.append(`education[${index}][thesisTitle]`, edu.thesisTitle || '');
            });

            formData.awards.forEach((award, index) => {
                submitData.append(`awards[${index}][title]`, award.title);
                submitData.append(`awards[${index}][awardingBody]`, award.awardingBody);
                submitData.append(`awards[${index}][year]`, award.year.toString());
                submitData.append(`awards[${index}][description]`, award.description || '');
            });



            await dispatch(onCreateOrUpdateStaff(submitData));

            handleModalClose();
            resetForm();
        } catch (error) {
            console.error("Error creating staff:", error);

        }
    };

    // Update staff
    const updateStaff = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedStaff) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = ['name', 'title', 'bio', 'email', 'phone', 'officeLocation'];
            basicFields.forEach(field => {
                submitData.append(field, formData[field]);
            });

            // Append boolean field
            submitData.append('isResearchContributor', formData.isResearchContributor);
            if (formData.isResearchContributor) {
                // Append research interests as array
                formData.researchInterests.forEach((interest, index) => {
                    if (interest.trim()) {
                        submitData.append(`researchInterests[${index}]`, interest);
                    }
                });

                // Append publications
                formData.publications.forEach((pub, index) => {
                    submitData.append(`publications[${index}][title]`, pub.title);
                    submitData.append(`publications[${index}][journalOrConference]`, pub.journalOrConference);
                    submitData.append(`publications[${index}][publicationDate]`, pub.publicationDate);
                    submitData.append(`publications[${index}][link]`, pub.link || '');
                    submitData.append(`publications[${index}][isSelected]`, pub.isSelected);

                    pub.authors.forEach((author, aIndex) => {
                        if (author.trim()) {
                            submitData.append(`publications[${index}][authors][${aIndex}]`, author);
                        }
                    });
                });
            }

            // Append photo file if exists
            if (formData.photoUrl instanceof File) {
                submitData.append('photo', formData.photoUrl);
            }

            // Append array fields as individual entries
            formData.professionalExperience.forEach((exp, index) => {
                submitData.append(`professionalExperience[${index}][position]`, exp.position);
                submitData.append(`professionalExperience[${index}][organization]`, exp.organization);
                submitData.append(`professionalExperience[${index}][startDate]`, exp.startDate);
                submitData.append(`professionalExperience[${index}][endDate]`, exp.endDate || '');
                submitData.append(`professionalExperience[${index}][isCurrent]`, exp.isCurrent);
                submitData.append(`professionalExperience[${index}][description]`, exp.description || '');

                // Append achievements as array
                exp.achievements.forEach((achievement, aIndex) => {
                    if (achievement.trim()) {
                        submitData.append(`professionalExperience[${index}][achievements][${aIndex}]`, achievement);
                    }
                });
            });

            formData.education.forEach((edu, index) => {
                submitData.append(`education[${index}][degree]`, edu.degree);
                submitData.append(`education[${index}][fieldOfStudy]`, edu.fieldOfStudy);
                submitData.append(`education[${index}][institution]`, edu.institution);
                submitData.append(`education[${index}][graduationYear]`, edu.graduationYear.toString());
                submitData.append(`education[${index}][country]`, edu.country || '');
                submitData.append(`education[${index}][thesisTitle]`, edu.thesisTitle || '');
            });



            formData.awards.forEach((award, index) => {
                submitData.append(`awards[${index}][title]`, award.title);
                submitData.append(`awards[${index}][awardingBody]`, award.awardingBody);
                submitData.append(`awards[${index}][year]`, award.year.toString());
                submitData.append(`awards[${index}][description]`, award.description || '');
            });



            // Append ID for update
            submitData.append('_id', selectedStaff._id);

            await dispatch(onCreateOrUpdateStaff(submitData));

            handleModalClose();
            resetForm();
        } catch (error) {
            console.error("Error updating staff:", error);

        }
    };

    const handleModalClose = () => {
        setPhotoFiles([]); // reset FilePond files
        setModal(false);
    };


    // Delete staff
    const deleteStaff = async () => {
        if (!selectedStaff) return;

        try {
            await dispatch(onDeleteStaff(selectedStaff._id));

            setDeleteModal(false);
            fetchStaff();
        } catch (error) {
            console.error("Error deleting staff:", error);

        }
    };

    // Open modal for edit
    const handleEdit = (staffMember) => {
        setSelectedStaff(staffMember);

        // Parse array fields if they are strings (from backend)
        const parseArrayField = (field) => {
            if (!staffMember[field]) return getDefaultArray(field);
            if (Array.isArray(staffMember[field])) return staffMember[field];
            try {
                return JSON.parse(staffMember[field]);
            } catch {
                return getDefaultArray(field);
            }
        };

        // Format date for HTML date input (YYYY-MM-DD)
        const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            } catch {
                return '';
            }
        };

        // Parse and format professional experience dates
        const parsedProfessionalExperience = parseArrayField('professionalExperience').map(exp => ({
            ...exp,
            startDate: formatDateForInput(exp.startDate),
            endDate: formatDateForInput(exp.endDate)
        }));

        // Parse and format publication dates
        const parsedPublications = parseArrayField('publications').map(pub => ({
            ...pub,
            publicationDate: formatDateForInput(pub.publicationDate)
        }));

        setFormData({
            name: staffMember.name || "",
            title: staffMember.title || "",
            bio: staffMember.bio || "",
            email: staffMember.email || "",
            phone: staffMember.phone || "",
            officeLocation: staffMember.officeLocation || "",
            photoUrl: staffMember.photoUrl || "",
            isResearchContributor: staffMember.isResearchContributor || false,
            researchInterests: parseArrayField('researchInterests'),
            professionalExperience: parsedProfessionalExperience.length > 0 ? parsedProfessionalExperience : getDefaultArray('professionalExperience'),
            education: parseArrayField('education'),
            publications: parsedPublications.length > 0 ? parsedPublications : getDefaultArray('publications'),
            awards: parseArrayField('awards')
        });

        setIsEdit(true);
        setModal(true);
        setActiveTab('1');
    };
    // Helper function for default arrays
    // Helper function for default arrays
    const getDefaultArray = (field) => {
        const defaults = {
            professionalExperience: [{
                position: "",
                organization: "",
                startDate: "",
                endDate: "",
                isCurrent: false,
                description: "",
                achievements: [""]
            }],
            education: [{
                degree: "",
                fieldOfStudy: "",
                institution: "",
                graduationYear: new Date().getFullYear(),
                country: "",
                thesisTitle: ""
            }],
            publications: [{
                title: "",
                journalOrConference: "",
                publicationDate: "",
                authors: [""],
                link: "",
                isSelected: false
            }],
            awards: [{
                title: "",
                awardingBody: "",
                year: new Date().getFullYear(),
                description: ""
            }],
            researchInterests: []
        };
        return defaults[field] || [];
    };

    // Open modal for view
    const handleView = (staffMember) => {
        setSelectedStaff(staffMember);
        setViewModal(true);
        setActiveTab('1');
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedStaff(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
                <div className="avatar-xs">
                    {row.photoUrl ? (
                        <img
                            src={row.photoUrl}
                            alt={row.name}
                            className="rounded-circle"
                            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className="avatar-title bg-light text-secondary rounded-circle">
                            <i className="ri-user-line" />
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
            name: 'Title',
            selector: row => row.title,
            wrap: true,

        },
        {
            name: 'Email',
            selector: row => row.email,
            sortable: true,

        },
        {
            name: 'Phone',
            selector: row => row.phone || 'N/A',

        },
        {
            name: 'Research',
            cell: row => (
                <Badge color={row.isResearchContributor ? 'success' : 'secondary'}>
                    {row.isResearchContributor ? 'Researcher' : 'Staff'}
                </Badge>
            ),

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
                            setSelectedStaff(row);
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
                <BreadCrumb title="Staff" pageTitle="People" />

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
                                        placeholder="Search by name, email, or title"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            {/* <Col md={3}>
                                <FormGroup>
                                    <Label>Title</Label>
                                    <Input
                                        type="text"
                                        name="title"
                                        placeholder="Filter by title"
                                        value={filters.title}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Research Contributor</Label>
                                    <Input
                                        type="select"
                                        name="isResearchContributor"
                                        value={filters.isResearchContributor}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All</option>
                                        <option value="true">Researchers</option>
                                        <option value="false">Non-Researchers</option>
                                    </Input>
                                </FormGroup>
                            </Col> */}
                        </Row>
                    </CardBody>
                </Card>

                {/* Staff Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Staff List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Staff
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredStaff}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No staff members found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={handleModalClose} unmountOnClose={false} size="xl" scrollable>
                <ModalHeader toggle={handleModalClose}>
                    {isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
                </ModalHeader>
                <Form noValidate onSubmit={isEdit ? updateStaff : createStaff}>
                    <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Step Navigation */}
                        <div className="step-arrow-nav mb-4">

                            <Nav className="nav-pills custom-nav nav-justified" role="tablist">

                                <NavItem>
                                    <NavLink
                                        className={activeTab === '1' ? 'active' : ''}
                                        onClick={() => setActiveTab('1')}
                                    >
                                        <i className="ri-user-line me-1" /> Basic Info
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '2' ? 'active' : ''}
                                        onClick={() => setActiveTab('2')}
                                    >
                                        <i className="ri-briefcase-line me-1" /> Experience
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '3' ? 'active' : ''}
                                        onClick={() => setActiveTab('3')}
                                    >
                                        <i className="ri-graduation-cap-line me-1" /> Education
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '4' ? 'active' : ''}
                                        onClick={() => setActiveTab('4')}
                                    >
                                        <i className="ri-file-paper-line me-1" /> Research
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '5' ? 'active' : ''}
                                        onClick={() => setActiveTab('5')}
                                    >
                                        <i className="ri-trophy-line me-1" /> Awards
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
                                            <Label>Photo</Label>
                                            <FilePond
                                                files={photoFiles}
                                                onupdatefiles={handleFileUpdate}
                                                allowMultiple={false}
                                                maxFiles={1}
                                                name="photo"
                                                labelIdle='Drag & Drop your photo or <span class="filepond--label-action">Browse</span>'
                                                acceptedFileTypes={['image/*']}
                                                imagePreviewHeight={100}
                                                credits={false}
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Full Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter full name"
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Title <span className="text-danger">*</span></Label>
                                            <Input
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Professor, Lecturer, etc."
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Email <span className="text-danger">*</span></Label>
                                            <Input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="Enter email address"
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Phone</Label>
                                            <Input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="Enter phone number"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Office Location</Label>
                                            <Input
                                                name="officeLocation"
                                                value={formData.officeLocation}
                                                onChange={handleInputChange}
                                                placeholder="Enter office location"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Bio <span className="text-danger">*</span></Label>
                                            <Input
                                                type="textarea"
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                placeholder="Enter professional biography"
                                                rows="4"
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup check>
                                            <Input
                                                type="checkbox"
                                                name="isResearchContributor"
                                                checked={formData.isResearchContributor}
                                                onChange={handleInputChange}
                                                id="isResearchContributor"
                                            />
                                            <Label for="isResearchContributor" check>
                                                Research Contributor
                                            </Label>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 2: Professional Experience */}
                            <TabPane tabId="2">
                                {formData.professionalExperience.map((exp, index) => (
                                    <Card key={index} className="mb-3">
                                        <CardHeader className="d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0">Experience #{index + 1}</h6>
                                            {formData.professionalExperience.length > 1 && (
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    onClick={() => removeArrayItem('professionalExperience', index)}
                                                >
                                                    <i className="ri-delete-bin-line" />
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardBody>
                                            <Row>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Position <span className="text-danger">*</span></Label>
                                                        <Input
                                                            value={exp.position}
                                                            onChange={(e) => handleArrayFieldChange('professionalExperience', index, 'position', e.target.value)}
                                                            placeholder="Enter position title"
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Organization <span className="text-danger">*</span></Label>
                                                        <Input
                                                            value={exp.organization}
                                                            onChange={(e) => handleArrayFieldChange('professionalExperience', index, 'organization', e.target.value)}
                                                            placeholder="Enter organization name"
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Start Date <span className="text-danger">*</span></Label>
                                                        <Input
                                                            type="date"
                                                            value={exp.startDate || ''}
                                                            onChange={(e) => handleArrayFieldChange('professionalExperience', index, 'startDate', e.target.value)}
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>End Date</Label>
                                                        <Input
                                                            type="date"
                                                            value={exp.endDate || ''}
                                                            onChange={(e) => handleArrayFieldChange('professionalExperience', index, 'endDate', e.target.value)}
                                                            disabled={exp.isCurrent}
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={12}>
                                                    <FormGroup check>
                                                        <Input
                                                            type="checkbox"
                                                            checked={exp.isCurrent}
                                                            onChange={(e) => handleArrayFieldChange('professionalExperience', index, 'isCurrent', e.target.checked)}
                                                            id={`current-${index}`}
                                                        />
                                                        <Label for={`current-${index}`} check>
                                                            Current Position
                                                        </Label>
                                                    </FormGroup>
                                                </Col>
                                                <Col md={12}>
                                                    <FormGroup>
                                                        <Label>Description</Label>
                                                        <Input
                                                            type="textarea"
                                                            value={exp.description}
                                                            onChange={(e) => handleArrayFieldChange('professionalExperience', index, 'description', e.target.value)}
                                                            placeholder="Describe responsibilities and achievements"
                                                            rows="3"
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={12}>
                                                    <Label>Achievements</Label>
                                                    {exp.achievements.map((achievement, aIndex) => (
                                                        <div key={aIndex} className="d-flex gap-2 mb-2">
                                                            <Input
                                                                value={achievement}
                                                                onChange={(e) => handleNestedArrayChange('professionalExperience', index, 'achievements', aIndex, e.target.value)}
                                                                placeholder="Enter achievement"
                                                            />
                                                            {exp.achievements.length > 1 && (
                                                                <Button
                                                                    color="danger"
                                                                    size="sm"
                                                                    onClick={() => removeNestedArrayItem('professionalExperience', index, 'achievements', aIndex)}
                                                                >
                                                                    <i className="ri-delete-bin-line" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <Button
                                                        color="light"
                                                        size="sm"
                                                        onClick={() => addNestedArrayItem('professionalExperience', index, 'achievements', '')}
                                                    >
                                                        <i className="ri-add-line me-1" /> Add Achievement
                                                    </Button>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>
                                ))}
                                <Button
                                    color="light"
                                    onClick={() => addArrayItem('professionalExperience', {
                                        position: "",
                                        organization: "",
                                        startDate: "",
                                        endDate: "",
                                        isCurrent: false,
                                        description: "",
                                        achievements: [""]
                                    })}
                                >
                                    <i className="ri-add-line me-1" /> Add Another Experience
                                </Button>
                            </TabPane>

                            {/* Tab 3: Education */}
                            <TabPane tabId="3">
                                {formData.education.map((edu, index) => (
                                    <Card key={index} className="mb-3">
                                        <CardHeader className="d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0">Education #{index + 1}</h6>
                                            {formData.education.length > 1 && (
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    onClick={() => removeArrayItem('education', index)}
                                                >
                                                    <i className="ri-delete-bin-line" />
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardBody>
                                            <Row>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Degree <span className="text-danger">*</span></Label>
                                                        <Input
                                                            value={edu.degree}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'degree', e.target.value)}
                                                            placeholder="e.g., Bachelor of Science"
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Field of Study <span className="text-danger">*</span></Label>
                                                        <Input
                                                            value={edu.fieldOfStudy}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'fieldOfStudy', e.target.value)}
                                                            placeholder="e.g., Computer Science"
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Institution <span className="text-danger">*</span></Label>
                                                        <Input
                                                            value={edu.institution}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'institution', e.target.value)}
                                                            placeholder="Enter institution name"
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Graduation Year <span className="text-danger">*</span></Label>
                                                        <Input
                                                            type="number"
                                                            value={edu.graduationYear}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'graduationYear', parseInt(e.target.value))}
                                                            min="1900"
                                                            max={new Date().getFullYear() + 5}
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Country</Label>
                                                        <Input
                                                            value={edu.country}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'country', e.target.value)}
                                                            placeholder="Enter country"
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Thesis Title</Label>
                                                        <Input
                                                            value={edu.thesisTitle}
                                                            onChange={(e) => handleArrayFieldChange('education', index, 'thesisTitle', e.target.value)}
                                                            placeholder="Enter thesis title (if applicable)"
                                                        />
                                                    </FormGroup>
                                                </Col>
                                            </Row>
                                        </CardBody>
                                    </Card>
                                ))}
                                <Button
                                    color="light"
                                    onClick={() => addArrayItem('education', {
                                        degree: "",
                                        fieldOfStudy: "",
                                        institution: "",
                                        graduationYear: new Date().getFullYear(),
                                        country: "",
                                        thesisTitle: ""
                                    })}
                                >
                                    <i className="ri-add-line me-1" /> Add Another Education
                                </Button>
                            </TabPane>

                            {/* Tab 4: Research & Publications */}
                            {/* Tab 4: Research & Publications */}
                            <TabPane tabId="4">
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <FormGroup check>
                                            <Input
                                                type="checkbox"
                                                name="isResearchContributor"
                                                checked={formData.isResearchContributor}
                                                onChange={handleInputChange}
                                                id="isResearchContributor"
                                            />
                                            <Label for="isResearchContributor" check className="fw-semibold">
                                                This staff member is a research contributor
                                            </Label>
                                        </FormGroup>
                                        <small className="text-muted">
                                            When checked, research fields will be enabled for this staff member
                                        </small>
                                    </Col>
                                </Row>

                                {formData.isResearchContributor ? (
                                    <>
                                        <Row className="mb-4">
                                            <Col md={12}>
                                                <FormGroup>
                                                    <Label>Research Interests</Label>
                                                    <CreatableSelect
                                                        isMulti
                                                        value={formData.researchInterests.map(interest => ({ value: interest, label: interest }))}
                                                        onChange={(selected) => setFormData(prev => ({
                                                            ...prev,
                                                            researchInterests: selected ? selected.map(item => item.value) : []
                                                        }))}
                                                        options={[]}
                                                        placeholder="Type and press enter to add research interests"
                                                        isClearable
                                                        formatCreateLabel={(inputValue) => `Add "${inputValue}"`}
                                                        noOptionsMessage={() => "Type to add research interests"}
                                                        styles={{
                                                            option: (provided, state) => ({
                                                                ...provided,
                                                                backgroundColor: state.isFocused ? "#4a6fa5" : "#2f4b73",  // focused = blue, otherwise white
                                                                color: "white",                                         // text color
                                                            }),
                                                            menu: (provided) => ({
                                                                ...provided,
                                                                backgroundColor: "white", // dropdown menu bg
                                                            }),
                                                            multiValue: (provided) => ({
                                                                ...provided,
                                                                backgroundColor: "#4a6fa5", // chip bg
                                                                color: "white",
                                                            }),
                                                            multiValueLabel: (provided) => ({
                                                                ...provided,
                                                                color: "white", // chip text
                                                            }),
                                                            input: (provided) => ({
                                                                ...provided,
                                                                color: "#2f4b73", // typing text color
                                                            }),
                                                        }}
                                                    />
                                                    <small className="text-muted">
                                                        Type and press enter to add research interests
                                                    </small>
                                                </FormGroup>
                                            </Col>
                                        </Row>

                                        <h6>Publications</h6>
                                        {formData.publications.map((pub, index) => (
                                            <Card key={index} className="mb-3">
                                                <CardHeader className="d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0">Publication #{index + 1}</h6>
                                                    {formData.publications.length > 1 && (
                                                        <Button
                                                            color="danger"
                                                            size="sm"
                                                            onClick={() => removeArrayItem('publications', index)}
                                                        >
                                                            <i className="ri-delete-bin-line" />
                                                        </Button>
                                                    )}
                                                </CardHeader>
                                                <CardBody>
                                                    <Row>
                                                        <Col md={12}>
                                                            <FormGroup>
                                                                <Label>Title <span className="text-danger">*</span></Label>
                                                                <Input
                                                                    value={pub.title}
                                                                    onChange={(e) => handleArrayFieldChange('publications', index, 'title', e.target.value)}
                                                                    placeholder="Enter publication title"
                                                                    required
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label>Journal/Conference <span className="text-danger">*</span></Label>
                                                                <Input
                                                                    value={pub.journalOrConference}
                                                                    onChange={(e) => handleArrayFieldChange('publications', index, 'journalOrConference', e.target.value)}
                                                                    placeholder="Enter journal or conference name"
                                                                    required
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label>Publication Date <span className="text-danger">*</span></Label>
                                                                <Input
                                                                    type="date"
                                                                    value={pub.publicationDate || ''}
                                                                    onChange={(e) => handleArrayFieldChange('publications', index, 'publicationDate', e.target.value)}
                                                                    required
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={12}>
                                                            <Label>Authors</Label>
                                                            {pub.authors.map((author, aIndex) => (
                                                                <div key={aIndex} className="d-flex gap-2 mb-2">
                                                                    <Input
                                                                        value={author}
                                                                        onChange={(e) => handleNestedArrayChange('publications', index, 'authors', aIndex, e.target.value)}
                                                                        placeholder="Enter author name"
                                                                    />
                                                                    {pub.authors.length > 1 && (
                                                                        <Button
                                                                            color="danger"
                                                                            size="sm"
                                                                            onClick={() => removeNestedArrayItem('publications', index, 'authors', aIndex)}
                                                                        >
                                                                            <i className="ri-delete-bin-line" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                            <Button
                                                                color="light"
                                                                size="sm"
                                                                onClick={() => addNestedArrayItem('publications', index, 'authors', '')}
                                                            >
                                                                <i className="ri-add-line me-1" /> Add Author
                                                            </Button>
                                                        </Col>
                                                        <Col md={12}>
                                                            <FormGroup>
                                                                <Label>Link</Label>
                                                                <Input
                                                                    type="url"
                                                                    value={pub.link}
                                                                    onChange={(e) => handleArrayFieldChange('publications', index, 'link', e.target.value)}
                                                                    placeholder="https://example.com/publication"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={12}>
                                                            <FormGroup check>
                                                                <Input
                                                                    type="checkbox"
                                                                    checked={pub.isSelected}
                                                                    onChange={(e) => handleArrayFieldChange('publications', index, 'isSelected', e.target.checked)}
                                                                    id={`selected-${index}`}
                                                                />
                                                                <Label for={`selected-${index}`} check>
                                                                    Featured Publication
                                                                </Label>
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                        ))}
                                        <Button
                                            color="light"
                                            onClick={() => addArrayItem('publications', {
                                                title: "",
                                                journalOrConference: "",
                                                publicationDate: "",
                                                authors: [""],
                                                link: "",
                                                isSelected: false
                                            })}
                                        >
                                            <i className="ri-add-line me-1" /> Add Another Publication
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <i className="ri-file-paper-line display-4 text-muted mb-3" />
                                        <h5>Research Contributor Disabled</h5>
                                        <p className="text-muted">
                                            Enable "Research Contributor" to add research interests and publications for this staff member.
                                        </p>
                                    </div>
                                )}
                            </TabPane>

                            {/* Tab 5: Awards */}
                            <TabPane tabId="5">
                                {formData.awards.map((award, index) => (
                                    <Card key={index} className="mb-3">
                                        <CardHeader className="d-flex justify-content-between align-items-center">
                                            <h6 className="mb-0">Award #{index + 1}</h6>
                                            {formData.awards.length > 1 && (
                                                <Button
                                                    color="danger"
                                                    size="sm"
                                                    onClick={() => removeArrayItem('awards', index)}
                                                >
                                                    <i className="ri-delete-bin-line" />
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardBody>
                                            <Row>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Title <span className="text-danger">*</span></Label>
                                                        <Input
                                                            value={award.title}
                                                            onChange={(e) => handleArrayFieldChange('awards', index, 'title', e.target.value)}
                                                            placeholder="Enter award title"
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Awarding Body <span className="text-danger">*</span></Label>
                                                        <Input
                                                            value={award.awardingBody}
                                                            onChange={(e) => handleArrayFieldChange('awards', index, 'awardingBody', e.target.value)}
                                                            placeholder="Enter awarding organization"
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={6}>
                                                    <FormGroup>
                                                        <Label>Year <span className="text-danger">*</span></Label>
                                                        <Input
                                                            type="number"
                                                            value={award.year}
                                                            onChange={(e) => handleArrayFieldChange('awards', index, 'year', parseInt(e.target.value))}
                                                            min="1900"
                                                            max={new Date().getFullYear()}
                                                            required
                                                        />
                                                    </FormGroup>
                                                </Col>
                                                <Col md={12}>
                                                    <FormGroup>
                                                        <Label>Description</Label>
                                                        <Input
                                                            type="textarea"
                                                            value={award.description}
                                                            onChange={(e) => handleArrayFieldChange('awards', index, 'description', e.target.value)}
                                                            placeholder="Enter award description"
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
                                    onClick={() => addArrayItem('awards', {
                                        title: "",
                                        awardingBody: "",
                                        year: new Date().getFullYear(),
                                        description: ""
                                    })}
                                >
                                    <i className="ri-add-line me-1" /> Add Another Award
                                </Button>
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
                                        {isEdit ? 'Update Staff' : 'Add Staff'}
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
                    Staff Details - {selectedStaff?.name}
                </ModalHeader>
                <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedStaff && (
                        <>
                            {/* Step Navigation for View */}
                            <div className="step-arrow-nav mb-4">



                                <Nav className="nav-pills custom-nav nav-justified" role="tablist">
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '1' ? 'active' : ''}
                                            onClick={() => setActiveTab('1')}
                                        >
                                            <i className="ri-user-line me-1" /> Basic Info
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '2' ? 'active' : ''}
                                            onClick={() => setActiveTab('2')}
                                        >
                                            <i className="ri-briefcase-line me-1" /> Experience
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '3' ? 'active' : ''}
                                            onClick={() => setActiveTab('3')}
                                        >
                                            <i className="ri-graduation-cap-line me-1" /> Education
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '4' ? 'active' : ''}
                                            onClick={() => setActiveTab('4')}
                                        >
                                            <i className="ri-file-paper-line me-1" /> Research
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTab === '5' ? 'active' : ''}
                                            onClick={() => setActiveTab('5')}
                                        >
                                            <i className="ri-trophy-line me-1" /> Awards
                                        </NavLink>
                                    </NavItem>
                                </Nav>
                            </div>
                            <TabContent activeTab={activeTab}>
                                {/* Tab 1: Basic Information */}
                                <TabPane tabId="1">
                                    <Row>
                                        <Col md={3} className="text-center mb-3">
                                            {selectedStaff.photoUrl ? (
                                                <img
                                                    src={selectedStaff.photoUrl}
                                                    alt={selectedStaff.name}
                                                    className="rounded-circle img-thumbnail"
                                                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <div className="avatar-title bg-light text-secondary rounded-circle display-4">
                                                    <i className="ri-user-line" />
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={9}>
                                            <h4>{selectedStaff.name}</h4>
                                            <h5 className="text-primary">{selectedStaff.title}</h5>
                                            <Badge color={selectedStaff.isResearchContributor ? 'success' : 'secondary'} className="mb-3">
                                                {selectedStaff.isResearchContributor ? 'Research Contributor' : 'Staff Member'}
                                            </Badge>

                                            <div className="mt-3">
                                                <p><strong>Email:</strong> {selectedStaff.email}</p>
                                                <p><strong>Phone:</strong> {selectedStaff.phone || 'N/A'}</p>
                                                <p><strong>Office Location:</strong> {selectedStaff.officeLocation || 'N/A'}</p>
                                            </div>
                                        </Col>
                                        <Col md={12} className="mt-3">
                                            <h6>Biography</h6>
                                            <p>{selectedStaff.bio}</p>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 2: Professional Experience */}
                                <TabPane tabId="2">
                                    {selectedStaff.professionalExperience?.length > 0 ? (
                                        selectedStaff.professionalExperience.map((exp, index) => (
                                            <Card key={index} className="mb-3">
                                                <CardBody>
                                                    <h6>{exp.position}</h6>
                                                    <p className="text-primary mb-2">{exp.organization}</p>
                                                    <p className="text-muted">
                                                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                                                    </p>
                                                    {exp.description && (
                                                        <p>{exp.description}</p>
                                                    )}
                                                    {exp.achievements?.length > 0 && (
                                                        <div>
                                                            <h6>Achievements:</h6>
                                                            <ul>
                                                                {exp.achievements.map((achievement, aIndex) => (
                                                                    <li key={aIndex}>{achievement}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        ))
                                    ) : (
                                        <p>No professional experience recorded.</p>
                                    )}
                                </TabPane>

                                {/* Tab 3: Education */}
                                <TabPane tabId="3">
                                    {selectedStaff.education?.length > 0 ? (
                                        selectedStaff.education.map((edu, index) => (
                                            <Card key={index} className="mb-3">
                                                <CardBody>
                                                    <h6>{edu.degree}</h6>
                                                    <p className="text-primary mb-1">{edu.fieldOfStudy}</p>
                                                    <p className="mb-1">{edu.institution}</p>
                                                    <p className="text-muted mb-1">Graduated: {edu.graduationYear}</p>
                                                    {edu.country && <p className="mb-1"><strong>Country:</strong> {edu.country}</p>}
                                                    {edu.thesisTitle && <p className="mb-0"><strong>Thesis:</strong> {edu.thesisTitle}</p>}
                                                </CardBody>
                                            </Card>
                                        ))
                                    ) : (
                                        <p>No education information recorded.</p>
                                    )}
                                </TabPane>

                                {/* Tab 4: Research & Publications */}
                                {/* Tab 4: Research & Publications */}
                                <TabPane tabId="4">
                                    {selectedStaff.isResearchContributor ? (
                                        <>
                                            {selectedStaff.researchInterests?.length > 0 && (
                                                <div className="mb-4">
                                                    <h6>Research Interests</h6>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {selectedStaff.researchInterests.map((interest, index) => (
                                                            <Badge key={index} color="info">
                                                                {interest}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <h6>Publications</h6>
                                            {selectedStaff.publications?.length > 0 ? (
                                                selectedStaff.publications.map((pub, index) => (
                                                    <Card key={index} className="mb-3">
                                                        <CardBody>
                                                            <div className="d-flex justify-content-between align-items-start">
                                                                <div>
                                                                    <h6>{pub.title}</h6>
                                                                    <p className="text-primary mb-1">{pub.journalOrConference}</p>
                                                                    <p className="text-muted mb-1">
                                                                        Published: {formatDate(pub.publicationDate)}
                                                                    </p>
                                                                    <p className="mb-1">
                                                                        <strong>Authors:</strong> {pub.authors?.join(', ')}
                                                                    </p>
                                                                    {pub.link && (
                                                                        <a href={pub.link} target="_blank" rel="noopener noreferrer">
                                                                            View Publication
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                {pub.isSelected && (
                                                                    <Badge color="success">Featured</Badge>
                                                                )}
                                                            </div>
                                                        </CardBody>
                                                    </Card>
                                                ))
                                            ) : (
                                                <p>No publications recorded.</p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-4">
                                            <i className="ri-file-paper-line display-4 text-muted mb-3" />
                                            <h5>Not a Research Contributor</h5>
                                            <p className="text-muted">
                                                This staff member is not marked as a research contributor.
                                            </p>
                                        </div>
                                    )}
                                </TabPane>

                                {/* Tab 5: Awards */}
                                <TabPane tabId="5">
                                    {selectedStaff.awards?.length > 0 ? (
                                        selectedStaff.awards.map((award, index) => (
                                            <Card key={index} className="mb-3">
                                                <CardBody>
                                                    <h6>{award.title}</h6>
                                                    <p className="text-primary mb-1">{award.awardingBody}</p>
                                                    <p className="text-muted mb-1">Year: {award.year}</p>
                                                    {award.description && <p className="mb-0">{award.description}</p>}
                                                </CardBody>
                                            </Card>
                                        ))
                                    ) : (
                                        <p>No awards recorded.</p>
                                    )}
                                </TabPane>
                            </TabContent>
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    {/* <Button color="primary" onClick={() => handleEdit(selectedStaff)}>
                        <i className="ri-pencil-line me-1" /> Edit Staff
                    </Button> */}
                    <Button color="light" onClick={() => setViewModal(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteStaff}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default StaffPage;