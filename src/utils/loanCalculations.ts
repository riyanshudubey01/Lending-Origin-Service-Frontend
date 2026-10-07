export function calculateEmi(
  principal: number,
  annualRate: number,
  tenureMonths: number,
): number {
  if (principal <= 0 || tenureMonths <= 0) {
    return 0;
  }

  const monthlyRate = (annualRate / 12) / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);

  if (monthlyRate === 0) {
    return Math.round(principal / tenureMonths);
  }

  return Math.round((principal * monthlyRate * factor) / (factor - 1));
}
