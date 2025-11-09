import http from "http";
import dotenv from "dotenv";
import { handleRequest } from "./routes/userRoutes";

dotenv.config({ debug: false });

const PORT = process.env.PORT ?? "4000";

const server = http.createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (err) {
    console.error("Unhandled error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Internal Server Error" }));
  }
});

server.listen(parseInt(PORT, 10), () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
