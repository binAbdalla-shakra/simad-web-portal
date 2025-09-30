import React, { useState, useEffect, useCallback } from 'react';
import DataTable from "react-data-table-component";
import Select from "react-select";
import {
    Card, CardHeader, CardBody,
    Col, Container, Row,
    Form, Input, Label, FormGroup,
    Modal, ModalBody, ModalFooter, ModalHeader,
    Button, Badge, FormFeedback
} from "reactstrap";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import DeleteModal from "../../../Components/Common/DeleteModal";
import Loader from "../../../Components/Common/Loader";
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';

//redux
import {
    getUsersData as onGetUsersData,
    addUser as onAddNewUser,
    updateUser as onUpdateUser,
    deleteUser as onDeleteUser,
    getRoles as onGetRoles
} from "../../../slices/thunks";

// Formik
import * as Yup from "yup";
import { useFormik } from "formik";

//User Images
import userdummyimg from '../../../assets/images/users/user-dummy-img.jpg';

const Users = () => {
    document.title = "Users | simad University";

    const dispatch = useDispatch();

    const selectusersData = createSelector(
        (state) => state.Settings,
        (usersData) => usersData.usersData

    );

    //     const selectusersData = createSelector(
    //     (state) => state.Settings,
    //     (usersData) => usersData.usersData

    // );

    const roles = useSelector(state => state.Settings.rolesData) || [];

    //    console.log("")

    const usersData = useSelector(selectusersData);

    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Filters state
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        role: ''
    });

    // Form state
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        roles: [],
        isActive: true
    });

    // Options for selects
    const statusOptions = [
        { value: "", label: "All Statuses" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" }
    ];




    // Fetch users with filters
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetUsersData());
        } catch (error) {
            console.error("Error loading users:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            await dispatch(onGetRoles());
        } catch (error) {
            console.error("Error loading roles:", error);
        } finally {
            setLoading(false);
        }
    }, [dispatch]);




    // Update users list when data changes
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    useEffect(() => {
        setUsersList(usersData?.users || []);
    }, [usersData]);


    // console.log("roles are: ", roles)
    const roleOptions = Array.isArray(roles?.roles)
        ? roles.roles.map(role => ({
            value: role._id,
            label: role.type
        }))
        : [];

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Handle select filter changes
    const handleSelectFilterChange = (name, selectedOption) => {
        setFilters(prev => ({
            ...prev,
            [name]: selectedOption?.value || ""
        }));
    };

    // Filter users based on filters
    const filteredUsers = usersList.filter(user => {
        return (
            (filters.search === '' ||
                user.username.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
                user.phone.toLowerCase().includes(filters.search.toLowerCase())) &&
            (filters.status === '' ||
                (filters.status === 'Active' ? user.isActive : !user.isActive)) &&
            (filters.role === '' || user.title === filters.role)
        );
    });

    // Open modal for edit
    const handleEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            username: user.username || "",
            email: user.email || "",
            password: "",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            roles: user.roles || [],

            isActive: user.isActive || true
        });
        setIsEdit(true);
        setModal(true);
    };

    // Open modal for create
    const handleCreate = () => {
        setSelectedUser(null);
        setFormData({
            username: "",
            email: "",
            password: "",
            firstName: "",
            lastName: "",
            phone: "",
            title: "",
            isActive: true
        });
        setIsEdit(false);
        setModal(true);
    };

    // Delete User
    const onClickDelete = (user) => {
        setSelectedUser(user);
        setDeleteModal(true);
    };

    const handleDeleteUser = () => {
        if (selectedUser) {
            dispatch(onDeleteUser(selectedUser._id));
            setDeleteModal(false);
        }
    };

    // Form validation
    const validation = useFormik({
        enableReinitialize: true,
        initialValues: {
            username: formData.username,
            email: formData.email,
            // password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            roles: formData.roles,
            isActive: formData.isActive
        },
        validationSchema: Yup.object({
            username: Yup.string()
                .required("Username is required")
                .trim()
                .lowercase(),
            email: Yup.string()
                .email("Invalid email format")
                .required("Email is required")
                .trim()
                .lowercase(),
            // password: Yup.string()
            //     .when('isEdit', (isEdit, schema) => {
            //         return isEdit ? schema.notRequired() : schema.min(8, "Password must be at least 8 characters").required("Password is required")
            //     }),
            firstName: Yup.string().required("First name is required").trim(),
            lastName: Yup.string().required("Last name is required").trim(),
            phone: Yup.string().required("Phone is required").trim(),
            roles: Yup.array()
                .of(Yup.string())
                .min(1, "At least one role is required")
                .required("Role is required"),


            isActive: Yup.boolean()
        }),
        onSubmit: (values) => {
            const payload = {
                ...values,
            };

            if (isEdit) {
                dispatch(onUpdateUser({ _id: selectedUser._id, ...payload }));
            } else {
                dispatch(onAddNewUser({
                    ...payload,
                    id: (Math.floor(Math.random() * (30 - 20)) + 20).toString(),
                    avatar: 'user-dummy-img.jpg',
                    password: process.env.REACT_APP_DEFAULT_PASS || "Simad1999",
                    bg_url: 'user-dummy-img.jpg'
                }));
            }
            setModal(false);
        }

    });

    // Table columns
    const columns = [
        {
            name: '#',
            cell: (row, index) => index + 1,
        },
        {
            name: 'Username',
            selector: row => row.username,
        },
        {
            name: 'Full Name',
            selector: row => `${row.firstName} ${row.lastName}`,
        },
        {
            name: 'Email',
            selector: row => row.email,
        },
        {
            name: 'Phone',
            selector: row => row.phone || '-',
        },
        {
            name: 'Roles',
            cell: row => {
                const userRoles = Array.isArray(row.roles) ? row.roles : [];
                return userRoles.map(roleId => {
                    const role = roleOptions.find(r => r.value === roleId);
                    return role ? role.label : roleId;
                }).join(', ');
            }
        },

        {
            name: 'Status',
            cell: row => (
                <Badge color={row.isActive ? 'success' : 'danger'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            name: 'Actions',
            cell: row => (
                <div className="d-flex gap-2">
                    <Button color="soft-primary" size="sm" onClick={() => handleEdit(row)}>
                        <i className="ri-pencil-line" />
                    </Button>
                    <Button color="soft-danger" size="sm" onClick={() => onClickDelete(row)}>
                        <i className="ri-delete-bin-line" />
                    </Button>
                </div>
            ),
        }
    ];

    return (
        <div className="page-content">
            <Container fluid>
                <BreadCrumb title="Users" pageTitle="Settings" />

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
                                        placeholder="Search by username, name, email or phone"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Status</Label>
                                    <Select
                                        options={statusOptions}
                                        value={statusOptions.find(opt => opt.value === filters.status)}
                                        onChange={(opt) => handleSelectFilterChange('status', opt)}
                                        isClearable
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={3} style={{ display: 'none' }}>
                                <FormGroup>
                                    <Label>Role</Label>
                                    <Select
                                        options={roleOptions}
                                        value={roleOptions.find(opt => opt.value === filters.role)}
                                        onChange={(opt) => handleSelectFilterChange('role', opt)}
                                        isClearable
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2} className="d-flex align-items-end mb-3">
                                <Button color="primary" onClick={fetchUsers} disabled={loading}>
                                    {loading ? 'Filtering...' : 'Apply Filters'}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Data Table */}
                <Card>
                    <CardHeader className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Users List</h5>
                        <Button color="primary" onClick={handleCreate}>
                            <i className="ri-add-line me-1" /> Add User
                        </Button>
                    </CardHeader>
                    <CardBody>
                        {loading ? (
                            <Loader />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={filteredUsers}
                                pagination
                                highlightOnHover
                                responsive
                                noDataComponent="No users found matching your criteria"
                            />
                        )}
                    </CardBody>
                </Card>
            </Container>

            {/* Add/Edit Modal */}
            <Modal isOpen={modal} toggle={() => setModal(false)} size="lg">
                <ModalHeader toggle={() => setModal(false)}>
                    {isEdit ? 'Edit User' : 'Add New User'}
                </ModalHeader>
                <Form onSubmit={(e) => {
                    e.preventDefault();
                    validation.handleSubmit();
                }}>
                    <ModalBody>
                        <Row>
                            <Col lg={12}>
                                <div className="text-center mb-4">
                                    <div className="avatar-lg mx-auto">
                                        <div className="avatar-title bg-light rounded-circle">
                                            <img src={userdummyimg} alt="user" className="avatar-md rounded-circle h-auto" />
                                        </div>
                                    </div>
                                </div>

                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>First Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="firstName"
                                                value={validation.values.firstName}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                placeholder="e.g., Abdishakur"
                                                invalid={validation.touched.firstName && !!validation.errors.firstName}
                                            />
                                            <FormFeedback>{validation.errors.firstName}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Last Name <span className="text-danger">*</span></Label>
                                            <Input
                                                name="lastName"
                                                value={validation.values.lastName}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                placeholder="e.g., Abdullahi"
                                                invalid={validation.touched.lastName && !!validation.errors.lastName}
                                            />
                                            <FormFeedback>{validation.errors.lastName}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Username <span className="text-danger">*</span></Label>
                                            <Input
                                                name="username"
                                                value={validation.values.username}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                placeholder="e.g., shakra"
                                                invalid={validation.touched.username && !!validation.errors.username}
                                            />
                                            <FormFeedback>{validation.errors.username}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Email <span className="text-danger">*</span></Label>
                                            <Input
                                                type="email"
                                                name="email"
                                                value={validation.values.email}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                placeholder="e.g., abdi@gmail.com"
                                                invalid={validation.touched.email && !!validation.errors.email}
                                            />
                                            <FormFeedback>{validation.errors.email}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>


                                <Row>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Phone <span className="text-danger">*</span></Label>
                                            <Input
                                                name="phone"
                                                value={validation.values.phone}
                                                onChange={validation.handleChange}
                                                onBlur={validation.handleBlur}
                                                placeholder="e.g., +252610000000"
                                                invalid={validation.touched.phone && !!validation.errors.phone}
                                            />
                                            <FormFeedback>{validation.errors.phone}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label>Roles <span className="text-danger">*</span></Label>

                                            <Select
                                                name="roles"
                                                isMulti
                                                options={roleOptions}
                                                value={roleOptions.filter(opt => (validation.values.roles || []).includes(opt.value))}

                                                onChange={(selected) =>
                                                    validation.setFieldValue("roles", selected ? selected.map(opt => opt.value) : [])
                                                }
                                                onBlur={validation.handleBlur}
                                                closeMenuOnSelect={false}
                                                styles={{
                                                    option: (provided, state) => ({
                                                        ...provided,
                                                        color: 'white',
                                                        backgroundColor: state.isFocused ? '#4a6fa5' : '#2f4b73',
                                                    }),
                                                    multiValue: (base) => ({
                                                        ...base,
                                                        backgroundColor: '#2f4b73',
                                                        color: 'white',
                                                    }),
                                                    multiValueLabel: (base) => ({
                                                        ...base,
                                                        color: 'white',
                                                    }),
                                                    multiValueRemove: (base) => ({
                                                        ...base,
                                                        color: 'white',
                                                        ':hover': {
                                                            backgroundColor: '#1c2b45',
                                                            color: 'white',
                                                        },
                                                    }),
                                                }}
                                            />
                                            {validation.touched.roles && validation.errors.roles && (
                                                <div className="invalid-feedback d-block">{validation.errors.roles}</div>
                                            )}

                                            <FormFeedback>{validation.errors.title}</FormFeedback>
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <FormGroup check className="mt-3">
                                    <Input
                                        type="checkbox"
                                        name="isActive"
                                        checked={validation.values.isActive}
                                        onChange={validation.handleChange}
                                        id="isActive"
                                    />
                                    <Label for="isActive" check>
                                        Active User
                                    </Label>
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

            {/* Delete Confirmation Modal */}
            <DeleteModal
                show={deleteModal}
                onDeleteClick={handleDeleteUser}
                onCloseClick={() => setDeleteModal(false)}
            />

            <ToastContainer />
        </div>
    );
};

export default Users;