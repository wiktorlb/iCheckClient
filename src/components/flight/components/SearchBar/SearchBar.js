import React, { memo } from 'react';
import './style.css';
import searchIcon from './search-icon.png';

/**
 * Search Bar Component
 *
 * A reusable search input component for filtering passenger lists by surname.
 * Provides real-time filtering functionality with a clean and intuitive interface.
 *
 * @component
 * @param {Object} props
 * @param {string} props.value - Current search input value
 * @param {Function} props.onChange - Handler for search input changes
 * @param {string} props.placeholder - Placeholder text for the search input
 */
export const SearchBar = memo(({ value, onChange }) => (
    <div className="search-bar-container">
    <input
        type="text"
        placeholder="Search by surname..."
        value={value}
        onChange={onChange}
        className="search-bar"

    />
{/*     <span className="search-bar-icon">
        <img src={searchIcon} alt="search" />
    </span> */}
    </div>

));

export default SearchBar;