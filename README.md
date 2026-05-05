# Imagify

An image recognition gallery built on AWS. Upload an image, get AI-detected labels back, browse your gallery filtered by label.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│              React SPA (Vite + React 18)                │
└──────────┬───────────────────────┬──────────────────────┘
           │ /api/*                │ PUT (presigned URL)
           ▼                       ▼
┌──────────────────┐     ┌──────────────────────┐
│   Express API    │     │      S3 Bucket        │
│   (EC2 t2.micro) │     │  imagify-images-      │
│                  │     │  bucket               │
│  • presigned URL │     │                       │
│    generation    │     │  uploads/{id}/{file}  │
│  • gallery read  │     └──────────┬────────────┘
└──────────────────┘                │ S3 Event (PUT)
           │                        ▼
           │             ┌──────────────────────┐
           │             │  Lambda Function      │
           │             │  imagify-image-       │
           │             │  processor            │
           │             │                       │
           │             │  • DetectLabels       │
           │             │    (Rekognition)      │
           │             │  • Stores results     │
           │             └──────────┬────────────┘
           │                        │
           │                        ▼
           │             ┌──────────────────────┐
           └────────────►│     DynamoDB          │
                         │   imagify-labels      │
                         │                       │
                         │  PK: imageId          │
                         │  + filename, s3Key    │
                         │  + labels[], date     │
                         └──────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| Compute | AWS EC2 (t2.micro) |
| Storage | AWS S3 |
| Database | AWS DynamoDB (on-demand) |
| AI / ML | AWS Rekognition |
| Serverless | AWS Lambda (Node.js 22.x) |
| Auth (planned) | AWS Cognito |

## Directory Structure

```
Imagify/
├── frontend/                   # React SPA
│   └── src/
│       ├── components/
│       │   ├── Header.jsx      # Search bar + upload button
│       │   ├── LabelFilter.jsx # Clickable label chips
│       │   ├── ImageGrid.jsx   # Responsive image grid
│       │   ├── ImageCard.jsx   # Card with labels + confidence
│       │   └── UploadModal.jsx # Drag-and-drop upload
│       ├── pages/
│       │   └── Home.jsx
│       ├── services/
│       │   └── api.js          # All backend API calls
│       ├── utils/
│       │   └── labelColors.js  # Deterministic label chip colours
│       └── styles/
│           └── index.css
├── backend/                    # Express API (runs on EC2)
│   └── src/
│       ├── routes/
│       │   └── images.js       # GET /, GET /upload-url, GET /:id/labels
│       ├── services/
│       │   ├── s3.js           # Presigned URL generation
│       │   └── dynamodb.js     # DynamoDB reads
│       └── config/
│           └── aws.js
├── lambda/
│   └── image-processor/        # Triggered by S3 upload
│       ├── index.js            # Handler
│       ├── rekognition.js      # DetectLabels call
│       └── dynamodb.js         # Write labels to DynamoDB
└── CLAUDE.md                   # AI assistant context
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/images` | List all images with labels and presigned URLs |
| `GET` | `/api/images/upload-url` | Get a presigned S3 PUT URL for upload |
| `GET` | `/api/images/:id/labels` | Poll for labels after upload |

## Upload Flow

1. Browser requests a presigned S3 URL from the backend
2. Browser PUTs the image file directly to S3 (no EC2 bandwidth used)
3. S3 triggers the Lambda function
4. Lambda calls Rekognition `DetectLabels`
5. Lambda writes `imageId`, `filename`, `s3Key`, `labels[]` to DynamoDB
6. Browser polls `/api/images/:id/labels` until labels appear
7. Gallery refreshes — image and labels are displayed

## Local Development

```bash
# Backend
cd backend
cp .env.example .env      # fill in AWS credentials for local dev
npm install
node server.js            # http://localhost:3000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```

### Required `.env` values (backend)
```
PORT=3000
AWS_REGION=us-east-1
S3_BUCKET_NAME=imagify-images-bucket
DYNAMODB_TABLE_NAME=imagify-labels

# Local dev only — not needed on EC2 (uses IAM role)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## AWS Infrastructure

All resources are in `us-east-1` under the free tier.

| Resource | Name | Notes |
|----------|------|-------|
| S3 Bucket | `imagify-images-bucket` | Private; browser access via presigned URLs |
| DynamoDB | `imagify-labels` | On-demand capacity |
| Lambda | `imagify-image-processor` | Node.js 22.x, 128 MB |
| IAM Role | `imagify-lambda-role` | S3 read, Rekognition, DynamoDB write, CloudWatch |
| IAM Role | `imagify-ec2-role` | S3 full (presigned URLs), DynamoDB read |
| IAM User | `imagify-local-dev` | Local development credentials only |
