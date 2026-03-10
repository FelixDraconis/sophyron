# Sophyron — GitHub Pages site

This repo is a simple static website intended to be hosted on **GitHub Pages**.

## Quick start

- Edit `index.html` to update:
  - Header/hero wording if you want
  - Social link tiles (Bandcamp/YouTube/email/etc.)
- Edit `styles.css` if you want to tweak layout/colors.
- Edit `data/releases.json` to manage your soundtrack list (the site auto-renders from this file).

## Adding cover art

Place your cover images in:

- `assets/covers/`

Then set each release's `coverImage` path in `data/releases.json` (example already included).

## Adding a new release

1. Add the cover image to `assets/covers/` (use simple filenames like `my-album-cover.png`).
2. Append a new object to `data/releases.json` with:
   - `title`
   - `releaseDate` (ISO format like `2026-03-01`)
   - `coverImage` (path to your cover file)
   - `bandcampUrl`
   - `youtubeUrl`

The homepage automatically sorts by `releaseDate`, so the newest becomes **Latest**.

## GitHub Pages publishing (user site)

In GitHub, open the repo settings:

- **Settings → Pages**
- **Source**: Deploy from a branch
- **Branch**: `main`
- **Folder**: `/(root)`

After that, your site should publish at your GitHub Pages URL.

