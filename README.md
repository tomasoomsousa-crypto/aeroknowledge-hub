# AeroKnowledge Hub

A web app that captures and shares the practical know-how of aircraft maintenance mechanics (MRO). Mechanics record the fixes they find in the hangar (photo, voice note with transcript, or video), a quality engineer validates them, and newer mechanics ask an AI assistant that only answers with approved fixes.

**Live app:** https://aeroknowledge-hub.netlify.app/

> Demo project for the Emerging Technologies course. All tips, people and aircraft registrations are fictional. Photos, videos and voices are AI-generated and labelled as such. Tips do not replace the official aircraft manuals.

## Features

- **Two profiles**, switched at the top of the page: Mechanic and Supervisor / Quality Engineer.
- **Submit**: a tablet-friendly form with aircraft, ATA system, part, warning, downtime hours saved and the fix. Attach a photo, record a voice note (with automatic transcription in Chrome and Edge) or add a video. Every tip starts as *Pending Approval*.
- **Validation** (Supervisor only):
  - approve, after confirming or correcting the hours saved, or reject with a reason;
  - **Live hangar**: aircraft drawn in their bays with their status (operational, in maintenance, grounded/AOG), today's stops and reasons, and the approved tips that may help;
  - indicators: hours saved, decision time, charts per month, system and aircraft, and top contributors.
- **Feed**: approved tips with photos, videos and playable voice notes, searchable and filterable by aircraft and system.
- **MEC-AI chat**: mechanics describe the problem in their own words (hangar slang included). The assistant asks diagnostic questions until it finds the cause and answers only with approved tips, always showing who fixed the problem. It replies in English, or in Portuguese if the mechanic writes in Portuguese.

## Architecture

| Part | Technology |
|---|---|
| Front end | A single HTML page (`aeroknowledge-hub.html`, built into `index.html`), no framework |
| Hosting | Netlify (static site + serverless function) |
| Data | Supabase Postgres (`items`, `fleet`) with real-time updates |
| Files | Supabase Storage, public `media` bucket |
| AI | Claude via the Netlify function `netlify/functions/mec-ai.mjs`; the API key is stored in Netlify (`ANTHROPIC_API_KEY`) |

The same page also runs as a Claude Artifact on claude.ai. Without Supabase it falls back to a local demo mode that keeps changes in the browser.

## Files

- `aeroknowledge-hub.html`: the app. `index.html` is generated from it by `build.py`.
- `seed-items.json`, `seed-fleet.json`: example tips and aircraft, loaded automatically into an empty database.
- `media/`: example photos, videos and voice notes.
- `supabase/setup.sql`, `supabase/storage.sql`: create the tables, access rules and the media bucket. `supabase/reset.sql` clears the data so the examples are loaded again.
- `netlify/functions/mec-ai.mjs`: the MEC-AI function.

## Run locally

```bash
python -m http.server 8000
```

Then open http://localhost:8000. After editing `aeroknowledge-hub.html`, rebuild `index.html`:

```bash
python build.py
```
