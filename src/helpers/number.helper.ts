export const round = (value: number, decimals = 2): number | undefined => {
  if ((value != 0 && !value) || isNaN(value)) return undefined
  const factor = 10 ** decimals
  const result = Math.round(value * factor) / factor
  return result
}
