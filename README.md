# Corpuscribe

**Corpus-grounded scientific writing tools over MCP.**

Corpuscribe is a local, read-only MCP server for consulting the language of a scientific literature corpus. It retrieves sourced examples, compares terminology, and filters sentences with optional rhetorical labels produced by classifiers such as Jev.

Corpuscribe does not generate scientific claims and does not require source PDFs to leave the local machine.

## Tools

- `corpus_status` reports corpus and rhetorical-index coverage.
- `corpus_search` retrieves exact words or phrases with article and page provenance.
- `terminology_compare` compares two to six formulations and returns sourced examples.

## Requirements

- Node.js 20 or newer
- A compatible SQLite database containing `sentences` and `jev_labels` tables

## Install and build

```bash
npm install
npm run build
```

## Run

```bash
CORPUSCRIBE_DB=/absolute/path/to/linguistic.sqlite npm start
```

or:

```bash
node dist/server.js --database /absolute/path/to/linguistic.sqlite
```

The database is opened in read-only mode. Corpus databases, PDFs, environment files, and generated indexes are excluded by `.gitignore`.

## Example MCP configuration

```json
{
  "mcpServers": {
    "corpuscribe": {
      "command": "node",
      "args": [
        "/absolute/path/to/corpuscribe/dist/server.js",
        "--database",
        "/absolute/path/to/linguistic.sqlite"
      ]
    }
  }
}
```

## Development

```bash
npm test
npm run check
npm run build
```

Tests use a synthetic SQLite fixture. No personal corpus or copyrighted article text is included in the repository.

## License

MIT
