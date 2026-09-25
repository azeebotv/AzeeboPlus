# Agbala API Reference

Complete API reference for the Agbala storyworld endpoints in the Vertical Service.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Access Levels](#access-levels)
- [Spoiler Levels](#spoiler-levels)
- [Storyworld Endpoints](#storyworld-endpoints)
- [Badge Endpoints](#badge-endpoints)
- [Theory Endpoints](#theory-endpoints)
- [Room Endpoints](#room-endpoints)
- [Moderation Endpoints](#moderation-endpoints)
- [Subscription Endpoints](#subscription-endpoints)
- [Error Responses](#error-responses)

## Overview

The Agbala API provides endpoints for managing storyworlds, badges, theories, discussion rooms, and user subscriptions. All endpoints follow RESTful conventions and return JSON responses.

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Some endpoints are publicly accessible (marked with 🔓) while others require authentication (🔒) or admin privileges (👑).

## Base URL

```
https://api.azeeboplus.com/v1/vertical
```

For local development:
```
http://localhost:3017/v1/vertical
```

## Access Levels

Access levels control content visibility based on subscription tier:

| Level | Description | Subscription Required |
|-------|-------------|----------------------|
| `free` | Basic content accessible to all users | No |
| `basic` | Standard content for registered users | Basic plan |
| `premium` | Exclusive content for premium subscribers | Premium plan |
| `exclusive` | Limited content for top-tier supporters | Exclusive plan |

## Spoiler Levels

Spoiler levels help users control content visibility:

| Level | Description |
|-------|-------------|
| `none` | No spoilers, safe for all users |
| `minor` | Minor plot details, low risk |
| `moderate` | Significant plot points, medium risk |
| `major` | Major twists and endings, high risk |
| `all` | All content, including major spoilers |

## Storyworld Endpoints

### List Storyworlds

🔒 `GET /storyworlds`

Returns a paginated list of storyworlds.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | published | Filter by status |
| category | string | - | Filter by category |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "sw-1",
        "name": "Agbala",
        "slug": "agbala",
        "description": "The main Agbala storyworld",
        "category": "fantasy",
        "accessLevel": "free",
        "subscriptionRequired": false,
        "universeId": "universe-1",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get Storyworld by Slug

🔓 `GET /storyworlds/:slug`

Returns a single storyworld by its slug.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sw-1",
    "name": "Agbala",
    "slug": "agbala",
    "description": "The main Agbala storyworld",
    "category": "fantasy",
    "accessLevel": "free",
    "subscriptionRequired": false,
    "universeId": "universe-1",
    "stats": {
      "totalTheories": 150,
      "totalRooms": 25,
      "totalBadges": 10,
      "activeUsers": 500
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Create Storyworld

👑 `POST /storyworlds`

Creates a new storyworld. Admin only.

**Request Body:**

```json
{
  "name": "New Storyworld",
  "description": "A new storyworld description",
  "category": "sci-fi",
  "accessLevel": "basic",
  "universeId": "universe-1"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sw-2",
    "name": "New Storyworld",
    "slug": "new-storyworld",
    "description": "A new storyworld description",
    "category": "sci-fi",
    "accessLevel": "basic",
    "subscriptionRequired": true,
    "universeId": "universe-1",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update Storyworld

👑 `PUT /storyworlds/:id`

Updates an existing storyworld. Admin only.

**Request Body:**

```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "sw-1",
    "name": "Updated Name",
    "slug": "agbala",
    "description": "Updated description",
    "updatedAt": "2024-01-02T00:00:00Z"
  }
}
```

### Delete Storyworld

👑 `DELETE /storyworlds/:id`

Deletes a storyworld. Admin only.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Storyworld deleted"
  }
}
```

## Badge Endpoints

### List Badges

🔓 `GET /storyworlds/:storyworldId/badges`

Returns badges for a storyworld.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| category | string | - | Filter by category |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "badge-1",
        "name": "First Theory",
        "description": "Submit your first theory",
        "icon": "https://cdn.azeeboplus.com/badges/first-theory.png",
        "category": "engagement",
        "condition": "first_theory",
        "points": 10,
        "storyworldId": "sw-1",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get Badge by ID

🔓 `GET /badges/:id`

Returns a single badge by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "badge-1",
    "name": "First Theory",
    "description": "Submit your first theory",
    "icon": "https://cdn.azeeboplus.com/badges/first-theory.png",
    "category": "engagement",
    "condition": "first_theory",
    "points": 10,
    "storyworldId": "sw-1",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Get User Badges

🔒 `GET /users/:userId/badges`

Returns badges earned by a user.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "user-badge-1",
      "badgeId": "badge-1",
      "earnedAt": "2024-01-15T00:00:00Z",
      "badge": {
        "id": "badge-1",
        "name": "First Theory",
        "description": "Submit your first theory",
        "icon": "https://cdn.azeeboplus.com/badges/first-theory.png",
        "points": 10
      }
    }
  ]
}
```

### Check Badge Condition

🔒 `GET /badges/:badgeId/check`

Checks if a user is eligible for a badge.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | User ID to check |

**Response:**

```json
{
  "success": true,
  "data": {
    "badgeId": "badge-1",
    "userId": "user-1",
    "earned": false,
    "eligible": true,
    "progress": {
      "current": 1,
      "required": 1
    }
  }
}
```

### Award Badge

👑 `POST /badges/:badgeId/award`

Awards a badge to a user. Admin only.

**Request Body:**

```json
{
  "userId": "user-1"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user-badge-1",
    "userId": "user-1",
    "badgeId": "badge-1",
    "earnedAt": "2024-01-15T00:00:00Z",
    "points": 10
  }
}
```

### Revoke Badge

👑 `DELETE /badges/:badgeId/revoke`

Revokes a badge from a user. Admin only.

**Request Body:**

```json
{
  "userId": "user-1"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Badge revoked"
  }
}
```

### Get Badge Leaderboard

🔓 `GET /storyworlds/:storyworldId/badges/leaderboard`

Returns the badge leaderboard for a storyworld.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 10 | Number of users to return |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "userId": "user-1",
      "username": "topuser",
      "avatarUrl": "https://cdn.azeeboplus.com/avatars/user1.jpg",
      "totalBadges": 15,
      "totalPoints": 150
    }
  ]
}
```

## Theory Endpoints

### List Theories

🔓 `GET /storyworlds/:storyworldId/theories`

Returns theories for a storyworld.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | published | Filter by status |
| spoilerLevel | string | - | Filter by spoiler level |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "theory-1",
        "title": "The Prophecy Theory",
        "content": "This theory suggests that...",
        "userId": "user-1",
        "username": "theorist1",
        "storyworldId": "sw-1",
        "status": "published",
        "spoilerLevel": "minor",
        "upvotes": 42,
        "downvotes": 3,
        "commentCount": 15,
        "createdAt": "2024-01-15T00:00:00Z",
        "updatedAt": "2024-01-15T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get Theory by ID

🔓 `GET /theories/:id`

Returns a single theory by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "theory-1",
    "title": "The Prophecy Theory",
    "content": "This theory suggests that the main character is actually...",
    "userId": "user-1",
    "username": "theorist1",
    "storyworldId": "sw-1",
    "status": "published",
    "spoilerLevel": "minor",
    "upvotes": 42,
    "downvotes": 3,
    "comments": [
      {
        "id": "comment-1",
        "userId": "user-2",
        "username": "commenter1",
        "content": "Great theory!",
        "createdAt": "2024-01-16T00:00:00Z"
      }
    ],
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-01-15T00:00:00Z"
  }
}
```

### Create Theory

🔒 `POST /theories`

Creates a new theory.

**Request Body:**

```json
{
  "title": "My New Theory",
  "content": "This theory explains that...",
  "storyworldId": "sw-1",
  "spoilerLevel": "minor"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "theory-2",
    "title": "My New Theory",
    "content": "This theory explains that...",
    "userId": "user-1",
    "storyworldId": "sw-1",
    "status": "pending",
    "spoilerLevel": "minor",
    "createdAt": "2024-01-20T00:00:00Z"
  }
}
```

### Update Theory

🔒 `PUT /theories/:id`

Updates a theory. Only the author can update.

**Request Body:**

```json
{
  "title": "Updated Theory Title",
  "content": "Updated content..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "theory-1",
    "title": "Updated Theory Title",
    "content": "Updated content...",
    "updatedAt": "2024-01-21T00:00:00Z"
  }
}
```

### Delete Theory

🔒 `DELETE /theories/:id`

Deletes a theory. Only the author or admin can delete.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Theory deleted"
  }
}
```

