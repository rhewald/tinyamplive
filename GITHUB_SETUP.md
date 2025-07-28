# GitHub Setup Guide for TinyAmp

## Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in to your account
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `tinyamp`
   - **Description**: `San Francisco music discovery platform - discover independent venues, events, and artists`
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. Click "Create repository"

## Step 2: Connect Your Local Project to GitHub

### Option A: Using Git Commands (Recommended)

Open your terminal in the TinyAmp project directory and run:

```bash
# Initialize git repository (if not already done)
git init

# Add all files to git
git add .

# Make your first commit
git commit -m "Initial commit: TinyAmp music discovery platform with Cursor AI and GitHub integration"

# Add your GitHub repository as the remote origin
git remote add origin https://github.com/rhewald/tinyamplive.git

# Push to GitHub
git push -u origin main
```

Your repository is now live at: https://github.com/rhewald/tinyamplive

### Option B: Using GitHub CLI (if you have it installed)

```bash
# Your repository is already created at:
# https://github.com/rhewald/tinyamplive
```

### Option C: Using Replit's Git Integration

1. In Replit, open the Shell tab
2. Run the git commands from Option A above

## Step 3: Set Up Branch Protection (Optional but Recommended)

After pushing to GitHub:

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Branches" in the left sidebar
4. Click "Add rule" next to "Branch protection rules"
5. Set branch name pattern to `main`
6. Enable these options:
   - "Require a pull request before merging"
   - "Require status checks to pass before merging"
   - "Restrict pushes that create files larger than 100 MB"

## Step 4: Configure GitHub Actions

The CI/CD pipeline will automatically run when you push code. To customize it:

1. Go to the "Actions" tab in your repository
2. The workflow file is already set up in `.github/workflows/ci.yml`
3. You may need to add secrets for API keys:
   - Go to Settings > Secrets and variables > Actions
   - Add these secrets:
     - `GOOGLE_PLACES_API_KEY`
     - `SCRAPINGBEE_API_KEY`
     - `DATABASE_URL`

## Step 5: Customize Repository Settings

### Topics and Description
1. Go to your repository main page
2. Click the gear icon next to "About"
3. Add topics: `music`, `san-francisco`, `events`, `venues`, `react`, `typescript`, `nodejs`
4. Add website URL: `https://tinyamp.live`

### Social Preview
1. Go to Settings > General
2. Scroll to "Social preview"
3. Upload an image representing TinyAmp (optional)

## Step 6: Enable Discussions (Optional)

1. Go to Settings > General
2. Scroll to "Features"
3. Check "Discussions"
4. This allows community discussions about features and ideas

## Step 7: Set Up Issue Templates

The issue templates are already configured in `.github/ISSUE_TEMPLATE/`. Users can now:
- Report bugs using the bug report template
- Request features using the feature request template
- Request new venues using the venue request template

## Common Issues and Solutions

### Authentication Error
If you get authentication errors:
```bash
# Use personal access token instead of password
git remote set-url origin https://YOUR_USERNAME:YOUR_TOKEN@github.com/YOUR_USERNAME/tinyamp.git
```

### Large Files Warning
If git warns about large files:
```bash
# Remove large files from tracking
git rm --cached large-file-name
echo "large-file-name" >> .gitignore
git add .gitignore
git commit -m "Remove large files and update gitignore"
```

### Permission Denied
If you get permission denied errors:
```bash
# Check your SSH keys or use HTTPS instead
git remote set-url origin https://github.com/YOUR_USERNAME/tinyamp.git
```

## Next Steps After Setup

1. **Clone to local development**: `git clone https://github.com/rhewald/tinyamplive.git`
2. **Set up Cursor AI**: Open the cloned repository in Cursor IDE
3. **Install dependencies**: `npm install`
4. **Set up environment**: Copy `.env.example` to `.env` and add your API keys
5. **Start contributing**: Create feature branches and submit pull requests

## Useful Git Commands for Ongoing Development

```bash
# Create a new feature branch
git checkout -b feature/new-feature-name

# Add and commit changes
git add .
git commit -m "Add new feature: description"

# Push feature branch
git push origin feature/new-feature-name

# Switch back to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch (or use GitHub PR)
git merge feature/new-feature-name
```

Your TinyAmp repository is now ready for collaborative development with all the professional tooling in place!