import { IncomingMessage, ServerResponse } from "http";

export async function parseJsonBody(req: IncomingMessage, res: ServerResponse): Promise<any | null> {
  return new Promise((resolve) => {
    const chunks: Uint8Array[] = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString().trim();
      if (!raw) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Request body is required and must be valid JSON" }));
        resolve(null);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Invalid JSON in request body" }));
        resolve(null);
      }
    });

    req.on("error", (err) => {
      console.error("Request stream error:", err);
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Error reading request body" }));
      resolve(null);
    });
  });
}
