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
    getPrograms as onGetPrograms,
    deleteProgram as onDeleteProgram,
    CreateOrUpdateProgram as onCreateOrUpdateProgram
} from "../../../slices/thunks";

// Import other thunks for dropdowns
import {
    getSchools as onGetSchools
} from "../../../slices/thunks";

// Selectors
const selectProgramsData = createSelector(
    (state) => state.Setups,
    (programsData) => programsData.programsData.programs || []
);

const selectSchoolsData = createSelector(
    (state) => state.Setups,
    (schoolsData) => schoolsData.schoolsData.schools || []
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

const ProgramsPage = () => {
    document.title = "Programs | simad University";

    const dispatch = useDispatch();
    const programsData = useSelector(selectProgramsData);
    const schoolsData = useSelector(selectSchoolsData);

    // State management
    const [programs, setPrograms] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [viewModal, setViewModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [filteredPrograms, setFilteredPrograms] = useState([]);
    const [activeTab, setActiveTab] = useState('1');

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        school: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        shortName: "",
        tagline: "",
        school: "",
        about_program_sec_title: "",
        about_program_sec_icon: "",
        about_program_sec_info: "",
        duration: 4,
        duration_sec_icon: "",
        duration_sec_title: "",
        sem_fee: 0,
        sem_fee_sec_icon: "",
        sem_fee_sec_title: "",
        curriculum_sec_icon: "",
        curriculum_sec_title: "",
        curriculum_sec_desc: "",
        curriculum: [{
            title: "",
            description: "",
            icon: "",
            order: 0
        }],
        admissionRequirements_sec_icon: "",
        admissionRequirements_sec_title: "",
        admissionRequirements_sec_desc: "",
        admissionRequirements: [""],
        careerPaths_sec_icon: "",
        careerPaths_sec_title: "",
        careerPaths_sec_desc: "",
        careerPaths: [{
            title: "",
            description: "",
            icon: "",
            order: 0
        }],
        provider: "SIMAD University",
        icon: "",
        coverImage: "",
        externalLink: "",
        order: 0
    });
    // const [iconFiles, setIconFiles] = useState([]);
    const [coverImageFiles, setCoverImageFiles] = useState([]);

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetPrograms());
            await dispatch(onGetSchools());
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
        const initialPrograms = Array.isArray(programsData) ? programsData : [];
        const initialSchools = Array.isArray(schoolsData) ? schoolsData : [];

        setPrograms(initialPrograms);
        setFilteredPrograms(initialPrograms);
        setSchools(initialSchools);
    }, [programsData, schoolsData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        const filtered = programs.filter(program => {
            const matchesSearch = !value ||
                program.name?.toLowerCase().includes(value.toLowerCase()) ||
                program.shortName?.toLowerCase().includes(value.toLowerCase()) ||
                program.tagline?.toLowerCase().includes(value.toLowerCase());

            const matchesSchool = !filters.school ||
                program.school?._id === (name === 'school' ? value : filters.school);

            return matchesSearch && matchesSchool;
        });
        setFilteredPrograms(filtered);
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

    // Handle nested array changes
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
        const requiredFields = ['name', 'school'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Validate URL format if provided
        if (formData.externalLink && !/^https?:\/\/.+\..+/.test(formData.externalLink)) {
            toast.warning('Please enter a valid external link URL');
            return false;
        }

        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            shortName: "",
            tagline: "",
            school: "",
            about_program_sec_title: "",
            about_program_sec_icon: "",
            about_program_sec_info: "",
            duration: 4,
            duration_sec_icon: "",
            duration_sec_title: "",
            sem_fee: 0,
            sem_fee_sec_icon: "",
            sem_fee_sec_title: "",
            curriculum_sec_icon: "",
            curriculum_sec_title: "",
            curriculum_sec_desc: "",
            curriculum: [{
                title: "",
                description: "",
                icon: "",
                order: 0
            }],
            admissionRequirements_sec_icon: "",
            admissionRequirements_sec_title: "",
            admissionRequirements_sec_desc: "",
            admissionRequirements: [""],
            careerPaths_sec_icon: "",
            careerPaths_sec_title: "",
            careerPaths_sec_desc: "",
            careerPaths: [{
                title: "",
                description: "",
                icon: "",
                order: 0
            }],
            provider: "SIMAD University",
            icon: "",
            coverImage: "",
            externalLink: "",
            order: 0
        });

        setCoverImageFiles([]);
        setSelectedProgram(null);
        setActiveTab('1');
    };

    // Create new program
    const createProgram = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = [
                'name', 'shortName', 'tagline', 'school',
                'about_program_sec_title', 'about_program_sec_icon', 'about_program_sec_info',
                'duration', 'duration_sec_icon', 'duration_sec_title',
                'sem_fee', 'sem_fee_sec_icon', 'sem_fee_sec_title',
                'curriculum_sec_icon', 'curriculum_sec_title', 'curriculum_sec_desc',
                'admissionRequirements_sec_icon', 'admissionRequirements_sec_title', 'admissionRequirements_sec_desc',
                'careerPaths_sec_icon', 'careerPaths_sec_title', 'careerPaths_sec_desc',
                'provider', 'externalLink', 'order'
            ];

            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append curriculum
            formData.curriculum.forEach((item, index) => {
                submitData.append(`curriculum[${index}][title]`, item.title || '');
                submitData.append(`curriculum[${index}][description]`, item.description || '');
                submitData.append(`curriculum[${index}][icon]`, item.icon || '');
                submitData.append(`curriculum[${index}][order]`, item.order || 0);
            });

            // Append admission requirements
            formData.admissionRequirements.forEach((requirement, index) => {
                if (requirement.trim()) {
                    submitData.append(`admissionRequirements[${index}]`, requirement);
                }
            });

            // Append career paths
            formData.careerPaths.forEach((item, index) => {
                submitData.append(`careerPaths[${index}][title]`, item.title || '');
                submitData.append(`careerPaths[${index}][description]`, item.description || '');
                submitData.append(`careerPaths[${index}][icon]`, item.icon || '');
                submitData.append(`careerPaths[${index}][order]`, item.order || 0);
            });



            // Append cover image file if exists
            if (formData.coverImage instanceof File) {
                submitData.append('coverImage', formData.coverImage);
            }

            await dispatch(onCreateOrUpdateProgram(submitData));

            handleModalClose();
            resetForm();
        } catch (error) {
            console.error("Error creating program:", error);

        }
    };

    // Update program
    const updateProgram = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedProgram) return;

        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = [
                'name', 'shortName', 'icon', 'tagline', 'school',
                'about_program_sec_title', 'about_program_sec_icon', 'about_program_sec_info',
                'duration', 'duration_sec_icon', 'duration_sec_title',
                'sem_fee', 'sem_fee_sec_icon', 'sem_fee_sec_title',
                'curriculum_sec_icon', 'curriculum_sec_title', 'curriculum_sec_desc',
                'admissionRequirements_sec_icon', 'admissionRequirements_sec_title', 'admissionRequirements_sec_desc',
                'careerPaths_sec_icon', 'careerPaths_sec_title', 'careerPaths_sec_desc',
                'provider', 'externalLink', 'order'
            ];

            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append curriculum
            formData.curriculum.forEach((item, index) => {
                submitData.append(`curriculum[${index}][title]`, item.title || '');
                submitData.append(`curriculum[${index}][description]`, item.description || '');
                submitData.append(`curriculum[${index}][icon]`, item.icon || '');
                submitData.append(`curriculum[${index}][order]`, item.order || 0);
            });

            // Append admission requirements
            formData.admissionRequirements.forEach((requirement, index) => {
                if (requirement.trim()) {
                    submitData.append(`admissionRequirements[${index}]`, requirement);
                }
            });

            // Append career paths
            formData.careerPaths.forEach((item, index) => {
                submitData.append(`careerPaths[${index}][title]`, item.title || '');
                submitData.append(`careerPaths[${index}][description]`, item.description || '');
                submitData.append(`careerPaths[${index}][icon]`, item.icon || '');
                submitData.append(`careerPaths[${index}][order]`, item.order || 0);
            });

            // Append icon file if exists
            // if (formData.icon instanceof File) {
            //     submitData.append('icon', formData.icon);
            // }

            // Append cover image file if exists
            if (formData.coverImage instanceof File) {
                submitData.append('coverImage', formData.coverImage);
            }

            // Append ID for update
            submitData.append('_id', selectedProgram._id);

            await dispatch(onCreateOrUpdateProgram(submitData));

            handleModalClose();
            resetForm();
        } catch (error) {
            console.error("Error updating program:", error);

        }
    };

    const handleModalClose = () => {
        // setIconFiles([]);
        setCoverImageFiles([]);
        setModal(false);
    };

    // Delete program
    const deleteProgram = async () => {
        if (!selectedProgram) return;

        try {
            await dispatch(onDeleteProgram(selectedProgram._id));

            setDeleteModal(false);
            fetchData();
        } catch (error) {
            console.error("Error deleting program:", error);

        }
    };

    // Open modal for edit
    const handleEdit = (program) => {
        setSelectedProgram(program);

        setFormData({
            name: program.name || "",
            shortName: program.shortName || "",
            tagline: program.tagline || "",
            school: program.school?._id || "",
            about_program_sec_title: program.about_program_sec_title || "",
            about_program_sec_icon: program.about_program_sec_icon || "",
            about_program_sec_info: program.about_program_sec_info || "",
            duration: program.duration || 4,
            duration_sec_icon: program.duration_sec_icon || "",
            duration_sec_title: program.duration_sec_title || "",
            sem_fee: program.sem_fee || 0,
            sem_fee_sec_icon: program.sem_fee_sec_icon || "",
            sem_fee_sec_title: program.sem_fee_sec_title || "",
            curriculum_sec_icon: program.curriculum_sec_icon || "",
            curriculum_sec_title: program.curriculum_sec_title || "",
            curriculum_sec_desc: program.curriculum_sec_desc || "",
            curriculum: program.curriculum?.length > 0 ? program.curriculum : [{
                title: "",
                description: "",
                icon: "",
                order: 0
            }],
            admissionRequirements_sec_icon: program.admissionRequirements_sec_icon || "",
            admissionRequirements_sec_title: program.admissionRequirements_sec_title || "",
            admissionRequirements_sec_desc: program.admissionRequirements_sec_desc || "",
            admissionRequirements: program.admissionRequirements?.length > 0 ? program.admissionRequirements : [""],
            careerPaths_sec_icon: program.careerPaths_sec_icon || "",
            careerPaths_sec_title: program.careerPaths_sec_title || "",
            careerPaths_sec_desc: program.careerPaths_sec_desc || "",
            careerPaths: program.careerPaths?.length > 0 ? program.careerPaths : [{
                title: "",
                description: "",
                icon: "",
                order: 0
            }],
            provider: program.provider || "SIMAD University",
            icon: program.icon || "",
            coverImage: program.coverImage || "",
            externalLink: program.externalLink || "",
            order: program.order || 0
        });

        setIsEdit(true);
        setModal(true);
        setActiveTab('1');
    };

    // Open modal for view
    const handleView = (program) => {
        setSelectedProgram(program);
        setViewModal(true);
        setActiveTab('1');
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedProgram(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    const handleSimpleArrayChange = (field, index, value) => {
        setFormData(prev => {
            const updatedArray = [...prev[field]];
            updatedArray[index] = value;
            return {
                ...prev,
                [field]: updatedArray
            };
        });
    };

    // Format options for dropdowns
    const schoolOptions = schools.map(school => ({
        value: school._id,
        label: school.name
    }));

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
        },
        {
            name: 'Icon',
            cell: (row) => (
                <div className="avatar-xs">
                    {row.icon ? (
                        <div className="avatar-title bg-light text-primary rounded-circle">
                            <i className={row.icon} />
                        </div>
                    ) : (
                        <div className="avatar-title bg-light text-secondary rounded-circle">
                            <i className="ri-book-line" />
                        </div>
                    )}
                </div>
            ),
            width: '70px'
        },
        {
            name: 'Program Name',
            selector: row => row.name,
            sortable: true,
        },
        {
            name: 'Short Name',
            selector: row => row.shortName || 'N/A',
        },
        {
            name: 'School',
            cell: row => row.school?.name || 'N/A',
        },
        {
            name: 'Duration',
            cell: row => `${row.duration || 0} years`,
        },
        {
            name: 'Semester Fee',
            cell: row => row.sem_fee ? `$${row.sem_fee}` : 'N/A',
        },
        {
            name: 'Order',
            selector: row => row.order,
            sortable: true,
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
                            setSelectedProgram(row);
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
                <BreadCrumb title="Programs" pageTitle="Academics" />

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
                                        placeholder="Search by program name, short name, or tagline"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            {/* <Col md={4}>
                                <FormGroup>
                                    <Label>School</Label>
                                    <Input
                                        type="select"
                                        name="school"
                                        value={filters.school}
                                        onChange={handleFilterChange}
                                    >
                                        <option value="">All Schools</option>
                                        {schoolOptions.map(option => (
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

                {/* Programs Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Programs List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Program
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredPrograms}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No programs found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={handleModalClose} unmountOnClose={false} size="xl" scrollable>
                <ModalHeader toggle={handleModalClose}>
                    {isEdit ? 'Edit Program' : 'Add New Program'}
                </ModalHeader>
                <Form onSubmit={isEdit ? updateProgram : createProgram}>
                    <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Step Navigation */}
                        <Nav pills className="nav-pills-custom mb-4">
                            <NavItem>
                                <NavLink
                                    className={activeTab === '1' ? 'active' : ''}
                                    onClick={() => setActiveTab('1')}
                                >
                                    <i className="ri-book-line me-1" /> Basic Info
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={activeTab === '2' ? 'active' : ''}
                                    onClick={() => setActiveTab('2')}
                                >
                                    <i className="ri-information-line me-1" /> Program Details
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={activeTab === '3' ? 'active' : ''}
                                    onClick={() => setActiveTab('3')}
                                >
                                    <i className="ri-file-list-line me-1" /> Curriculum
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={activeTab === '4' ? 'active' : ''}
                                    onClick={() => setActiveTab('4')}
                                >
                                    <i className="ri-clipboard-line me-1" /> Admission
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={activeTab === '5' ? 'active' : ''}
                                    onClick={() => setActiveTab('5')}
                                >
                                    <i className="ri-briefcase-line me-1" /> Career Paths
                                </NavLink>
                            </NavItem>
                        </Nav>

                        <TabContent activeTab={activeTab}>
                            {/* Tab 1: Basic Information */}
                            <TabPane tabId="1">
                                <Row>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Program Icon Class</Label>
                                            <Input
                                                name="icon"
                                                value={formData.icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-book-line"
                                            />
                                            <small className="text-muted">
                                                Enter Remix Icon class name (e.g., ri-book-line, ri-computer-line)
                                            </small>
                                            {formData.icon && (
                                                <div className="mt-2">
                                                    <Label>Icon Preview:</Label>
                                                    <div className="d-flex align-items-center gap-2 mt-1">
                                                        <i className={formData.icon + " fs-4 text-primary"} />
                                                        <span>{formData.icon}</span>
                                                    </div>
                                                </div>
                                            )}
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
                                            <Label>Program Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter program name"
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Short Name</Label>
                                            <Input
                                                name="shortName"
                                                value={formData.shortName}
                                                onChange={handleInputChange}
                                                placeholder="Enter short name (e.g., BSC, MBA)"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>School <span className="text-danger">*</span></Label>
                                            <Select
                                                value={schoolOptions.find(option => option.value === formData.school) || null}
                                                onChange={(selected) => setFormData(prev => ({
                                                    ...prev,
                                                    school: selected ? selected.value : ""
                                                }))}
                                                options={schoolOptions}
                                                placeholder="Select school"
                                                isClearable
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Provider</Label>
                                            <Input
                                                name="provider"
                                                value={formData.provider}
                                                onChange={handleInputChange}
                                                placeholder="Program provider"
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
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>External Link</Label>
                                            <Input
                                                type="url"
                                                name="externalLink"
                                                value={formData.externalLink}
                                                onChange={handleInputChange}
                                                placeholder="https://example.com/program"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Tagline</Label>
                                            <Input
                                                name="tagline"
                                                value={formData.tagline}
                                                onChange={handleInputChange}
                                                placeholder="Enter program tagline"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 2: Program Details */}
                            <TabPane tabId="2">
                                <Row>
                                    <Col md={12}>
                                        <h6>About Program Section</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Title</Label>
                                            <Input
                                                name="about_program_sec_title"
                                                value={formData.about_program_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="About Program"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Icon</Label>
                                            <Input
                                                name="about_program_sec_icon"
                                                value={formData.about_program_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-information-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Program Information</Label>
                                            <Input
                                                type="textarea"
                                                name="about_program_sec_info"
                                                value={formData.about_program_sec_info}
                                                onChange={handleInputChange}
                                                placeholder="Enter detailed program information"
                                                rows="4"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Duration Section</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Duration (Years)</Label>
                                            <Input
                                                type="number"
                                                name="duration"
                                                value={formData.duration}
                                                onChange={handleInputChange}
                                                min="1"
                                                max="10"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Title</Label>
                                            <Input
                                                name="duration_sec_title"
                                                value={formData.duration_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Program Duration"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Icon</Label>
                                            <Input
                                                name="duration_sec_icon"
                                                value={formData.duration_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-time-line"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Semester Fee Section</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Semester Fee ($)</Label>
                                            <Input
                                                type="number"
                                                name="sem_fee"
                                                value={formData.sem_fee}
                                                onChange={handleInputChange}
                                                min="0"
                                                step="0.01"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Title</Label>
                                            <Input
                                                name="sem_fee_sec_title"
                                                value={formData.sem_fee_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Tuition Fees"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Icon</Label>
                                            <Input
                                                name="sem_fee_sec_icon"
                                                value={formData.sem_fee_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-money-dollar-circle-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 3: Curriculum */}
                            <TabPane tabId="3">
                                <Row>
                                    <Col md={12}>
                                        <h6>Curriculum Section Settings</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Title</Label>
                                            <Input
                                                name="curriculum_sec_title"
                                                value={formData.curriculum_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Curriculum"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Icon</Label>
                                            <Input
                                                name="curriculum_sec_icon"
                                                value={formData.curriculum_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-book-open-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Section Description</Label>
                                            <Input
                                                type="textarea"
                                                name="curriculum_sec_desc"
                                                value={formData.curriculum_sec_desc}
                                                onChange={handleInputChange}
                                                placeholder="Enter curriculum section description"
                                                rows="3"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Curriculum Items</h6>
                                        {formData.curriculum.map((item, index) => (
                                            <Card key={index} className="mb-3">
                                                <CardHeader className="d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0">Curriculum Item #{index + 1}</h6>
                                                    {formData.curriculum.length > 1 && (
                                                        <Button
                                                            color="danger"
                                                            size="sm"
                                                            onClick={() => removeArrayItem('curriculum', index)}
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
                                                                    value={item.title}
                                                                    onChange={(e) => handleArrayFieldChange('curriculum', index, 'title', e.target.value)}
                                                                    placeholder="Enter curriculum title"
                                                                    required
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label>Icon Class</Label>
                                                                <Input
                                                                    value={item.icon}
                                                                    onChange={(e) => handleArrayFieldChange('curriculum', index, 'icon', e.target.value)}
                                                                    placeholder="ri-book-2-line"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label>Order</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={item.order}
                                                                    onChange={(e) => handleArrayFieldChange('curriculum', index, 'order', parseInt(e.target.value))}
                                                                    min="0"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={12}>
                                                            <FormGroup>
                                                                <Label>Description <span className="text-danger">*</span></Label>
                                                                <Input
                                                                    type="textarea"
                                                                    value={item.description}
                                                                    onChange={(e) => handleArrayFieldChange('curriculum', index, 'description', e.target.value)}
                                                                    placeholder="Enter curriculum description"
                                                                    rows="3"
                                                                    required
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                        ))}
                                        <Button
                                            color="light"
                                            onClick={() => addArrayItem('curriculum', {
                                                title: "",
                                                description: "",
                                                icon: "",
                                                order: 0
                                            })}
                                        >
                                            <i className="ri-add-line me-1" /> Add Curriculum Item
                                        </Button>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 4: Admission Requirements */}
                            <TabPane tabId="4">
                                <Row>
                                    <Col md={12}>
                                        <h6>Admission Requirements Section Settings</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Title</Label>
                                            <Input
                                                name="admissionRequirements_sec_title"
                                                value={formData.admissionRequirements_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Admission Requirements"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Icon</Label>
                                            <Input
                                                name="admissionRequirements_sec_icon"
                                                value={formData.admissionRequirements_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-clipboard-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Section Description</Label>
                                            <Input
                                                type="textarea"
                                                name="admissionRequirements_sec_desc"
                                                value={formData.admissionRequirements_sec_desc}
                                                onChange={handleInputChange}
                                                placeholder="Enter admission requirements section description"
                                                rows="3"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Admission Requirements</h6>
                                        {formData.admissionRequirements.map((requirement, index) => (
                                            <div key={index} className="d-flex gap-2 mb-2">
                                                <Input
                                                    value={requirement}
                                                    onChange={(e) => handleSimpleArrayChange('admissionRequirements', index, e.target.value)}
                                                    placeholder="Enter admission requirement"
                                                />
                                                {formData.admissionRequirements.length > 1 && (
                                                    <Button
                                                        color="danger"
                                                        size="sm"
                                                        onClick={() => removeArrayItem('admissionRequirements', index)}
                                                    >
                                                        <i className="ri-delete-bin-line" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            color="light"
                                            onClick={() => addArrayItem('admissionRequirements', "")}
                                        >
                                            <i className="ri-add-line me-1" /> Add Requirement
                                        </Button>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 5: Career Paths */}
                            <TabPane tabId="5">
                                <Row>
                                    <Col md={12}>
                                        <h6>Career Paths Section Settings</h6>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Title</Label>
                                            <Input
                                                name="careerPaths_sec_title"
                                                value={formData.careerPaths_sec_title}
                                                onChange={handleInputChange}
                                                placeholder="Career Paths"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label>Section Icon</Label>
                                            <Input
                                                name="careerPaths_sec_icon"
                                                value={formData.careerPaths_sec_icon}
                                                onChange={handleInputChange}
                                                placeholder="ri-briefcase-line"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label>Section Description</Label>
                                            <Input
                                                type="textarea"
                                                name="careerPaths_sec_desc"
                                                value={formData.careerPaths_sec_desc}
                                                onChange={handleInputChange}
                                                placeholder="Enter career paths section description"
                                                rows="3"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6>Career Path Items</h6>
                                        {formData.careerPaths.map((item, index) => (
                                            <Card key={index} className="mb-3">
                                                <CardHeader className="d-flex justify-content-between align-items-center">
                                                    <h6 className="mb-0">Career Path #{index + 1}</h6>
                                                    {formData.careerPaths.length > 1 && (
                                                        <Button
                                                            color="danger"
                                                            size="sm"
                                                            onClick={() => removeArrayItem('careerPaths', index)}
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
                                                                    value={item.title}
                                                                    onChange={(e) => handleArrayFieldChange('careerPaths', index, 'title', e.target.value)}
                                                                    placeholder="Enter career path title"
                                                                    required
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label>Icon Class</Label>
                                                                <Input
                                                                    value={item.icon}
                                                                    onChange={(e) => handleArrayFieldChange('careerPaths', index, 'icon', e.target.value)}
                                                                    placeholder="ri-briefcase-4-line"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={6}>
                                                            <FormGroup>
                                                                <Label>Order</Label>
                                                                <Input
                                                                    type="number"
                                                                    value={item.order}
                                                                    onChange={(e) => handleArrayFieldChange('careerPaths', index, 'order', parseInt(e.target.value))}
                                                                    min="0"
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                        <Col md={12}>
                                                            <FormGroup>
                                                                <Label>Description <span className="text-danger">*</span></Label>
                                                                <Input
                                                                    type="textarea"
                                                                    value={item.description}
                                                                    onChange={(e) => handleArrayFieldChange('careerPaths', index, 'description', e.target.value)}
                                                                    placeholder="Enter career path description"
                                                                    rows="3"
                                                                    required
                                                                />
                                                            </FormGroup>
                                                        </Col>
                                                    </Row>
                                                </CardBody>
                                            </Card>
                                        ))}
                                        <Button
                                            color="light"
                                            onClick={() => addArrayItem('careerPaths', {
                                                title: "",
                                                description: "",
                                                icon: "",
                                                order: 0
                                            })}
                                        >
                                            <i className="ri-add-line me-1" /> Add Career Path
                                        </Button>
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
                                        {isEdit ? 'Update Program' : 'Add Program'}
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
                    Program Details - {selectedProgram?.name}
                </ModalHeader>
                <ModalBody style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {selectedProgram && (
                        <>
                            {/* Step Navigation for View */}
                            <Nav pills className="nav-pills-custom mb-4">
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '1' ? 'active' : ''}
                                        onClick={() => setActiveTab('1')}
                                    >
                                        <i className="ri-book-line me-1" /> Basic Info
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '2' ? 'active' : ''}
                                        onClick={() => setActiveTab('2')}
                                    >
                                        <i className="ri-information-line me-1" /> Program Details
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '3' ? 'active' : ''}
                                        onClick={() => setActiveTab('3')}
                                    >
                                        <i className="ri-file-list-line me-1" /> Curriculum
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '4' ? 'active' : ''}
                                        onClick={() => setActiveTab('4')}
                                    >
                                        <i className="ri-clipboard-line me-1" /> Admission
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={activeTab === '5' ? 'active' : ''}
                                        onClick={() => setActiveTab('5')}
                                    >
                                        <i className="ri-briefcase-line me-1" /> Career Paths
                                    </NavLink>
                                </NavItem>
                            </Nav>

                            <TabContent activeTab={activeTab}>
                                {/* Tab 1: Basic Information */}
                                <TabPane tabId="1">
                                    <Row>
                                        <Col md={4} className="text-center mb-3">
                                            {selectedProgram.icon ? (
                                                <div className="avatar-title bg-light text-primary rounded-circle display-4 mb-3">
                                                    <i className={selectedProgram.icon} />
                                                </div>
                                            ) : (
                                                <div className="avatar-title bg-light text-secondary rounded-circle display-4 mb-3">
                                                    <i className="ri-book-line" />
                                                </div>
                                            )}
                                            <h6 className="mt-2">Program Icon</h6>
                                            {selectedProgram.icon && (
                                                <p className="text-muted small">{selectedProgram.icon}</p>
                                            )}
                                        </Col>
                                        <Col md={8}>
                                            <h4>{selectedProgram.name}</h4>
                                            {selectedProgram.shortName && (
                                                <h5 className="text-primary">({selectedProgram.shortName})</h5>
                                            )}
                                            {selectedProgram.tagline && (
                                                <p className="text-muted">{selectedProgram.tagline}</p>
                                            )}
                                            <div className="mt-3">
                                                <p><strong>School:</strong> {selectedProgram.school?.name || 'N/A'}</p>
                                                <p><strong>Provider:</strong> {selectedProgram.provider}</p>
                                                <p><strong>Order:</strong> {selectedProgram.order}</p>
                                                {selectedProgram.externalLink && (
                                                    <p>
                                                        <strong>External Link:</strong>{' '}
                                                        <a href={selectedProgram.externalLink} target="_blank" rel="noopener noreferrer">
                                                            {selectedProgram.externalLink}
                                                        </a>
                                                    </p>
                                                )}
                                            </div>
                                        </Col>
                                        <Col md={12} className="mt-3">
                                            {selectedProgram.coverImage && (
                                                <div className="mb-3">
                                                    <img
                                                        src={selectedProgram.coverImage}
                                                        alt="Cover"
                                                        className="img-fluid rounded"
                                                        style={{ maxHeight: '200px', objectFit: 'cover', width: '100%' }}
                                                    />
                                                    <h6 className="text-center mt-2">Cover Image</h6>
                                                </div>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 2: Program Details */}
                                <TabPane tabId="2">
                                    <Row>
                                        <Col md={6}>
                                            <h6>About Program</h6>
                                            <p><strong>Section Title:</strong> {selectedProgram.about_program_sec_title || 'N/A'}</p>
                                            <p><strong>Section Icon:</strong> {selectedProgram.about_program_sec_icon || 'N/A'}</p>
                                            <p><strong>Information:</strong> {selectedProgram.about_program_sec_info || 'N/A'}</p>
                                        </Col>
                                        <Col md={6}>
                                            <h6>Duration & Fees</h6>
                                            <p><strong>Duration:</strong> {selectedProgram.duration} years</p>
                                            <p><strong>Duration Section Title:</strong> {selectedProgram.duration_sec_title || 'N/A'}</p>
                                            <p><strong>Duration Section Icon:</strong> {selectedProgram.duration_sec_icon || 'N/A'}</p>
                                            <p><strong>Semester Fee:</strong> ${selectedProgram.sem_fee || 'N/A'}</p>
                                            <p><strong>Fee Section Title:</strong> {selectedProgram.sem_fee_sec_title || 'N/A'}</p>
                                            <p><strong>Fee Section Icon:</strong> {selectedProgram.sem_fee_sec_icon || 'N/A'}</p>
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 3: Curriculum */}
                                <TabPane tabId="3">
                                    <Row>
                                        <Col md={12}>
                                            <h6>Curriculum Section</h6>
                                            <p><strong>Title:</strong> {selectedProgram.curriculum_sec_title || 'N/A'}</p>
                                            <p><strong>Icon:</strong> {selectedProgram.curriculum_sec_icon || 'N/A'}</p>
                                            <p><strong>Description:</strong> {selectedProgram.curriculum_sec_desc || 'N/A'}</p>
                                        </Col>
                                        <Col md={12} className="mt-3">
                                            <h6>Curriculum Items</h6>
                                            {selectedProgram.curriculum?.length > 0 ? (
                                                selectedProgram.curriculum.map((item, index) => (
                                                    <Card key={index} className="mb-3">
                                                        <CardBody>
                                                            <h6>{item.title}</h6>
                                                            {item.icon && (
                                                                <p><i className={item.icon} /> {item.icon}</p>
                                                            )}
                                                            <p className="mb-2">{item.description}</p>
                                                            <small className="text-muted">Order: {item.order}</small>
                                                        </CardBody>
                                                    </Card>
                                                ))
                                            ) : (
                                                <p>No curriculum items recorded.</p>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 4: Admission Requirements */}
                                <TabPane tabId="4">
                                    <Row>
                                        <Col md={12}>
                                            <h6>Admission Requirements Section</h6>
                                            <p><strong>Title:</strong> {selectedProgram.admissionRequirements_sec_title || 'N/A'}</p>
                                            <p><strong>Icon:</strong> {selectedProgram.admissionRequirements_sec_icon || 'N/A'}</p>
                                            <p><strong>Description:</strong> {selectedProgram.admissionRequirements_sec_desc || 'N/A'}</p>
                                        </Col>
                                        <Col md={12} className="mt-3">
                                            <h6>Admission Requirements</h6>
                                            {selectedProgram.admissionRequirements?.length > 0 ? (
                                                <ul>
                                                    {selectedProgram.admissionRequirements.map((requirement, index) => (
                                                        <li key={index}>{requirement}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>No admission requirements recorded.</p>
                                            )}
                                        </Col>
                                    </Row>
                                </TabPane>

                                {/* Tab 5: Career Paths */}
                                <TabPane tabId="5">
                                    <Row>
                                        <Col md={12}>
                                            <h6>Career Paths Section</h6>
                                            <p><strong>Title:</strong> {selectedProgram.careerPaths_sec_title || 'N/A'}</p>
                                            <p><strong>Icon:</strong> {selectedProgram.careerPaths_sec_icon || 'N/A'}</p>
                                            <p><strong>Description:</strong> {selectedProgram.careerPaths_sec_desc || 'N/A'}</p>
                                        </Col>
                                        <Col md={12} className="mt-3">
                                            <h6>Career Path Items</h6>
                                            {selectedProgram.careerPaths?.length > 0 ? (
                                                selectedProgram.careerPaths.map((item, index) => (
                                                    <Card key={index} className="mb-3">
                                                        <CardBody>
                                                            <h6>{item.title}</h6>
                                                            {item.icon && (
                                                                <p><i className={item.icon} /> {item.icon}</p>
                                                            )}
                                                            <p className="mb-2">{item.description}</p>
                                                            <small className="text-muted">Order: {item.order}</small>
                                                        </CardBody>
                                                    </Card>
                                                ))
                                            ) : (
                                                <p>No career paths recorded.</p>
                                            )}
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
                onDeleteClick={deleteProgram}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default ProgramsPage;