import { runAgentOnce } from "./worker.js";

const agentId = "faultline-mira-821e7a";

console.log("========== WORKER SMOKE ==========");

try {
  const result = await runAgentOnce(agentId);

  console.log("Worker completed successfully.");
  console.log("RUN RESULT:");
  console.log(result);
} catch (error) {
  console.error("Worker failed:");

  console.error(
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
}