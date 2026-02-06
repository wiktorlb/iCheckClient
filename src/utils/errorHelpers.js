const stringifyValue = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value === 'string') {
        return value;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    if (Array.isArray(value)) {
        return value
            .map((entry) => stringifyValue(entry))
            .filter(Boolean)
            .join(', ');
    }

    if (typeof value === 'object') {
        if (typeof value.message === 'string') {
            return value.message;
        }

        if (typeof value.error === 'string') {
            return value.error;
        }

        return JSON.stringify(value);
    }

    return null;
};

/**
 * Extracts readable error details from various backend error shapes.
 * @param {unknown} error
 * @returns {string[]|undefined}
 */
export const collectErrorDetails = (error) => {
    const details = [];
    const responseData = error?.response?.data;

    if (typeof responseData === 'string') {
        details.push(responseData);
    } else if (Array.isArray(responseData)) {
        responseData.forEach((entry) => {
            const stringified = stringifyValue(entry);
            if (stringified) {
                details.push(stringified);
            }
        });
    } else if (responseData && typeof responseData === 'object') {
        const knownFields = ['message', 'error', 'details'];
        knownFields.forEach((field) => {
            if (responseData[field]) {
                const stringified = stringifyValue(responseData[field]);
                if (stringified) {
                    details.push(stringified);
                }
            }
        });

        if (!details.length) {
            Object.values(responseData).forEach((value) => {
                const stringified = stringifyValue(value);
                if (stringified) {
                    details.push(stringified);
                }
            });
        }
    }

    if (!details.length && error?.message) {
        details.push(error.message);
    }

    return details.length ? Array.from(new Set(details)) : undefined;
};

export const buildErrorState = ({
    title,
    description,
    hint,
    error,
    retryLabel,
    retryAction
}) => {
    const payload = {
        title: title || 'Something went wrong',
        description: description || 'Please try again later.'
    };

    const details = collectErrorDetails(error);
    if (details?.length) {
        payload.details = details;
    }

    if (hint) {
        payload.hint = hint;
    }

    if (typeof retryAction === 'function') {
        payload.onAction = retryAction;
        payload.actionLabel = retryLabel || 'Retry';
    }

    return payload;
};
