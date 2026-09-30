import { describe, expect, it } from "vitest";

import { LISTENING_SCENES, LISTENING_SPEEDS } from "../client/src/components/ListeningTrainingView";

describe("listening training playback configuration", () => {
  it("exposes exactly the supported listening speeds", () => {
    expect([...LISTENING_SPEEDS]).toEqual([0.75, 1, 1.25]);
  });

  it("keeps every listening scene at forty lines", () => {
    expect(LISTENING_SCENES).toHaveLength(10);
    for (const scene of LISTENING_SCENES) {
      expect(scene.lines, scene.id).toHaveLength(40);
    }
  });
});
