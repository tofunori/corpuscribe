# Database contract

Corpuscribe v0.1 reads a prepared SQLite database. It does not ingest PDFs or run Jev. See [the fictional demo](../examples/demo.sql) for a minimal working schema.

## Required tables

Both tables must exist, even when there are no rhetorical classifications.

### `sentences`

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | TEXT | Stable sentence identifier; primary key. |
| `article` | TEXT | Article identifier, such as a DOI. |
| `title` | TEXT | Publication title, nullable. |
| `source_id` | TEXT | Identifier of the source containing the passage. |
| `page_pdf` | INTEGER | PDF page reference, nullable. |
| `frequency_eligible` | INTEGER | Only rows equal to 1 enter search and frequency counts. |
| `canonical_verified` | INTEGER | Higher values rank before unverified examples; verification is an upstream responsibility. |
| `text` | TEXT | Extracted sentence text. |
| `word_count` | INTEGER | Upstream word count; shorter sentences rank first after verification status. |

Additional columns are permitted. Corpuscribe currently returns identifiers and page references, not local PDF paths or a PDF viewer.

### `jev_labels`

| Column | Type | Purpose |
| :--- | :--- | :--- |
| `sentence_id` | TEXT | Sentence identifier matching `sentences.id`. |
| `label` | TEXT | Classification dimension, for example `certainty`. |
| `choice` | TEXT | Selected answer, for example `possible`. |
| `choice_probability` | REAL | Probability of the selected answer, between 0 and 1. |

Leave this table empty for a corpus without classifications. Filter names and choices are supplied by the caller; the server does not enforce a taxonomy. Multiple filters must all match a sentence. Keep a single intended classification schema in this table: v0.1 does not isolate versions or return probability distributions.

## Counts and provenance

`corpus_status` counts eligible sentence rows and their distinct articles and sources. Its Jev counts cover all rows in `jev_labels`, including any rows that refer to ineligible or missing sentences. They are not a direct percentage of eligible corpus coverage.

`terminology_compare.occurrences` is a count of matching sentence rows. It does not count each appearance of a phrase within a sentence. The server relies on upstream article identities and eligibility flags to control duplicates.

Startup checks table names only. A database with missing required columns will fail when the affected tool is called. Preserve your source database and prepare compatible indexes upstream.
