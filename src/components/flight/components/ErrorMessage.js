import React, { memo } from 'react';
/**
 * Komponent wyświetlający komunikat błędu
 * @component
 */
export const ErrorMessage = memo(({ error }) => {
    if (!error) return null;
    return <div className="error-message">{error}</div>;
});

export default ErrorMessage;