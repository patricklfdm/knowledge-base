// Caller owns the outer transaction. Fixed savepoint name; no nesting/re-entrancy.
export function addExpenseBatch(db, journeyId, amounts) {
  if (!db.isTransaction) throw new Error("outer transaction required")
  db.exec("SAVEPOINT expense_batch")
  try {
    const insert = db.prepare("INSERT INTO expenses(journey_id,amount_cents) VALUES (?,?)")
    for (const amount of amounts) insert.run(journeyId, amount)
    db.exec("RELEASE expense_batch")
  } catch (error) {
    db.exec("ROLLBACK TO expense_batch")
    db.exec("RELEASE expense_batch")
    throw error
  }
}
