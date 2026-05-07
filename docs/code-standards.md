# Code Standards

## Principles
- Keep the app single-process and dependency-light.
- Prefer plain JavaScript unless a build step becomes necessary.
- Keep UI static and framework-free.
- Validate external inputs at HTTP/SMTP boundaries.

## Naming
- Use descriptive kebab-case file names for new JS/CSS/HTML files where practical.
- Keep runtime entrypoint as `server.js` for Node convention and simple `npm start`.

## Validation
- Run `npm run check` before considering code complete.
