# Setting Up Real Desktop & Mobile Downloads

This guide explains how to trigger the automated builds so users get real .exe/.msi and .apk files.

---

## How It Works

Two GitHub Actions workflows build the apps automatically and upload the files to GitHub Releases.
The download page then links directly to those release files.

---

## Step 1 — Push this code to GitHub

Make sure all these new files are pushed to `main`:
- `.github/workflows/build-desktop.yml`
- `.github/workflows/build-mobile.yml`
- `frontend/src-tauri/Cargo.toml`
- `frontend/src-tauri/src/main.rs`
- `frontend/src-tauri/build.rs`
- `mobile-app/eas.json`

---

## Step 2 — Set up Expo account (for APK only)

1. Go to https://expo.dev and create a free account
2. Go to **Account Settings → Access Tokens**
3. Create a new token, copy it
4. In your GitHub repo: **Settings → Secrets and variables → Actions**
5. Add a new secret named `EXPO_TOKEN` with your token value

> **Free tier**: EAS Build gives you 30 free builds/month — more than enough.

---

## Step 3 — Trigger the builds

### Option A — Tag-based (recommended)
Push a version tag to trigger both builds automatically:
```bash
git tag v2.0.0
git push origin v2.0.0
```

### Option B — Manual trigger
1. Go to your GitHub repo → **Actions** tab
2. Click **"Build Desktop App"** or **"Build Mobile APK"**
3. Click **"Run workflow"** → **"Run workflow"**

---

## Step 4 — Wait for builds to finish

- **Desktop build**: ~10–20 minutes (compiles Rust + bundles app)
- **Mobile APK build**: ~10–15 minutes (EAS cloud build)

When done, go to your repo's **Releases** page — you'll see the files attached.

---

## What Gets Built

| File | Platform |
|------|----------|
| `Airis_2.0.0_x64_en-US.msi` | Windows installer |
| `airis_2.0.0_amd64.deb` | Linux (Debian/Ubuntu) |
| `airis_2.0.0_amd64.AppImage` | Linux (any distro) |
| `airis-android.apk` | Android phones/tablets |

---

## Download Page

`/download` already links to these files via:
```
https://github.com/saishivasanjeethpaikarao-jpg/ai--assistant/releases/latest/download/<filename>
```

Once a release exists, the download buttons serve real files immediately.
