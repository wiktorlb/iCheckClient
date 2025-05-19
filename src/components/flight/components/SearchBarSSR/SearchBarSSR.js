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

    const handleInputClick = () => {
        setIsOpen(true);
    };

    const handleCodeSelect = (code) => {
        onChange({ target: { value: code } });
        setIsOpen(false);
    };

    return (
        <div className="search-bar-container" ref={dropdownRef}>
            <input
                type="text"
                placeholder="Search by SSR code..."
                value={value}
                onChange={onChange}
                onClick={handleInputClick}
                className="search-bar"
            />
            {isOpen && (
                <div className="ssr-dropdown">
                    {loading ? (
                        <div className="ssr-option loading">Loading...</div>
                    ) : error ? (
                        <div className="ssr-option error">{error}</div>
                    ) : filteredCodes.length > 0 ? (
                        filteredCodes.map((code) => (
                            <div
                                key={code._id}
                                className="ssr-option"
                                onClick={() => handleCodeSelect(code.code)}
                                title={code.description}
                            >
                                <span className="ssr-code">{code.code}</span>
                                <span className="ssr-description">{code.description}</span>
                            </div>
                        ))
                    ) : (
                        <div className="ssr-option no-results">No matching codes found</div>
                    )}
                </div>
            )}
        </div>
    );
});

export default SearchBarSSR;