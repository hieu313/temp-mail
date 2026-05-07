# Deployment Guide

## Local Run

```bash
npm install
npm start
```

Default ports:
- HTTP: `3000`
- SMTP: `25`

Override with environment variables:

```bash
HTTP_PORT=3000 SMTP_PORT=2525 npm start
```

Port 25 may require elevated privileges or conflict with an existing mail service.
