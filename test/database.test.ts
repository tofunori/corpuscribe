import Database from "better-sqlite3";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CorpusDatabase } from "../src/database.js";

let directory: string;
let corpus: CorpusDatabase;

beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "corpuscribe-"));
  const path = join(directory, "fixture.sqlite");
  const db = new Database(path);
  db.exec(`
    CREATE TABLE sentences (
      id TEXT PRIMARY KEY,
      article TEXT,
      title TEXT,
      source_id TEXT,
      page_pdf INTEGER,
      frequency_eligible INTEGER,
      canonical_verified INTEGER,
      text TEXT,
      word_count INTEGER
    );
    CREATE TABLE jev_labels (
      sentence_id TEXT,
      label TEXT,
      choice TEXT,
      choice_probability REAL
    );
  `);
  const insert = db.prepare("INSERT INTO sentences VALUES (?, ?, ?, ?, ?, 1, 1, ?, ?)");
  insert.run("s1", "article:a", "Snow study", "pdf:a", 4, "These assumptions may underestimate melt.", 6);
  insert.run("s2", "article:b", "Ice study", "pdf:b", 9, "The estimate provides an upper bound.", 7);
  db.prepare("INSERT INTO jev_labels VALUES (?, ?, ?, ?)").run("s1", "certainty", "possible", 0.94);
  db.close();
  corpus = new CorpusDatabase(path);
});

afterEach(() => {
  corpus.close();
  rmSync(directory, { recursive: true, force: true });
});

describe("CorpusDatabase", () => {
  it("reports corpus and Jev coverage", () => {
    expect(corpus.status()).toEqual({
      sentences: 2,
      articles: 2,
      sources: 2,
      jevSentences: 1,
      jevLabels: 1,
    });
  });

  it("filters examples by a Jev classification", () => {
    const rows = corpus.search("underestimate", 10, [
      { label: "certainty", choice: "possible", minProbability: 0.9 },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.article).toBe("article:a");
  });

  it("compares terminology with provenance", () => {
    const comparison = corpus.compareTerms(["upper bound", "underestimate"]);
    expect(comparison.map(({ occurrences }) => occurrences)).toEqual([1, 1]);
    expect(comparison[0]?.examples[0]?.pagePdf).toBe(9);
  });
});
