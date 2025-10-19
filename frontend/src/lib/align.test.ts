import { describe, expect, it } from "vitest";
import { alignTexts, tokenize } from "./align";

describe("tokenize", () => {
  it("splits apostrophes into mapped tokens", () => {
    const tokens = tokenize("L'ami d'Éric");
    expect(tokens).toEqual(["le", "ami", "de", "éric"]);
  });
});

describe("alignTexts", () => {
  it("returns perfect matches as good", () => {
    const result = alignTexts("Bonjour tout le monde", "bonjour tout le monde");
    expect(result.wordsTotal).toBe(4);
    expect(result.wordsCorrect).toBe(4);
    expect(result.accuracy).toBeCloseTo(1);
    expect(result.diff.every((token) => token.op === "match")).toBe(true);
  });

  it("detects substitutions", () => {
    const result = alignTexts("Je mange une pomme", "je mange la pomme");
    const ops = result.diff.map((token) => token.op);
    expect(ops).toContain("sub");
  });
});
