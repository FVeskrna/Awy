export const getWarrantyStatus = (purchaseDate: string, durationMonths: number | string) => {
    if (!purchaseDate) return { isValid: false, label: 'Unknown' };

    const start = new Date(purchaseDate);
    if (isNaN(start.getTime())) return { isValid: false, label: 'Invalid Date' };

    const duration = Number(durationMonths) || 0;
    if (duration === 0) return { isValid: false, label: 'No Warranty' };

    const expiration = new Date(start);
    expiration.setMonth(start.getMonth() + duration);

    // Handle month rollover edge cases (e.g. Jan 31 + 1 month -> Feb 28/29)
    if (expiration.getDate() !== start.getDate()) {
        expiration.setDate(0);
    }

    const now = new Date();
    // Reset time for accurate date comparison
    now.setHours(0, 0, 0, 0);
    expiration.setHours(0, 0, 0, 0);

    const isValid = expiration >= now;
    return {
        isValid,
        label: isValid ? 'Active' : 'Expired',
        expirationDate: expiration.toLocaleDateString()
    };
};
