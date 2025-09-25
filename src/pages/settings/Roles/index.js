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

//redux
import {
    getRoles as onGetRoles,
    addRole as onAddRole,
    updateRole as onUpdateRole,
    deleteRole as onDeleteRole,
} from "../../../slices/thunks";

const Roles = () => {
    document.title = "Roles | simad University";

    const dispatch = useDispatch();

    const selectRolesData = createSelector(
        (state) => state.Settings,
        (rolesData) => rolesData.rolesData
    );

    // State management
    const rolesData = useSelector(selectRolesData);

    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [filteredRoles, setFilteredRoles] = useState([]);

    // Filters state
    const [filters, setFilters] = useState({
        search: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        type: "",
        description: "",
        CreatedBy: "667f1b9e8c4a8d001e4a1234", // Static MongoID
        ModifiedBy: "667f1b9e8c4a8d001e4a1234" // Static MongoID
    });

    // Static user IDs (you can modify these as needed)
    const staticUserIds = {
        CreatedBy: "667f1b9e8c4a8d001e4a1234",
        ModifiedBy: "667f1b9e8c4a8d001e4a1234"
    };

    // Fetch roles
    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetRoles());
        } catch (error) {
            setError("Error loading roles: " + error.message);
            toast.error("Failed to load roles");
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    // Update roles list when data changes
    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    useEffect(() => {
        const initialRoles = rolesData?.roles || [];
        setRoles(initialRoles);
        setFilteredRoles(initialRoles);
    }, [rolesData]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { value } = e.target;
        setFilters(prevFilters => ({ ...prevFilters, search: value }));

        // Filter the roles based on the search input
        const filtered = roles.filter(role =>
            role.type.toLowerCase().includes(value.toLowerCase()) ||
            (role.description && role.description.toLowerCase().includes(value.toLowerCase()))
        );
        setFilteredRoles(filtered);
    };

    // Validate form
    const validateForm = () => {
        if (!formData.type.trim()) {
            toast.warning("Role type is required");
            return false;
        }

        if (formData.type.length < 2) {
            toast.warning("Role type must be at least 2 characters long");
            return false;
        }

        return true;
    };

    // Create new role
    const createRole = async () => {
        if (!validateForm()) return;

        try {
            const roleData = {
                ...formData,
                CreatedBy: staticUserIds.CreatedBy
            };

            await dispatch(onAddRole(roleData));
            setModal(false);
            resetForm();
        } catch (error) {
            toast.error("Error creating role: " + error.message);
        }
    };

    // Update role
    const updateRole = async () => {
        if (!validateForm() || !selectedRole) return;

        try {
            const roleData = {
                ...formData,
                _id: selectedRole._id,
                ModifiedBy: staticUserIds.ModifiedBy
            };

            await dispatch(onUpdateRole(roleData));
            setModal(false);
            resetForm();
        } catch (error) {
            toast.error("Error updating role: " + error.message);
        }
    };

    // Delete role
    const deleteRole = async () => {
        if (!selectedRole) return;

        try {
            await dispatch(onDeleteRole(selectedRole._id));
            setDeleteModal(false);
            fetchRoles();
        } catch (error) {
            toast.error("Error deleting role: " + error.message);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            type: "",
            description: "",
            CreatedBy: staticUserIds.CreatedBy,
            ModifiedBy: staticUserIds.ModifiedBy
        });
    };

    // Open modal for edit
    const handleEdit = (role) => {
        setSelectedRole(role);
        setFormData({
            type: role.type,
            description: role.description || "",
            CreatedBy: role.CreatedBy || staticUserIds.CreatedBy,
            ModifiedBy: role.ModifiedBy || staticUserIds.ModifiedBy
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedRole(null);
        resetForm();
        setIsEdit(false);
        setModal(true);
    };

    // Format date
    const formatDate = (dateString) => {
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
            cell: (row, index) => index + 1
        },
        {
            name: 'Role Type',
            selector: row => row.type,
        },
        {
            name: 'Description',
            selector: row => row.description || '-',
            wrap: true,
            cell: row => (
                <span title={row.description}>
                    {row.description ? (row.description.length > 50 ? `${row.description.substring(0, 50)}...` : row.description) : '-'}
                </span>
            )
        },
        {
            name: 'Permissions',
            cell: row => (
                <Badge color="info">
                    {row.permissions ? row.permissions.length : 0} permissions
                </Badge>
            )
        },

        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-2">
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button color="soft-danger" size="sm" onClick={() => {
                        setSelectedRole(row);
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
                <BreadCrumb title="Roles Management" pageTitle="Settings" />

                {/* Filter Controls */}
                <Card className="mb-3">
                    <CardBody>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Search Roles</Label>
                                    <Input
                                        type="text"
                                        name="search"
                                        placeholder="Search by role type or description"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>

                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Roles List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add New Role
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : error ? (
                            <div className="text-danger text-center">{error}</div>
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredRoles}
                                pagination
                                highlightOnHover
                                responsive
                                striped
                                noDataComponent={
                                    <div className="text-center py-4">
                                        <i className="ri-shield-keyhole-line display-4 text-muted" />
                                        <h5 className="mt-2">No Roles Found</h5>
                                        <p className="text-muted">Get started by creating your first role.</p>
                                    </div>
                                }
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit Role' : 'Add New Role'}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    isEdit ? updateRole() : createRole();
                }}>
                    <ModalBody>
                        <Row>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Role Type <span className="text-danger">*</span></Label>
                                    <Input
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Admin, User, Moderator"
                                        required
                                    />
                                    <small className="text-muted">
                                        Enter the role type (minimum 2 characters)
                                    </small>
                                </FormGroup>
                            </Col>
                            <Col md={12}>
                                <FormGroup>
                                    <Label>Description</Label>
                                    <Input
                                        type="textarea"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe the role's purpose and permissions"
                                        rows="3"
                                    />
                                    <small className="text-muted">
                                        Optional description of the role
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
                            {isEdit ? 'Update Role' : 'Create Role'}
                        </Button>
                    </ModalFooter>
                </Form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={deleteRole}
                onCloseClick={() => setDeleteModal(false)}
                confirmationText={`Are you sure you want to delete the role "${selectedRole?.type}"? This action cannot be undone.`}
            />

            <ToastContainer />
        </div>
    );
};

export default Roles;