# CodesRock Backend - Render Deployment Guide

## Prerequisites
- GitHub account
- Render.com account (free tier available)
- MongoDB Atlas connection string (already configured)
- Cloudinary credentials (already configured)

## Step 1: Create GitHub Repository

1. Go to GitHub and create a new repository:
   - Name: `codesrock-backend`
   - Visibility: Private or Public (your choice)
   - **Do NOT** initialize with README, .gitignore, or license

2. Copy the repository URL (it will look like):
   ```
   https://github.com/[your-username]/codesrock-backend.git
   ```

## Step 2: Push Code to GitHub

Run these commands in your terminal (from the codesrock-backend directory):

```bash
# Add GitHub remote
git remote add origin https://github.com/[your-username]/codesrock-backend.git

# Push to GitHub
git push -u origin main
```

## Step 3: Deploy on Render

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select the `codesrock-backend` repository
5. Configure the service:
   - **Name**: `codesrock-api` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

## Step 4: Add Environment Variables

In the Render dashboard, scroll down to "Environment Variables" and add:

| Key | Value | Note |
|-----|-------|------|
| `NODE_ENV` | `production` | Already in render.yaml |
| `MONGODB_URI` | Your MongoDB Atlas connection string | From your .env file |
| `JWT_SECRET` | Generate a secure random string | For production security |
| `FRONTEND_URL` | Your frontend URL | Will update after frontend deployment |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | From your .env file |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | From your .env file |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | From your .env file |

### Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build the TypeScript code
   - Start the server
3. Wait ~10 minutes for the initial deployment

## Step 6: Get Your API URL

After deployment completes, you'll receive a URL like:
```
https://codesrock-api.onrender.com
```

## Step 7: Test Your Deployment

Test if the API is working:
```bash
curl https://codesrock-api.onrender.com/api/auth/health
```

Or visit in your browser:
```
https://codesrock-api.onrender.com/api/auth/health
```

## Step 8: Update Frontend Configuration

Update your frontend to use the new API URL:
- Update the API base URL in your frontend config to point to your Render URL

## Important Notes

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- 750 hours/month free (enough for one service running 24/7)

### MongoDB Atlas IP Whitelist
- Render uses dynamic IPs
- In MongoDB Atlas, whitelist `0.0.0.0/0` (allow from anywhere) for Render deployments
- Or use MongoDB Atlas's "Add Current IP Address" for each deployment IP

### Automatic Deployments
- Render automatically deploys when you push to the `main` branch
- View deployment logs in the Render dashboard

### Environment Variables
- Never commit .env file to GitHub
- All sensitive data should be in Render environment variables

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Ensure all TypeScript compiles without errors locally: `npm run build`

### Server Won't Start
- Check environment variables are set correctly
- Review server logs in Render dashboard
- Ensure MongoDB connection string is correct

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes Render's IPs
- Check MongoDB connection string is correct
- Ensure database user has proper permissions

## Updating Your Deployment

To deploy changes:
```bash
git add .
git commit -m "Your change description"
git push origin main
```

Render will automatically deploy the changes.

## Support

- Render Docs: https://render.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- GitHub Issues: Create issues in your repository
