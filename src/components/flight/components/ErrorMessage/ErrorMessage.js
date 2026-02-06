import React, { memo } from 'react';
import './style.css';

const DEFAULT_TITLE = 'Something went wrong';

/**
 * @typedef {Object} StructuredError
 * @property {string} [title]
 * @property {string} [description]
 * @property {string} [hint]
 * @property {string[]} [details]
 * @property {string} [actionLabel]
 * @property {() => void} [onAction]
 */

const normalizeError = (error) => {
    if (!error) {
        return null;
    }

    if (typeof error === 'string') {
        return { title: DEFAULT_TITLE, description: error };
    }

    return {
        title: error.title || DEFAULT_TITLE,
        description: error.description,
        hint: error.hint,
        details: error.details,
        actionLabel: error.actionLabel,
        onAction: error.onAction
    };
};

export const ErrorMessage = memo(({ error }) => {
    const normalized = normalizeError(error);

    if (!normalized) {
        return null;
    }

    const {
        title,
        description,
        hint,
        details,
        actionLabel,
        onAction
    } = normalized;

    return (
        <div className="error-message" role="alert" aria-live="polite">
            <div className="error-message__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                    <circle cx="12" cy="12" r="11" />
                    <path d="M12 7v6" />
                    <circle cx="12" cy="16" r="1.25" />
                </svg>
            </div>
            <div className="error-message__content">
                {title && <p className="error-message__title">{title}</p>}
                {description && (
                    <p className="error-message__description">{description}</p>
                )}
                {Array.isArray(details) && details.length > 0 && (
                    <ul className="error-message__list">
                        {details.map((line, index) => (
                            <li key={`${line}-${index}`}>{line}</li>
                        ))}
                    </ul>
                )}
                {hint && <p className="error-message__hint">{hint}</p>}
            </div>
            {onAction && (
                <div className="error-message__actions">
                    <button type="button" className="error-message__retry" onClick={onAction}>
                        {actionLabel || 'Retry'}
                    </button>
                </div>
            )}
        </div>
    );
});

export default ErrorMessage;