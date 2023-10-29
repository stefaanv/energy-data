export const round = (value: number, decimals = 2): number | undefined => {
  if (!value || isNaN(value)) return null
  const factor = 10 ** decimals
  const result = Math.round(value * factor) / factor
  return result
}
