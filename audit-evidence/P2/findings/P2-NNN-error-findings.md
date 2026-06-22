# T-P2-005 Findings — Error Envelope Diff

**Evidence dir:** [audit-evidence/P2/errors/](file:///Users/deprof/www/azeebo+/audit-evidence/P2/errors/)

---

## Side-by-side truth table

| Field           | Backend (`GlobalExceptionFilter`)                                                                                  | Web `apiError.ts`                                            | Mobile `apiClient.ts`                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `code`          | ✅ present (from `AppError.code`)                                                                                  | ✅ `ApiError.code`                                            | ❌ no `code` field                                    |
| `message`       | ✅ present                                                                                                          | ✅ `ApiError.message` + `data.message`                        | ✅ `(data as { message?: string })?.message`          |
| `details`       | ✅ present (`AppError.details`)                                                                                    | ✅ `ApiError.details`                                         | ❌ absent                                             |
| `traceId`       | ❌ absent (no OTel trace_id injected)                                                                              | ❌ absent                                                     | ❌ absent                                             |
| `statusCode`    | ✅ present                                                                                                          | ✅ `ApiError.statusCode` (top-level, not in `data`)           | ❌ only inside `error.message` string                 |
| `status`        | n/a (HTTP layer)                                                                                                    | ✅ top-level `status` (only used in `handleApiError` switch) | n/a                                                   |
| `data` wrapper  | ❌ flat envelope `{code, message, details}`                                                                         | ✅ nested `data: { message }`                                 | ❌ flat                                               |
| Field path      | `{code, message, details}` directly on response body                                                              | `response.data.message` (axios convention)                   | direct on response body                              |

**Concrete diff example** — what the backend sends vs what the frontend expects:

```jsonc
// backend (auth-service exception, e.g. 401)
{
  "code": "AUTH_REQUIRED",
  "message": "Authentication required",
  "details": { "hint": "token missing" },
  "statusCode": 401,
  "timestamp": "2026-06-22T12:00:00.000Z",
  "path": "/auth/me"
}

// web frontend handleApiError expects:
{
  "message": "...",       // top-level OR data.message
  "status": 401,           // axios response.status
  "data": { "message": "..." }
}

// mobile frontend expects:
{
  "message": "...",       // only via (data as { message }).message
  "success": false,
  "error": "...",
  "statusCode": 401
}
```

**Gap:** backend never sends `success: false` or `error`; frontend never sees `code` (mobile) or `details` (mobile). The frontend's switch on `status` only matches 6 codes.

---

## P2-021 — `GlobalExceptionFilter` emits `{code,message,details,statusCode,timestamp,path}` but mobile/web clients only read `message` + `status` (High · error-drift · functionality)

**Files:**
- [packages/error-handling/src/global-exception.filter.ts](file:///Users/deprof/www/azeebo+/packages/error-handling/src/global-exception.filter.ts) (emits `{code,message,details,statusCode,timestamp,path}`)
- [apps/web/src/lib/apiError.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/apiError.ts) — `interface ApiErrorResponse { message?, status?, data: { message? } }`
- [apps/mobile/src/api/client.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/api/client.ts#L9-L90) — `interface ApiError extends Error { statusCode?, message? }`

**RCA:**
1. **Symptom:** the backend's structured `code` field (e.g. `AUTH_REQUIRED`, `WALLET_INSUFFICIENT_BALANCE`) is never displayed in the UI; users see only generic messages.
2. **Trigger:** any 4xx/5xx from any service.
3. **Proximate cause:** the frontend `ApiErrorResponse` type doesn't include `code` or `details`; `handleApiError` switch maps only 6 status codes.
4. **Root cause:** no shared `@azeebo/error-types` package; the package exists but isn't imported by web/mobile.
5. **Blast radius:** every error path. Users get "An unexpected error occurred" for many actual conditions (e.g. 502, 503, 504, 422, 409).
6. **Detection gap:** no contract test asserting the frontend reads the envelope's `code` field.

**Remediation:** import `@azeebo/error-handling`'s `ErrorResponse` type in both web and mobile; have the frontend's `handleApiError` switch on `code` first, fall back to status; map `details.fieldErrors[]` to form fields.

---

## P2-022 — Mobile never reads `code` or `details` (High · error-drift)

**File:** [apps/mobile/src/api/client.ts](file:///Users/deprof/www/azeebo+/apps/mobile/src/api/client.ts#L9-L20)

**Observation:** `interface ApiError extends Error { statusCode?: number; message?: string; }` — no `code`, no `details`. The mobile UI cannot differentiate between "insufficient balance" (code `WALLET_INSUFFICIENT_BALANCE`) and "network error".

**Remediation:** same as P2-021; specifically, mobile needs `code: string; details: any;` fields on its `ApiError` interface.

---

## P2-023 — Backend `GlobalExceptionFilter` does not inject `traceId` from OTel (Medium · observability)

**File:** [packages/error-handling/src/global-exception.filter.ts](file:///Users/deprof/www/azeebo+/packages/error-handling/src/global-exception.filter.ts) (no `traceId`/`trace_id` field present)

**Observation:** the filter emits `timestamp` and `path` but no correlation/trace ID. When a user reports "I got an error at 14:23", support cannot find the corresponding trace.

**Remediation:** inject OTel's `trace.getActiveSpan()?.spanContext().traceId` into the response body. Add a UI banner "Error ID: abc123" on every error toast.

---

## P2-024 — `handleApiError` switch handles only 6 status codes (400, 401, 403, 404, 429, 500) (Medium · functionality)

**File:** [apps/web/src/lib/apiError.ts](file:///Users/deprof/www/azeebo+/apps/web/src/lib/apiError.ts#L98-L120)

**Observation:** 422 (validation), 409 (conflict), 410 (gone), 423 (locked), 451 (legal), 502/503/504 (upstream) all fall through to the generic `'An unexpected error occurred'`.

**Remediation:** expand the switch or default to the backend's `message` field when present; only fall back to generic for unknown.

---

## Summary

| ID     | Sev    | Title                                                                                  |
| ------ | ------ | -------------------------------------------------------------------------------------- |
| P2-021 | High   | `GlobalExceptionFilter` emits `{code,details,traceId?}`; web only reads `message+status` |
| P2-022 | High   | Mobile `ApiError` interface has no `code` or `details` fields                           |
| P2-023 | Medium | Filter does not inject OTel `traceId`                                                  |
| P2-024 | Medium | `handleApiError` switch handles only 6 of ~15 common status codes                     |

**Verification status:**
- [x] Error filters reviewed (`packages/error-handling/src/global-exception.filter.ts` + per-service `main.ts`).
- [x] Catch branches reviewed (`apps/web/src/lib/apiError.ts`, `apps/mobile/src/api/client.ts`).
- [x] Side-by-side diff produced.
- [ ] Live `supertest` of every exception type → **NOT SATISFIED — requires running services; deferred.**