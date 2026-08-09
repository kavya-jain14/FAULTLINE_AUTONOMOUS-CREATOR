import { SourceRegistry } from "./index.js";

const registry = new SourceRegistry();

console.log(
  "Registered sources:",
  registry.listSources(),
);

const results = await registry.fetchAll();

for (const result of results) {
  console.log("\n--- SOURCE ---");
  console.log(`Source: ${result.source}`);
  console.log(
    `Candidates: ${result.candidates.length}`,
  );
  console.log(
    `Error: ${result.error ?? "none"}`,
  );

  for (const candidate of result.candidates.slice(
    0,
    2,
  )) {
    console.log({
      id: candidate.sourceId,
      title: candidate.title,
      source: candidate.sourceName,
    });
  }
}