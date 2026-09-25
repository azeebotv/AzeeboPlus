# Skill: Prepare PR

> Prepare a clean PR with tests, docs, and proper formatting.

---

## Usage

```
/prepare-pr [branch-name]

Example:
/prepare-pr feature/REAL-001-reality-vote-flow
```

## What It Does

1. Reviews all changes in the current branch
2. Verifies code quality (lint, types, tests)
3. Generates a PR description from changes
4. Suggests review labels and reviewers
5. Checks PR size and splits if needed
6. Ensures checklist compliance

## Output

### PR Description Template

```markdown
## What
[1-2 sentence summary of what changed]

## Why
[Why this change was needed — link to issue/task]

## Changes
- [Change 1]
- [Change 2]

## Screenshots / Demo
[If UI change]

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] Edge cases considered

## Checklist
- [ ] TypeScript strict — no `any`
- [ ] Lint passes
- [ ] Tests pass
- [ ] Loading/empty/error/success states
- [ ] Analytics events added
- [ ] Shared components reused
- [ ] No hardcoded prices
- [ ] PR < 400 lines
- [ ] Documentation updated (if needed)
```

## Rules

- PR title follows conventional commits: `feat(reality): add vote confirmation [REAL-001]`
- Branch name matches: `feature/REAL-001-reality-vote-flow`
- PR targets `develop` (or `main` for hotfixes)
- Squash merge preferred
- No secrets or .env files in the diff