### Vote on Theory

🔒 `POST /theories/:id/vote`

Vote on a theory.

**Request Body:**

```json
{
  "vote": "up"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "theoryId": "theory-1",
    "vote": "up",
    "upvotes": 43,
    "downvotes": 3
  }
}
```

## Room Endpoints

### List Rooms

🔓 `GET /storyworlds/:storyworldId/rooms`

Returns discussion rooms for a storyworld.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | active | Filter by status |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "room-1",
        "name": "General Discussion",
        "description": "Discuss anything about Agbala",
        "storyworldId": "sw-1",
        "createdBy": "user-1",
        "status": "active",
        "memberCount": 150,
        "postCount": 1200,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get Room by ID

🔓 `GET /rooms/:id`

Returns a single room by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "room-1",
    "name": "General Discussion",
    "description": "Discuss anything about Agbala",
    "storyworldId": "sw-1",
    "createdBy": "user-1",
    "status": "active",
    "members": [
      {
        "userId": "user-1",
        "username": "creator",
        "joinedAt": "2024-01-01T00:00:00Z",
        "role": "admin"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Create Room

🔒 `POST /rooms`

Creates a new discussion room.

**Request Body:**

```json
{
  "name": "New Discussion Room",
  "description": "A room for discussing theories",
  "storyworldId": "sw-1"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "room-2",
    "name": "New Discussion Room",
    "description": "A room for discussing theories",
    "storyworldId": "sw-1",
    "createdBy": "user-1",
    "status": "active",
    "createdAt": "2024-01-20T00:00:00Z"
  }
}
```

### Get Room Posts

🔓 `GET /rooms/:roomId/posts`

Returns posts in a room.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Items per page |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "post-1",
        "content": "What do you all think about the latest episode?",
        "userId": "user-1",
        "username": "user1",
        "roomId": "room-1",
        "status": "published",
        "upvotes": 5,
        "replyCount": 3,
        "createdAt": "2024-01-15T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
}
```

### Create Room Post

🔒 `POST /rooms/:roomId/posts`

Creates a new post in a room.

**Request Body:**

```json
{
  "content": "This is my thoughts on the latest development..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "post-2",
    "content": "This is my thoughts on the latest development...",
    "userId": "user-1",
    "roomId": "room-1",
    "status": "pending",
    "createdAt": "2024-01-20T00:00:00Z"
  }
}
```

### Vote on Post

🔒 `POST /posts/:postId/vote`

Vote on a room post.

**Request Body:**

```json
{
  "vote": "up"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "postId": "post-1",
    "vote": "up",
    "upvotes": 6,
    "downvotes": 0
  }
}
```

## Moderation Endpoints

### Submit Theory for Moderation

🔒 `POST /moderation/theories/:theoryId/submit`

Submits a theory for moderation review.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mod-1",
    "contentType": "theory",
    "contentId": "theory-1",
    "status": "pending",
    "submittedBy": "user-1",
    "submittedAt": "2024-01-15T00:00:00Z"
  }
}
```

