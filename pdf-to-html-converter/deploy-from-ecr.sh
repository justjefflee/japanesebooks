#!/bin/bash

# Deploy from ECR to EC2
# Run this script on your EC2 instance

set -e

ECR_REGISTRY="380247287206.dkr.ecr.us-east-1.amazonaws.com"
ECR_REPOSITORY="justjefflee/japanesebooks"
IMAGE_TAG="${1:-latest}"

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

echo "⬇️  Pulling latest image from ECR..."
docker compose pull

echo "🚀 Starting containers..."
docker compose up -d

echo "✅ Deployment complete!"
echo ""
echo "Check status:"
echo "  docker compose ps"
echo "  docker compose logs -f"
echo ""
echo "Health check:"
echo "  curl http://localhost:3001/api/health"
