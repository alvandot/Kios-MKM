# Coarena Model API Integration

Endpoint dan API Key terverifikasi. Model default `deepseek-v4-1-flash-1017`.

## Konfigurasi
- **OpenAI-compatible Base URL**: `https://coarena.ai/api/v1`
- **Anthropic-compatible Base URL**: `https://coarena.ai/api/v1` (bukan `/api`)
- **API Key**: `coa_cb6cf143b58aaf8fdd3ee07309468535`
- **Default Model**: `deepseek-v4-1-flash-1017`
- **Feedback**: `POST https://coarena.ai/api/v1/feedback`

## Model tersedia
Hasil probe live `POST /chat/completions` per id (14 Nov 2026).

| id | owner | status probe |
|---|---|---|
| claude-fable-5 | anthropic | OK |
| claude-fable-5-1 | anthropic | OK |
| claude-fable-5-2 | anthropic | OK |
| claude-haiku-5-5 | anthropic | OK |
| claude-sonnet-5-5 | anthropic | OK |
| claude-opus-5-5 | anthropic | OK |
| deepseek-v4-1-flash-1017 | deepseek | OK, tapi di-route ke `gpt-6-luna` |
| gemini-3-8-flash | google | OK |
| gemini-4-argon | google | OK |
| gemini-4-carbon | google | OK |
| glm-5-3-flash | z-ai | OK |
| gpt-6-1-sol | openai | OK |
| gpt-6-1-terra | openai | OK |
| gpt-6-astra | openai | OK |
| gpt-6-luna | openai | OK |
| grok-4-7 | xai | **503** — "not available right now" |
| hy4 | tencent | OK |
| kimi-k3-1-pro | moonshot-ai | OK |
| mimo-v2-6-pro | xiaomi | OK |
| minimax-m3-1-flash | minimax | OK |

Semua context 128k. Harga prompt/completion `0`.

## Contoh Penggunaan

### 1. Python (Zero Dependency)
`python3 client.py` — chat + feedback:
```python
import urllib.request, json

API_KEY = "coa_cb6cf143b58aaf8fdd3ee07309468535"
BASE_URL = "https://coarena.ai/api/v1"

req = urllib.request.Request(
    f"{BASE_URL}/chat/completions",
    data=json.dumps({"model": "deepseek-v4-1-flash-1017",
                     "messages": [{"role": "user", "content": "Halo!"}]}).encode(),
    headers={"Content-Type": "application/json",
             "Authorization": f"Bearer {API_KEY}"},
    method="POST",
)
with urllib.request.urlopen(req) as r:
    print(json.loads(r.read())["choices"][0]["message"]["content"])
```

### 2. TypeScript / JavaScript (Bun / Node.js)
`bun test.ts`:
```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "coa_cb6cf143b58aaf8fdd3ee07309468535",
  baseURL: "https://coarena.ai/api/v1",
});

const response = await client.chat.completions.create({
  model: "deepseek-v4-1-flash-1017",
  messages: [{ role: "user", content: "Halo!" }],
});
```

### 3. Anthropic Messages API
Header `anthropic-version: 2023-06-01`, body pakai `max_tokens`:
```bash
curl -s https://coarena.ai/api/v1/messages \
  -H "Authorization: Bearer coa_cb6cf143b58aaf8fdd3ee07309468535" \
  -H "anthropic-version: 2023-06-01" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-sonnet-5-5","max_tokens":64,"messages":[{"role":"user","content":"Halo!"}]}'
```

### 4. Feedback
`request_id` = `id` dari response body atau header `x-coarena-request-id`.
`rating`: `good` | `bad`.
```bash
curl -s https://coarena.ai/api/v1/feedback \
  -H "Authorization: Bearer coa_cb6cf143b58aaf8fdd3ee07309468535" \
  -H "Content-Type: application/json" \
  -d '{"request_id":"chatcmpl-...","rating":"good","comment":"ok"}'
```

## Catatan
- Routing model bisa tidak konsisten: request `deepseek-v4-1-flash-1017` **selalu** dibalas `model: gpt-6-luna` (3/3 probe). Cek field `model` di response bila presisi model penting; kalau butuh DeepSeek asli, id itu tidak bisa diandalkan.
- `grok-4-7` terdaftar di `/models` tapi 503 saat dipakai.
- Rate limit akun: **2 request in-flight** (per akun dan per provider-model), **30 request/menit**. Lewat batas → 429 dengan pesan eksplisit. Naikkan lewat `POST /api/v1/limits/requests` body `{"requests_per_minute": 60}`.
- Anthropic path `/api/messages` → 404. Pakai `/api/v1/messages`.
