export function generateMemberId(date = new Date(), randomValue = Math.random()) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = String(Math.floor(randomValue * 10_000)).padStart(4, "0");

  return `MBC-${year}${month}${day}-${random}`;
}