### Submit Room Post for Moderation

🔒 `POST /moderation/posts/:postId/submit`

Submits a room post for moderation review.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mod-2",
    "contentType": "room_post",
    "contentId": "post-1",
    "status": "pending",
    "submittedBy": "user-1",
    "submittedAt": "2024-01-15T00:00:00Z"
  }
}
```

### Get Moderation Status

🔒 `GET /moderation/:id`

Returns the status of a moderation item.

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mod-1",
    "contentType": "theory",
    "contentId": "theory-1",
    "status": "approved",
    "submittedBy": "user-1",
    "submittedAt": "2024-01-15T00:00:00Z",
    "reviewedBy": "admin-1",
    "reviewedAt": "2024-01-16T00:00:00Z",
    "rejectionReason": null
  }
}
```

### Get Pending Moderations

👑 `GET /moderation/pending`

Returns pending moderation items. Admin only.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| contentType | string | - | Filter by content type |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "mod-1",
        "contentType": "theory",
        "contentId": "theory-1",
        "status": "pending",
        "submittedBy": "user-1",
        "submittedAt": "2024-01-15T00:00:00Z",
        "content": {
          "title": "New Theory",
          "content": "Theory content..."
        }
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Review Moderation

👑 `PUT /moderation/:id/review`

Reviews a moderation item. Admin only.

