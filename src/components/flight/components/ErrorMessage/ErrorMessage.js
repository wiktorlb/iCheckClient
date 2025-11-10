import React, { memo } from 'react';
import './style.css';
/**
 * Error Message Component
 *
 * A reusable component for displaying error messages throughout the application.
 * Provides consistent error message styling and formatting.
 *
 * @component
 * @param {Object} props
 * @param {string} props.error - The error message to display
 */
export const ErrorMessage = memo(({ error }) => {
    if (!error) return null;
    return <div className="error-message">{error}</div>;
});

export default ErrorMessage;