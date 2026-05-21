# Dùng temp mail tự host với auto_reg

File `server.js` đã được chỉnh để tương thích với provider `freemail` của `auto_reg`.

## API mà auto_reg cần

`auto_reg` provider `freemail` sẽ gọi:

```text
GET /api/generate
GET /api/emails?mailbox=<email>&limit=20
```

`server.js` hiện đã hỗ trợ các endpoint này.

## Biến môi trường

Chạy temp mail server với domain của bạn:

```bash
MAIL_DOMAIN=hieunm3103.id.vn HTTP_PORT=3000 SMTP_PORT=25 node server.js
```

Ý nghĩa:

- `MAIL_DOMAIN`: domain dùng để sinh mailbox, ví dụ `abc@hieunm3103.id.vn`
- `HTTP_PORT`: port web/API, mặc định `3000`
- `SMTP_PORT`: port nhận mail SMTP, mặc định `25`

## DNS cần có

Ví dụ dùng domain `hieunm3103.id.vn`:

```text
A  mail.hieunm3103.id.vn  -> IP VPS của bạn
MX hieunm3103.id.vn       -> mail.hieunm3103.id.vn
```

Server phải có public IP và mở inbound TCP port `25`. Nếu chạy sau NAT hoặc máy local không public port 25 thì email từ internet thường sẽ không vào được.

## Test temp mail API

Sinh email mới:

```bash
curl http://localhost:3000/api/generate
```

Kết quả mong đợi:

```json
{"email":"userxxxx@hieunm3103.id.vn"}
```

Xem inbox của mailbox:

```bash
curl "http://localhost:3000/api/emails?mailbox=userxxxx@hieunm3103.id.vn&limit=20"
```

Response sẽ có các field mà `auto_reg` đọc được:

```json
[
  {
    "id": 1,
    "from_address": "sender@example.com",
    "to_address": "userxxxx@hieunm3103.id.vn",
    "subject": "Your code is 123456",
    "body": "...",
    "text": "...",
    "preview": "...",
    "verification_code": "123456",
    "created_at": "2026-05-21T..."
  }
]
```

## Cấu hình trong auto_reg

Vào Web UI của `auto_reg`:

```text
Settings -> Email Service
```

Chọn provider:

```text
Freemail（自建 CF Worker）
```

Điền:

```text
freemail_api_url = http://IP_OR_DOMAIN_CUA_TEMP_MAIL:3000
```

Ví dụ nếu cùng máy:

```text
freemail_api_url = http://127.0.0.1:3000
```

Nếu `auto_reg` chạy trong Docker còn temp mail chạy ở host, thử:

```text
freemail_api_url = http://host.docker.internal:3000
```

Các field sau có thể để trống vì `server.js` hiện chưa yêu cầu auth:

```text
freemail_admin_token
freemail_username
freemail_password
```

Sau đó đảm bảo `mail_provider` là:

```text
freemail
```

## Files cần move sang project temp mail

Copy file đã chỉnh:

```text
server.js
```

Và file hướng dẫn này nếu muốn lưu kèm:

```text
TEMP_MAIL_AUTO_REG_SETUP.md
```
