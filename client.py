import urllib.request
import json

API_KEY = "coa_cb6cf143b58aaf8fdd3ee07309468535"
BASE_URL = "https://coarena.ai/api/v1"
MODEL = "deepseek-v4-1-flash-1017"


def chat(messages, model=MODEL):
    payload = {"model": model, "messages": messages}
    req = urllib.request.Request(
        f"{BASE_URL}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


def feedback(request_id, rating, comment=None):
    payload = {"request_id": request_id, "rating": rating}
    if comment:
        payload["comment"] = comment
    req = urllib.request.Request(
        f"{BASE_URL}/feedback",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode("utf-8"))


if __name__ == "__main__":
    result = chat([
        {"role": "system", "content": "Anda adalah asisten AI yang ringkas."},
        {"role": "user", "content": "Halo, tes model deepseek v4.1 flash mod."},
    ])
    print(result["choices"][0]["message"]["content"])
    print(feedback(result["id"], "good", "smoke test"))
