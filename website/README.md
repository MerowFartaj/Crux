# CRUX Terminal — Marketing Website

The marketing and landing page for [cruxterminal.com](https://cruxterminal.com), showcasing features, screenshots, and download links for CRUX Terminal.

## Tech Stack

- **Next.js 14** — App Router with server components
- **Tailwind CSS** — Utility-first styling
- **Framer Motion** — Animations and scroll-based transitions
- **TypeScript** — End-to-end type safety

## Getting Started

```bash
cd website
npm install
npm run dev
```

The site runs at [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Deployment

The site is deployed on **Vercel** and auto-deploys from the `main` branch. Push to `main` and Vercel handles the rest.

## Project Structure

```
website/
  src/
    app/          Next.js App Router pages and layouts
    components/   Reusable UI components (hero, features, footer, etc.)
    lib/          Utilities and constants
  public/         Static assets (images, icons, OG images)
```
