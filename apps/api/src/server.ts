import { createServer } from "node:http";

import { handleRequest } from "./app.js";

const host = process.env.HOST ?? "127.0.0.1";
const port = Number(process.env.PORT ?? 3000);

const server = createServer(
  (request, response) => {
    void handleRequest(request, response).catch(
      (error: unknown) => {
        console.error(
          "Unhandled API error:",
          error,
        );

        if (!response.headersSent) {
          response.statusCode = 500;

          response.setHeader(
            "Content-Type",
            "application/json; charset=utf-8",
          );

          response.end(
            JSON.stringify({
              message: "Internal server error.",
            }),
          );
        } else {
          response.end();
        }
      },
    );
  },
);

server.listen(port, host, () => {
  console.log(
    `FAULTLINE API running at http://${host}:${port}`,
  );
});