# Contributing to Corpuscribe

Thanks for helping make literature-grounded writing easier to inspect and reproduce.

## Start locally

Use Node.js 22, then run `npm ci`, `npm test`, `npm run check` and `npm run build`. The README includes a fictional demo corpus for manual MCP testing.

## Report a problem

Open a GitHub issue with the expected behavior, actual behavior, Node.js version, MCP client and a minimal reproduction. Use fictional sentences and identifiers. Remove credentials, private paths and unpublished text from logs.

## Propose a change

Describe the writing or retrieval problem first. Keep the SQLite reader read-only, use parameterized SQL, and preserve source identifiers in results. Add focused tests for changed behavior and describe remaining limitations in the pull request.

Please distinguish measured frequencies, classifier predictions and scientific judgments. Claims about corpus coverage should identify which rows and schemas were counted.
