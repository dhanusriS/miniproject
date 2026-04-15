#!/bin/bash

# AWS Deployment Script for Twitter Sentiment Analysis App
set -e

# Configuration
APP_NAME="twitter-sentiment-analysis"
AWS_REGION="${AWS_REGION:-us-east-1}"
ECR_REPO="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}.dkr.ecr.${AWS_REGION}.amazonaws.com/${APP_NAME}"

echo "🚀 Starting deployment of ${APP_NAME}..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed. Aborting." >&2; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Aborting." >&2; exit 1; }

# Build Docker image
echo "📦 Building Docker image..."
docker build -t ${APP_NAME}:latest .

# Create ECR repository if it doesn't exist
echo "🔍 Checking ECR repository..."
if ! aws ecr describe-repositories --repository-names ${APP_NAME} --region ${AWS_REGION} >/dev/null 2>&1; then
    echo "📝 Creating ECR repository..."
    aws ecr create-repository --repository-name ${APP_NAME} --region ${AWS_REGION}
fi

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text)}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Tag image for ECR
echo "🏷️  Tagging image for ECR..."
docker tag ${APP_NAME}:latest ${ECR_REPO}:latest

# Push to ECR
echo "⬆️  Pushing image to ECR..."
docker push ${ECR_REPO}:latest

echo "✅ Docker image pushed to ECR successfully!"
echo "📍 Image URI: ${ECR_REPO}:latest"
echo ""
echo "Next steps:"
echo "1. Deploy using Elastic Beanstalk: eb deploy"
echo "2. Or create App Runner service using: ${ECR_REPO}:latest"
echo "3. Or update ECS task definition with new image URI"
