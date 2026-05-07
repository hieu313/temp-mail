# Temp Mail Browser

A tiny temp mail receiver with one Node.js process:

- Receives email through SMTP.
- Parses email with `mailparser`.
- Stores messages in SQLite (`emails.db`).
- Shows a browser table with sender, recipient, extracted 6-digit code, detail modal, and delete action.

## Project Structure

```txt
temp-mail/
├── server.js
├── package.json
├── emails.db
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

`emails.db` is generated at runtime and is ignored by git.

## Install

```bash
npm install
```

## Run

```bash
npm start
```

Defaults:

- Browser UI: `http://localhost:3000`
- SMTP server: port `25`

Port `25` may require root permission or may already be used by another mail service. For local testing, use a non-privileged SMTP port:

```bash
SMTP_PORT=2525 npm start
```

You can also change the HTTP port:

```bash
HTTP_PORT=8080 SMTP_PORT=2525 npm start
```

## Validate

```bash
npm run check
```

## Run in Background with PM2

```bash
npm install -g pm2
pm2 start server.js --name temp-mail
pm2 save
```

Port `25` needs extra permission on Linux. Grant Node permission to bind privileged ports:

```bash
sudo setcap 'cap_net_bind_service=+ep' "$(readlink -f "$(which node)")"
pm2 restart temp-mail
```

Enable PM2 after reboot:

```bash
pm2 startup
```

Copy and run the `sudo ...` command printed by PM2, then run:

```bash
pm2 save
```

## HTTPS on Amazon Linux with Caddy

Assumptions:

- DNS `A` record points your domain to the EC2 public IP.
- EC2 security group allows inbound `80`, `443`, and `25`.
- The app is running locally on `127.0.0.1:3000`.

Install Caddy:

```bash
sudo dnf install -y 'dnf-command(copr)'
sudo dnf copr enable -y @caddy/caddy
sudo dnf install -y caddy
```

Configure Caddy:

```bash
sudo nano /etc/caddy/Caddyfile
```

Example:

```caddy
tempmail.hieunm3103.id.vn {
    reverse_proxy 127.0.0.1:3000
}
```

Start and reload:

```bash
sudo systemctl enable --now caddy
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Test:

```bash
curl -I https://tempmail.hieunm3103.id.vn
```

Caddy automatically provisions and renews Let's Encrypt certificates.

## Basic Auth with Caddy

Generate a random password:

```bash
PASS=$(openssl rand -base64 24)
echo "$PASS"
```

Generate the Caddy password hash:

```bash
HASH=$(caddy hash-password --plaintext "$PASS")
echo "$HASH"
```

Update `/etc/caddy/Caddyfile`:

```caddy
tempmail.hieunm3103.id.vn {
    basicauth {
        admin HASH_FROM_COMMAND
    }

    reverse_proxy 127.0.0.1:3000
}
```

Replace `HASH_FROM_COMMAND` with the generated hash. Keep the plaintext password in a password manager.

Validate and reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Test unauthenticated access:

```bash
curl -I https://tempmail.hieunm3103.id.vn
```

Expected: `401`.

Test authenticated access:

```bash
curl -u admin:"$PASS" -I https://tempmail.hieunm3103.id.vn
```

Expected: `200`.

## API

### List emails

```http
GET /api/emails
```

Returns rows with:

- `id`
- `fromAddress`
- `toAddress`
- `subject`
- `code`
- `createdAt`

### Search emails by address

```http
GET /api/emails/search?q=inbox
```

Searches both `fromAddress` and `toAddress`. Returns the same row shape as `GET /api/emails`.

### Get email detail

```http
GET /api/emails/:id
```

Returns full email detail, including `body`.

### Delete email

```http
DELETE /api/emails/:id
```

Deletes an email by id.

## Code Extraction

The app extracts the first 6-digit code from the email body with:

```js
/\b\d{6}\b/
```

If no code exists, `code` is `null`.
