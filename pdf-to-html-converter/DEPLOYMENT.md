# Docker Deployment Guide for EC2

This guide will help you deploy the PDF to HTML Converter on your Amazon Linux 2023 EC2 instance using Docker.

## Prerequisites

- EC2 instance running Amazon Linux 2023
- Security Group with ports 80 and 443 open
- (Optional) Domain name pointing to your EC2 instance

## Step 1: Initial EC2 Setup

SSH into your EC2 instance and run the deployment script:
ssh -i ~/Downloads/JeffKeyPair.pem ec2-user@ec2-98-92-18-46.compute-1.amazonaws.com
scp -i ~/Downloads/JeffKeyPair.pem deploy-ec2.sh ec2-user@ec2-98-92-18-46.compute-1.amazonaws.com:~

| Type       | Protocol | Port Range | Source                                       |
| ---------- | -------- | ---------- | -------------------------------------------- |
| HTTP       | TCP      | 80         | 0.0.0.0/0                                    |
| HTTPS      | TCP      | 443        | 0.0.0.0/0                                    |
| Custom TCP | TCP      | 3001       | 0.0.0.0/0 (optional - for direct API access) |

```bash
# Upload the deployment script
scp -i your-key.pem deploy-ec2.sh ec2-user@your-ec2-ip:~

# SSH into the instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Run the setup script
bash deploy-ec2.sh

# Log out and log back in for docker group to take effect
exit
ssh -i your-key.pem ec2-user@your-ec2-ip
```

## Step 2: Upload Your Application

From your local machine, upload the entire project:

```bash
# Create a zip of your project (excluding node_modules)
cd /Users/jefflee/dev/japanesebooks
tar -czf pdf-converter.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='converted/*.html' \
  pdf-to-html-converter/

# Upload to EC2
scp -i your-key.pem pdf-converter.tar.gz ec2-user@your-ec2-ip:~

# On EC2, extract
ssh -i your-key.pem ec2-user@your-ec2-ip
tar -xzf pdf-converter.tar.gz
cd pdf-to-html-converter
```

## Step 3: Deploy with Docker Compose

```bash
# Build and start the containers
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check status
docker-compose ps
```

Your app should now be running at `http://your-ec2-ip`

## Step 4: Set Up SSL (Optional but Recommended)

If you have a domain name:

1. Update `nginx.conf` - replace `your-domain.com` with your actual domain
2. Install Certbot in the nginx container:

```bash
# Get SSL certificate
docker-compose run --rm certbot certonly \
  --webroot \
  --webroot-path /var/www/certbot \
  -d your-domain.com \
  --email your-email@example.com \
  --agree-tos

# Uncomment HTTPS section in nginx.conf
nano nginx.conf
# Uncomment the HTTPS server block and update domain name

# Restart nginx
docker-compose restart nginx
```

3. Set up auto-renewal:

```bash
# Add to crontab
crontab -e

# Add this line:
0 3 * * * cd /home/ec2-user/pdf-to-html-converter && docker-compose run --rm certbot renew && docker-compose restart nginx
```

## Useful Docker Commands

```bash
# View logs
docker-compose logs -f app
docker-compose logs -f nginx

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# View running containers
docker-compose ps

# Access app shell
docker-compose exec app sh

# View app health
curl http://localhost:3001/api/health
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 80/3001
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :3001

# Stop conflicting services
sudo systemctl stop nginx  # if nginx is running outside Docker
```

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Check if ports are available
sudo lsof -i :3001
sudo lsof -i :80
```

### PDF Conversion Failing

```bash
# Check container resources
docker stats

# Might need to increase EC2 instance size if memory is low
```

## Monitoring

### Check Health

```bash
curl http://localhost:3001/api/health
```

### Check Disk Space

```bash
df -h
du -sh /home/ec2-user/pdf-to-html-converter/converted
```

### View Resource Usage

```bash
docker stats
```

## Backups

Backup your converted files and metadata:

```bash
# On EC2
cd /home/ec2-user/pdf-to-html-converter
tar -czf backup-$(date +%Y%m%d).tar.gz converted/

# Download to local machine
scp -i your-key.pem ec2-user@your-ec2-ip:~/pdf-to-html-converter/backup-*.tar.gz ./
```

## Updates

To update the application:

```bash
# On local machine: push changes to git
git push

# On EC2
cd /home/ec2-user/pdf-to-html-converter
git pull
docker-compose up -d --build
```
