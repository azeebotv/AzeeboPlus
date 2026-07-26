Potential Next Steps
Remaining from earlier analysis:
1. Test other services — comedy, sports, reality, vertical, lifestyle tests (all have pre-existing failures from firebase-admin/zod dependencies)
2. Mobile app test coverage — no tests exist for mobile app screens
3. Web app test coverage — minimal tests for web pages
New features to build:
4. Admin UI for genre management — CRUD UI for managing movie genres
5. Admin UI for other universes — write operations for comedy, games, lifestyle, vertical
6. Live chat persistence — save live chat messages to database
7. Trivia game engine — implement trivia question management and scoring
8. Sports live scores — real-time WebSocket score updates
Infrastructure:
9. Fix remaining Prisma schema validation errors — 37 validation errors in combined-schema.prisma
10. Fix remaining TypeScript errors — admin/creator client apps
11. Add CI/CD tests — ensure tests run in pipeline