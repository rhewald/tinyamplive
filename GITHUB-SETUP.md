# GitHub Setup for TinyAmp Development

## Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in to your account
2. **Click the "+" button** in the top right → "New repository"
3. **Repository name**: `tinyamp`
4. **Description**: `Independent music discovery platform for San Francisco`
5. **Set to Public** (or Private if you prefer)
6. **Don't initialize** with README (we already have files)
7. **Click "Create repository"**

## Step 2: Connect Your Replit Project to GitHub

In your Replit workspace:

1. **Open the Shell tab** in Replit
2. **Run these commands** (replace `your-username` with your GitHub username):

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your current project state
git commit -m "Initial TinyAmp project setup with Cursor IDE integration"

# Add your GitHub repository as origin
git remote add origin https://github.com/your-username/tinyamp.git

# Push to GitHub
git push -u origin main
```

## Step 3: Clone to Your Local Machine

On your local computer:

```bash
# Clone the repository
git clone https://github.com/your-username/tinyamp.git
cd tinyamp

# Install dependencies
npm install

# Create your local .env file (copy from REPLIT_ENV_VARS below)
```

## Step 4: Set Up Local Environment

Create `.env` file with these values:

```
DATABASE_URL=postgresql://neondb_owner:m6Qps8vhOk2W@ep-long-tooth-a5y4e3fb.us-east-2.aws.neon.tech/neondb?sslmode=require
GOOGLE_PLACES_API_KEY=AIzaSyB9BlL7kuDRa5NiBfh0Hvt1xi9uYaiRbaE
VITE_GOOGLE_PLACES_API_KEY=AIzaSyB9BlL7kuDRa5NiBfh0Hvt1xi9uYaiRbaE
SPOTIFY_CLIENT_ID=2a3104352bb4486eb715253fea6ea3ee
SPOTIFY_CLIENT_SECRET=d9d3fcd6f44d403cbd0afc822d1079a7
SCRAPINGBEE_API_KEY=RQXDMPPGVK1WA9Q5UHFWBKPAU8LD1K5HZWTYV6JL5ATA5K3QSZLW3D7Z4PQXWKKL7FWEMCHVYAACYCSQ
```

## Step 5: Development Workflow

### Making Changes Locally (Cursor IDE)
```bash
# Start development
npm run dev

# Make your changes in Cursor IDE with AI assistance
# Test your changes locally

# Commit and push to GitHub
git add .
git commit -m "Your change description"
git push origin main
```

### Syncing to Replit
In your Replit Shell:
```bash
# Pull latest changes from GitHub
git pull origin main

# Restart your Replit development server if needed
```

### Syncing from Replit to GitHub
In your Replit Shell:
```bash
# Add and commit changes made in Replit
git add .
git commit -m "Changes made in Replit"
git push origin main
```

## Step 6: Open in Cursor IDE

1. **Open Cursor IDE**
2. **File → Open Folder**
3. **Select your cloned `tinyamp` folder**
4. **Cursor will automatically detect the configuration** (.cursorrules, .vscode settings)
5. **Start coding with AI assistance!**

## Benefits of GitHub Workflow

- ✅ **Version Control**: Track all changes with git history
- ✅ **Backup**: Your code is safely stored on GitHub
- ✅ **Collaboration**: Easy to share and work with others
- ✅ **Deployment**: Connect to hosting services (Vercel, Railway, etc.)
- ✅ **AI Integration**: Full Cursor IDE support with project context
- ✅ **Flexibility**: Work from Replit OR locally as needed

## GitHub Repository Features

Once set up, you can:
- **Create Issues** for bug tracking and feature requests
- **Use Pull Requests** for code reviews
- **Set up GitHub Actions** for automated testing/deployment  
- **Use GitHub Codespaces** for cloud development
- **Share your project** easily with the community

Your TinyAmp project will now have professional version control and be ready for advanced development workflows!