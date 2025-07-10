# 🚀 Render.com Deployment Guide - Serverless Architecture

## Overview
With the new serverless architecture, you only need to deploy the frontend React Native web build. No backend server is required.

## Step 1: Update Your Render Service

### Option A: Modify Existing Service

1. **Go to your Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign in to your account

2. **Select Your Service**
   - Find your existing rehearsal-scheduler service
   - Click on it to open the settings

3. **Update Build Settings**
   - Go to "Settings" tab
   - Update the following:

   **Build Command:**
   ```bash
   npm install && npm run build
   ```

   **Start Command:**
   ```bash
   npx serve -s dist -p $PORT
   ```

   **Root Directory:** 
   ```
   (leave empty or set to root)
   ```

4. **Update Environment Variables**
   - Go to "Environment" tab
   - Add/Update these variables:
   ```
   EXPO_PUBLIC_MONGODB_URI=mongodb+srv://rehearsal-user:123@cluster0.ma5xhcl.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority&appName=Cluster0
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=857657662535-cd6capub87vghupi38g1fcar6hcch7ug.apps.googleusercontent.com
   ```

5. **Remove Backend Variables** (if they exist)
   - Remove any backend-related environment variables
   - Remove `NODE_ENV`, `JWT_SECRET`, `GOOGLE_CLIENT_SECRET`, etc.

### Option B: Create New Static Site Service

1. **Create New Service**
   - Click "New +" in your Render dashboard
   - Select "Static Site"

2. **Connect Repository**
   - Connect your GitHub repository
   - Select the branch (usually `main` or `master`)

3. **Configure Build Settings**
   - **Build Command:**
   ```bash
   npm install && npm run build
   ```
   
   - **Publish Directory:**
   ```
   dist
   ```

4. **Set Environment Variables**
   ```
   EXPO_PUBLIC_MONGODB_URI=mongodb+srv://rehearsal-user:123@cluster0.ma5xhcl.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority&appName=Cluster0
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=857657662535-cd6capub87vghupi38g1fcar6hcch7ug.apps.googleusercontent.com
   ```

## Step 2: Update Your Build Configuration

Create/update your `package.json` build script to ensure it works with Render:

```json
{
  "scripts": {
    "build": "expo export --platform web --output-dir dist --clear",
    "start": "expo start",
    "deploy": "npm run build && echo 'Build complete for deployment'"
  }
}
```

## Step 3: Create a Static Site Configuration

Create a `render.yaml` file in your project root for deployment configuration:

```yaml
services:
  - type: web
    name: rehearsal-scheduler
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    envVars:
      - key: EXPO_PUBLIC_MONGODB_URI
        value: mongodb+srv://rehearsal-user:123@cluster0.ma5xhcl.mongodb.net/rehearsal-scheduler?retryWrites=true&w=majority&appName=Cluster0
      - key: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
        value: 857657662535-cd6capub87vghupi38g1fcar6hcch7ug.apps.googleusercontent.com
```

## Step 4: Deploy

1. **Manual Deploy**
   - Click "Manual Deploy" in your Render dashboard
   - Select the latest commit
   - Click "Deploy"

2. **Auto Deploy** (recommended)
   - Enable "Auto-Deploy" in your service settings
   - Every push to your main branch will trigger a deployment

## Step 5: Verify Deployment

1. **Check Build Logs**
   - Monitor the build process in Render's dashboard
   - Look for any errors in the build logs

2. **Test Your App**
   - Visit your deployed URL
   - Test all functionality:
     - Actor management
     - Scene creation
     - Rehearsal scheduling
     - Profile management

## Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check that all dependencies are in `package.json`
   - Ensure `npm run build` works locally

2. **Environment Variables Not Working**
   - Verify all `EXPO_PUBLIC_` prefixed variables are set
   - Check that the MongoDB URI is correct

3. **Database Connection Issues**
   - Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
   - Check that the connection string is correct

### Build Command Alternatives:

If the default build command doesn't work, try:

```bash
# Option 1: Basic build
npm ci && npm run build

# Option 2: With cache clearing
npm ci && npm run build:web

# Option 3: With explicit output
npm ci && npx expo export --platform web --output-dir dist --clear
```

## Performance Optimization

1. **Enable Compression**
   - Render automatically compresses static files
   - Your React Native web build will be optimized

2. **CDN**
   - Render provides CDN for static files
   - Your app will load faster globally

3. **Caching**
   - Set appropriate cache headers
   - Static assets will be cached by browsers

## Security Notes

1. **Environment Variables**
   - Never commit sensitive data to your repository
   - Use Render's environment variable system

2. **MongoDB Security**
   - Consider restricting IP access in production
   - Use strong passwords for database users

3. **HTTPS**
   - Render provides HTTPS by default
   - Your app will be secure

## Next Steps

1. **Custom Domain** (optional)
   - Add your own domain in Render settings
   - Configure DNS to point to Render

2. **Performance Monitoring**
   - Monitor your app's performance
   - Use Render's analytics

3. **Backup Strategy**
   - Regular MongoDB backups
   - Version control for your code

Your app is now deployed as a serverless static site with direct MongoDB integration! 🎉
