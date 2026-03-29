
import express from "express";
const app = express();
const PORT = 3000;

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Simple server is running" });
});

app.get("*", (req, res) => {
  res.send("<h1>Simple Server</h1><p>Backend is reachable.</p>");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SIMPLE SERVER] Running on http://localhost:${PORT}`);
});
