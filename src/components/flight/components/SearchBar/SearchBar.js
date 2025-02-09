import React, { memo } from 'react';
import './style.css';
import searchIcon from './search-icon.png';

/**
 * Komponent paska wyszukiwania
 * @component
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