**Request Body:**

```json
{
  "status": "approved",
  "rejectionReason": null
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "mod-1",
    "status": "approved",
    "reviewedBy": "admin-1",
    "reviewedAt": "2024-01-16T00:00:00Z",
    "rejectionReason": null
  }
}
```

### Get User Moderation History

🔒 `GET /moderation/user/:userId`

Returns moderation history for a user.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| status | string | - | Filter by status |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "mod-1",
        "contentType": "theory",
        "contentId": "theory-1",
        "status": "approved",
        "submittedAt": "2024-01-15T00:00:00Z",
        "reviewedAt": "2024-01-16T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get Moderation Stats

👑 `GET /moderation/stats`

Returns moderation statistics. Admin only.

**Response:**

```json
{
  "success": true,
  "data": {
    "total": 100,
    "pending": 25,
    "approved": 60,
    "rejected": 15,
    "averageReviewTime": "2.5 hours"
  }
}
```

## Subscription Endpoints

### Check Access Level

🔒 `GET /subscriptions/access/:storyworldId`

Checks if a user has access to a storyworld.

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user-1",
    "storyworldId": "sw-1",
    "hasAccess": true,
    "requiredLevel": "premium",
    "currentLevel": "premium",
    "expiresAt": "2024-12-31T00:00:00Z"
  }
}
```

### Get Access Levels

🔓 `GET /subscriptions/levels`

Returns all available access levels.

**Response:**

```json
{
  "success": true,
  "data": {
    "levels": [
      {
        "name": "free",
        "description": "Basic content access",
        "price": 0,
        "features": ["Basic content", "Community forums"]
      },
      {
        "name": "basic",
        "description": "Standard content access",
        "price": 4.99,
        "features": ["All free features", "Basic theories", "Standard rooms"]
      },
      {
        "name": "premium",
        "description": "Full content access",
        "price": 9.99,
        "features": ["All basic features", "Premium theories", "Exclusive rooms", "Early access"]
      },
      {
        "name": "exclusive",
        "description": "Top-tier access",
        "price": 19.99,
        "features": ["All premium features", "Creator interactions", "Beta access", "Custom badges"]
      }
    ]
  }
}
```

### Generate Subscription Prompt

🔒 `GET /subscriptions/prompt/:targetLevel`

Generates a subscription upgrade prompt for a user.

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user-1",
    "currentPlan": "free",
    "targetPlan": "premium",
    "prompt": {
      "title": "Upgrade to Premium",
      "message": "Unlock exclusive content and features with Premium!",
      "features": ["Premium theories", "Exclusive rooms", "Early access"],
      "price": "$9.99/month",
      "cta": "Upgrade Now"
    }
  }
}
```

### Validate Subscription

🔒 `GET /subscriptions/validate`

Validates a user's subscription with the subscription service.

**Response:**

```json
{
  "success": true,
  "data": {
    "userId": "user-1",
    "valid": true,
    "plan": "premium",
    "status": "active",
    "expiresAt": "2024-12-31T00:00:00Z",
    "features": ["all_access", "early_access", "exclusive_content"]
  }
}
```

### Refresh Subscription Cache

🔒 `POST /subscriptions/refresh`

Refreshes the subscription cache for a user.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Subscription cache refreshed",
    "cachedAt": "2024-01-20T00:00:00Z"
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Insufficient permissions |
| BAD_REQUEST | 400 | Invalid request data |
| CONFLICT | 409 | Resource already exists |
| VALIDATION_ERROR | 400 | Validation failed |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Internal server error |

### Example Error Responses

**404 Not Found:**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Storyworld not found: not-existing-slug"
  }
}
```

**401 Unauthorized:**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action"
  }
}
```

**400 Bad Request:**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Badge already earned by this user"
  }
}
```

**429 Rate Limited:**

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```
