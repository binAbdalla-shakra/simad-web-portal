import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, Spinner
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
    getEvents as onGetEvents,
    deleteEvent as onDeleteEvent,
    CreateOrUpdateEvent as onCreateOrUpdateEvent
} from "../../../slices/thunks";

// Selectors
const selectEventsData = createSelector(
    (state) => state.ContentManagement,
    (eventsData) => eventsData.eventsData.events || []
);

const EventsPage = () => {
    document.title = "Events | simad University";

    const dispatch = useDispatch();
    const eventsData = useSelector(selectEventsData);

    // State management
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [filteredEvents, setFilteredEvents] = useState([]);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        date: '',
        location: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        duration: "",
        startTime: "",
        location: "",
        image: null
    });
    const [imageFiles, setImageFiles] = useState([]);

    // Duration options
    const durationOptions = [
        { value: '30 minutes', label: '30 minutes' },
        { value: '1 hour', label: '1 hour' },
        { value: '2 hours', label: '2 hours' },
        { value: '3 hours', label: '3 hours' },
        { value: '4 hours', label: '4 hours' },
        { value: '6 hours', label: '6 hours' },
        { value: '1 day', label: '1 day' },
        { value: '2 days', label: '2 days' },
        { value: '3 days', label: '3 days' },
        { value: '1 week', label: '1 week' },
        { value: '2 weeks', label: '2 weeks' }
    ];

    // Time options
    const timeOptions = [
        { value: '08:00 AM', label: '8:00 AM' },
        { value: '09:00 AM', label: '9:00 AM' },
        { value: '10:00 AM', label: '10:00 AM' },
        { value: '11:00 AM', label: '11:00 AM' },
        { value: '12:00 PM', label: '12:00 PM' },
        { value: '01:00 PM', label: '1:00 PM' },
        { value: '02:00 PM', label: '2:00 PM' },
        { value: '03:00 PM', label: '3:00 PM' },
        { value: '04:00 PM', label: '4:00 PM' },
        { value: '05:00 PM', label: '5:00 PM' },
        { value: '06:00 PM', label: '6:00 PM' },
        { value: '07:00 PM', label: '7:00 PM' },
        { value: '08:00 PM', label: '8:00 PM' }
    ];

    // Fetch events
    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetEvents());
        } catch (error) {
            console.error("Error loading events:", error);
            toast.error("Failed to load events");
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Load events data
    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Update events list when data changes
    useEffect(() => {
        const initialEvents = Array.isArray(eventsData) ? eventsData : [];
        setEvents(initialEvents);
        setFilteredEvents(initialEvents);
    }, [eventsData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        // Filter the events based on search, date, and location
        const filtered = events.filter(event => {
            const matchesSearch = !value ||
                event.title?.toLowerCase().includes(value.toLowerCase()) ||
                event.description?.toLowerCase().includes(value.toLowerCase());

            const matchesDate = !filters.date ||
                event.date === (name === 'date' ? value : filters.date);

            const matchesLocation = !filters.location ||
                event.location?.toLowerCase().includes((name === 'location' ? value : filters.location).toLowerCase());

            return matchesSearch && matchesDate && matchesLocation;
        });
        setFilteredEvents(filtered);
    };

    // Handle specific filter changes
    const handleSpecificFilterChange = (filterName, value) => {
        setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));

        const filtered = events.filter(event => {
            const matchesSearch = !filters.search ||
                event.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
                event.description?.toLowerCase().includes(filters.search.toLowerCase());

            const matchesDate = filterName !== 'date' ? !filters.date || event.date === filters.date : !value || event.date === value;

            const matchesLocation = filterName !== 'location' ? !filters.location || event.location?.toLowerCase().includes(filters.location.toLowerCase()) : !value || event.location?.toLowerCase().includes(value.toLowerCase());

            return matchesSearch && matchesDate && matchesLocation;
        });
        setFilteredEvents(filtered);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle select changes
    const handleSelectChange = (name, selectedOption) => {
        setFormData(prev => ({
            ...prev,
            [name]: selectedOption ? selectedOption.value : ""
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
        const requiredFields = ['title', 'date', 'startTime', 'duration', 'location', 'description'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Validate date is not in the past
        const eventDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (eventDate < today) {
            toast.warning('Event date cannot be in the past');
            return false;
        }

        return true;
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            date: "",
            duration: "",
            startTime: "",
            location: "",
            image: null
        });
        setImageFiles([]);
        setSelectedEvent(null);
    };

    // Format date for input
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    // Format date for display
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return 'No date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Check if event is upcoming
    const isEventUpcoming = (dateString) => {
        const eventDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
    };

    // Create new event
    const createEvent = async (e) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('date', formData.date);
            submitData.append('duration', formData.duration);
            submitData.append('startTime', formData.startTime);
            submitData.append('location', formData.location);

            if (formData.image) {
                submitData.append('image', formData.image);
            }

            await dispatch(onCreateOrUpdateEvent(submitData)).unwrap();

            setModal(false);
            resetForm();
        } catch (error) {
            // Failed: keep the modal open and the entered data intact so the
            // user can fix the issue and resubmit instead of losing their input.
            console.error("Error creating event:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update event
    const updateEvent = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedEvent || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('date', formData.date);
            submitData.append('duration', formData.duration);
            submitData.append('startTime', formData.startTime);
            submitData.append('location', formData.location);
            submitData.append('_id', selectedEvent._id);

            if (formData.image) {
                submitData.append('image', formData.image);
            }

            await dispatch(onCreateOrUpdateEvent(submitData)).unwrap();

            setModal(false);
            resetForm();
        } catch (error) {
            console.error("Error updating event:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete event
    const deleteEvent = async () => {
        if (!selectedEvent) return;

        try {
            await dispatch(onDeleteEvent(selectedEvent._id));

            setDeleteModal(false);
            fetchEvents();
        } catch (error) {
            console.error("Error deleting event:", error);
            // toast.error("Failed to delete event");
        }
    };

    // Open modal for edit
    const handleEdit = (event) => {
        setSelectedEvent(event);
        setFormData({
            title: event.title || "",
            description: event.description || "",
            date: formatDateForInput(event.date) || "",
            duration: event.duration || "",
            startTime: event.startTime || "",
            location: event.location || "",
            image: null
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedEvent(null);
        setFormData({
            title: "",
            description: "",
            date: formatDateForInput(new Date()),
            duration: "",
            startTime: "",
            location: "",
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
                <BreadCrumb title="Events" pageTitle="Media" />

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
                                        placeholder="Search by title, description, or location"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3} style={{ display: "none" }}>
                                <FormGroup>
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        name="date"
                                        value={filters.date}
                                        onChange={(e) => handleSpecificFilterChange('date', e.target.value)}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3} style={{ display: "none" }}>
                                <FormGroup>
                                    <Label>Location</Label>
                                    <Input
                                        type="text"
                                        name="location"
                                        placeholder="Filter by location"
                                        value={filters.location}
                                        onChange={(e) => handleSpecificFilterChange('location', e.target.value)}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Events Cards */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Events List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Event
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : filteredEvents.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="text-muted">
                                    <i className="ri-calendar-event-line display-4" />
                                    <h4 className="mt-3">No events found</h4>
                                    <p className="text-muted">
                                        {events.length === 0
                                            ? "Get started by adding your first event."
                                            : "No events match your search criteria."}
                                    </p>
                                    {events.length === 0 && (
                                        <Button color="primary" onClick={handleCreate}>
                                            Add Event
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Row>
                                {filteredEvents.map((event) => (
                                    <Col key={event._id} lg={4} md={6} className="mb-4">
                                        <Card className="h-100 shadow-sm event-card">
                                            {/* Event Image */}
                                            <div className="event-image-container position-relative">
                                                {event.image ? (
                                                    <img
                                                        src={event.image}
                                                        alt={event.title}
                                                        className="card-img-top event-image"
                                                        style={{ height: '200px', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div className="card-img-top event-image-placeholder d-flex align-items-center justify-content-center">
                                                        <i className="ri-calendar-event-line display-4 text-muted" />
                                                    </div>
                                                )}
                                                {/* Status Badge */}
                                                <Badge
                                                    color={isEventUpcoming(event.date) ? 'success' : 'secondary'}
                                                    className="position-absolute top-0 end-0 m-2"
                                                >
                                                    {isEventUpcoming(event.date) ? 'Upcoming' : 'Past'}
                                                </Badge>
                                            </div>

                                            <CardBody className="d-flex flex-column">
                                                {/* Event Date & Time */}
                                                <div className="mb-3">
                                                    <div className="d-flex align-items-center text-muted mb-1">
                                                        <i className="ri-calendar-line me-2" />
                                                        <small>{formatDateForDisplay(event.date)}</small>
                                                    </div>
                                                    <div className="d-flex align-items-center text-muted mb-1">
                                                        <i className="ri-time-line me-2" />
                                                        <small>{event.startTime} • {event.duration}</small>
                                                    </div>
                                                    <div className="d-flex align-items-center text-muted">
                                                        <i className="ri-map-pin-line me-2" />
                                                        <small className="text-truncate">{event.location}</small>
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <h5 className="card-title mb-3 flex-grow-0">
                                                    {event.title}
                                                </h5>

                                                {/* Description */}
                                                <p className="text-muted mb-3 flex-grow-1">
                                                    {truncateText(event.description, 100)}
                                                </p>

                                                {/* Actions */}
                                                <div className="d-flex justify-content-between align-items-center mt-auto">
                                                    <small className="text-muted">
                                                        {event.createdAt &&
                                                            `Created: ${formatDateForDisplay(event.createdAt)}`
                                                        }
                                                    </small>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            color="soft-primary"
                                                            size="sm"
                                                            onClick={() => handleEdit(event)}
                                                        >
                                                            <i className="ri-pencil-line" />
                                                        </Button>
                                                        <Button
                                                            color="soft-danger"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedEvent(event);
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
                    {isEdit ? 'Edit Event' : 'Add New Event'}
                </ModalHeader>
                <Form onSubmit={isEdit ? updateEvent : createEvent}>
                    <ModalBody>
                        <Row>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Event Title <span className="text-danger">*</span></Label>
                                    <Input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Annual Tech Symposium 2026"
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
                                        placeholder="e.g., Join us for a day of talks and workshops on emerging technology."
                                        rows="4"
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Date <span className="text-danger">*</span></Label>
                                    <Input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        min={formatDateForInput(new Date())}
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Start Time <span className="text-danger">*</span></Label>
                                    <Select
                                        name="startTime"
                                        value={timeOptions.find(option => option.value === formData.startTime) || null}
                                        onChange={(selected) => handleSelectChange('startTime', selected)}
                                        options={timeOptions}
                                        placeholder="Select start time"
                                        isClearable
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Duration <span className="text-danger">*</span></Label>
                                    <Select
                                        name="duration"
                                        value={durationOptions.find(option => option.value === formData.duration) || null}
                                        onChange={(selected) => handleSelectChange('duration', selected)}
                                        options={durationOptions}
                                        placeholder="Select duration"
                                        isClearable
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Location <span className="text-danger">*</span></Label>
                                    <Input
                                        name="location"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Simad University Main Campus, Mogadishu"
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Event Image</Label>
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
                                        Recommended: Landscape image, 800x400 pixels or larger
                                    </small>
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setModal(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Spinner size="sm" className="me-1" />}
                            {isSubmitting ? 'Saving...' : (isEdit ? 'Update Event' : 'Add Event')}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteEvent}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />

            {/* Custom CSS */}
            <style>
                {`
                    .event-card {
                        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                    }
                    .event-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
                    }
                    .event-image-container {
                        position: relative;
                        overflow: hidden;
                    }
                    .event-image-placeholder {
                        height: 200px;
                        background-color: #f8f9fa;
                    }
                    .event-image {
                        transition: transform 0.3s ease;
                    }
                    .event-card:hover .event-image {
                        transform: scale(1.05);
                    }
                `}
            </style>
        </div>
    );
};

export default EventsPage;