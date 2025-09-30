import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge
} from "reactstrap";
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

// React Beautiful DnD
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

//redux
import {
    getPartnersInfo as onGetPartnersInfo,
    deletePartner as onDeletePartner,
    CreateOrUpdatePartner as onCreateOrUpdatePartner,
    getPartnerCategories as onGetPartnerCategories
} from "../../../slices/thunks";
import { set } from 'lodash';

// Selectors
const selectPartnersData = createSelector(
    (state) => state.Setups,
    (partnersData) => partnersData.partnersData.partners || []
);
const selectPartnerCategoriesData = createSelector(
    (state) => state.Setups,
    (partner_categoriesData) => partner_categoriesData.partner_categoriesData.categories || []
);
const PartnersPage = () => {
    document.title = "Partners | simad University";

    const dispatch = useDispatch();
    const partnersData = useSelector(selectPartnersData);
    const partnerCategoriesData = useSelector(selectPartnerCategoriesData);


    // State management
    const [partners, setPartners] = useState([]);
    const [partnerCategories, setPartnerCategories] = useState([]);

    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [filteredPartners, setFilteredPartners] = useState([]);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        category: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        desc: "",
        howLong: "",
        category: "",
        logo: null
    });
    const [logoFiles, setLogoFiles] = useState([]);



    // Fetch partners
    const fetchPartnersAndCategories = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetPartnersInfo());
            await dispatch(onGetPartnerCategories());
        } catch (error) {
            console.error("Error loading partners or categories:", error);
            toast.error("Failed to load partners or categories");
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Load partners data
    useEffect(() => {
        fetchPartnersAndCategories();
    }, [fetchPartnersAndCategories]);
    // console.log("data is:", partnersData)
    // Update partners list when data changes
    useEffect(() => {
        const partnerCategories = Array.isArray(partnerCategoriesData) ? partnerCategoriesData : [];

        const initialPartners = Array.isArray(partnersData) ? partnersData : [];
        const partnersWithOrder = initialPartners.map((partner, index) => ({
            ...partner,
            order: partner.order || index
        }));
        const sortedPartners = partnersWithOrder.sort((a, b) => a.order - b.order);
        setPartners(sortedPartners);
        setPartnerCategories(partnerCategories);
        setFilteredPartners(sortedPartners);
    }, [partnersData, partnerCategoriesData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        // Filter the partners based on search and category
        const filtered = partners.filter(partner => {
            const matchesSearch = !value ||
                partner.name?.toLowerCase().includes(value.toLowerCase()) ||
                partner.desc?.toLowerCase().includes(value.toLowerCase());

            const matchesCategory = !filters.category ||
                partner.category === (name === 'category' ? value : filters.category);

            return matchesSearch && matchesCategory;
        });
        setFilteredPartners(filtered);
    };


    const categoryOptions = partnerCategories.map(category => ({
        value: category._id,
        label: category.categoryName
    }));



    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle file upload
    const handleFileUpdate = (fileItems) => {
        setLogoFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                logo: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                logo: null
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

        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            desc: "",
            howLong: "",
            category: "",
            logo: null
        });
        setLogoFiles([]);
        setSelectedPartner(null);
    };

    // Create new partner
    const createPartner = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('desc', formData.desc);
            submitData.append('howLong', formData.howLong);
            submitData.append('category', formData.category);

            if (formData.logo) {
                submitData.append('logo', formData.logo);
            }

            await dispatch(onCreateOrUpdatePartner(submitData));

            setModal(false);
            resetForm();
        } catch (error) {
            console.error("Error creating partner:", error);
            toast.error("Failed to create partner");
        }
    };

    // Update partner
    const updatePartner = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedPartner) return;

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('desc', formData.desc);
            submitData.append('howLong', formData.howLong);
            submitData.append('category', formData.category);
            submitData.append('_id', selectedPartner._id);

            if (formData.logo) {
                submitData.append('logo', formData.logo);
            }

            await dispatch(onCreateOrUpdatePartner(submitData));

            setModal(false);
            resetForm();
        } catch (error) {
            console.error("Error updating partner:", error);
            toast.error("Failed to update partner");
        }
    };

    // Delete partner
    const deletePartner = async () => {
        if (!selectedPartner) return;

        try {
            await dispatch(onDeletePartner(selectedPartner._id));
            setDeleteModal(false);
        } catch (error) {
            console.error("Error deleting partner:", error);
            toast.error("Failed to delete partner");
        }
    };

    // Open modal for edit
    const handleEdit = (partner) => {
        setSelectedPartner(partner);
        setFormData({
            name: partner.name || "",
            desc: partner.desc || "",
            howLong: partner.howLong || "",
            category: partner.category._id || "",
            logo: null
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedPartner(null);
        setFormData({
            name: "",
            desc: "",
            howLong: "",
            category: "",
            logo: null
        });
        setLogoFiles([]);
        setIsEdit(false);
        setModal(true);
    };


    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Partners" pageTitle="Setup" />

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
                                        placeholder="Search by name or description"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Category</Label>
                                    <Label>Role</Label>

                                    <Select
                                        name="category"
                                        value={categoryOptions.find(option => option.value === filters.category) || null}
                                        onChange={(selected) => {
                                            const value = selected ? selected.value : "";
                                            setFilters(prev => ({ ...prev, category: value }));

                                            const filtered = partners.filter(partner => {
                                                const matchesSearch = !filters.search ||
                                                    partner.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                                                    partner.desc?.toLowerCase().includes(filters.search.toLowerCase());

                                                const matchesCategory = !value || partner.category._id === value;

                                                return matchesSearch && matchesCategory;
                                            });

                                            setFilteredPartners(filtered);
                                        }}
                                        options={[{ value: "", label: "All Categories" }, ...categoryOptions]}
                                        isClearable
                                        placeholder="Select Category"
                                    />

                                </FormGroup>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Partners Cards */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Partners List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Partner
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : filteredPartners.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="text-muted">
                                    <i className="ri-group-line display-4" />
                                    <h4 className="mt-3">No partners found</h4>
                                    <p className="text-muted">
                                        {partners.length === 0
                                            ? "Get started by adding your first partner."
                                            : "No partners match your search criteria."}
                                    </p>
                                    {partners.length === 0 && (
                                        <Button color="primary" onClick={handleCreate}>
                                            Add Partner
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Row>
                                {filteredPartners.map((partner) => (
                                    <Col key={partner._id} lg={3} md={4} sm={6} className="mb-4">
                                        <Card className="h-100 shadow-sm">
                                            <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                                <Badge color="primary" className="fs-12">
                                                    Order: {partner.order + 1}
                                                </Badge>
                                                <div className="d-flex gap-1">
                                                    <Button
                                                        color="soft-primary"
                                                        size="sm"
                                                        onClick={() => handleEdit(partner)}
                                                    >
                                                        <i className="ri-pencil-line" />
                                                    </Button>
                                                    <Button
                                                        color="soft-danger"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedPartner(partner);
                                                            setDeleteModal(true);
                                                        }}
                                                    >
                                                        <i className="ri-delete-bin-line" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <CardBody className="text-center">
                                                {/* Logo */}
                                                <div className="mb-3">
                                                    <div className="avatar-xl mx-auto">
                                                        {partner.logo ? (
                                                            <img
                                                                src={partner.logo}
                                                                alt={partner.name}
                                                                className="img-thumbnail rounded-circle"
                                                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <div className="avatar-title bg-light text-secondary rounded-circle fs-24">
                                                                <i className="ri-building-line" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Name */}
                                                <h5 className="card-title mb-2">{partner.name}</h5>

                                                {/* Category */}
                                                <Badge
                                                    color="success"
                                                    className="mb-3"
                                                >
                                                    {partner.category.categoryName}
                                                </Badge>

                                                {/* Description */}
                                                {partner.desc && (
                                                    <p className="text-muted mb-3">
                                                        {partner.desc.length > 100
                                                            ? `${partner.desc.substring(0, 100)}...`
                                                            : partner.desc}
                                                    </p>
                                                )}

                                                {/* How Long */}
                                                {partner.howLong && (
                                                    <div className="d-flex align-items-center justify-content-center text-muted">
                                                        <i className="ri-time-line me-1" />
                                                        <small>{partner.howLong}</small>
                                                    </div>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Partner' : 'Add New Partner'}
                </ModalHeader>
                <Form onSubmit={isEdit ? updatePartner : createPartner}>
                    <ModalBody>
                        <Row>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Partner Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter partner name"
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Description</Label>
                                    <Input
                                        type="textarea"
                                        name="desc"
                                        value={formData.desc}
                                        onChange={handleInputChange}
                                        placeholder="Enter partner description"
                                        rows="3"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Partnership Duration</Label>
                                    <Input
                                        name="howLong"
                                        value={formData.howLong}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 2 years, Since 2020"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Category <span className="text-danger">*</span></Label>
                                    <Select
                                        name="category"
                                        value={categoryOptions.find(option => option.value === formData.category) || null}
                                        onChange={(selected) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                category: selected ? selected.value : ""
                                            }));
                                        }}
                                        options={categoryOptions}
                                        placeholder="Select Category"
                                        isClearable
                                        required
                                    />

                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Partner Logo</Label>
                                    <FilePond
                                        files={logoFiles}
                                        onupdatefiles={handleFileUpdate}
                                        allowMultiple={false}
                                        maxFiles={1}
                                        name="logo"
                                        labelIdle='Drag & Drop your logo or <span class="filepond--label-action">Browse</span>'
                                        acceptedFileTypes={['image/*']}
                                        imagePreviewHeight={100}
                                        credits={false}
                                    />
                                    <small className="text-muted">
                                        Recommended: Square image, 200x200 pixels or larger
                                    </small>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setModal(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit">
                            {isEdit ? 'Update Partner' : 'Add Partner'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deletePartner}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default PartnersPage;