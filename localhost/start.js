import path from "path";
import { fileURLToPath } from "url";
import httpServer from "http-server";
import getPort from "get-port";
import open from "open";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDirectory = path.resolve(__dirname, "../");
(async () => {
  const port = await getPort({ port: 3000 });
  const server = httpServer.createServer({ root: rootDirectory, cache: -1 });
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    open(`http://localhost:${port}`);
  });
})();
