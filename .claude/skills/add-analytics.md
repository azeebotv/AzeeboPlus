# Skill: Add Analytics

> Instrument analytics events on existing code.

---

## Usage

```
/add-analytics [file-or-module-path]

Example:
/add-analytics apps/mobile/src/screens/reality/VoteScreen.tsx
/add-analytics services/universes/reality-service/src/vote
```

## What It Does

1. Reads the existing code
2. Identifies conversion points (view, tap, success, failure)
3. Adds `@azeebo/analytics-sdk` calls
4. Ensures event naming follows `snake_case` convention
5. Adds event properties for debugging

## Analytics Event Pattern

Every screen/action must have:

| Event | Trigger | Properties |
|-------|---------|-----------|
| `{universe}_{screen}_viewed` | Screen mount | `{ user_id, timestamp }` |
| `{universe}_{action}_tapped` | User tap | `{ user_id, item_id, timestamp }` |
| `{universe}_{action}_success` | Action completed | `{ user_id, item_id, amount?, timestamp }` |
| `{universe}_{action}_failure` | Action failed | `{ user_id, error_code, timestamp }` |

## Examples

```typescript
// Before
const handleVote = async () => {
  await vote({ showId, contestantId, quantity });
};

// After
const handleVote = async () => {
  analytics.track('reality_vote_tapped', {
    user_id: user.id,
    show_id: showId,
    contestant_id: contestantId,
    quantity,
  });

  try {
    await vote({ showId, contestantId, quantity });
    analytics.track('reality_vote_success', {
      user_id: user.id,
      show_id: showId,
      contestant_id: contestantId,
      quantity,
      amount: quantity * pricePerVote,
    });
  } catch (error) {
    analytics.track('reality_vote_failure', {
      user_id: user.id,
      error_code: error.code,
    });
  }
};
```

## Rules

- Never log sensitive data (passwords, full card numbers)
- Use `snake_case` for event names
- Include `user_id` on all events
- Properties should be serializable (no functions, no DOM elements)
