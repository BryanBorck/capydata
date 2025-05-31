# Cloud Build Trigger Setup Guide

## Setting up Cloud Build Triggers for Datagotchi

### 📍 Creating a Production Trigger

1. **Go to Cloud Build → Triggers** in GCP Console

2. **Click "Create Trigger"**

3. **Configure the trigger**:

   **Name**: `datagotchi-production-deploy`

   **Event**: Push to a branch

   **Source**:

   - Repository: Select your connected repository
   - Branch: `^main$` (to match only main branch)

   **Build Configuration**:

   ⚠️ **IMPORTANT**: Under **Build Type**, you need to select:

   ```
   ○ Dockerfile
   ● Cloud Build configuration file (yaml or json)  ← SELECT THIS ONE
   ○ Buildpack
   ```

   **Configuration file location**: `/cloudbuild-production.yaml`

   (Note: The path starts with `/` because it's at the repository root)

### 📍 Creating a Staging Trigger

Follow the same steps but:

- **Name**: `datagotchi-staging-deploy`
- **Branch**: `.*` (to match all branches) or specific branch pattern
- **Configuration file location**: `/cloudbuild-staging.yaml`

## 🚨 Common Issues

### "I don't see the yaml option"

Make sure you're selecting **"Cloud Build configuration file (yaml or json)"** as the Build Type, NOT "Dockerfile".

### "File not found"

- Use `/cloudbuild-production.yaml` (with leading slash)
- NOT `cloudbuild-production.yaml`
- NOT `back/cloudbuild-production.yaml`

## 🎯 Manual Deployment (Alternative)

If you prefer to run builds manually instead of triggers:

1. Go to **Cloud Build → History**
2. Click **"Run"** (blue button)
3. Select **"Run using a build config file"**
4. Browse and select `cloudbuild-production.yaml` or `cloudbuild-staging.yaml`
5. Click **"Run"**

This way you don't need to set up triggers at all!
