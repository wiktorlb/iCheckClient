import React, { memo } from 'react';
import './style.css';
/**
 * Action Panel Component
 *
 * A dynamic action panel that provides context-specific operations for selected items.
 * Supports different modes (passengers, baggage) and displays relevant action buttons
 * based on the current context.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.visible - Controls the visibility of the action panel
 * @param {Function} props.onAction - Callback function for action button clicks
 * @param {string} props.mode - The current mode of the panel ('passengers' or 'baggage')
 */
export const ActionPanel = memo(({ visible, onAction, mode = 'passengers' }) => {
    if (!visible) return null;

    return (
        <div className="action-panel fixed-action-panel">
            {mode === 'passengers' && (
                <>
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
                </>
            )}
            {mode === 'boarding' && (
                <button
                    onClick={() => onAction('board')}
                    className="board-btn"
                >
                    Board Selected
                </button>
            )}
        </div>
    );
});

export default ActionPanel;