require("dotenv").config();

const http = require("http");

const PORT = 3000;
const OFFICIAL_EMAIL = process.env.OFFICIAL_EMAIL;

/* ---------- Helper Functions ---------- */

function fibonacci(n) {
  const res = [];
  let a = 0, b = 1;
  for (let i = 0; i < n; i++) {
    res.push(a);
    [a, b] = [b, a + b];
  }
  return res;
}

function isPrime(num) {
  if (num < 2) return false;
  for (let i = 2; i * i <= num; i++) {
    if (num % i === 0) return false;
  }
  return true;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function lcmArray(arr) {
  return arr.reduce((a, b) => (a * b) / gcd(a, b));
}

function hcfArray(arr) {
  return arr.reduce((a, b) => gcd(a, b));
}

/* ---------- Gemini AI ---------- */

async function askGemini(question) {
  const apiKey = process.env.GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: question }]
          }
        ]
      })
    }
  );

  const data = await response.json();

  // safe check
  if (!data.candidates) {
    throw new Error("Gemini API error");
  }

  return data.candidates[0].content.parts[0].text;
}

/* ---------- Server ---------- */

const server = http.createServer((req, res) => {

  // GET /health
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      is_success: true,
      official_email: OFFICIAL_EMAIL
    }));
    return;
  }

  // POST /bfhl
  if (req.method === "POST" && req.url === "/bfhl") {
    let body = "";

    req.on("data", chunk => body += chunk.toString());

    req.on("end", async () => {
      try {
        const input = JSON.parse(body);
        let result;

        if (input.fibonacci !== undefined) {
          result = fibonacci(input.fibonacci);

        } else if (input.prime !== undefined) {
          result = input.prime.filter(isPrime);

        } else if (input.lcm !== undefined) {
          result = lcmArray(input.lcm);

        } else if (input.hcf !== undefined) {
          result = hcfArray(input.hcf);

        } else if (input.AI !== undefined) {
          result = await askGemini(input.AI);

        } else {
          throw "Invalid";
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          is_success: true,
          official_email: OFFICIAL_EMAIL,
          data: result
        }));

      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
          is_success: false,
          error: "Invalid request"
        }));
      }
    });
    return;
  }

  // Invalid route
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    is_success: false,
    error: "Route not found"
  }));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
