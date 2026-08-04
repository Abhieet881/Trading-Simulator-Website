export function getAccountNumber(userId) {
  if (!userId) return 910502; // fallback default
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 900000) + 100000;
}

export function formatLotSize(size) {
  const num = parseFloat(size) || 0;
  if (num === 0) return '0.00';
  
  // If the number divides cleanly by 0.01, show exactly 2 decimal places (e.g. 0.10, 0.01, 1.50)
  if (num % 0.01 === 0) {
    return num.toFixed(2);
  }
  
  // If the number is smaller than 0.01, show up to 4 decimal places without trailing zeros (e.g. 0.001, 0.0005)
  if (num < 0.01) {
    const formatted = num.toFixed(4);
    // Strip trailing zeros only, but keep the decimal point
    return formatted.replace(/0+$/, '').replace(/\.$/, '.0');
  }
  
  // Standard format up to 3 decimal places without trailing zeros (e.g. 0.125, 1.25)
  const formatted = num.toFixed(3);
  return formatted.replace(/0+$/, '').replace(/\.$/, '.0');
}
