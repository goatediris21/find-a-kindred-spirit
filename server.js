const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const REVIEWS_FILE = path.join(ROOT, "reviews.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function readReviews() {
  try { return JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf8")); } catch (e) { return []; }
}

function writeReviews(reviews) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2) + "\n", "utf8");
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://" + req.headers.host);

  if (url.pathname === "/api/reviews") {
    if (req.method === "GET") {
      res.writeHead(200, { "Content-Type": MIME[".json"] });
      res.end(JSON.stringify(readReviews()));
      return;
    }
    if (req.method === "POST") {
      let body = "";
      req.on("data", c => {
        body += c;
        if (body.length > 1e5) req.destroy();
      });
      req.on("end", () => {
        let review = null;
        try { review = JSON.parse(body); } catch (e) {}
        const rating = Number(review && review.rating);
        const name = String(review && review.name || "").trim().slice(0, 100);
        const text = String(review && review.text || "").trim().slice(0, 1000);
        if (!rating || rating < 1 || rating > 5 || !name || !text) {
          res.writeHead(400, { "Content-Type": MIME[".json"] });
          res.end(JSON.stringify({ error: "Review must include a 1-5 star rating, a name, and text." }));
          return;
        }
        const reviews = readReviews();
        reviews.unshift({ rating, name, text });
        writeReviews(reviews);
        res.writeHead(200, { "Content-Type": MIME[".json"] });
        res.end(JSON.stringify(reviews));
      });
      return;
    }
    res.writeHead(405, { "Content-Type": "text/plain" });
    res.end("Method not allowed");
    return;
  }

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const rel = pathname.replace(/^[/\\]+/, "");
  const filePath = path.resolve(ROOT, rel);
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log("Kindred Spirit site running at http://localhost:" + PORT);
});
