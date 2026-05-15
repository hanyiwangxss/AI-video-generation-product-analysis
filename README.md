# AI Video Product Analysis Agent (Prototype)

This is a minimal, local-first agent prototype for analyzing AI video generation products with bilingual output and source tracking.

## Portfolio note (for HR)

This is a portfolio demo to showcase product analysis and research workflows. I designed the bilingual data model, built the filtering/compare UI, and implemented source-linked cards so every claim is traceable. The project focuses on clarity, auditability, and fast iteration rather than production-scale infrastructure. Data comes from public sources and is time-stamped; some UX ratings are left blank when recent user reports are not available.

## What is included
- Simple product schema validation
- JSON-based data store (no external dependencies)
- TF-IDF keyword retrieval for product matching
- CLI query interface with bilingual rendering

## Quick start

From the repo root:

```bash
cd ai_video_agent
python run.py --list --lang zh
python run.py --query "pricing and usage limits" --lang en
```

## Web UI (portfolio demo)

Serve the `web/` folder and open the browser UI:

```bash
cd ai_video_agent
python -m http.server 8000
```

Then open:

```
http://localhost:8000/web/
```

The web UI reads data from `web/data/products_seed.json`. Keep it in sync with
`data/products_seed.json` when you update content.

You can also specify a custom data file:

```bash
python run.py --data /path/to/products.json --query "text-to-video" --lang zh
```

## Data format

Edit the JSON file at `ai_video_agent/data/products_seed.json`.

Each product includes:
- `id`: stable identifier
- `name`: `{ "en": "", "zh": "" }`
- `vendor`: company or org
- `status`: `placeholder` or real status
- `category`: list of tags
- `capabilities`: `{ "en": [], "zh": [] }`
- `pricing`: `{ "en": "", "zh": "" }`
- `limitations`: list of strings
- `use_cases`: list of strings
- `notes`: `{ "en": "", "zh": "" }`
- `sources`: list of `{ "title": "", "url": "", "date": "YYYY-MM-DD" }`

## Next steps
- Replace placeholder entries with verified data and sources.
- Add more products or versions over time.
- Extend retrieval with embeddings when you are ready to add dependencies.
