import { useCallback } from 'react';

/**
 * Hook dostarczający funkcję do generowania tooltipów dla kodów SSR
 * @returns {Function} Funkcja generująca tooltip
 */
export const useSrrTooltip = () => {
    return useCallback((code, passenger) => {
        if (code.startsWith('BAG')) {
            return getBaggageTooltip(passenger, code);
        }
        if (code === 'DOCS') {
            return getDocumentTooltip(passenger);
        }
        if (code === 'COM') {
            return getCommentTooltip(passenger);
        }
        return 'No additional information available';
    }, []);
};

/**
 * Generuje tooltip dla bagażu
 */
/* const getBaggageTooltip = (passenger, code) => {
    if (!passenger.baggageList?.length) return 'No baggage details available';

    const baggage = passenger.baggageList[parseInt(code.slice(3)) - 1];
    return baggage
        ? `Baggage Details:\nID: ${baggage.id || 'N/A'}\nType: ${baggage.type || 'N/A'}\nWeight: ${baggage.weight || 'N/A'} kg`
        : 'Baggage information not found';
};
 */

const getBaggageTooltip = (passenger, code) => {
    if (!passenger.baggageList?.length) return 'No baggage details available';

    const baggage = passenger.baggageList[parseInt(code.slice(3)) - 1];
    if (!baggage) return 'Baggage information not found';

    // Mapowanie typów bagażu na bardziej czytelne nazwy
    const baggageTypes = {
        'BAG': 'Baggage',
        'HAND_LUGGAGE': 'Hand Luggage',
        'DAA': 'DAA',
        'SPORT_EQUIPMENT': 'Sport Equipment',
        'WHEELCHAIR': 'Wheelchair'
    };

    const readableType = baggageTypes[baggage.type] || baggage.type;

    return `Baggage Details:\n` +
        `ID: ${baggage.id || 'N/A'}\n` +
        `Type: ${readableType || 'N/A'}\n` +
        `Weight: ${baggage.weight || 'N/A'} kg`;
};
/**
 * Generuje tooltip dla dokumentów
 */
const getDocumentTooltip = (passenger) => {
    console.log('Full passenger data:', passenger);
    // Dodajmy console.log do debugowania
    console.log('Document data:', {
        type: passenger.documentType,
        serial: passenger.serialName,
        citizenship: passenger.citizenship,
        validUntil: passenger.validUntil,
        issueCountry: passenger.issueCountry
    });

    // Mapowanie typów dokumentów na czytelne nazwy
    const documentTypes = {
        'P': 'Passport',
        'ID': 'ID Card'
    };

    const details = [];

    // Sprawdzamy i dodajemy każde pole, jeśli istnieje
    if (passenger.documentType) {
        const readableType = documentTypes[passenger.documentType] || passenger.documentType;
        details.push(`Document Type: ${readableType}`);
    }
    if (passenger.serialName) details.push(`Serial Number: ${passenger.serialName}`);
    if (passenger.citizenship) details.push(`Citizenship: ${passenger.citizenship}`);
    if (passenger.validUntil) {
        // Formatowanie daty, jeśli jest to data
        const date = new Date(passenger.validUntil);
        const formattedDate = isNaN(date.getTime())
            ? passenger.validUntil
            : date.toLocaleDateString();
        details.push(`Valid Until: ${formattedDate}`);
    }
    if (passenger.issueCountry) details.push(`Issue Country: ${passenger.issueCountry}`);

    return details.length > 0
        ? `Document Details:\n${details.join('\n')}`
        : 'No document information available';
};

/**
 * Generuje tooltip dla komentarzy
 */
const getCommentTooltip = (passenger) => {
    if (!passenger.comments?.length) return 'No comments available';

    return passenger.comments.map(comment =>
        `Comment: ${comment.text}\n` +
        `Added by: ${comment.addedBy}\n` +
        `Date: ${comment.date}`
    ).join('\n\n');
};

export default useSrrTooltip;