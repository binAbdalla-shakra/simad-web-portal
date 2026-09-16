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
    getNews as onGetNews,
    deleteNews as onDeleteNews,
    CreateOrUpdateNews as onCreateOrUpdateNews
} from "../../../slices/thunks";

// Selectors
const selectNewsData = createSelector(
    (state) => state.ContentManagement,
    (newsData) => newsData.newsData.news || []
);

const NewsPage = () => {
    document.title = "News | simad University";

    const dispatch = useDispatch();
    const newsData = useSelector(selectNewsData);

    // State management
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [filteredNews, setFilteredNews] = useState([]);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        date: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        infoLink: "",
        date: "",
        image: null
    });
    const [imageFiles, setImageFiles] = useState([]);

    // Fetch news
    const fetchNews = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetNews());
        } catch (error) {
            console.error("Error loading news:", error);

        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Load news data
    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    // Update news list when data changes
    useEffect(() => {
        const initialNews = Array.isArray(newsData) ? newsData : [];
        setNews(initialNews);
        setFilteredNews(initialNews);
    }, [newsData]);

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));

        // Filter the news based on search and date
        const filtered = news.filter(newsItem => {
            const matchesSearch = !value ||
                newsItem.title?.toLowerCase().includes(value.toLowerCase()) ||
                newsItem.description?.toLowerCase().includes(value.toLowerCase());

            const matchesDate = !filters.date ||
                newsItem.date === (name === 'date' ? value : filters.date);

            return matchesSearch && matchesDate;
        });
        setFilteredNews(filtered);
    };

    // Handle date filter change separately
    const handleDateFilterChange = (e) => {
        const { value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, date: value }));

        const filtered = news.filter(newsItem => {
            const matchesSearch = !filters.search ||
                newsItem.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
                newsItem.description?.toLowerCase().includes(filters.search.toLowerCase());

            const matchesDate = !value || newsItem.date === value;

            return matchesSearch && matchesDate;
        });
        setFilteredNews(filtered);
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
        const requiredFields = ['title', 'description', 'date'];
        const missingFields = requiredFields.filter(field => !formData[field]);

        if (missingFields.length > 0) {
            toast.warning(`Please fill all required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Validate URL format if infoLink is provided
        if (formData.infoLink && !isValidUrl(formData.infoLink)) {
            toast.warning('Please enter a valid URL for the information link');
            return false;
        }

        return true;
    };

    // URL validation helper
    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            infoLink: "",
            date: "",
            image: null
        });
        setImageFiles([]);
        setSelectedNews(null);
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
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Create new news
    const createNews = async (e) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('infoLink', formData.infoLink);
            submitData.append('date', formData.date);

            if (formData.image) {
                submitData.append('image', formData.image);
            }

            await dispatch(onCreateOrUpdateNews(submitData)).unwrap();

            setModal(false);
            resetForm();
        } catch (error) {
            // Failed: keep the modal open and the entered data intact so the
            // user can fix the issue and resubmit instead of losing their input.
            console.error("Error creating news:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update news
    const updateNews = async (e) => {
        e.preventDefault();
        if (!validateForm() || !selectedNews || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('description', formData.description);
            submitData.append('infoLink', formData.infoLink);
            submitData.append('date', formData.date);
            submitData.append('_id', selectedNews._id);

            if (formData.image) {
                submitData.append('image', formData.image);
            }

            await dispatch(onCreateOrUpdateNews(submitData)).unwrap();

            setModal(false);
            resetForm();
        } catch (error) {
            console.error("Error updating news:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete news
    const deleteNews = async () => {
        if (!selectedNews) return;

        try {
            await dispatch(onDeleteNews(selectedNews._id));

            setDeleteModal(false);
            fetchNews();
        } catch (error) {
            console.error("Error deleting news:", error);

        }
    };

    // Open modal for edit
    const handleEdit = (newsItem) => {
        setSelectedNews(newsItem);
        setFormData({
            title: newsItem.title || "",
            description: newsItem.description || "",
            infoLink: newsItem.infoLink || "",
            date: formatDateForInput(newsItem.date) || "",
            image: null
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedNews(null);
        setFormData({
            title: "",
            description: "",
            infoLink: "",
            date: formatDateForInput(new Date()),
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
                <BreadCrumb title="News" pageTitle="Media" />

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
                                        placeholder="Search by title or description"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4} style={{ display: "none" }}>
                                <FormGroup>
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        name="date"
                                        value={filters.date}
                                        onChange={handleDateFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* News Cards */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">News List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add News
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : filteredNews.length === 0 ? (
                            <div className="text-center py-5">
                                <div className="text-muted">
                                    <i className="ri-newspaper-line display-4" />
                                    <h4 className="mt-3">No news found</h4>
                                    <p className="text-muted">
                                        {news.length === 0
                                            ? "Get started by adding your first news article."
                                            : "No news articles match your search criteria."}
                                    </p>
                                    {news.length === 0 && (
                                        <Button color="primary" onClick={handleCreate}>
                                            Add News
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Row>
                                {filteredNews.map((newsItem) => (
                                    <Col key={newsItem._id} lg={4} md={6} className="mb-4">
                                        <Card className="h-100 shadow-sm news-card">
                                            {/* News Image */}
                                            <div className="news-image-container">
                                                {newsItem.image ? (
                                                    <img
                                                        src={newsItem.image}
                                                        alt={newsItem.title}
                                                        className="card-img-top news-image"
                                                        style={{ height: '200px', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div className="card-img-top news-image-placeholder d-flex align-items-center justify-content-center">
                                                        <i className="ri-newspaper-line display-4 text-muted" />
                                                    </div>
                                                )}
                                            </div>

                                            <CardBody className="d-flex flex-column">
                                                {/* Date Badge */}
                                                <div className="mb-2">
                                                    <Badge color="primary" className="fs-12">
                                                        <i className="ri-calendar-line me-1" />
                                                        {formatDateForDisplay(newsItem.date)}
                                                    </Badge>
                                                </div>

                                                {/* Title */}
                                                <h5 className="card-title mb-3 flex-grow-0">
                                                    {newsItem.title}
                                                </h5>

                                                {/* Description */}
                                                <p className="text-muted mb-3 flex-grow-1">
                                                    {truncateText(newsItem.description, 120)}
                                                </p>

                                                {/* Info Link */}
                                                {newsItem.infoLink && (
                                                    <div className="mb-3">
                                                        <a
                                                            href={newsItem.infoLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary text-decoration-none"
                                                        >
                                                            <i className="ri-external-link-line me-1" />
                                                            Read more
                                                        </a>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="d-flex justify-content-between align-items-center mt-auto">
                                                    <small className="text-muted">
                                                        {newsItem.createdAt &&
                                                            `Created: ${formatDateForDisplay(newsItem.createdAt)}`
                                                        }
                                                    </small>
                                                    <div className="d-flex gap-1">
                                                        <Button
                                                            color="soft-primary"
                                                            size="sm"
                                                            onClick={() => handleEdit(newsItem)}
                                                        >
                                                            <i className="ri-pencil-line" />
                                                        </Button>
                                                        <Button
                                                            color="soft-danger"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedNews(newsItem);
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
                    {isEdit ? 'Edit News' : 'Add New News'}
                </ModalHeader>
                <Form onSubmit={isEdit ? updateNews : createNews}>
                    <ModalBody>
                        <Row>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Title <span className="text-danger">*</span></Label>
                                    <Input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Simad University Launches New Engineering Program"
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
                                        placeholder="Enter a brief summary of the news article"
                                        rows="4"
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Information Link <span className="text-muted fs-12">(optional)</span></Label>
                                    <Input
                                        type="url"
                                        name="infoLink"
                                        value={formData.infoLink}
                                        onChange={handleInputChange}
                                        placeholder="https://example.com/news-article"
                                    />
                                    <small className="text-muted">
                                        Optional: Link to full article or external source
                                    </small>
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
                                        required
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>News Image <span className="text-muted fs-12">(optional)</span></Label>
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
                            {isSubmitting ? 'Saving...' : (isEdit ? 'Update News' : 'Add News')}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteNews}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />

            {/* Custom CSS */}
            <style>
                {`
                    .news-card {
                        transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                    }
                    .news-card:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
                    }
                    .news-image-container {
                        position: relative;
                        overflow: hidden;
                    }
                    .news-image-placeholder {
                        height: 200px;
                        background-color: #f8f9fa;
                    }
                    .news-image {
                        transition: transform 0.3s ease;
                    }
                    .news-card:hover .news-image {
                        transform: scale(1.05);
                    }
                `}
            </style>
        </div>
    );
};

export default NewsPage;