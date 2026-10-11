-- Reconciliation-grade uniqueness for ledger idempotency keys. Nullable
-- unique in Postgres permits any number of NULLs, so only replayed keys
-- (same idempotencyKey) collide.
CREATE UNIQUE INDEX "wallet_ledger_idempotencyKey_key" ON "wallet_ledger"("idempotencyKey");
