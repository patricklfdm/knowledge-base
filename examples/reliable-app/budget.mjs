export function errorBudget({ eligible, bad }, targetBasisPoints = 9990) {
  if (!Number.isSafeInteger(eligible) || !Number.isSafeInteger(bad) || eligible < 0 || bad < 0 || bad > eligible || !Number.isInteger(targetBasisPoints) || targetBasisPoints < 1 || targetBasisPoints > 10000) throw new Error("invalid observations")
  if (eligible === 0) return { state: "unknown", allowedBad: null, remaining: null, goodRatio: null }
  // Integer division avoids floating-point off-by-one at the allowed-failure boundary.
  const allowedBad = Number(BigInt(eligible) * BigInt(10000 - targetBasisPoints) / 10000n)
  return { state: bad <= allowedBad ? "within" : "exceeded", allowedBad, remaining: allowedBad - bad, goodRatio: (eligible - bad) / eligible }
}
