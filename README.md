<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1s0z6ZSmQlpvCMxjgajTHNSYpEtXLSVaD

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend (Express + SQLite)

Start the backend server (in `server` folder):

```bash
cd server
npm install
node migrate.js
npm run dev
```

This starts an API at `http://localhost:4001/api` used by the frontend.

If you deploy the backend elsewhere, set `REACT_APP_API_BASE` to the API URL before building the frontend.
