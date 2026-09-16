function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)
  return x >= 0 ? y : -y
}

function cdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}

/** Probability that final value >= multiple * amount, log-normal with annual mean mu and vol sigma over T years. */
export function pAbove(multiple: number, mu: number, sigma: number, years: number): number {
  const s = Math.max(sigma, 0.005)
  const m = (Math.log(1 + mu) - (s * s) / 2) * years
  const sd = s * Math.sqrt(years)
  const z = (Math.log(multiple) - m) / sd
  return 1 - cdf(z)
}
