import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [allRoles] = useState(['USER', 'ADMIN', 'LEADER']);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(4);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            navigate('/login', { replace: true });
            return;
        }

        try {
            const decoded = JSON.parse(atob(jwt.split('.')[1]));
            const hasAdminAccess = decoded?.role === 'ADMIN' || decoded?.roles?.includes?.('ADMIN');

            if (!hasAdminAccess) {
                setError('Access restricted to administrators only.');
                navigate('/flightboard', { replace: true });
                return;
            }

            setIsAuthorized(true);

            axiosInstance
                .get('/api/users', {
                    headers: { Authorization: `Bearer ${jwt}` },
                })
                .then((response) => {
                    setUsers(response.data);
                    setFilteredUsers(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching users:', error);
                    setError('Failed to fetch users.');
                });
        } catch (err) {
            console.error('Failed to verify user role:', err);
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        if (searchTerm === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter((user) =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    const handleAddRole = (userId, newRole) => {
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
            axiosInstance
                .put(
                    `/api/users/${userId}/roles/add`,
                    newRole,
                    {
                        headers: { Authorization: `Bearer ${jwt}` },
                    }
                )
                .then(() => {
                    setUsers((prevUsers) =>
                        prevUsers.map((user) =>
                            user.id === userId
                                ? { ...user, roles: [...user.roles, newRole] }
                                : user
                        )
                    );
                    setFeedback({ type: 'success', message: 'Role added successfully.' });
                })
                .catch((error) => {
                    console.error('Error adding role:', error);
                    setFeedback({ type: 'error', message: 'Failed to add role.' });
                });
        }
    };

    const handleRemoveRole = async (userId, roleToRemove) => {
        try {
            const jwt = localStorage.getItem('jwt');
            if (!jwt) return;

            const response = await axiosInstance.put(
                `/api/users/${userId}/roles/remove`,
                roleToRemove,
                {
                    headers: { Authorization: `Bearer ${jwt}` },
                }
            );

            if (response.status === 200) {
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.id === userId
                            ? { ...user, roles: user.roles.filter((role) => role !== roleToRemove) }
                            : user
                    )
                );
                setFeedback({ type: 'success', message: 'Role removed successfully.' });
            }
        } catch (error) {
            console.error('Error removing role:', error);
            setFeedback({ type: 'error', message: error.response?.data || 'Failed to remove role.' });
        }
    };

    const handleDeleteUser = (userId) => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        axiosInstance
            .delete(`/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            })
            .then(() => {
                setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
                setFeedback({ type: 'success', message: 'User deleted successfully.' });
            })
            .catch((error) => {
                console.error('Error deleting user:', error);
                setFeedback({ type: 'error', message: 'Failed to delete user.' });
            });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (!isAuthorized) {
        return null;
    }

    return (
        <section className="user-management-page">
            <div className="user-management-card">
                <header className="user-management-head">
                    <div>
                        <p className="eyebrow">Administration</p>
                        <h1>User management</h1>
                        <p>View all crew members and update their access levels.</p>
                    </div>
                    <div className="user-management-head__actions">
                        <div className="user-stat">
                            <span>Total users</span>
                            <strong>{filteredUsers.length}</strong>
                        </div>
                        <button
                            type="button"
                            className="primary-action"
                            onClick={() => navigate('/register')}
                        >
                            Add user
                        </button>
                    </div>
                </header>

                {error && <div className="inline-banner error">{error}</div>}
                {feedback && (
                    <div className={`inline-banner ${feedback.type}`}>
                        <span>{feedback.message}</span>
                        <button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss notice">
                            ×
                        </button>
                    </div>
                )}

                <div className="user-management-toolbar">
                    <label className="search-field">
                        <span>Search by username</span>
                        <input
                            type="text"
                            placeholder="Start typing..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </label>
                </div>

                {currentUsers.length > 0 ? (
                    <>
                        <div className="table-wrapper">
                            <table className="user-management-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Roles</th>
                                        <th>Add role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="user-ident">
                                                    <span className="name">{user.username}</span>
                                                    <span className="meta">ID: {user.id}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="role-list">
                                                    {user.roles.map((role) => (
                                                        <span key={role} className="role-chip">
                                                            {role}
                                                            <button
                                                                type="button"
                                                                className="role-chip__remove"
                                                                onClick={() => handleRemoveRole(user.id, role)}
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <select
                                                    className="role-select"
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            handleAddRole(user.id, e.target.value);
                                                            e.target.value = '';
                                                        }
                                                    }}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>
                                                        Select role
                                                    </option>
                                                    {allRoles
                                                        .filter((role) => !user.roles.includes(role))
                                                        .map((role) => (
                                                            <option key={role} value={role}>
                                                                {role}
                                                            </option>
                                                        ))}
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="ghost-danger"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination-row">
                            <button
                                type="button"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span>Page {currentPage} of {totalPages || 1}</span>
                            <button
                                type="button"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="empty-state">
                        <h3>No users to display</h3>
                        <p>You can add new staff accounts from the registration view.</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default UserManagement;