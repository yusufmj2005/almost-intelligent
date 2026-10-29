# NOVA Digital — Portfolio Website

A responsive fictional digital-studio website built with plain HTML, CSS, and JavaScript. Designed as a portfolio project for demonstrating frontend development, interaction design, and browser-local lead capture.

## Features

- Responsive layout with mobile navigation
- Premium dark visual theme and custom CSS illustrations
- Scripted demo chatbot with quick prompts
- Contact form with browser-side validation
- Lead capture stored in `localStorage`
- CSV export of demo leads
- Accessible labels, focus states, and reduced-motion support
- No framework, paid API, backend, or build step required

## Run locally

1. Extract the ZIP.
2. Open `index.html` in a modern browser.

For a local web server (optional), open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Test the chatbot

Click **Ask NOVA** in the bottom-right corner. Try asking about services, pricing, timelines, AI, or getting started.

The chatbot is a deterministic scripted demo. It does not call an AI model and does not need an API key.

## Test lead capture

1. Fill out the project enquiry form.
2. Submit it.
3. The success message confirms that the record was stored in this browser.

To export leads saved in the current browser, open the page with `?admin=1`, for example:

- Local file: `index.html?admin=1`
- Local server: `http://localhost:8000/?admin=1`

Click **Export demo leads (CSV)**.

### Important limitations

- Leads are stored only in the visitor's browser, not sent to an inbox or server.
- `localStorage` is not a production CRM and is not shared across browsers/devices.
- Do not collect real customer or sensitive data in this demo.
- Before real business use, connect the form to a secure backend or a form service, add privacy disclosures, and implement appropriate security and consent practices.
- Replace the fictional NOVA brand, concept projects, copy, and contact details before presenting it as a client project.
- Project cards are clearly illustrative concepts, not real client work.

## Publish free

You can publish the static files with GitHub Pages or another static hosting provider's free tier. Check current plan limits and terms before choosing a host.

## Suggested portfolio description

**NOVA Digital — Responsive Business Website with Interactive Chat and Lead Capture**

Designed and built a responsive digital-studio website using HTML, CSS, and vanilla JavaScript. Implemented a scripted support chatbot, mobile navigation, validated contact form, browser-local lead storage, and CSV export. Focused on responsive UI, accessible interactions, and a polished visual system. No paid APIs or build tools required.
