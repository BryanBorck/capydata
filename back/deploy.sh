#!/bin/bash

# Datagotchi Backend Deployment Script for GCP Cloud Run
# This script builds and deploys the FastAPI backend to Google Cloud Run

set -e  # Exit on any error

# Configuration variables
PROJECT_ID="zap-mas-451218"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/datagotchi-backend"

# Default to staging environment
ENVIRONMENT=${1:-"staging"}

if [ "$ENVIRONMENT" = "staging" ]; then
    SERVICE_NAME="datagotchi-backend-staging"
    APP_ENV="development"
    MEMORY="1Gi"
    CPU="1"
    MAX_INSTANCES="5"
    MIN_INSTANCES="0"
elif [ "$ENVIRONMENT" = "production" ]; then
    SERVICE_NAME="datagotchi-backend-prod"
    APP_ENV="production"
    MEMORY="2Gi"
    CPU="2"
    MAX_INSTANCES="10"
    MIN_INSTANCES="1"
else
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment of Datagotchi Backend to GCP Cloud Run${NC}"
echo -e "${BLUE}📋 Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}🔧 Service Name: $SERVICE_NAME${NC}"
echo -e "${BLUE}🌍 Region: $REGION${NC}"
echo -e "${BLUE}📦 Project ID: $PROJECT_ID${NC}"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Set the project
echo -e "${GREEN}🔧 Setting GCP project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${GREEN}🔌 Enabling required GCP APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Generate timestamp for image tag
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TAGGED_IMAGE_NAME="$IMAGE_NAME:$TIMESTAMP"

# Build the Docker image
echo -e "${GREEN}🏗️  Building Docker image...${NC}"
docker build -t $TAGGED_IMAGE_NAME .

# Push the image to Google Container Registry
echo -e "${GREEN}📤 Pushing image to Google Container Registry...${NC}"
docker push $TAGGED_IMAGE_NAME

# Deploy to Cloud Run
echo -e "${GREEN}🚀 Deploying to Cloud Run ($ENVIRONMENT)...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image=$TAGGED_IMAGE_NAME \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --port=8080 \
    --memory=$MEMORY \
    --cpu=$CPU \
    --max-instances=$MAX_INSTANCES \
    --min-instances=$MIN_INSTANCES \
    --timeout=300 \
    --set-env-vars="ENVIRONMENT=$ENVIRONMENT,APP_ENV=$APP_ENV"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --platform=managed --region=$REGION --format="value(status.url)")

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo -e "${GREEN}📊 Health Check: $SERVICE_URL/health${NC}"
echo -e "${GREEN}📖 API Docs: $SERVICE_URL/docs${NC}"

# Test the deployment
echo -e "${GREEN}🧪 Testing deployment...${NC}"
if curl -f -s "$SERVICE_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed. Please check the logs.${NC}"
    echo -e "${YELLOW}💡 You can check logs with: gcloud run logs tail $SERVICE_NAME --region=$REGION${NC}"
fi

echo -e "${GREEN}🎉 Deployment script completed!${NC}"
echo -e "${BLUE}📝 Note: Remember to set your Supabase environment variables:${NC}"
if [ "$ENVIRONMENT" = "staging" ]; then
    echo -e "${YELLOW}   - SUPABASE_URL (for development)${NC}"
    echo -e "${YELLOW}   - SUPABASE_KEY (for development)${NC}"
else
    echo -e "${YELLOW}   - SUPABASE_URL_PROD (for production)${NC}"
    echo -e "${YELLOW}   - SUPABASE_KEY_PROD (for production)${NC}"
fi 