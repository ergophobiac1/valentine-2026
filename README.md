# Valentine Site 💘 (GitHub Pages)

A tiny, cute, single-page “Be My Valentine?” website made with plain HTML/CSS/JS.

Features:
- Pastel gradient background + centered floating card
- Banner starts as: **"Will you be my valentine?"**
- Two buttons: **Yes** and **No**
- **No** runs away when your cursor/finger gets close (pointer events, desktop + mobile)
- After the first **No** evade, a 5-second timer starts; then **No** fades out and becomes non-interactive
- Every **No** evade makes **Yes** grow (smoothly, with a sensible max size)
- Clicking **Yes** swaps the banner to **"I love you!"**, disables the buttons, pops a big heart, and launches simple confetti
- Respects **prefers-reduced-motion** (reduces/avoids animations + disables confetti)

---

## Run locally

You can open `index.html` directly, but some browsers are stricter with local JS/CSS. A local server is recommended.

### Option A: Simple local server (Python)
From the `valentine-site/` folder:

```bash
python -m http.server 8000
```

Then open:
- `http://localhost:8000`

---

## Deploy to GitHub Pages (exact steps)

1. **Create a new GitHub repository**
   - Example name: `valentine-site`

2. **Add the project files**
   - Put these files at the repo root:
     - `index.html`
     - `styles.css`
     - `app.js`
     - `README.md`

3. **Commit and push to `main`**
   ```bash
   git add .
   git commit -m "Add valentine site"
   git push origin main
   ```

4. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings**
   - In the left sidebar, click **Pages**
   - Under **Build and deployment**
     - **Source**: “Deploy from a branch”
     - **Branch**: `main`
     - **Folder**: `/ (root)`
   - Click **Save**

5. **Open your site**
   - After GitHub finishes deploying, you’ll see a Pages URL in the Pages settings.
   - Open that URL to view your Valentine site 🎉

---

## Notes

- No frameworks, no external libraries, no CDNs.
- Designed to work cleanly on common desktop and mobile viewport sizes.
- If your OS/browser has **Reduce Motion** enabled, animations and confetti are minimized/disabled.
