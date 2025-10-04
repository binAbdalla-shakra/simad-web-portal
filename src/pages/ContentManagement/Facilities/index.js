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

// Register the plugins
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview);

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

//redux
import {
    getFacilities as onGetFacilities,
    deleteFacility as onDeleteFacility,
    CreateOrUpdateFacility as onCreateOrUpdateFacility
} from "../../../slices/thunks";

// Selectors
const selectFacilitiesData = createSelector(
    (state) => state.ContentManagement,
    (facilitiesData) => facilitiesData.facilitiesData.facilities || []
);

const FacilitiesPage = () => {
    document.title = "Facilities | simad University";

    const dispatch = useDispatch();
    const facilitiesData = useSelector(selectFacilitiesData);

    // State management
    const [facilities, setFacilities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState(null);
    const [filteredFacilities, setFilteredFacilities] = useState([]);

    // Filters state
    const [filters, setFilters] = useState({
        search: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        image: null
    });
    const [imageFiles, setImageFiles] = useState([]);

    // Fetch facilities
    const fetchFacilities = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetFacilities());
        } catch (error) {
            console.error("Error loading facilities:", error);

        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Load facilities data
    useEffect(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    // Update facilities list when data changes
    useEffect(() => {
        const initialFacilities = Array.isArray(facilitiesData) ? facilitiesData : [];
        setFacilities(initialFacilities);
        setFilteredFacilities(initialFacilities);
    }, [facilitiesData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        // Filter the facilities based on search
        const filtered = facilities.filter(facility => {
            const matchesSearch = !value ||
                facility.name?.toLowerCase().includes(value.toLowerCase()) ||
                facility.description?.toLowerCase().includes(value.toLowerCase());

            return matchesSearch;
        });
        setFilteredFacilities(filtered);
    };

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
        setImageFiles(fileItems);
        if (fileItems.length > 0) {
            setFormData(prev => ({
                ...prev,
                image: fileItems[0].file
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                image: null
            }));
        }
    };

    // Validate form
    const validateForm = () => {
        const requiredFields = ['name', 'description'];
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
            description: "",
            image: null
        });
        setImageFiles([]);
        setSelectedFacility(null);
    };

    // Format date for display
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Create new facility
    const createFacility = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('description', formData.description);

            if (formData.image) {
                submitData.append('image', formData.image);
            }

            await dispatch(onCreateOrUpdateFacility(submitData));


            setModal(false);
            resetForm();
            fetchFacilities(); // Refresh the list
        } catch (error) {
            console.error("Error creating facility:", error);

        }
    };

    // Update facility
    const updateFacility = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedFacility) return;

        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('description', formData.description);
            submitData.append('_id', selectedFacility._id);

            if (formData.image) {
                submitData.append('image', formData.image);
            }

            await dispatch(onCreateOrUpdateFacility(submitData));


            setModal(false);
            resetForm();
            fetchFacilities(); // Refresh the list
        } catch (error) {
            console.error("Error updating facility:", error);

        }
    };

    // Delete facility
    const deleteFacility = async () => {
        if (!selectedFacility) return;

        try {
            await dispatch(onDeleteFacility(selectedFacility._id));


            setDeleteModal(false);
            fetchFacilities();
        } catch (error) {
            console.error("Error deleting facility:", error);

        }
    };

    // Open modal for edit
    const handleEdit = (facility) => {
        setSelectedFacility(facility);
        setFormData({
            name: facility.name || "",
            description: facility.description || "",
            image: null
        });

        // Reset image files
        // setImageFiles([]);

        // // Set existing image if available - using setTimeout to ensure FilePond is ready
        // if (facility.image) {
        //     // Convert the image URL to a proper file object
        //     const fetchImageAsFile = async () => {
        //         try {
        //             const response = await fetch(facility.image);
        //             const blob = await response.blob();
        //             const file = new File([blob], 'existing-image.jpg', { type: blob.type });

        //             setImageFiles([
        //                 {
        //                     source: file,
        //                     options: {
        //                         type: 'local'
        //                     }
        //                 }
        //             ]);
        //         } catch (error) {
        //             console.error('Error loading existing image:', error);
        //             // If fetch fails, just set the URL and let FilePond handle it
        //             setImageFiles([
        //                 {
        //                     source: facility.image,
        //                     options: {
        //                         type: 'limbo'
        //                     }
        //                 }
        //             ]);
        //         }
        //     };

        //     fetchImageAsFile();
        // }

        setIsEdit(true);
        setModal(true);
    };


    // Open modal for create
    const handleCreate = () => {
        setSelectedFacility(null);
        setFormData({
            name: "",
            description: "",
            image: null
        });
        setImageFiles([]);
        setIsEdit(false);
        setModal(true);
    };

    // Truncate text for cards
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Facilities" pageTitle="Content Management" />

                {/* Filter Controls */}
                <Card className="mb-3">
                    <CardBody>
                        <Row>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Search Facilities</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by name or description"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Facilities Cards */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Facilities List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Facility
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : filteredFacilities.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="text-muted">
                                    <i className="ri-building-line display-4" />
                                    <h4 className="mt-3">No facilities found</h4>
                                    <p className="text-muted">
                                        {facilities.length === 0
                                            ? "Get started by adding your first facility."
                                            : "No facilities match your search criteria."}
                                    </p>
                                    {facilities.length === 0 && (
                                        <Button color="primary" onClick={handleCreate}>
                                            Add Facility
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Row>
                                {filteredFacilities.map((facility) => (
                                    <Col key={facility._id} lg={4} md={6} className="mb-4">
                                        <Card className="h-100 shadow-sm facility-card">
                                            {/* Facility Image */}
                                            <div className="facility-image-container">
                                                {facility.image ? (
                                                    <img
                                                        src={facility.image}
                                                        alt={facility.name}
                                                        className="card-img-top facility-image"
                                                        style={{ height: '200px', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="card-img-top facility-image-placeholder d-flex align-items-center justify-content-center"
                                                        style={{ height: '200px' }}
                                                    >
                                                        <i className="ri-building-line display-4 text-muted" />
                                                    </div>
                                                )}
                                            </div>

                                            <CardBody className="d-flex flex-column">
                                                {/* Name */}
                                                <h5 className="card-title mb-3 flex-grow-0">
                                                    {facility.name}
                                                </h5>

                                                {/* Description */}
                                                <p className="text-muted mb-3 flex-grow-1">
                                                    {truncateText(facility.description, 120)}
                                                </p>

                                                {/* Actions */}
                                                <div className="d-flex justify-content-between align-items-center mt-auto">
                                                    <small className="text-muted">
                                                        {facility.createdAt &&
                                                            `Created: ${formatDateForDisplay(facility.createdAt)}`
                                                        }
                                                    </small>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            color="soft-primary"
                                                            size="sm"
                                                            onClick={() => handleEdit(facility)}
                                                        >
                                                            <i className="ri-pencil-line" />
                                                        </Button>
                                                        <Button
                                                            color="soft-danger"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedFacility(facility);
                                                                setDeleteModal(true);
                                                            }}
                                                        >
                                                            <i className="ri-delete-bin-line" />
                                                        </Button>
                                                    </div>
                                                </div>
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
                    {isEdit ? 'Edit Facility' : 'Add New Facility'}
                </ModalHeader>
                <Form onSubmit={isEdit ? updateFacility : createFacility}>
                    <ModalBody>
                        <Row>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter facility name"
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Description <span className="text-danger">*</span></Label>
                                    <Input
                                        type="textarea"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Enter facility description"
                                        rows="4"
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Facility Image</Label>
                                    <FilePond
                                        files={imageFiles}
                                        onupdatefiles={handleFileUpdate}
                                        allowMultiple={false}
                                        maxFiles={1}
                                        name="image"
                                        labelIdle='Drag & Drop your image or <span class="filepond--label-action">Browse</span>'
                                        acceptedFileTypes={['image/*']}
                                        imagePreviewHeight={150}
                                        credits={false}
                                    />
                                    <small className="text-muted">
                                        Recommended: High-quality image showcasing the facility
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
                            {isEdit ? 'Update Facility' : 'Add Facility'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteFacility}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />

            {/* Custom CSS */}
            <style>
                {`
                    .facility-card {
                        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                    }
                    .facility-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
                    }
                    .facility-image-container {
                        position: relative;
                        overflow: hidden;
                    }
                    .facility-image-placeholder {
                        background-color: #f8f9fa;
                    }
                    .facility-image {
                        transition: transform 0.3s ease;
                    }
                    .facility-card:hover .facility-image {
                        transform: scale(1.05);
                    }
                `}
            </style>
        </div>
    );
};

export default FacilitiesPage;