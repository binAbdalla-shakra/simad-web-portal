import React, { useState, useEffect, useCallback } from 'react';
import DataTable from "react-data-table-component";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, Spinner
} from "reactstrap";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import NoDataFound from "../../../Components/Common/NoDataFound";

import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

import { MenuAPI } from "../../../helpers/backend_helper";
import { getLoggedinUser } from "../../../helpers/api_helper";

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [filteredRoles, setFilteredRoles] = useState([]);

    // Filters state
    const [filters, setFilters] = useState({
        search: ''
    });

    const currentUser = getLoggedinUser()?.data?.user;
    const currentUserId = currentUser?._id || currentUser?.id || "";

    // Form state
    const [formData, setFormData] = useState({
        type: "",
        description: "",
        CreatedBy: currentUserId,
        ModifiedBy: currentUserId
    });

    // Menus (fetched once) and the checkbox-tree state derived from them
    const [menus, setMenus] = useState([]);
    // permissionsState: { [topLevelMenuId]: { hasAccess: bool, subMenus: Set<string> } }
    const [permissionsState, setPermissionsState] = useState({});

    useEffect(() => {
        MenuAPI.list().then((res) => {
            if (res?.success) setMenus(res.data?.menus || []);
        });
    }, []);

    const topLevelMenus = menus.filter((m) => !m.parentId);
    const childMenusByParent = (parentId) => menus.filter((m) => m.parentId === parentId);

    const emptyPermissionsState = () => {
        const state = {};
        topLevelMenus.forEach((menu) => {
            state[menu._id] = { hasAccess: false, subMenus: new Set() };
        });
        return state;
    };

    const permissionsStateFromRole = (role) => {
        const state = emptyPermissionsState();
        (role?.permissions || []).forEach((perm) => {
            const menuId = perm.menu?._id || perm.menu;
            if (!menuId || !state[menuId]) return;
            state[menuId] = {
                hasAccess: !!perm.hasAccess,
                subMenus: new Set((perm.subMenus || []).map((s) => s._id || s))
            };
        });
        return state;
    };

    const toggleSectionAccess = (menuId, checked) => {
        setPermissionsState((prev) => {
            const children = childMenusByParent(menuId);
            const next = { ...prev, [menuId]: { hasAccess: checked, subMenus: new Set(prev[menuId]?.subMenus) } };
            if (children.length > 0) {
                next[menuId].subMenus = checked ? new Set(children.map((c) => c._id)) : new Set();
            }
            return next;
        });
    };

    const toggleSubMenu = (menuId, subMenuId, checked) => {
        setPermissionsState((prev) => {
            const subMenus = new Set(prev[menuId]?.subMenus);
            checked ? subMenus.add(subMenuId) : subMenus.delete(subMenuId);
            return { ...prev, [menuId]: { hasAccess: subMenus.size > 0, subMenus } };
        });
    };

    const buildPermissionsPayload = () =>
        Object.entries(permissionsState)
            .filter(([, v]) => v.hasAccess || v.subMenus.size > 0)
            .map(([menu, v]) => ({
                menu,
                subMenus: Array.from(v.subMenus),
                hasAccess: v.hasAccess
            }));

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
        if (!validateForm() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const roleData = {
                ...formData,
                CreatedBy: currentUserId,
                permissions: buildPermissionsPayload()
            };

            await dispatch(onAddRole(roleData)).unwrap();
            setModal(false);
            resetForm();
        } catch (error) {
            // Failed: keep the modal open and the entered data intact so the
            // user can fix the issue and resubmit instead of losing their input.
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update role
    const updateRole = async () => {
        if (!validateForm() || !selectedRole || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const roleData = {
                ...formData,
                _id: selectedRole._id,
                ModifiedBy: currentUserId,
                permissions: buildPermissionsPayload()
            };

            await dispatch(onUpdateRole(roleData)).unwrap();
            setModal(false);
            resetForm();
        } catch (error) {
            // Error toast already shown by the thunk.
        } finally {
            setIsSubmitting(false);
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
            CreatedBy: currentUserId,
            ModifiedBy: currentUserId
        });
        setPermissionsState(emptyPermissionsState());
    };

    // Open modal for edit
    const handleEdit = (role) => {
        setSelectedRole(role);
        setFormData({
            type: role.type,
            description: role.description || "",
            CreatedBy: role.CreatedBy || currentUserId,
            ModifiedBy: currentUserId
        });
        setPermissionsState(permissionsStateFromRole(role));
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
                                    <NoDataFound title="No Roles Found" message="Get started by creating your first role." />
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
                                    <Label>Description <span className="text-muted fs-12">(optional)</span></Label>
                                    <Input
                                        type="textarea"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe the role's purpose and permissions"
                                        rows="3"
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={12}>
                                <FormGroup>
                                    <Label className="mb-2">Permissions</Label>
                                    {menus.length === 0 ? (
                                        <p className="text-muted mb-0">Loading menus...</p>
                                    ) : (
                                        <div className="border rounded p-3" style={{ maxHeight: 320, overflowY: "auto" }}>
                                            {topLevelMenus.map((menu) => {
                                                const children = childMenusByParent(menu._id);
                                                const sectionState = permissionsState[menu._id] || { hasAccess: false, subMenus: new Set() };
                                                return (
                                                    <div key={menu._id} className="mb-2">
                                                        <FormGroup check className="mb-1">
                                                            <Input
                                                                type="checkbox"
                                                                id={`perm-${menu._id}`}
                                                                checked={sectionState.hasAccess}
                                                                onChange={(e) => toggleSectionAccess(menu._id, e.target.checked)}
                                                            />
                                                            <Label check for={`perm-${menu._id}`} className="fw-semibold">
                                                                {menu.label}
                                                            </Label>
                                                        </FormGroup>
                                                        {children.length > 0 && (
                                                            <div className="ms-4">
                                                                {children.map((child) => (
                                                                    <FormGroup check key={child._id} className="mb-1">
                                                                        <Input
                                                                            type="checkbox"
                                                                            id={`perm-${child._id}`}
                                                                            checked={sectionState.subMenus.has(child._id)}
                                                                            onChange={(e) => toggleSubMenu(menu._id, child._id, e.target.checked)}
                                                                        />
                                                                        <Label check for={`perm-${child._id}`}>
                                                                            {child.label}
                                                                        </Label>
                                                                    </FormGroup>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <small className="text-muted d-block mt-1">
                                        Check a section to grant access to it. Sections with sub-items also let you pick specific pages within that section.
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
                            {isSubmitting ? 'Saving...' : (isEdit ? 'Update Role' : 'Create Role')}
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