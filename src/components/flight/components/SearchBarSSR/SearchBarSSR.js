import React, { memo, useState, useEffect, useRef } from 'react';
import axiosInstance from '../../../../api/axiosConfig';
import './style.css';

/**
 * Komponent paska wyszukiwania po kodach SSR
 * @component
 */
export const SearchBarSSR = memo(({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [ssrCodes, setSsrCodes] = useState([]);
    const [filteredCodes, setFilteredCodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const dropdownRef = useRef(null);

    // Pobieranie kodów SSR z backendu
    useEffect(() => {
        const fetchSSRCodes = async () => {
            try {
                const response = await axiosInstance.get('/api/ssr-codes');
                setSsrCodes(response.data);
                setFilteredCodes(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching SSR codes:', error);
                setError('Failed to load SSR codes');
                setLoading(false);
            }
        };

        fetchSSRCodes();
    }, []);

    useEffect(() => {
        // Filtruj kody SSR na podstawie wpisanej wartości
        const filtered = ssrCodes.filter(code =>
            code.code.toLowerCase().includes(value.toLowerCase()) ||
            code.description.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCodes(filtered);
    }, [value, ssrCodes]);

    useEffect(() => {
        // Obsługa kliknięcia poza komponentem
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e) => {
        onChange(e);
        setIsOpen(true);
    };

    const handleSelectCode = (code) => {
        onChange({ target: { value: code.code } });
        setIsOpen(false);
    };

    return (
        <div className="search-bar-ssr" ref={dropdownRef}>
            <input
                type="text"
                value={value}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                placeholder="Search by SSR code..."
                className="search-input"
            />
            {isOpen && !loading && !error && (
                <div className="ssr-dropdown">
                    {filteredCodes.length > 0 ? (
                        filteredCodes.map((code) => (
                            <div
                                key={code.code}
                                className="ssr-option"
                                onClick={() => handleSelectCode(code)}
                            >
                                <span className="ssr-code">{code.code}</span>
                                <span className="ssr-description">{code.description}</span>
                            </div>
                        ))
                    ) : (
                        <div className="no-results">No matching SSR codes found</div>
                    )}
                </div>
            )}
            {loading && <div className="loading">Loading SSR codes...</div>}
            {error && <div className="error">{error}</div>}
        </div>
    );
});

export default SearchBarSSR;