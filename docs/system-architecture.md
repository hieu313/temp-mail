# System Architecture

## Overview

The app runs as one Node process with two listeners:
- SMTP listener receives and parses mail.
- HTTP listener serves the browser UI and JSON API.

SQLite stores received messages in `emails.db`.

## Data Flow

```txt
SMTP client -> smtp-server -> mailparser -> SQLite -> HTTP API -> Browser UI
```

## Runtime Components
- `server.js`: SMTP server, HTTP server, SQLite setup, API routes.
- `public/index.html`: Browser page shell.
- `public/styles.css`: UI styles.
- `public/app.js`: Client-side rendering and API calls.
