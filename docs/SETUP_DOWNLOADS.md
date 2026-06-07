# Setting Up Real Desktop & Mobile Downloads

This guide explains how to trigger the automated builds so users can
download real `.exe` / `.msi` and `.apk` files from GitHub Releases.

## How It Works

Two GitHub Actions workflows build the apps automatically and upload the
files to GitHub Releases. Once a release exists, the download page
links directly to those release files.

## Step 1 — Push to GitHub

The workflows are already in the repo under `.github/workflows/`:

- `build-and-release.yml` — desktop Tauri builds (Windows / macOS / Linux)
- `build-mobile.yml` — Android APK via EAS

Both run on tag push (e.g. `v3.0.0`) and can also be triggered
manually from the Actions tab.

## Step 2 — Set up Expo (for APK builds)

1. Go to <https://expo.dev> and create a free account
2. **Account Settings → Access Tokens** — create a token, copy it
3. In your GitHub repo: **Settings → Secrets and variables → Actions**
4. Add a new secret named `EXPO_TOKEN` with the token value

> The EAS Build free tier gives 30 builds per month — more than enough.

## Step 3 — Trigger the builds

### Option A — Tag-based (recommended)

Push a version tag to trigger both desktop and mobile builds:

```bash
git tag v3.0.0
git push origin v3.0.0
```

### Option B — Manual trigger

1. Go to your GitHub repo → **Actions** tab
2. Click **"Build and Release"** or **"Build Mobile APK"**
3. Click **"Run workflow"** → **"Run workflow"**

## Step 4 — Wait for the builds

- **Desktop builds**: ~10–20 minutes (compiles Rust + bundles app)
- **Mobile APK**: ~10–15 minutes (EAS cloud build)

When done, the artifacts are attached to the GitHub Release.

## What Gets Built

Desktop bundle (`frontend/src-tauri/target/release/bundle/...`):

| File                              | Platform         |
| --------------------------------- | ---------------- |
| `AIRIS_3.0.0_x64_en-US.msi`       | Windows          |
| `airis_3.0.0_amd64.deb`           | Debian / Ubuntu  |
| `airis_3.0.0_amd64.AppImage`      | Any Linux distro |
| `AIRIS.app`                       | macOS            |

Mobile (`airis-android.apk`):

| File                  | Platform    |
| --------------------- | ----------- |
| `airis-android.apk`   | Android     |

## Download Page

The download buttons on the dashboard link to the latest release:

```
https://github.com/<owner>/<repo>/releases/latest/download/<filename>
```

Once a release exists, the buttons serve real files immediately.
