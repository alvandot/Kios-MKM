import OpenAI from "openai";

const API_KEY = "coa_cb6cf143b58aaf8fdd3ee07309468535";
const BASE_URL = "https://coarena.ai/api/v1";

const client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });

const response = await client.chat.completions.create({
  model: "deepseek-v4-1-flash-1017",
  messages: [{ role: "user", content: "Halo dari DeepSeek v4.1 Flash Mod! Tes sistem." }],
});

console.log("Response:", response.choices[0].message.content);

const fb = await fetch(`${BASE_URL}/feedback`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
  body: JSON.stringify({ request_id: response.id, rating: "good", comment: "smoke test" }),
});
console.log("Feedback:", await fb.json());
