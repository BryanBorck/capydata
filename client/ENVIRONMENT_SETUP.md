# Environment-Specific Supabase Configuration

This project supports multiple Supabase databases for different environments (development and production) using the `NODE_APP_ENV` environment variable.

## Configuration

### Environment Variables

Create a `.env.local` file in the `client` directory with the following structure:

```bash
# Environment Configuration
# Set to 'development' or 'production' to switch between databases
NODE_APP_ENV=development

# Development Environment Supabase (local or dev cloud)
NEXT_PUBLIC_SUPABASE_URL_DEV=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=your-local-supabase-anon-key

# Production Environment Supabase
NEXT_PUBLIC_SUPABASE_URL_PROD=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=your-production-supabase-anon-key

# Legacy fallback (still supported if the specific environment vars aren't set)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-default-supabase-anon-key

# App Environment (for features like test mode)
NEXT_PUBLIC_APP_ENV=development

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## How It Works

1. **Environment Detection**: The system checks the `NODE_APP_ENV` variable
2. **Database Selection**: Based on the environment, it selects the appropriate Supabase configuration
3. **Fallback Support**: If environment-specific variables aren't set, it falls back to the legacy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Setting Up Production Database

### 1. Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/sign in
3. Create a new project for production
4. Wait for it to be provisioned (2-3 minutes)

### 2. Get Production Credentials

1. Go to Settings > API in your production project
2. Copy your Project URL and anon public key
3. Add them to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL_PROD=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=your-production-anon-key
```

### 3. Apply Database Schema to Production

1. Go to the SQL Editor in your production Supabase dashboard
2. Copy and paste the content from `supabase/migrations/20240101000000_initial_schema.sql`
3. Run the script to create the database schema

### 4. Switch to Production

Set the environment variable to use production database:

```bash
NODE_APP_ENV=production
```

## Environment Switching

### Development Mode (Default)
```bash
NODE_APP_ENV=development
```
- Uses local Supabase or development cloud instance
- Safer for testing and development

### Production Mode
```bash
NODE_APP_ENV=production
```
- Uses production Supabase instance
- For live deployment

## Deployment Configuration

### Development Deployment
```bash
NODE_APP_ENV=development
NEXT_PUBLIC_SUPABASE_URL_DEV=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV=your-dev-anon-key
```

### Production Deployment
```bash
NODE_APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL_PROD=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD=your-production-anon-key
```

## Benefits

1. **Environment Separation**: Keep development and production data completely separate
2. **Easy Switching**: Change databases with a single environment variable
3. **Backward Compatibility**: Existing setups continue to work with fallback variables
4. **Deployment Safety**: Avoid accidentally using development database in production

## Troubleshooting

### Missing Configuration Error
If you see an error about missing Supabase configuration:

1. Check that you have the correct environment variables set
2. Verify that `NODE_APP_ENV` is set to either `development` or `production`
3. Ensure the corresponding `_DEV` or `_PROD` variables are defined

### Connection Issues
1. Verify your Supabase project URLs and keys are correct
2. Check that your production Supabase project has the correct schema applied
3. Ensure your development environment (local Supabase) is running

### Database Schema Issues
Make sure both your development and production databases have the same schema:
- Apply all migrations from `supabase/migrations/` to both environments
- Use Supabase CLI for local development: `supabase db reset`
- Use SQL Editor for production database schema setup 