# Datagotchi Backend - GCP Deployment Guide

This guide covers deploying the Datagotchi FastAPI backend to Google Cloud Platform using Cloud Run with proper staging and production environment separation.

## 🏗️ Architecture Overview

The backend is deployed as a containerized service on Google Cloud Run with:

- **Staging Environment**: `datagotchi-backend-staging` (uses development Supabase)
- **Production Environment**: `datagotchi-backend-prod` (uses production Supabase)
- Automatic scaling from 0 to multiple instances
- Pay-per-use pricing model
- Built-in HTTPS and custom domains
- Environment-specific configuration

**Project ID**: `zap-mas-451218`

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Google Cloud Account**: Active GCP account with billing enabled
2. **Access to Project**: `zap-mas-451218`
3. **Google Cloud CLI**: Install from [cloud.google.com/sdk](https://cloud.google.com/sdk)
4. **Docker**: Install from [docker.com](https://docker.com) (for local deployment)

### Initial Setup

1. **Authenticate with GCP**:

   ```bash
   gcloud auth login
   gcloud auth configure-docker
   ```

2. **Set the project**:
   ```bash
   gcloud config set project zap-mas-451218
   ```

## 🚀 Deployment Options

### Option 1: Cloud Build (Recommended for GCP Platform)

Deploy directly from the GCP Console using Cloud Build:

#### For Staging (Development Supabase):

1. Go to **Cloud Build** in GCP Console
2. Click **"Run"**
3. Select **"Repository"** and connect your repository
4. Use build config file: `back/cloudbuild-staging.yaml`
5. Set environment variables in Cloud Run after deployment

#### For Production (Production Supabase):

1. Go to **Cloud Build** in GCP Console
2. Click **"Run"**
3. Select **"Repository"** and connect your repository
4. Use build config file: `back/cloudbuild-production.yaml`
5. Set environment variables in Cloud Run after deployment

### Option 2: Automated CI/CD Triggers

Set up automatic deployments:

1. **Go to Cloud Build > Triggers**
2. **Create Staging Trigger**:
   - Name: `datagotchi-staging-deploy`
   - Event: Push to any branch (or specific branches)
   - Configuration: `back/cloudbuild-staging.yaml`
3. **Create Production Trigger**:
   - Name: `datagotchi-production-deploy`
   - Event: Push to `main` branch only
   - Configuration: `back/cloudbuild-production.yaml`

### Option 3: Local Deployment Script

Use the deployment script from your local machine:

```bash
cd back

# Deploy to staging
./deploy.sh staging

# Deploy to production
./deploy.sh production
```

## 🔧 Environment Configuration

### Environment Variables

The application uses different configurations based on `APP_ENV`:

| Variable            | Staging (APP_ENV=development) | Production (APP_ENV=production) | Required |
| ------------------- | ----------------------------- | ------------------------------- | -------- |
| `ENVIRONMENT`       | `staging`                     | `production`                    | No       |
| `APP_ENV`           | `development`                 | `production`                    | Yes      |
| `PORT`              | `8080`                        | `8080`                          | No       |
| `NOTTE_API_KEY`     | Your development key          | Your production key             | Yes\*    |
| `SUPABASE_URL`      | Development Supabase URL      | Not used                        | Yes      |
| `SUPABASE_KEY`      | Development Supabase key      | Not used                        | Yes      |
| `SUPABASE_URL_PROD` | Not used                      | Production Supabase URL         | Yes      |
| `SUPABASE_KEY_PROD` | Not used                      | Production Supabase key         | Yes      |

\*Required if using Notte SDK features

### Setting Environment Variables in Cloud Run

#### Through GCP Console:

1. Go to **Cloud Run** in GCP Console
2. Select your service (`datagotchi-backend-staging` or `datagotchi-backend-prod`)
3. Click **"Edit & Deploy New Revision"**
4. Go to **"Variables & Secrets"** tab
5. Add your environment variables

#### Through Command Line:

**For Staging:**

```bash
gcloud run services update datagotchi-backend-staging \
    --region=us-central1 \
    --set-env-vars="NOTTE_API_KEY=your-dev-key,SUPABASE_URL=your-dev-url,SUPABASE_KEY=your-dev-key"
```

**For Production:**

```bash
gcloud run services update datagotchi-backend-prod \
    --region=us-central1 \
    --set-env-vars="NOTTE_API_KEY=your-prod-key,SUPABASE_URL_PROD=your-prod-url,SUPABASE_KEY_PROD=your-prod-key"
```

## 🌐 Service URLs

After deployment, your services will be available at:

- **Staging**: `https://datagotchi-backend-staging-xxxxx-uc.a.run.app`
- **Production**: `https://datagotchi-backend-prod-xxxxx-uc.a.run.app`

### Endpoints:

- `/` - Welcome message
- `/health` - Health check
- `/docs` - API documentation (if enabled)
- `/api/v1/*` - Your API routes

## 📊 Monitoring and Maintenance

### View Logs

```bash
# Staging logs
gcloud run logs tail datagotchi-backend-staging --region=us-central1

# Production logs
gcloud run logs tail datagotchi-backend-prod --region=us-central1
```

### Check Service Status

```bash
# Staging status
gcloud run services describe datagotchi-backend-staging --region=us-central1

# Production status
gcloud run services describe datagotchi-backend-prod --region=us-central1
```

### Resource Allocation

| Environment | Memory | CPU | Max Instances | Min Instances |
| ----------- | ------ | --- | ------------- | ------------- |
| Staging     | 1Gi    | 1   | 5             | 0             |
| Production  | 2Gi    | 2   | 10            | 1             |

## 🔒 Security & Best Practices

### Secrets Management

For sensitive data, use Google Secret Manager:

```bash
# Create secrets
gcloud secrets create notte-api-key-dev --data-file=dev-key.txt
gcloud secrets create notte-api-key-prod --data-file=prod-key.txt
gcloud secrets create supabase-key-dev --data-file=dev-supabase-key.txt
gcloud secrets create supabase-key-prod --data-file=prod-supabase-key.txt

# Use in Cloud Run (update deployment configuration)
```

### Environment Separation

- **Staging**: Uses development Supabase instance for testing
- **Production**: Uses production Supabase instance for live data
- Different resource allocations and scaling policies
- Separate monitoring and logging

## 💰 Cost Optimization

- **Staging**: 0 min instances (scales to zero when not in use)
- **Production**: 1 min instance (always available for instant response)
- Automatic scaling based on traffic
- Pay only for what you use

## 🔧 Troubleshooting

### Common Issues

1. **Environment Variables**: Ensure correct Supabase variables are set for each environment
2. **Image Build Fails**: Check Dockerfile and dependencies
3. **Service Not Responding**: Verify environment variables and check logs
4. **Wrong Supabase Instance**: Check `APP_ENV` variable is set correctly

### Useful Commands

```bash
# Get service URLs
gcloud run services describe datagotchi-backend-staging --region=us-central1 --format="value(status.url)"
gcloud run services describe datagotchi-backend-prod --region=us-central1 --format="value(status.url)"

# Check environment variables
gcloud run services describe datagotchi-backend-staging --region=us-central1 --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)"
```

## 🚀 Quick Start Checklist

1. ✅ Set up your Supabase development and production instances
2. ✅ Get your Notte API keys for dev and prod
3. ✅ Deploy to staging using Cloud Build or deployment script
4. ✅ Set staging environment variables (dev Supabase)
5. ✅ Test staging deployment
6. ✅ Deploy to production (from main branch)
7. ✅ Set production environment variables (prod Supabase)
8. ✅ Test production deployment

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud Build Documentation](https://cloud.google.com/build/docs)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)

Your backend is now ready for professional deployment on GCP! 🎉
