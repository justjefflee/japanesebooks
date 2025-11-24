#!/bin/bash

# Build and push Docker image to ECR
# Run this script from your local machine

set -e

ECR_REGISTRY="380247287206.dkr.ecr.us-east-1.amazonaws.com"
ECR_REPOSITORY="justjefflee/japanesebooks"
IMAGE_TAG="${1:-latest}"

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

echo "🏗️  Building Docker image..."
docker build -t pdf-to-html-converter:$IMAGE_TAG .

echo "🏷️  Tagging image for ECR..."
docker tag pdf-to-html-converter:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

echo "⬆️  Pushing to ECR..."
docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG

echo "✅ Successfully pushed $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"
echo ""
echo "To deploy on EC2:"
echo "  ssh -i ~/Downloads/JeffKeyPair.pem ec2-user@ec2-98-92-18-46.compute-1.amazonaws.com"
echo "  cd pdf-to-html-converter"
echo "  docker compose pull"
echo "  docker compose up -d"
