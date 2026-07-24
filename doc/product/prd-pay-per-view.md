# PRD: Pay-Per-View Live Events

> Priority: P0 | Est. Effort: 5 days | Dependencies: screening system, wallet-service

---

## Problem Statement

Azeebo+ currently supports scheduled screenings with fixed pricing, but lacks real-time ticketed live events. Users want to watch live concerts, comedy shows, and sports events as they happen, with the ability to purchase tickets per event.

## User Stories

1. **As a viewer**, I want to browse upcoming live events and purchase tickets so I can watch them in real-time
2. **As a viewer**, I want to receive reminders before events start so I don't miss them
3. **As a creator/organizer**, I want to schedule live events with ticket pricing so I can monetize live content
4. **As an admin**, I want to manage live events and view revenue reports

## Requirements

### Functional
- [ ] Live event listing with countdown timers
- [ ] Ticket purchase flow (single ticket, group tickets)
- [ ] Real-time streaming integration (WebSocket/HLS)
- [ ] Chat/comments during live events
- [ ] Post-event replay access for ticket holders
- [ ] Revenue split between platform and organizer

### Non-Functional
- [ ] Support 10,000+ concurrent viewers per event
- [ ] Stream latency < 5 seconds
- [ ] Graceful degradation on network issues
- [ ] Mobile-optimized viewing experience

## Technical Design

### Database Changes
```prisma
model LiveEvent {
  id            String   @id @default(uuid())
  title         String
  description   String?
  thumbnail     String
  organizerId   String
  scheduledAt   DateTime
  duration      Int      // minutes
  status        String   // scheduled, live, ended, cancelled
  ticketPrice   Decimal  @db.Decimal(10, 2)
  currency      String   @default("NGN")
  maxViewers    Int?
  streamUrl     String?
  chatEnabled   Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model LiveEventTicket {
  id            String   @id @default(uuid())
  eventId       String
  userId        String
  amount        Decimal  @db.Decimal(10, 2)
  status        String   // purchased, used, refunded
  purchasedAt   DateTime @default(now())
}
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/live-events` | List upcoming/live events |
| GET | `/live-events/:id` | Get event details |
| POST | `/live-events/:id/purchase` | Purchase ticket |
| GET | `/live-events/:id/stream` | Get stream URL (auth required) |
| POST | `/live-events` | Create event (organizer) |

### Integration Points
- **wallet-service**: Ticket purchase debits
- **notification-service**: Event reminders
- **content-service**: Event metadata and media
- **analytics-service**: Viewership tracking

## Success Metrics
- 100+ live events in first quarter
- Average 500+ viewers per event
- 80% ticket-to-view conversion rate
- Revenue per event > ₦500,000
