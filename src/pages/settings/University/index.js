import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Button, Badge, Alert, Nav, NavItem, NavLink, TabContent, TabPane
} from "reactstrap";
import Select from "react-select";
import CreatableSelect from 'react-select/creatable';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
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
    getUniversity as onGetUniversity,
    createOrUpdateUniversity as onCreateOrUpdateUniversity
} from "../../../slices/thunks";

// Selectors
const selectUniversityData = createSelector(
    (state) => state.Settings,
    (universityData) => universityData.universityData.university || null
);

const UniversitySettingsPage = () => {
    document.title = "University Settings | simad University";

    const dispatch = useDispatch();
    const uniData = useSelector(selectUniversityData);
    const universityData = uniData?.[0];

    // State management
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('1');
    // Form state
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        type: "Private",
        motto: "",
        founded: "",
        address: {
            street: "",
            city: "",
            state: "",
            country: "Somalia",
            postalCode: ""
        },
        contact: {
            phone: "",
            email: "",
            website: ""
        },
        academics: {
            language: "",
            affiliation: ""
        },
        colors: [],
        formerNames: [],
        otherNames: [],
        logo: "",
        backgroundImage: "",
        about_simad: "",
        stats: {
            students: 0,
            alumni: 0,
            labs: 0,
            campuses: 0
        },
        description: {
            mission: "",
            vision: "",
            guiding_principles: "",
            core_values: ""
        },
        socialMedia: {
            facebook: "",
            twitter: "",
            linkedin: "",
            instagram: "",
            youtube: "",
            tiktok: ""
        },
        isActive: true
    });

    const [logoFiles, setLogoFiles] = useState([]);
    const [backgroundImageFiles, setBackgroundImageFiles] = useState([]);

    // University type options
    const typeOptions = [
        { value: 'Public', label: 'Public University' },
        { value: 'Private', label: 'Private University' },
        { value: 'Non-profit', label: 'Non-profit Organization' },
        { value: 'For-profit', label: 'For-profit Organization' }
    ];

    // Country options
    const countryOptions = [
        { value: 'Somalia', label: 'Somalia' },
    ];

    // Fetch data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetUniversity());
        } catch (error) {
            console.error("Error loading university data:", error);

        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Load data
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Update form when data changes
    useEffect(() => {
        if (universityData) {
            setFormData({
                name: universityData.name || "",
                slug: universityData.slug || "",
                type: universityData.type || "Private",
                motto: universityData.motto || "",
                founded: universityData.founded ? new Date(universityData.founded).toISOString().split('T')[0] : "",
                address: {
                    street: universityData.address?.street || "",
                    city: universityData.address?.city || "",
                    state: universityData.address?.state || "",
                    country: universityData.address?.country || "Somalia",
                    postalCode: universityData.address?.postalCode || ""
                },
                contact: {
                    phone: universityData.contact?.phone || "",
                    email: universityData.contact?.email || "",
                    website: universityData.contact?.website || ""
                },
                academics: {
                    language: universityData.academics?.language || "",
                    affiliation: universityData.academics?.affiliation || ""
                },
                colors: universityData.colors || [],
                formerNames: universityData.formerNames || [],
                otherNames: universityData.otherNames || [],
                logo: universityData.logo || "",
                backgroundImage: universityData.backgroundImage || "",
                about_simad: universityData.about_simad || "",
                stats: {
                    students: universityData.stats?.students || 0,
                    alumni: universityData.stats?.alumni || 0,
                    labs: universityData.stats?.labs || 0,
                    campuses: universityData.stats?.campuses || 0
                },
                description: {
                    mission: universityData.description?.mission || "",
                    vision: universityData.description?.vision || "",
                    guiding_principles: universityData.description?.guiding_principles || "",
                    core_values: universityData.description?.core_values || ""
                },
                socialMedia: {
                    facebook: universityData.socialMedia?.facebook || "",
                    twitter: universityData.socialMedia?.twitter || "",
                    linkedin: universityData.socialMedia?.linkedin || "",
                    instagram: universityData.socialMedia?.instagram || "",
                    youtube: universityData.socialMedia?.youtube || "",
                    tiktok: universityData.socialMedia?.tiktok || ""
                },
                isActive: universityData.isActive ?? true
            });
        }
    }, [universityData]);

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
    const handleArrayFieldChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value.map(item => item.value || item)
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

    // Handle file upload for background image
    const handleBackgroundImageFileUpdate = (fileItems) => {
        setBackgroundImageFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                backgroundImage: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                backgroundImage: ""
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
        if (formData.name && !universityData?.slug) {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(prev.name)
            }));
        }
    }, [formData.name, universityData?.slug]);

    // Validate form
    const validateForm = () => {
        const requiredFields = ['name', 'slug', 'type'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Validate email format if provided
        if (formData.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.email)) {
            toast.warning('Please enter a valid email address');
            return false;
        }

        // Validate website format if provided
        if (formData.contact.website && !/^https?:\/\/.+\..+/.test(formData.contact.website)) {
            toast.warning('Please enter a valid website URL');
            return false;
        }

        return true;
    };

    // Save university data
    const saveUniversity = async (e) => {
        e.preventDefault();
        if (!validateForm() || saving) return;

        setSaving(true);
        try {
            const submitData = new FormData();

            // Append basic fields
            const basicFields = [
                'name', 'slug', 'type', 'motto', 'founded', 'about_simad', 'isActive'
            ];

            basicFields.forEach(field => {
                if (formData[field] !== undefined && formData[field] !== null) {
                    submitData.append(field, formData[field]);
                }
            });

            // Append nested objects
            Object.keys(formData.address).forEach(field => {
                submitData.append(`address[${field}]`, formData.address[field] || '');
            });

            Object.keys(formData.contact).forEach(field => {
                submitData.append(`contact[${field}]`, formData.contact[field] || '');
            });

            Object.keys(formData.academics).forEach(field => {
                submitData.append(`academics[${field}]`, formData.academics[field] || '');
            });

            Object.keys(formData.stats).forEach(field => {
                submitData.append(`stats[${field}]`, formData.stats[field] || 0);
            });

            Object.keys(formData.description).forEach(field => {
                submitData.append(`description[${field}]`, formData.description[field] || '');
            });

            Object.keys(formData.socialMedia).forEach(field => {
                submitData.append(`socialMedia[${field}]`, formData.socialMedia[field] || '');
            });

            // Append arrays
            formData.colors.forEach((color, index) => {
                submitData.append(`colors[${index}]`, color);
            });

            formData.formerNames.forEach((name, index) => {
                submitData.append(`formerNames[${index}]`, name);
            });

            formData.otherNames.forEach((name, index) => {
                submitData.append(`otherNames[${index}]`, name);
            });

            // Append logo file if exists
            if (formData.logo instanceof File) {
                submitData.append('logo', formData.logo);
            }

            // Append background image file if exists
            if (formData.backgroundImage instanceof File) {
                submitData.append('backgroundImage', formData.backgroundImage);
            }

            // Append ID for update if exists
            if (universityData?._id) {
                submitData.append('_id', universityData._id);
            }

            await dispatch(onCreateOrUpdateUniversity(submitData)).unwrap();

            toast.success("University settings saved successfully!");
            fetchData();
        } catch (error) {
            // Error toast already shown by the thunk; keep the entered data
            // intact so the user can fix the issue and resubmit.
            console.error("Error saving university data:", error);
        } finally {
            setSaving(false);
        }
    };

    // Stats cards data
    const statsCards = [
        {
            title: "Total Students",
            value: formData.stats.students,
            icon: "ri-user-line",
            color: "primary",
            description: "Currently enrolled students"
        },
        {
            title: "Alumni Network",
            value: formData.stats.alumni,
            icon: "ri-graduation-cap-line",
            color: "success",
            description: "Graduated students"
        },
        {
            title: "Laboratories",
            value: formData.stats.labs,
            icon: "ri-flask-line",
            color: "info",
            description: "Research & teaching labs"
        },
        {
            title: "Campuses",
            value: formData.stats.campuses,
            icon: "ri-building-line",
            color: "warning",
            description: "University campuses"
        }
    ];

    if (loading) {
        return (
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="University Info" pageTitle="University" />
                    <Loader />
                </Container>
            </div>
        );
    }

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="University Settings" pageTitle="System Configuration" />

                {/* University Header */}
                <Card className="mb-4">
                    <CardBody className="p-4">
                        <Row className="align-items-center">
                            <Col md="auto">
                                {formData.logo ? (
                                    <img
                                        src={formData.logo}
                                        alt="University Logo"
                                        className="rounded"
                                        style={{ width: '80px', height: '80px', objectFit: 'contain' }}
                                    />
                                ) : (
                                    <div className="avatar-title bg-light text-primary rounded d-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                                        <i className="ri-building-line fs-2" />
                                    </div>
                                )}
                            </Col>
                            <Col md>
                                <h3 className="mb-1">{formData.name || "University Name"}</h3>
                                <p className="text-muted mb-2">{formData.motto || "University Motto"}</p>
                                <div className="d-flex flex-wrap gap-2">
                                    <Badge color="primary" className="fs-6">{formData.type}</Badge>
                                    <Badge color={formData.isActive ? 'success' : 'danger'} className="fs-6">
                                        {formData.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                    {formData.founded && (
                                        <Badge color="info" className="fs-6">
                                            Founded {new Date(formData.founded).getFullYear()}
                                        </Badge>
                                    )}
                                </div>
                            </Col>
                            <Col md="auto">
                                <Button color="primary" onClick={saveUniversity} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <i className="ri-loader-4-line spin me-2"></i>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-save-line me-2"></i>
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Stats Cards */}
                <Row className="mb-4">
                    {statsCards.map((stat, index) => (
                        <Col xl={3} md={6} key={index}>
                            <Card className="card-animate">
                                <CardBody>
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                            <p className="text-uppercase fw-medium text-muted mb-0">{stat.title}</p>
                                            <h4 className="mb-0">{stat.value.toLocaleString()}</h4>
                                            <p className="text-muted mb-0 small">{stat.description}</p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <div className="avatar-sm">
                                                <span className={`avatar-title bg-${stat.color}-subtle text-${stat.color} rounded-circle fs-2`}>
                                                    <i className={stat.icon}></i>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {/* Settings Tabs */}
                <Card>
                    <CardHeader className="bg-light">
                        <Nav className="nav-tabs card-header-tabs" role="tablist">
                            <NavItem>
                                <NavLink
                                    className={activeTab === '1' ? 'active' : ''}
                                    onClick={() => setActiveTab('1')}
                                >
                                    <i className="ri-building-line me-1"></i>
                                    Basic Information
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={activeTab === '2' ? 'active' : ''}
                                    onClick={() => setActiveTab('2')}
                                >
                                    <i className="ri-contacts-line me-1"></i>
                                    Contact & Location
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={activeTab === '3' ? 'active' : ''}
                                    onClick={() => setActiveTab('3')}
                                >
                                    <i className="ri-image-line me-1"></i>
                                    Media & Branding
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={activeTab === '4' ? 'active' : ''}
                                    onClick={() => setActiveTab('4')}
                                >
                                    <i className="ri-file-text-line me-1"></i>
                                    About & Mission
                                </NavLink>
                            </NavItem>
                            <NavItem>
                                <NavLink
                                    className={activeTab === '5' ? 'active' : ''}
                                    onClick={() => setActiveTab('5')}
                                >
                                    <i className="ri-share-line me-1"></i>
                                    Social Media
                                </NavLink>
                            </NavItem>
                        </Nav>
                    </CardHeader>
                    <CardBody>
                        <TabContent activeTab={activeTab}>
                            {/* Tab 1: Basic Information */}
                            <TabPane tabId="1">
                                <Row className="g-3">
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                University Name <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="e.g., SIMAD University"
                                                className="form-control-lg"
                                                required
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                URL Slug <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                name="slug"
                                                value={formData.slug}
                                                onChange={handleInputChange}
                                                placeholder="university-slug"
                                                className="form-control-lg"
                                                required
                                            />
                                            <small className="text-muted">
                                                Unique identifier for URLs (lowercase, hyphens only)
                                            </small>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                University Type <span className="text-danger">*</span>
                                            </Label>
                                            <Select
                                                value={typeOptions.find(opt => opt.value === formData.type)}
                                                onChange={(selected) => setFormData(prev => ({
                                                    ...prev,
                                                    type: selected ? selected.value : "Private"
                                                }))}
                                                options={typeOptions}
                                                placeholder="Select university type"
                                                className="react-select"
                                                classNamePrefix="select"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Founded Date <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="date"
                                                name="founded"
                                                value={formData.founded}
                                                onChange={handleInputChange}
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Motto <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                name="motto"
                                                value={formData.motto}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Knowledge for Life"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Academic Language <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.academics.language}
                                                onChange={(e) => handleNestedChange('academics', 'language', e.target.value)}
                                                placeholder="e.g., English, Somali"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Affiliation <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.academics.affiliation}
                                                onChange={(e) => handleNestedChange('academics', 'affiliation', e.target.value)}
                                                placeholder="e.g., Ministry of Education"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                University Colors <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <CreatableSelect
                                                isMulti
                                                value={formData.colors.map(color => ({ value: color, label: color }))}
                                                onChange={(selected) => handleArrayFieldChange('colors', selected)}
                                                placeholder="Add university colors..."
                                                className="react-select"
                                                classNamePrefix="select"
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
                                                Add your university's brand colors (hex codes or names)
                                            </small>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Former Names <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <CreatableSelect
                                                isMulti
                                                value={formData.formerNames.map(name => ({ value: name, label: name }))}
                                                onChange={(selected) => handleArrayFieldChange('formerNames', selected)}
                                                placeholder="Add former names..."
                                                className="react-select"
                                                classNamePrefix="select"
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
                                                University is active and visible to public
                                            </Label>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 2: Contact & Location */}
                            <TabPane tabId="2">
                                <Row className="g-3">
                                    <Col md={12}>
                                        <h6 className="mb-3">Contact Information</h6>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Phone Number <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.contact.phone}
                                                onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)}
                                                placeholder="+252 61 123 4567"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Email Address <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="email"
                                                value={formData.contact.email}
                                                onChange={(e) => handleNestedChange('contact', 'email', e.target.value)}
                                                placeholder="info@university.edu"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Website <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="url"
                                                value={formData.contact.website}
                                                onChange={(e) => handleNestedChange('contact', 'website', e.target.value)}
                                                placeholder="https://www.simad.edu.so"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>

                                    <Col md={12} className="mt-4">
                                        <h6 className="mb-3">Location Information</h6>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Street Address <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.address.street}
                                                onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                                                placeholder="e.g., Airport Road"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                City <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.address.city}
                                                onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                                                placeholder="e.g., Mogadishu"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                State/Region <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.address.state}
                                                onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                                                placeholder="e.g., Banaadir"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Country <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Select
                                                value={countryOptions.find(opt => opt.value === formData.address.country)}
                                                onChange={(selected) => handleNestedChange('address', 'country', selected ? selected.value : "Somalia")}
                                                options={countryOptions}
                                                placeholder="Select country"
                                                className="react-select"
                                                classNamePrefix="select"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Postal Code <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.address.postalCode}
                                                onChange={(e) => handleNestedChange('address', 'postalCode', e.target.value)}
                                                placeholder="e.g., 252"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 3: Media & Branding */}
                            <TabPane tabId="3">
                                <Row className="g-4">
                                    <Col md={6}>
                                        <Card className="border-0 shadow-sm">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">
                                                    <i className="ri-image-line me-2"></i>
                                                    University Logo
                                                </h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <FilePond
                                                        files={logoFiles}
                                                        onupdatefiles={handleLogoFileUpdate}
                                                        allowMultiple={false}
                                                        maxFiles={1}
                                                        name="logo"
                                                        labelIdle='<div class="text-center"><i class="ri-landscape-line display-4 text-muted"></i><p class="mt-2">Drag & Drop logo or <span class="filepond--label-action">Browse</span></p></div>'
                                                        acceptedFileTypes={['image/*']}
                                                        imagePreviewHeight={120}
                                                        credits={false}
                                                        className="filepond-border"
                                                    />
                                                    <small className="text-muted">
                                                        Recommended: 400x400px, PNG format with transparent background
                                                    </small>
                                                </FormGroup>

                                                {formData.logo && !logoFiles.length && (
                                                    <div className="mt-3 text-center">
                                                        <Label>Current Logo:</Label>
                                                        <div className="mt-2">
                                                            <img
                                                                src={formData.logo}
                                                                alt="Current logo"
                                                                className="img-thumbnail"
                                                                style={{ maxHeight: '120px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </Col>
                                    <Col md={6}>
                                        <Card className="border-0 shadow-sm">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">
                                                    <i className="ri-image-2-line me-2"></i>
                                                    Background Image
                                                </h6>
                                            </CardHeader>
                                            <CardBody>
                                                <FormGroup>
                                                    <FilePond
                                                        files={backgroundImageFiles}
                                                        onupdatefiles={handleBackgroundImageFileUpdate}
                                                        allowMultiple={false}
                                                        maxFiles={1}
                                                        name="backgroundImage"
                                                        labelIdle='<div class="text-center"><i class="ri-image-2-line display-4 text-muted"></i><p class="mt-2">Drag & Drop background image or <span class="filepond--label-action">Browse</span></p></div>'
                                                        acceptedFileTypes={['image/*']}
                                                        imagePreviewHeight={120}
                                                        credits={false}
                                                        className="filepond-border"
                                                    />
                                                    <small className="text-muted">
                                                        Recommended: 1920x1080px, JPG format for website headers
                                                    </small>
                                                </FormGroup>

                                                {formData.backgroundImage && !backgroundImageFiles.length && (
                                                    <div className="mt-3 text-center">
                                                        <Label>Current Background:</Label>
                                                        <div className="mt-2">
                                                            <img
                                                                src={formData.backgroundImage}
                                                                alt="Current background"
                                                                className="img-thumbnail"
                                                                style={{ maxHeight: '120px', width: '100%', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </Col>

                                    <Col md={12}>
                                        <Card className="border-0 shadow-sm mt-3">
                                            <CardHeader className="bg-light">
                                                <h6 className="mb-0">
                                                    <i className="ri-bar-chart-line me-2"></i>
                                                    University Statistics
                                                </h6>
                                            </CardHeader>
                                            <CardBody>
                                                <Row className="g-3">
                                                    <Col md={3}>
                                                        <FormGroup>
                                                            <Label className="form-label">
                                                                Total Students <span className="text-muted fs-12">(optional)</span>
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={formData.stats.students}
                                                                onChange={(e) => handleNestedChange('stats', 'students', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                className="form-control-lg"
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={3}>
                                                        <FormGroup>
                                                            <Label className="form-label">
                                                                Alumni Count <span className="text-muted fs-12">(optional)</span>
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={formData.stats.alumni}
                                                                onChange={(e) => handleNestedChange('stats', 'alumni', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                className="form-control-lg"
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={3}>
                                                        <FormGroup>
                                                            <Label className="form-label">
                                                                Laboratories <span className="text-muted fs-12">(optional)</span>
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={formData.stats.labs}
                                                                onChange={(e) => handleNestedChange('stats', 'labs', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                className="form-control-lg"
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                    <Col md={3}>
                                                        <FormGroup>
                                                            <Label className="form-label">
                                                                Campuses <span className="text-muted fs-12">(optional)</span>
                                                            </Label>
                                                            <Input
                                                                type="number"
                                                                value={formData.stats.campuses}
                                                                onChange={(e) => handleNestedChange('stats', 'campuses', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                className="form-control-lg"
                                                            />
                                                        </FormGroup>
                                                    </Col>
                                                </Row>
                                            </CardBody>
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 4: About & Mission */}
                            <TabPane tabId="4">
                                <Row className="g-3">
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                About University <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                name="about_simad"
                                                value={formData.about_simad}
                                                onChange={handleInputChange}
                                                placeholder="Write a comprehensive description about the university..."
                                                rows="6"
                                                className="form-control-lg"
                                            />
                                            <div className="text-end">
                                                <small className={`text-${formData.about_simad.length > 2000 ? 'danger' : 'muted'}`}>
                                                    {formData.about_simad.length}/2000
                                                </small>
                                            </div>
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Mission Statement <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                value={formData.description.mission}
                                                onChange={(e) => handleNestedChange('description', 'mission', e.target.value)}
                                                placeholder="University's mission statement..."
                                                rows="4"
                                                className="form-control-lg"
                                            />
                                            <div className="text-end">
                                                <small className={`text-${formData.description.mission.length > 500 ? 'danger' : 'muted'}`}>
                                                    {formData.description.mission.length}/500
                                                </small>
                                            </div>
                                        </FormGroup>
                                    </Col>
                                    <Col md={12}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Vision Statement <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                value={formData.description.vision}
                                                onChange={(e) => handleNestedChange('description', 'vision', e.target.value)}
                                                placeholder="University's vision for the future..."
                                                rows="4"
                                                className="form-control-lg"
                                            />
                                            <div className="text-end">
                                                <small className={`text-${formData.description.vision.length > 500 ? 'danger' : 'muted'}`}>
                                                    {formData.description.vision.length}/500
                                                </small>
                                            </div>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Guiding Principles <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                value={formData.description.guiding_principles}
                                                onChange={(e) => handleNestedChange('description', 'guiding_principles', e.target.value)}
                                                placeholder="Key guiding principles..."
                                                rows="3"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                Core Values <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                type="textarea"
                                                value={formData.description.core_values}
                                                onChange={(e) => handleNestedChange('description', 'core_values', e.target.value)}
                                                placeholder="University's core values..."
                                                rows="3"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>

                            {/* Tab 5: Social Media */}
                            <TabPane tabId="5">
                                <Row className="g-3">
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                <i className="ri-facebook-fill text-primary me-2"></i>
                                                Facebook <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.socialMedia.facebook}
                                                onChange={(e) => handleNestedChange('socialMedia', 'facebook', e.target.value)}
                                                placeholder="https://facebook.com/university"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                <i className="ri-twitter-fill text-info me-2"></i>
                                                Twitter <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.socialMedia.twitter}
                                                onChange={(e) => handleNestedChange('socialMedia', 'twitter', e.target.value)}
                                                placeholder="https://twitter.com/university"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                <i className="ri-linkedin-fill text-primary me-2"></i>
                                                LinkedIn <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.socialMedia.linkedin}
                                                onChange={(e) => handleNestedChange('socialMedia', 'linkedin', e.target.value)}
                                                placeholder="https://linkedin.com/company/university"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                <i className="ri-instagram-line text-danger me-2"></i>
                                                Instagram <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.socialMedia.instagram}
                                                onChange={(e) => handleNestedChange('socialMedia', 'instagram', e.target.value)}
                                                placeholder="https://instagram.com/university"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                <i className="ri-youtube-fill text-danger me-2"></i>
                                                YouTube <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.socialMedia.youtube}
                                                onChange={(e) => handleNestedChange('socialMedia', 'youtube', e.target.value)}
                                                placeholder="https://youtube.com/c/university"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="form-label">
                                                <i className="ri-tiktok-fill me-2"></i>
                                                TikTok <span className="text-muted fs-12">(optional)</span>
                                            </Label>
                                            <Input
                                                value={formData.socialMedia.tiktok}
                                                onChange={(e) => handleNestedChange('socialMedia', 'tiktok', e.target.value)}
                                                placeholder="https://tiktok.com/@university"
                                                className="form-control-lg"
                                            />
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </TabPane>
                        </TabContent>
                    </CardBody>
                </Card>

                {/* Save Button Footer */}
                <Card className="mt-4">
                    <CardBody className="text-center py-4">
                        <Button color="primary" size="lg" onClick={saveUniversity} disabled={saving} className="px-5">
                            {saving ? (
                                <>
                                    <i className="ri-loader-4-line spin me-2"></i>
                                    Saving University Settings...
                                </>
                            ) : (
                                <>
                                    <i className="ri-save-line me-2"></i>
                                    Save All Changes
                                </>
                            )}
                        </Button>
                        <p className="text-muted mt-2 mb-0">
                            All changes will be applied immediately to the university app
                        </p>
                    </CardBody>
                </Card>
            </Container>

            <ToastContainer />
        </div>
    );
};

export default UniversitySettingsPage;