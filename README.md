# Imagify

A Pinterest-like image sharing platform built on AWS. Upload images, get AI-detected labels via Rekognition, follow other users, like/dislike posts, and browse personalised feeds.

**Live:** S3 static website (URL in CLAUDE.md)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          Browser                            │
│                React SPA (Vite + React 18)                  │
│              S3 Static Website Hosting                      │
└──────────┬──────────────────────────┬───────────────────────┘
           │ /api/*                   │ PUT (presigned URL)
           ▼                          ▼
┌──────────────────────┐   ┌─────────────────────────┐
│     Express API      │   │       S3 Bucket          │
│   EC2 t2.micro       │   │  imagify-images-bucket   │
│  (nginx + PM2)       │   │                          │
│                      │   │  uploads/{id}/{filename} │
│  • presigned URLs    │   └────────────┬─────────────┘
│  • gallery reads     │                │ S3 Event (PUT)
└──────────────────────┘                ▼
           │                 ┌─────────────────────────┐
           │                 │     Lambda Function      │
           │                 │  imagify-image-processor │
           │                 │      Node.js 22.x        │
           │                 │                          │
           │                 │  • Rekognition           │
           │                 │    DetectLabels          │
           │                 │    (max 10, ≥70%)        │
           │                 └────────────┬─────────────┘
           │                              │
           │                              ▼
           │                 ┌─────────────────────────┐
           └────────────────►│        DynamoDB          │
                             │  imagify-labels          │
                             │  PK: imageId             │
                             │  + userId, filename      │
                             │  + labels[], processedAt │
                             │  GSI: userId-processedAt │
                             │                          │
                             │  imagify-follows         │
                             │  PK: followerId          │
                             │  SK: followeeId          │
                             │  GSI: followeeId-index   │
                             │                          │
                             │  imagify-reactions       │
                             │  PK: imageId             │
                             │  SK: userId              │
                             │  + type (like|dislike)   │
                             └─────────────────────────┘
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
│  imagify-build    │   • vite build (React)
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
frontend              pm2 restart)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Frontend Hosting | AWS S3 Static Website |
| Backend | Node.js, Express |
| Compute | AWS EC2 t2.micro (Amazon Linux 2023, nginx, PM2) |
| Storage | AWS S3 |
| Database | AWS DynamoDB (on-demand) |
| AI / ML | AWS Rekognition |
| Serverless | AWS Lambda (Node.js 22.x) |
| CI/CD | AWS CodePipeline + CodeBuild |
| Auth | AWS Cognito User Pool + `amazon-cognito-identity-js` |

## Directory Structure

```
Imagify/
├── frontend/                   # React SPA
│   └── src/
│       ├── components/
│       │   ├── Header.jsx      # Search bar, upload button, user avatar + sign-out
│       │   ├── FeedTabs.jsx    # All / Following / My Posts tabs
│       │   ├── LabelFilter.jsx # Clickable label chips
│       │   ├── ImageGrid.jsx   # Responsive image grid with skeleton loading
│       │   ├── ImageCard.jsx   # Card: labels, like/dislike, follow button
│       │   ├── UploadModal.jsx # Drag-and-drop upload + post name input
│       │   └── ProgressModal.jsx
│       ├── pages/
│       │   ├── Home.jsx        # Gallery + upload flow
│       │   └── AuthPage.jsx    # Sign up / confirm / sign in
│       ├── services/
│       │   └── api.js          # All backend API calls (auth-headered)
│       ├── utils/
│       │   ├── auth.js         # Cognito SDK wrapper (signUp/signIn/getToken/getUserId)
│       │   ├── labelColors.js  # Deterministic label chip colours
│       │   └── theme.js        # Light/dark/system theme util
│       └── styles/
│           └── index.css
├── backend/                    # Express API (runs on EC2)
│   └── src/
│       ├── middleware/
│       │   └── auth.js         # Cognito JWT verification → req.user.userId
│       ├── routes/
│       │   ├── images.js       # GET /, GET /upload-url, GET /:id/labels
│       │   ├── reactions.js    # PUT/DELETE/GET /:imageId/reactions
│       │   └── follows.js      # PUT/DELETE/GET /:followeeId
│       ├── services/
│       │   ├── s3.js           # Presigned URL generation
│       │   ├── dynamodb.js     # Images + labels queries
│       │   ├── reactions.js    # Reaction counts + user reaction
│       │   └── follows.js      # Follow/unfollow + getFollowingIds
│       └── config/
│           └── aws.js
├── lambda/
│   └── image-processor/        # Triggered by S3 upload
│       ├── index.js            # Handler
│       ├── rekognition.js      # DetectLabels call
│       └── dynamodb.js         # Write labels to DynamoDB
└── buildspec.yml               # CodeBuild build + deploy spec
```

## API Endpoints

All routes require a Cognito `Authorization: Bearer <token>` header.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/images` | Gallery — accepts `?feed=global\|following\|mine` |
| `GET` | `/api/images/upload-url` | Presigned S3 PUT URL for upload |
| `GET` | `/api/images/:id/labels` | Poll for labels after upload |
| `PUT` | `/api/images/:id/reactions` | Like or dislike (`{ type: "like"\|"dislike" }`) |
| `DELETE` | `/api/images/:id/reactions` | Remove reaction |
| `PUT` | `/api/follows/:userId` | Follow a user |
| `DELETE` | `/api/follows/:userId` | Unfollow a user |
| `GET` | `/api/follows/:userId` | Follow status + follower count |

## Upload Flow

1. Browser requests a presigned S3 PUT URL from the backend (includes `userId` in key)
2. Browser PUTs the image directly to S3 (no EC2 bandwidth used)
3. S3 triggers Lambda (`uploads/{userId}/{imageId}/{filename}`)
4. Lambda extracts `userId` from the key, calls Rekognition `DetectLabels`
5. Lambda writes `imageId`, `userId`, `filename`, `s3Key`, `labels[]` to DynamoDB
6. Browser polls `/api/images/:id/labels` every 2 s until labels appear (up to 40 s)
7. Gallery refreshes — image, labels, and reaction counts are displayed

## Local Development

```bash
# Backend
cd backend
npm install
npm run dev               # http://localhost:3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173 — proxies /api → :3000
```

### Required env vars

`backend/.env` (gitignored):
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...
FOLLOWS_TABLE_NAME=imagify-follows
REACTIONS_TABLE_NAME=imagify-reactions
```

`frontend/.env.local` (gitignored):
```
VITE_COGNITO_USER_POOL_ID=...
VITE_COGNITO_CLIENT_ID=...
```

## AWS Infrastructure

All resources in `us-east-1`.

| Resource | Name | Notes |
|----------|------|-------|
| S3 Bucket | `imagify-images-bucket` | Private; browser access via presigned URLs |
| S3 Bucket | `imagify-frontend` | Public; static website hosting |
| S3 Bucket | `imagify-pipeline-artifact` | Private; CodePipeline artifacts |
| DynamoDB | `imagify-labels` | PK: imageId; GSI: userId-processedAt-index |
| DynamoDB | `imagify-follows` | PK: followerId, SK: followeeId; GSI: followeeId-index |
| DynamoDB | `imagify-reactions` | PK: imageId, SK: userId |
| Lambda | `imagify-image-processor` | Node.js 22.x, 128 MB, triggered by S3 |
| EC2 | `imagify-backend` | t2.micro, Amazon Linux 2023, nginx + PM2 |
| Cognito | `imagify-user-pool` | Email sign-up/sign-in |
| IAM Role | `imagify-lambda-role` | S3 read, Rekognition, DynamoDB write |
| IAM Role | `imagify-ec2-role` | S3 presigned URLs, DynamoDB full, SSM |
| IAM Role | `imagify-codebuild-role` | S3 sync, Lambda update, SSM send |
| IAM User | `imagify-local-dev` | Local development credentials only |
| CodePipeline | `imagify-pipeline` | Triggered on push to main |
| CodeBuild | `imagify-build` | Node.js 22, builds + deploys all 3 targets |
| GitHub Connection | `imagify-github` | CodeStar Connection |

## Completed Phases

- [x] Phase 1 — S3, DynamoDB, IAM roles
- [x] Phase 2 — Lambda + Rekognition pipeline
- [x] Phase 3 — Express API on EC2, nginx + PM2, presigned URLs, gallery UI
- [x] Phase 4 — Cognito authentication (sign up / confirm / sign in / sign out)
- [x] Phase 5 — User attribution (`userId` on every upload + DynamoDB GSI)
- [x] Phase 6 — Social features: follows, likes/dislikes, global/following/mine feeds
- [x] CI/CD — CodePipeline auto-deploys frontend (S3), Lambda, and EC2 backend on push to `main`

## Roadmap

- [ ] Phase 7 — Profiles, delete own images, download with labels
- [ ] Phase 8 — API Gateway (rate limiting, throttling)
- [ ] Phase 9 — SQS between S3 and Lambda (decouple + retry)
- [ ] Phase 10 — Image optimisation at scale (deduplication, WebP derivatives, CloudFront CDN)
