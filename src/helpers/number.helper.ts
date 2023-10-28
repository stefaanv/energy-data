export const round = (value: number, decimals = 2) => {
  const factor = 10 ** decimals
  const result = Math.round(value * factor) / factor
  return result
}
