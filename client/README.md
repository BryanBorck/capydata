# Datagotchi Client (PWA)

This is a mobile-first Progressive Web App built with Next.js, Tailwind CSS and pnpm. It allows users to pick an image that matches a prompt and rewards daily participation with points stored natively in the browser.

## Getting started

```bash
# from the project root
cd client
pnpm install   # or: corepack enable && pnpm i

# dev server
pnpm dev

# production build
pnpm build
pnpm start
```

Then open `http://localhost:3000` in your browser. Add the site to your home-screen to enjoy the full PWA experience.

## Project structure

- `pages/` – Next.js pages
- `components/` – Reusable UI components
- `public/manifest.json` – Web App Manifest
- `styles/` – Global Tailwind styles

## Customisation

- Update the prompt, image URLs or points logic in `pages/index.tsx`.
- Replace `public/icon-192.png` and `public/icon-512.png` with your own icons for best PWA install quality.
