# Deprecation Policy — Azeebo+

This policy defines how we handle API deprecations and removals.

---

## Principles

1. **No Breaking Changes Without Notice** — All breaking changes require a deprecation period
2. **Clear Communication** — Deprecations are announced via multiple channels
3. **Reasonable Timeline** — Minimum 6 months between deprecation and removal
4. **Migration Support** — Provide migration guides for all deprecations

---

## Deprecation Lifecycle

### 1. Announcement (Month 0)
- Deprecation notice added to API response headers
- Announcement in changelog and release notes
- Email notification to affected API consumers
- Documentation updated with deprecation notice

### 2. Deprecation Period (Months 1-6)
- Deprecated endpoint returns `Sunset` header
- Deprecated endpoint returns `Deprecation` header
- Warning logged in analytics for usage tracking
- Migration guide published

### 3. Removal (Month 6+)
- Endpoint removed from API
- Returns 410 Gone for 30 days
- Returns 404 after 30-day grace period
- Final notification to remaining consumers

---

## HTTP Headers

### During Deprecation
```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Mar 2025 00:00:00 GMT
Link: <https://docs.azeebo.com/migration/v1-to-v2>; rel="successor-version"
X-Deprecation-Notice: This endpoint will be removed on 2025-03-01. Migrate to /v2/users
```

### After Removal
```http
HTTP/1.1 410 Gone
Content-Type: application/json

{
  "error": "GONE",
  "message": "This endpoint has been removed.",
  "migrationGuide": "https://docs.azeebo.com/migration/v1-to-v2",
  "alternativeEndpoints": ["/v2/users"]
}
```

---

## Versioning Strategy

### URL Versioning
- Current: `/v1/`
- Next: `/v2/`
- Version in URL path, not headers

### Deprecation Timeline
| Phase | Duration | Action |
|-------|----------|--------|
| Announce | Month 0 | Add deprecation headers |
| Warn | Months 1-6 | Track usage, notify consumers |
| Remove | Month 6+ | Return 410 Gone |
| Cleanup | Month 7+ | Return 404 |

---

## Affected Endpoints

### Currently Deprecated
| Endpoint | Deprecated | Removal Date | Alternative |
|----------|-----------|--------------|-------------|
| — | — | — | — |

### Recently Removed
| Endpoint | Removed | Was Deprecated | Alternative |
|----------|---------|----------------|-------------|
| — | — | — | — |

---

## Migration Guide Template

### Migrating from `/v1/{endpoint}` to `/v2/{endpoint}`

#### Changes
- Request body changes
- Response body changes
- Authentication changes

#### Before (v1)
```json
{
  "old_field": "value"
}
```

#### After (v2)
```json
{
  "new_field": "value"
}
```

#### Code Examples

**Before:**
```javascript
const response = await fetch('/v1/users');
```

**After:**
```javascript
const response = await fetch('/v2/users');
```

---

## Communication Channels

1. **API Response Headers** — Immediate notification
2. **Changelog** — Release notes
3. **Email** — Direct notification to registered API consumers
4. **Documentation** — Updated guides
5. **Status Page** — Announcements

---

## Exceptions

In rare cases, we may need to remove an endpoint with less notice:

- **Security vulnerability** — Immediate removal
- **Legal compliance** — As required by law
- **Critical bug** — If causing data loss or corruption

In these cases, we will:
1. Notify affected consumers immediately
2. Provide migration guide within 48 hours
3. Offer extended support for migration

---

## Contact

For questions about deprecations:
- Email: api-support@azeebo.com
- Discord: #api-support
- GitHub: [Discussions](https://github.com/vmnl/azeebo+/discussions)
