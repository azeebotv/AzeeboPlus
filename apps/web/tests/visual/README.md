# Visual Regression Testing

This directory contains Playwright-based visual regression tests that compare Storybook stories against baseline screenshots.

## Setup

```bash
# Install dependencies
cd apps/web
pnpm install

# Update baseline screenshots
pnpm test:visual:update
```

## Running Tests

```bash
# Start Storybook
pnpm storybook

# In another terminal, run visual tests
pnpm test:visual

# Update baselines after intentional changes
pnpm test:visual:update
```

## How It Works

1. Tests navigate to each Storybook story via iframe URL
2. Screenshots are taken at consistent viewport sizes
3. Screenshots are compared against baselines in `__screenshots__/`
4. Differences are saved in `__diffs__/` for review

## Configuration

- **Threshold**: 1% pixel difference allowed (`maxDiffPixelRatio: 0.01`)
- **Viewports**: Mobile (375px), Tablet (768px), Desktop (1280px)
- **Animations**: Disabled during screenshots for consistency

## Adding New Stories

1. Create a `.stories.tsx` file in the component directory
2. Add the story ID to `STORIES` array in `visual-regression.spec.ts`
3. Run `pnpm test:visual:update` to create baseline

## Reviewing Failures

When a test fails:
1. Check the diff image in `__diffs__/`
2. If the change is intentional, update baselines:
   ```bash
   pnpm test:visual:update
   ```
3. If the change is a bug, fix the component

## CI Integration

Add to your CI pipeline:
```yaml
- name: Visual Regression Tests
  run: |
    cd apps/web
    pnpm storybook &
    sleep 10
    pnpm test:visual
```
