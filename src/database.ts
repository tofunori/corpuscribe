import Database from "better-sqlite3";

export type RhetoricalFilter = {
  label: string;
  choice: string;
  minProbability?: number;
};

export type SentenceResult = {
  id: string;
  article: string;
  title: string | null;
  pagePdf: number | null;
  sourceId: string;
  text: string;
  wordCount: number | null;
};

export type CorpusStatus = {
  sentences: number;
  articles: number;
  sources: number;
  jevSentences: number;
  jevLabels: number;
};

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

export class CorpusDatabase {
  readonly db: Database.Database;

  constructor(path: string) {
    this.db = new Database(path, { readonly: true, fileMustExist: true });
    this.assertSchema();
  }

  close(): void {
    this.db.close();
  }

  status(): CorpusStatus {
    const row = this.db
      .prepare(`
        SELECT
          COUNT(*) AS sentences,
          COUNT(DISTINCT article) AS articles,
          COUNT(DISTINCT source_id) AS sources
        FROM sentences
        WHERE frequency_eligible = 1
      `)
      .get() as { sentences: number; articles: number; sources: number };

    const jev = this.db
      .prepare(`
        SELECT
          COUNT(DISTINCT sentence_id) AS jevSentences,
          COUNT(*) AS jevLabels
        FROM jev_labels
      `)
      .get() as { jevSentences: number; jevLabels: number };

    return { ...row, ...jev };
  }

  search(query: string, limit = 10, filters: RhetoricalFilter[] = []): SentenceResult[] {
    const boundedLimit = Math.max(1, Math.min(limit, 50));
    const clauses = ["s.frequency_eligible = 1", "LOWER(s.text) LIKE ? ESCAPE '\\'"];
    const params: Array<string | number> = [`%${escapeLike(query.toLowerCase())}%`];

    filters.forEach((filter, index) => {
      const alias = `j${index}`;
      clauses.push(`EXISTS (
        SELECT 1 FROM jev_labels ${alias}
        WHERE ${alias}.sentence_id = s.id
          AND ${alias}.label = ?
          AND ${alias}.choice = ?
          AND ${alias}.choice_probability >= ?
      )`);
      params.push(filter.label, filter.choice, filter.minProbability ?? 0.5);
    });

    params.push(boundedLimit);
    return this.db
      .prepare(`
        SELECT
          s.id,
          s.article,
          s.title,
          s.page_pdf AS pagePdf,
          s.source_id AS sourceId,
          s.text,
          s.word_count AS wordCount
        FROM sentences s
        WHERE ${clauses.join(" AND ")}
        ORDER BY s.canonical_verified DESC, s.word_count ASC
        LIMIT ?
      `)
      .all(...params) as SentenceResult[];
  }

  compareTerms(terms: string[]): Array<{
    term: string;
    occurrences: number;
    articles: number;
    sources: number;
    examples: SentenceResult[];
  }> {
    return terms.map((term) => {
      const pattern = `%${escapeLike(term.toLowerCase())}%`;
      const counts = this.db
        .prepare(`
          SELECT
            COUNT(*) AS occurrences,
            COUNT(DISTINCT article) AS articles,
            COUNT(DISTINCT source_id) AS sources
          FROM sentences
          WHERE frequency_eligible = 1
            AND LOWER(text) LIKE ? ESCAPE '\\'
        `)
        .get(pattern) as { occurrences: number; articles: number; sources: number };

      return { term, ...counts, examples: this.search(term, 3) };
    });
  }

  private assertSchema(): void {
    const tables = new Set(
      (this.db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all() as Array<{ name: string }>).map(({ name }) => name),
    );
    for (const required of ["sentences", "jev_labels"]) {
      if (!tables.has(required)) {
        throw new Error(`Incompatible database: missing table ${required}`);
      }
    }
  }
}
