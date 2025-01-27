import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import './style.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [allRoles] = useState(['USER', 'ADMIN', 'LEADER']); // Lista dostępnych ról
    const [error, setError] = useState(null);

    useEffect(() => {
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
            axiosInstance
                .get('/api/users', {
                    headers: { Authorization: `Bearer ${jwt}` },
                })
                .then((response) => {
                    setUsers(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching users:', error);
                    setError('Failed to fetch users.');
                });
        } else {
            window.location.href = '/login';
        }
    }, []);

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
                })
                .catch((error) => {
                    console.error('Error adding role:', error);
                    alert('Failed to add role.');
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
                alert('Role removed successfully.');
            }
        } catch (error) {
            console.error('Error removing role:', error);
            alert(error.response?.data || 'Failed to remove role.');
        }
    };

    return (
        <section>
            <main className="main">
                {error && <div className="error-message">{error}</div>}

                <h1>User Management</h1>

                {users.length > 0 ? (
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Roles</th>
                                <th>Add Role</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.username}</td>
                                    <td>
                                        {user.roles.map((role) => (
                                            <span key={role} className="role-badge">
                                                {role}{' '}
                                                <button
                                                    onClick={() => handleRemoveRole(user.id, role)}
                                                    className="remove-role-btn"
                                                >
                                                    ❌
                                                </button>
                                            </span>
                                        ))}
                                    </td>
                                    <td>
                                        <select
                                            onChange={(e) => handleAddRole(user.id, e.target.value)}
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
                                        <button onClick={() => alert(`Manage user ${user.username}`)}>
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div>No users available.</div>
                )}
            </main>
        </section>
    );
};

export default UserManagement;