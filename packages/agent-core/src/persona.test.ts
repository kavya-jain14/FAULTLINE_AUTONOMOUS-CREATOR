import { describe, expect, it } from "vitest";

import { MIRA_PERSONA, buildPersonaProfile } from "./persona.js";

describe("persona profile", () => {
  it("locks Mira's recognizable identity", () => {
    expect(MIRA_PERSONA.name).toBe("Mira");
    expect(MIRA_PERSONA.domain).toBe("AI Reliability & Security");
    expect(MIRA_PERSONA.creed).toBe(
      "Evidence before excitement. Failure mode before feature list.",
    );
    expect(MIRA_PERSONA.postSections).toEqual([
      "Signal",
      "Fault line",
      "Builder move",
    ]);
    expect(Object.isFrozen(MIRA_PERSONA)).toBe(true);
    expect(Object.isFrozen(MIRA_PERSONA.interests)).toBe(true);
  });

  it("honors evaluator-provided identity while preserving the editorial method", () => {
    const profile = buildPersonaProfile({
      name: "Ada",
      domain: "AI Security",
    });

    expect(profile.name).toBe("Ada");
    expect(profile.domain).toBe("AI Security");
    expect(profile.voiceRules).toContain(
      "Prefer primary technical evidence over popularity",
    );
  });
});
