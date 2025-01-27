/* import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import './style.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [allRoles] = useState(['USER', 'ADMIN', 'LEADER']); // Lista dostępnych ról
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
            axiosInstance
                .get('/api/users', {
                    params: {
                        search: searchTerm,
                        page: page,
                        size: 10,
                    },
                    headers: { Authorization: `Bearer ${jwt}` },
                })
                .then((response) => {
                    setUsers(response.data);
                    setTotalPages(response.headers['x-total-pages']); // Zakładając, że backend zwraca łączną liczbę stron
                })
                .catch((error) => {
                    console.error('Error fetching users:', error);
                    setError('Failed to fetch users.');
                });
        } else {
            window.location.href = '/login';
        }
    }, [searchTerm, page]); // Efekt uruchamiany za każdym razem, gdy zmienia się searchTerm lub page

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

    const handleDeleteUser = (userId) => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        axiosInstance
            .delete(`/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            })
            .then(() => {
                setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
                alert('User deleted successfully.');
            })
            .catch((error) => {
                console.error('Error deleting user:', error);
                alert('Failed to delete user.');
            });
    };

    return (
        <section>
            <main className="main-userManagement">
                {error && <div className="error-message">{error}</div>}

                <h1>User Management</h1>

                <input
                    type="text"
                    placeholder="Search by username"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                {users.length > 0 ? (
                    <table className="user-table">
                        <thead className='userManagement-tableHead'>
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
                                        <button onClick={() => handleDeleteUser(user.id)} className="delete-btn">
                                            Delete
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

export default UserManagement; */

import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import './style.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [allRoles] = useState(['USER', 'ADMIN', 'LEADER']);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1); // Strona bieżąca
    const [itemsPerPage] = useState(4); // Liczba użytkowników na stronie
    const [filteredUsers, setFilteredUsers] = useState([]); // Filtrująca lista użytkowników

    useEffect(() => {
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
            axiosInstance
                .get('/api/users', {
                    headers: { Authorization: `Bearer ${jwt}` },
                })
                .then((response) => {
                    setUsers(response.data); // Wszystkie dane użytkowników
                    setFilteredUsers(response.data); // Ustawiamy całą listę użytkowników w stanie
                })
                .catch((error) => {
                    console.error('Error fetching users:', error);
                    setError('Failed to fetch users.');
                });
        } else {
            window.location.href = '/login';
        }
    }, []);

    useEffect(() => {
        // Filtrujemy użytkowników na podstawie wprowadzonego searchTerm
        if (searchTerm === '') {
            setFilteredUsers(users); // Jeśli brak wyszukiwania, pokazujemy wszystkich użytkowników
        } else {
            const filtered = users.filter((user) =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered); // Ustawiamy przefiltrowanych użytkowników
        }
    }, [searchTerm, users]); // Przeładowanie filtracji przy zmianie searchTerm lub users

    // Obliczanie paginacji
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

    const handleDeleteUser = (userId) => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        axiosInstance
            .delete(`/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            })
            .then(() => {
                setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
                alert('User deleted successfully.');
            })
            .catch((error) => {
                console.error('Error deleting user:', error);
                alert('Failed to delete user.');
            });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage); // Zmieniamy stronę
        }
    };

    return (
        <section>
            <main className="main-userManagement">
                {error && <div className="error-message">{error}</div>}

                <h1>User Management</h1>

                <input
                    type="text"
                    placeholder="Search by username"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                {currentUsers.length > 0 ? (
                    <>
                        <table className="user-table">
                            <thead className='userManagement-tableHead'>
                                <tr>
                                    <th>Username</th>
                                    <th>Roles</th>
                                    <th>Add Role</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map((user) => (
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
                                            <button onClick={() => handleDeleteUser(user.id)} className="delete-btn">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Paginacja */}
                        <div className="pagination">
                            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                Previous
                            </button>
                            <span>{`Page ${currentPage} of ${totalPages}`}</span>
                            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <div>No users available.</div>
                )}
            </main>
        </section>
    );
};

export default UserManagement;