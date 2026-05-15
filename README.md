# AI Video Product Analysis Agent (Prototype)

This is a minimal, local-first agent prototype for analyzing AI video generation products with bilingual output and source tracking.

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
