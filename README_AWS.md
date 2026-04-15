# Twitter Sentiment Analysis - AWS Deployment

## Quick Start

### 1. Configure Environment Variables
```bash
cp .env.example .env
# Edit .env with your Twitter API credentials
```

### 2. Deploy to AWS

**Option A: Using deployment script (Recommended)**
```bash
./deploy.sh
```

**Option B: Manual deployment**
```bash
# Build and push Docker image
docker build -t twitter-sentiment-analysis:latest .
aws ecr create-repository --repository-name twitter-sentiment-analysis
docker tag twitter-sentiment-analysis:latest <account-id>.dkr.ecr.<region>.amazonaws.com/twitter-sentiment-analysis:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/twitter-sentiment-analysis:latest
```

### 3. Deploy to AWS Service

**Elastic Beanstalk (Simplest)**
```bash
eb init -p docker -r us-east-1 twitter-sentiment-app
eb create production-env
eb setenv TWITTER_BEARER_TOKEN=your_token
eb deploy
```

**App Runner (Easiest)**
1. Go to AWS Console → App Runner
2. Create service → Select ECR image
3. Configure environment variables
4. Deploy

## Architecture

- **Frontend**: React + Vite + TailwindCSS + Chart.js
- **Backend**: Express.js + Twitter API v2
- **ML**: Python NLTK VADER sentiment analysis
- **Container**: Docker with multi-stage build

## Files Created for AWS Deployment

- `Dockerfile` - Multi-stage container build
- `.dockerignore` - Exclude unnecessary files
- `.ebextensions/01_environment.config` - Elastic Beanstalk config
- `Dockerrun.aws.json` - AWS Docker deployment config
- `.env.example` - Environment variable template
- `deploy.sh` - Automated deployment script
- `AWS_DEPLOYMENT.md` - Detailed deployment guide

## Detailed Instructions

See [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for comprehensive deployment instructions, troubleshooting, and cost estimation.

## Environment Variables Required

- `PORT` - Application port (default: 5000)
- `TWITTER_BEARER_TOKEN` - Twitter API Bearer Token
- `TWITTER_CONSUMER_KEY` - Twitter API Consumer Key
- `TWITTER_CONSUMER_SECRET` - Twitter API Consumer Secret
- `TWITTER_ACCESS_TOKEN` - Twitter API Access Token
- `TWITTER_ACCESS_TOKEN_SECRET` - Twitter API Access Token Secret

## Local Testing

```bash
docker build -t twitter-sentiment-analysis:latest .
docker run -p 5000:5000 --env-file .env twitter-sentiment-analysis:latest
```

## Support

For issues or questions, refer to the detailed [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) guide.
