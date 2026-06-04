# 📤 Git Setup & Push Guide

## Step 1: Initialize Git (if not already done)

```bash
cd c:\Users\santo\source\ai--assistant-pr1

# Initialize git repository
git init

# Set your git identity
git config user.name "Your Name"
git config user.email "your.email@example.com"

# (Optional) Set globally
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 2: Create .gitignore

```bash
# Create .gitignore file with:
cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.*.local

# Node modules
node_modules/
frontend/node_modules/

# Build outputs
dist/
build/
*.exe
*.app
*.deb
*.dmg

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
venv/
env/
*.egg-info/
.pytest_cache/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Database
*.db
*.sqlite
*.sqlite3

# Temp files
temp/
tmp/
.tmp/

# Secrets
secrets.json
firebase_secrets.py
EOF
```

## Step 3: Add & Commit Files

```bash
# Add all files
git add .

# Verify staged files
git status

# Commit initial commit
git commit -m "Initial commit: AIRIS AI Assistant with all fixes applied

Features:
- 12-layer autonomous AI system
- Voice I/O with TTS/STT
- Trading & market analysis
- Multi-agent VibeCoder
- GitHub Actions CI/CD
- Tauri desktop app support
- Firebase cloud sync

Fixes applied:
- Fixed all import path errors
- Added missing API endpoints
- Fixed frontend API exports
- Added missing dependencies
- Corrected voice system integration"
```

## Step 4: Create Remote Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `ai--assistant-pr1` (or your preferred name)
   - **Description:** "AIRIS - Production-Ready AI Personal Assistant"
   - **Private/Public:** Choose based on preference
   - **Initialize with:** Do NOT check any options (we'll push existing repo)
3. Click "Create repository"

## Step 5: Add Remote & Push

```bash
# Add remote (replace with your actual GitHub repo URL)
git remote add origin https://github.com/yourusername/ai--assistant-pr1.git

# Verify remote
git remote -v

# Create and push to main branch
git branch -M main
git push -u origin main

# This will prompt for your GitHub token if using HTTPS
# Or if using SSH, make sure your SSH key is registered with GitHub
```

## Step 6: Create Tags for Releases

```bash
# Create first release tag
git tag -a v1.0.0 -m "Release v1.0.0 - Initial Production Release"

# Push tags to GitHub
git push origin v1.0.0

# Or push all tags:
git push origin --tags
```

## Step 7: Enable GitHub Actions

1. Go to your GitHub repository
2. Navigate to **Settings** → **Actions** → **General**
3. Enable "Allow all actions and reusable workflows"
4. Go to **Secrets and variables** → **Actions** → **New repository secret**
5. Add secrets (if deploying):
   - `RENDER_SERVICE_ID`: Your Render service ID
   - `RENDER_DEPLOY_KEY`: Your Render deploy key
   - `NETLIFY_AUTH_TOKEN`: Your Netlify token
   - `NETLIFY_SITE_ID`: Your Netlify site ID
   - `DOCKER_USERNAME`: Docker Hub username
   - `DOCKER_PASSWORD`: Docker Hub password token

## Step 8: Configure GitHub Pages (Optional)

1. Go to **Settings** → **Pages**
2. Set source to **GitHub Actions** or **Branch: main /root**
3. Your documentation will be deployed automatically

## Troubleshooting Git Commands

### Authentication Issues
```bash
# If using HTTPS, generate Personal Access Token:
# 1. Go to https://github.com/settings/tokens
# 2. Generate new token with 'repo' scope
# 3. Use token as password when pushed

# If using SSH:
ssh-keygen -t ed25519 -C "your_email@example.com"
# Add public key to https://github.com/settings/keys
```

### Commit History Issues
```bash
# See commit history
git log --oneline

# Amend last commit (before push)
git commit --amend

# Revert last commit (before push)
git reset --soft HEAD~1
```

### Branch Management
```bash
# Create feature branch
git checkout -b feature/new-feature

# Switch branch
git checkout main

# Delete local branch
git branch -d feature/new-feature

# Push feature branch
git push origin feature/new-feature
```

## GitHub Actions Workflows

After pushing, GitHub will automatically run workflows defined in `.github/workflows/`:

### 1. **build-and-release.yml** (Desktop App Builds)
- Builds Windows, macOS, Linux installers
- Creates releases
- Uploads to artifact storage

### 2. **test-quality.yml** (Testing)
- Runs Python tests
- Runs JavaScript tests
- Security scanning

### 3. **deploy.yml** (Deployment)
- Deploys to Render (backend)
- Deploys to Netlify (frontend)
- Publishes Docker images
- Creates GitHub releases

## Setting up Secrets for CI/CD

You'll need to add these secrets for full automation:

```bash
# Render
RENDER_SERVICE_ID=srv_xxxxx
RENDER_DEPLOY_KEY=xxxxx

# Netlify
NETLIFY_AUTH_TOKEN=xxxxx
NETLIFY_SITE_ID=xxxxx

# Docker Hub
DOCKER_USERNAME=yourusername
DOCKER_PASSWORD=dckr_pat_xxxxx
```

To add:
1. Go to GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret

## Creating Issues & Pull Requests

### Create a PR for a new feature:
```bash
# Create feature branch
git checkout -b feature/my-awesome-feature

# Make changes...
git add .
git commit -m "Add awesome feature"
git push origin feature/my-awesome-feature

# Go to GitHub and create PR
```

### Label issues for organization:
- `bug` - Something isn't working
- `feature` - New functionality
- `enhancement` - Improvement
- `documentation` - Doc updates
- `good first issue` - For newcomers

## Release Process

```bash
# When ready for release:
git tag -a v1.0.1 -m "Release v1.0.1 - Bug fixes"
git push origin v1.0.1

# GitHub Actions will automatically:
# 1. Build desktop apps
# 2. Create release
# 3. Upload artifacts
# 4. Deploy to cloud
```

---

**Next Steps:**
1. Execute steps 1-5 above
2. Go to GitHub repository settings
3. Enable branch protection for `main`
4. Set up required status checks for CI/CD
5. Monitor workflows under Actions tab

**Support:**
- Git docs: https://git-scm.com/doc
- GitHub docs: https://docs.github.com
