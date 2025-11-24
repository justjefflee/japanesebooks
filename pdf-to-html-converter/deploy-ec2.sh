#!/bin/bash

# PDF to HTML Converter - EC2 Deployment Script
# Run this on your Amazon Linux 2023 EC2 instance

set -e

echo "🚀 Starting deployment..."

# 1. Update system
echo "📦 Updating system packages..."
sudo dnf update -y

# 2. Install Docker (latest version from official repo)
echo "🐳 Installing Docker..."

# Remove old Docker if exists
sudo dnf remove docker docker-engine docker.io containerd runc -y 2>/dev/null || true

# Install required packages
sudo dnf install -y dnf-plugins-core

# Add Docker's official repository
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group
sudo usermod -aG docker ec2-user

# 3. Verify Docker Compose plugin is installed
echo "✅ Docker Compose plugin installed"

# 4. Install AWS CLI for ECR authentication
echo "📦 Installing AWS CLI..."
sudo dnf install -y aws-cli

echo "✅ System setup complete!"
echo ""
echo "⚠️  IMPORTANT: Configure your EC2 Security Group"
echo "Make sure the following ports are open in your AWS Security Group:"
echo "  - Port 80 (HTTP)"
echo "  - Port 443 (HTTPS)"
echo ""
echo "⚠️  IMPORTANT: Configure IAM Role for ECR Access"
echo "Attach an IAM role to your EC2 instance with AmazonEC2ContainerRegistryReadOnly policy"
echo "Or configure AWS credentials with: aws configure"
echo ""
echo "Next steps:"
echo "1. Configure AWS credentials (if not using IAM role)"
echo "2. Log out and log back in (for docker group to take effect)"
echo "3. Upload docker-compose.yml to the instance"
echo "4. Login to ECR: aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 380247287206.dkr.ecr.us-east-1.amazonaws.com"
echo "5. Deploy: docker compose pull && docker compose up -d"
echo ""
echo "Note: Use 'docker compose' (with space) not 'docker-compose'"
echo ""
echo "Optional - Set up SSL with Let's Encrypt:"
echo "1. Update nginx.conf with your domain name"
echo "2. Run: docker-compose run --rm certbot certonly --webroot --webroot-path /var/www/certbot -d your-domain.com"
echo "3. Uncomment HTTPS section in nginx.conf"
echo "4. Run: docker-compose restart nginx"
