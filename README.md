# Imagify

A Pinterest-like image sharing platform built on AWS. Upload images, get AI-detected labels via Rekognition, follow other users, like/dislike posts, browse personalised feeds, and view per-post engagement analytics.

**Live:** `http://imagify-frontend.s3-website-us-east-1.amazonaws.com`

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                            Browser                               │
│                  React SPA (Vite + React 18)                     │
│                 S3 Static Website Hosting                        │
└──────────┬───────────────────────────────┬───────────────────────┘
           │ /api/*  (JWT in header)        │ PUT (presigned URL)
           ▼                               ▼
┌──────────────────────┐       ┌───────────────────────────┐
│   API Gateway        │       │       S3 Bucket            │
│   HTTP API           │       │   imagify-images-bucket    │
│                      │       │                            │
│ • JWT Authorizer     │       │  uploads/{userId}/         │
│   (Cognito)          │       │    {imageId}/{filename}    │
│ • Throttling         │       └────────────┬───────────────┘
│   50 req/s burst 100 │                    │ S3 Event (PUT)
└──────────┬───────────┘                    ▼
           │                    ┌───────────────────────────┐
           ▼                    │      Lambda Function       │
┌──────────────────────┐        │  imagify-image-processor   │
│    Express API       │        │       Node.js 22.x         │
│   EC2 t2.micro       │        │                            │
│  (nginx + PM2)       │        │  • Rekognition             │
│                      │        │    DetectLabels            │
│  • presigned URLs    │        │    (max 10, ≥70% conf.)   │
│  • gallery + feeds   │        └────────────┬───────────────┘
│  • social APIs       │                     │
│  • profile APIs      │                     ▼
└──────────┬───────────┘       ┌───────────────────────────┐
           └──────────────────►│          DynamoDB          │
                               │                            │
                               │  imagify-labels            │
                               │  PK: imageId               │
                               │  + userId, filename, s3Key │
                               │  + labels[], processedAt   │
                               │  + downloadCount           │
                               │  GSI: userId-processedAt   │
                               │                            │
                               │  imagify-follows           │
                               │  PK: followerId            │
                               │  SK: followeeId            │
                               │  GSI: followeeId-index     │
                               │                            │
                               │  imagify-reactions         │
                               │  PK: imageId, SK: userId   │
                               │  + type (like|dislike)     │
                               └───────────────────────────┘
```

## CI/CD Pipeline

Every push to `main` triggers the full pipeline automatically.

```
GitHub (main branch)
        │
        ▼ CodeStar Connection
┌───────────────────┐
│   CodePipeline    │
│  imagify-pipeline │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│    CodeBuild      │   • npm ci (frontend + lambda)
│  imagify-build    │   • vite build (injects VITE_API_URL from env)
│  Node.js 22.x     │   • zip Lambda
└────────┬──────────┘
         │
    ┌────┴──────────────────┐
    │           │           │
    ▼           ▼           ▼
S3 Sync     Lambda      SSM Run
frontend/   update-     Command
dist →      function-   on EC2
imagify-    code        (git pull +
frontend               npm ci +
                       pm2 restart)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Frontend Hosting | AWS S3 Static Website |
| API Gateway | AWS API Gateway HTTP API (JWT auth, throttling) |
| Backend | Node.js, Express |
| Compute | AWS EC2 t2.micro (Amazon Linux 2023, nginx, PM2) |
| Storage | AWS S3 |
| Database | AWS DynamoDB (on-demand) |
| AI / ML | AWS Rekognition |
| Serverless | AWS Lambda (Node.js 22.x) |
| Auth | AWS Cognito User Pool + `amazon-cognito-identity-js` |
| CI/CD | AWS CodePipeline + CodeBuild |

---

## Directory Structure

```
Imagify/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Header.jsx          # Logo, search, theme toggle, user menu
│       │   ├── FeedTabs.jsx        # All / Following / My Posts tabs
│       │   ├── LabelFilter.jsx     # Scrollable label chip filter bar
│       │   ├── ImageGrid.jsx       # Responsive grid with skeleton loading
│       │   ├── ImageCard.jsx       # Simplified card (image + labels + counts)
│       │   ├── ImageDetailModal.jsx# Full-screen modal: details, actions, more by owner
│       │   ├── UploadModal.jsx     # Drag-and-drop upload + post name
│       │   ├── ProgressModal.jsx   # Upload / Rekognition progress indicator
│       │   └── SkeletonCard.jsx    # Shimmer placeholder
│       ├── pages/
│       │   ├── Home.jsx            # Gallery + upload + modal orchestration
│       │   ├── AuthPage.jsx        # Sign up / confirm / sign in
│       │   └── ProfilePage.jsx     # Dashboard: Posts, Followers, Settings tabs
│       ├── services/
│       │   └── api.js              # All backend API calls (auth-headered fetch)
│       ├── utils/
│       │   ├── auth.js             # Cognito SDK wrapper
│       │   ├── labelColors.js      # Deterministic label chip colours (hash-based)
│       │   └── theme.js            # Light / dark / system theme (localStorage)
│       └── styles/
│           └── index.css           # CSS custom properties, all component styles
├── backend/
│   └── src/
│       ├── middleware/
│       │   └── auth.js             # JWT decode → req.user.userId (API GW verifies sig)
│       ├── routes/
│       │   ├── images.js           # Gallery, upload URL, labels, download, delete
│       │   ├── reactions.js        # Like / dislike
│       │   ├── follows.js          # Follow / unfollow / status
│       │   └── users.js            # Profile stats, profile images, followers list
│       ├── services/
│       │   ├── s3.js               # Presigned URL generation + object delete
│       │   ├── dynamodb.js         # Images CRUD + download count increment
│       │   ├── reactions.js        # Reaction counts + batch delete
│       │   └── follows.js          # Follow/unfollow + GSI queries
│       └── config/
│           └── aws.js
├── lambda/
│   └── image-processor/
│       ├── index.js                # S3 trigger handler
│       ├── rekognition.js          # DetectLabels
│       └── dynamodb.js             # Write labels to imagify-labels
└── buildspec.yml                   # CodeBuild: build + deploy all 3 targets
```

---

## API Endpoints

All routes require `Authorization: Bearer <cognito-access-token>`. In production the token is verified by API Gateway before reaching EC2.

### Images
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/images` | Gallery — `?feed=global\|following\|mine` |
| `GET` | `/api/images/upload-url` | Presigned S3 PUT URL |
| `GET` | `/api/images/:id/labels` | Poll for Rekognition labels |
| `POST` | `/api/images/:id/download` | Record a download (increments count) |
| `DELETE` | `/api/images/:id` | Delete image (owner only) — removes S3 + DynamoDB + reactions |

### Reactions
| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/images/:id/reactions` | Like or dislike `{ type: "like"\|"dislike" }` |
| `DELETE` | `/api/images/:id/reactions` | Remove reaction |
| `GET` | `/api/images/:id/reactions` | Counts + current user's reaction |

### Follows
| Method | Path | Description |
|--------|------|-------------|
| `PUT` | `/api/follows/:userId` | Follow a user |
| `DELETE` | `/api/follows/:userId` | Unfollow a user |
| `GET` | `/api/follows/:userId` | Follow status + follower count |

### Users / Profiles
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/users/:userId` | Profile stats + images (postCount, followerCount, followingCount, isFollowing) |
| `GET` | `/api/users/:userId/followers` | List of follower userIds |

---

## Upload Flow

1. Browser requests a presigned S3 PUT URL from the backend (`userId` embedded in the key)
2. Browser PUTs the image directly to S3 — no EC2 bandwidth used
3. S3 triggers Lambda on `uploads/{userId}/{imageId}/{filename}`
4. Lambda calls Rekognition `DetectLabels` and writes labels + userId to DynamoDB
5. Browser polls `/api/images/:id/labels` every 2 s (up to 40 s) until labels appear
6. Gallery refreshes — image, labels, reactions, and engagement counts are displayed

---

## Local Development

```bash
# Backend
cd backend
npm install
npm run dev          # http://localhost:3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev          # http://localhost:5173 — proxies /api → :3000
```

### Required env vars

`backend/.env` (gitignored):
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
COGNITO_USER_POOL_ID=us-east-1_Gkon7tum6
COGNITO_CLIENT_ID=7ctfdoq4bmcrkgnfofnovh1a2g
DYNAMODB_TABLE_NAME=imagify-labels
S3_BUCKET_NAME=imagify-images-bucket
FOLLOWS_TABLE_NAME=imagify-follows
REACTIONS_TABLE_NAME=imagify-reactions
```

`frontend/.env.local` (gitignored):
```
VITE_COGNITO_USER_POOL_ID=us-east-1_Gkon7tum6
VITE_COGNITO_CLIENT_ID=7ctfdoq4bmcrkgnfofnovh1a2g
```

> `VITE_API_URL` is intentionally omitted — the Vite dev server proxies `/api` to `localhost:3000` automatically.

---

## AWS Infrastructure

All resources in `us-east-1`.

| Resource | Name | Notes |
|----------|------|-------|
| S3 Bucket | `imagify-images-bucket` | Private; browser access via presigned URLs |
| S3 Bucket | `imagify-frontend` | Public; static website hosting |
| S3 Bucket | `imagify-pipeline-artifact` | CodePipeline artifacts |
| DynamoDB | `imagify-labels` | PK: imageId; GSI: userId-processedAt-index |
| DynamoDB | `imagify-follows` | PK: followerId SK: followeeId; GSI: followeeId-index |
| DynamoDB | `imagify-reactions` | PK: imageId SK: userId |
| Lambda | `imagify-image-processor` | Node.js 22.x; triggered by S3 PUT |
| EC2 | `imagify-backend` | t2.micro, Amazon Linux 2023, nginx + PM2 |
| API Gateway | `imagify-api` | HTTP API; JWT authorizer (Cognito); 50 req/s throttle |
| Cognito | `imagify-user-pool` | Email sign-up / sign-in; ID: `us-east-1_Gkon7tum6` |
| IAM Role | `imagify-lambda-role` | S3 read, Rekognition, DynamoDB write |
| IAM Role | `imagify-ec2-role` | S3 presigned URLs, DynamoDB full, SSM |
| IAM Role | `imagify-codebuild-role` | S3 sync, Lambda update, SSM send |
| IAM User | `imagify-local-dev` | Local development credentials only |
| CodePipeline | `imagify-pipeline` | Triggered on push to `main` |
| CodeBuild | `imagify-build` | Node.js 22; `VITE_API_URL` set as console env var |
| GitHub Connection | `imagify-github` | CodeStar Connection |

---

