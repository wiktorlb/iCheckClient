import React, { memo } from 'react';
/**
 * Komponent panelu akcji
 * @component
 */
export const ActionPanel = memo(({ visible, onAction }) => {
    if (!visible) return null;

    return (
        <div className="action-panel fixed-action-panel">
            <button
                onClick={() => onAction('accept')}
                className="accept-btn"
            >
                Accept Passenger
            </button>
            <button
                onClick={() => onAction('update')}
                className="update-btn"
            >
                Update Passenger
            </button>
        </div>
    );
});

export default ActionPanel;