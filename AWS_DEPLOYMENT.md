# AWS Deployment Guide for Twitter Sentiment Analysis App

## Prerequisites
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker installed locally
- Twitter API credentials (Bearer Token, Consumer Key, Consumer Secret, Access Token, Access Token Secret)

## Deployment Options

### Option 1: AWS Elastic Beanstalk (Recommended for simplicity)

#### Step 1: Build and Push Docker Image
```bash
# Build Docker image locally
docker build -t twitter-sentiment-analysis:latest .

# Tag for ECR (replace with your ECR repository)
docker tag twitter-sentiment-analysis:latest <your-account-id>.dkr.ecr.<region>.amazonaws.com/twitter-sentiment-analysis:latest

# Login to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.<region>.amazonaws.com

# Push to ECR
docker push <your-account-id>.dkr.ecr.<region>.amazonaws.com/twitter-sentiment-analysis:latest
```

#### Step 2: Create Elastic Beanstalk Application
```bash
# Initialize Elastic Beanstalk
eb init -p docker -r <region> twitter-sentiment-app

# Create environment
eb create production-env
```

#### Step 3: Configure Environment Variables
```bash
# Set environment variables
eb setenv PORT=5000
eb setenv TWITTER_BEARER_TOKEN=your_bearer_token
eb setenv TWITTER_CONSUMER_KEY=your_consumer_key
eb setenv TWITTER_CONSUMER_SECRET=your_consumer_secret
eb setenv TWITTER_ACCESS_TOKEN=your_access_token
eb setenv TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret
```

#### Step 4: Deploy
```bash
# Deploy application
eb deploy
```

### Option 2: AWS App Runner (Simplest for containerized apps)

#### Step 1: Push to ECR
Same as Option 1, Step 1.

#### Step 2: Create App Runner Service
1. Go to AWS Console → App Runner
2. Create service
3. Select "Container registry" → "Amazon ECR"
4. Choose your image
5. Configure environment variables
6. Deploy

### Option 3: AWS ECS + Fargate (More control)

#### Step 1: Create ECR Repository
```bash
aws ecr create-repository --repository-name twitter-sentiment-analysis
```

#### Step 2: Push Image (same as Option 1)

#### Step 3: Create ECS Task Definition
Create a task definition JSON file referencing your ECR image.

#### Step 4: Create ECS Service
```bash
aws ecs create-service --cluster twitter-sentiment-cluster --service-name twitter-sentiment-service --task-definition twitter-sentiment-task --desired-count 1 --launch-type FARGATE
```

## Local Testing Before Deployment

```bash
# Build Docker image
docker build -t twitter-sentiment-analysis:latest .

# Run container locally
docker run -p 5000:5000 \
  -e TWITTER_BEARER_TOKEN=your_token \
  -e TWITTER_CONSUMER_KEY=your_key \
  -e TWITTER_CONSUMER_SECRET=your_secret \
  -e TWITTER_ACCESS_TOKEN=your_access_token \
  -e TWITTER_ACCESS_TOKEN_SECRET=your_access_secret \
  twitter-sentiment-analysis:latest

# Test the application
curl http://localhost:5000
```

## Environment Variables

Required environment variables:
- `PORT` - Application port (default: 5000)
- `TWITTER_BEARER_TOKEN` - Twitter API Bearer Token
- `TWITTER_CONSUMER_KEY` - Twitter API Consumer Key
- `TWITTER_CONSUMER_SECRET` - Twitter API Consumer Secret
- `TWITTER_ACCESS_TOKEN` - Twitter API Access Token
- `TWITTER_ACCESS_TOKEN_SECRET` - Twitter API Access Token Secret

## Troubleshooting

### Docker Build Issues
- Ensure Docker daemon is running
- Check Dockerfile syntax
- Verify all dependencies are in package.json

### AWS Deployment Issues
- Check AWS CLI credentials: `aws configure list`
- Verify IAM permissions for ECR, Elastic Beanstalk/ECS
- Check CloudWatch logs for application errors

### Application Issues
- Verify environment variables are set correctly
- Check Twitter API credentials are valid
- Review application logs in CloudWatch

## Cost Estimation

- Elastic Beanstalk: ~$20-50/month (t2.micro/t3.small)
- App Runner: ~$25-60/month (based on CPU/memory usage)
- ECS Fargate: ~$30-70/month (based on vCPU/memory)

## Security Notes

- Never commit `.env` file with real credentials
- Use AWS Secrets Manager for sensitive data in production
- Enable HTTPS with AWS Certificate Manager
- Configure security groups to restrict access
- Regularly update dependencies

## Monitoring

- Enable CloudWatch logs
- Set up CloudWatch alarms for CPU/memory usage
- Monitor application health checks
- Track Twitter API rate limits
