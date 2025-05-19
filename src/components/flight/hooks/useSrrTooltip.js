import { useCallback, useState, useEffect } from 'react';
import axiosInstance from '../../../api/axiosConfig';

/**
 * Hook dostarczający funkcję do generowania tooltipów dla kodów SSR
 * @returns {Function} Funkcja generująca tooltip
 */
export const useSrrTooltip = () => {
    const [ssrCodes, setSsrCodes] = useState({});

    useEffect(() => {
        const fetchSSRCodes = async () => {
            try {
                const response = await axiosInstance.get('/api/ssr-codes');
                const codesMap = response.data.reduce((acc, code) => {
                    acc[code.code] = code;
                    return acc;
                }, {});
                setSsrCodes(codesMap);
            } catch (error) {
                console.error('Error fetching SSR codes:', error);
            }
        };

        fetchSSRCodes();
    }, []);

    return useCallback((code, passenger) => {
        const ssrCode = ssrCodes[code];

        if (ssrCode) {
            let tooltip = `${ssrCode.code}: ${ssrCode.description}\n`;

            // Dodaj szczegóły w zależności od kategorii kodu SSR
            switch (ssrCode.category) {
                case 'BAGGAGE':
                    return getBaggageTooltip(passenger, code) + '\n\n' + tooltip;
                case 'DOCUMENTATION':
                    return getDocumentTooltip(passenger) + '\n\n' + tooltip;
                case 'SPECIAL_ASSISTANCE':
                    return tooltip + '\nSpecial assistance required';
                case 'SEAT':
                    return getSeatTooltip(passenger) + '\n\n' + tooltip;
                default:
                    return tooltip;
            }
        }

        // Fallback dla starych kodów SSR
        if (code.startsWith('BAG')) {
            return getBaggageTooltip(passenger, code);
        }
        if (code === 'DOCS') {
            return getDocumentTooltip(passenger);
        }
        if (code === 'COM') {
            return getCommentTooltip(passenger);
        }
        if (code === 'SEAT') {
            return getSeatTooltip(passenger);
        }

        return 'No additional information available';
    }, [ssrCodes]);
};

/**
 * Generuje tooltip dla bagażu
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

    return `BAGGAGE DETAILS:\n` +
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
        ? `DOCUMENT DETAILS:\n${details.join('\n')}`
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

/**
 * Generuje tooltip dla przypisanego miejsca
 */
const getSeatTooltip = (passenger) => {
    if (!passenger.seatNumber) return 'Brak przypisanego miejsca';

    return `SEAT: ` + `${passenger.seatNumber}`;
};

export default useSrrTooltip;