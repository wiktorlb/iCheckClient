import React, { memo } from 'react';
import './style.css';

/**
 * Komponent paska wyszukiwania
 * @component
 */
export const SearchBar = memo(({ value, onChange }) => (
    <input
        type="text"
        placeholder="Search by surname..."
        value={value}
        onChange={onChange}
        className="search-bar"
    />
));

export default SearchBar;