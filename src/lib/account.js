export function getAccountNumber(userId) {
  if (!userId) return 910502; // fallback default
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 900000) + 100000;
}
