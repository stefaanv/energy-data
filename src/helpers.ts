/**
 * percentage : value between 0 and 100
 */
export type Percentage = number

export function joinUrlParts(first: string, second: string, ...rest: string[]) {
  const slashes = (first.endsWith('/') ? 1 : 0) + (second.startsWith('/') ? 1 : 0)
  const joined =
    slashes === 2 ? first + second.slice(1) : first + (slashes === 0 ? '/' : '') + second
  if (rest.length === 0) return joined
  return joinUrlParts(joined, rest[0], ...rest.slice(1))
}
