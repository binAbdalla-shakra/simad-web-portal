import React, { useState, useEffect, useCallback } from 'react';
import DataTable from "react-data-table-component";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge
} from "reactstrap";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

import {
    getPartnerCategories as onGetPartnerCategories,
    addPartnerCategory as onAddPartnerCategory,
    updatePartnerCategory as onUpdatePartnerCategory,
    deletePartnerCategory as onDeletePartnerCategory,
} from "../../../slices/thunks";

const PartnerCategories = () => {
    document.title = "Partner Categories | SIMAD University";
    const dispatch = useDispatch();

    const selectPartnerCategoriesData = createSelector(
        (state) => state.Setups,
        (partner_categoriesData) => partner_categoriesData.partner_categoriesData
    );

    const partnerCategoriesData = useSelector(selectPartnerCategoriesData);

    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [formData, setFormData] = useState({ categoryName: "", desc: "" });

    const [filters, setFilters] = useState({ search: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const fetchPartnerCategories = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetPartnerCategories());
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchPartnerCategories();
    }, [fetchPartnerCategories]);

    useEffect(() => {
        const initialCategories = partnerCategoriesData?.categories || [];
        setCategories(initialCategories);
        setFilteredCategories(initialCategories);
    }, [partnerCategoriesData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterChange = (e) => {
        const { value } = e.target;
        setFilters(prev => ({ ...prev, search: value }));

        const filtered = categories.filter(cat =>
            cat.categoryName.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCategories(filtered);
    };

    const validateForm = () => {
        if (!formData.categoryName || !formData.desc) {
            toast.warning("Please fill all required fields.");
            return false;
        }
        return true;
    };

    const createCategory = async () => {
        if (!validateForm()) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const data = {
                ...formData,
                createdBy: authUser?.data?.user?.username || "Admin"
            };

            dispatch(onAddPartnerCategory(data));
            setModal(false);
        } catch (error) {
            console.error("Error creating category:", error);
        }
    };

    const updateCategory = async () => {
        if (!validateForm() || !selectedCategory) return;

        try {
            const authUser = JSON.parse(sessionStorage.getItem("authUser"));
            const data = {
                ...formData,
                _id: selectedCategory._id,
                updatedBy: authUser?.data?.user?.username || "Admin"
            };

            dispatch(onUpdatePartnerCategory(data));
            setModal(false);
        } catch (error) {
            console.error("Error updating category:", error);
        }
    };

    const deleteCategory = async () => {
        if (!selectedCategory) return;

        try {
            dispatch(onDeletePartnerCategory(selectedCategory._id));
            setDeleteModal(false);
            fetchPartnerCategories();
        } catch (error) {
            console.error("Error deleting category:", error);
        }
    };

    const handleCreate = () => {
        setSelectedCategory(null);
        setFormData({ categoryName: "", desc: "" });
        setIsEdit(false);
        setModal(true);
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setFormData({
            categoryName: category.categoryName,
            desc: category.desc
        });
        setIsEdit(true);
        setModal(true);
    };

    const columns = [
        {
            name: "#",
            cell: (row, index) => index + 1,
        },
        {
            name: "Category Name",
            selector: row => row.categoryName,
        },
        {
            name: "Description",
            selector: row => row.desc,
            wrap: true,
        },
        {
            name: "Actions",
            cell: row => (
                <div className="d-flex gap-2">
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button color="soft-danger" size="sm" onClick={() => {
                        setSelectedCategory(row);
                        setDeleteModal(true);
                    }}>
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Partner Categories" pageTitle="Partners" />

                <Card className="mb-3">
                    <CardBody>
                        <Row>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Search</Label>
                                    <Input
                                        type="text"
                                        placeholder="Search by category name"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Partner Categories List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add Category
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : error ? (
                            <div className="text-danger">{error}</div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredCategories}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No categories found"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)}>
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Partner Category' : 'Add Partner Category'}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    isEdit ? updateCategory() : createCategory();
                }}>
                    <ModalBody>
                        <Row>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Category Name <span className="text-danger">*</span></Label>
                                    <Input
                                        name="categoryName"
                                        value={formData.categoryName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. International"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Description <span className="text-danger">*</span></Label>
                                    <Input
                                        type="textarea"
                                        name="desc"
                                        value={formData.desc}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Category description"
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="light" onClick={() => setModal(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteCategory}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default PartnerCategories;
