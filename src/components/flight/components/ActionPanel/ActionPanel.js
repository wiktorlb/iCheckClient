import React, { memo } from 'react';
import './style.css';
/**
 * Komponent panelu akcji
 * @component
 * @param {Object} props
 * @param {boolean} props.visible - Czy panel jest widoczny
 * @param {Function} props.onAction - Funkcja obsługująca akcje
 * @param {string} props.mode - Tryb panelu ('passengers' lub 'boarding')
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