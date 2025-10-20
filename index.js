import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("✅ Hello from Vercel!");
});

export default app;
