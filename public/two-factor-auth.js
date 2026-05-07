(function initTwoFactorAuth(root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("crypto"));
    return;
  }

  root.twoFactorAuth = factory(null);
})(typeof globalThis !== "undefined" ? globalThis : this, (crypto) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  function normalizeSecret(secret) {
    return String(secret || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  }

  function decodeBase32(secret) {
    const normalized = normalizeSecret(secret);
    const bytes = [];
    let bits = 0;
    let value = 0;

    for (const char of normalized) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    if (bytes.length === 0) throw new Error("Invalid Base32 secret");
    return new Uint8Array(bytes);
  }

  function createCounterBuffer(timestamp, period) {
    const counter = Math.floor(timestamp / 1000 / period);
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(0, Math.floor(counter / 0x100000000));
    view.setUint32(4, counter >>> 0);
    return buffer;
  }

  function truncateHmac(hmac, digits) {
    const offset = hmac[hmac.length - 1] & 15;
    const binary = ((hmac[offset] & 127) << 24)
      | ((hmac[offset + 1] & 255) << 16)
      | ((hmac[offset + 2] & 255) << 8)
      | (hmac[offset + 3] & 255);

    return String(binary % (10 ** digits)).padStart(digits, "0");
  }

  async function generateBrowserTotp(secret, options) {
    const key = await globalThis.crypto.subtle.importKey(
      "raw",
      decodeBase32(secret),
      { name: "HMAC", hash: "SHA-1" },
      false,
      ["sign"],
    );
    const signature = await globalThis.crypto.subtle.sign("HMAC", key, createCounterBuffer(options.timestamp, options.period));
    return truncateHmac(new Uint8Array(signature), options.digits);
  }

  function generateNodeTotp(secret, options) {
    const hmac = crypto
      .createHmac("sha1", Buffer.from(decodeBase32(secret)))
      .update(Buffer.from(createCounterBuffer(options.timestamp, options.period)))
      .digest();

    return truncateHmac(hmac, options.digits);
  }

  function generateTotp(secret, options = {}) {
    const normalizedOptions = {
      digits: options.digits || 6,
      period: options.period || 30,
      timestamp: options.timestamp || Date.now(),
    };

    if (crypto) return generateNodeTotp(secret, normalizedOptions);
    return generateBrowserTotp(secret, normalizedOptions);
  }

  async function requestTotp(secret) {
    const response = await fetch("/api/2fa/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Không tạo được 2FA code.");
    }

    return response.json();
  }

  return { generateTotp, normalizeSecret, requestTotp };
});
