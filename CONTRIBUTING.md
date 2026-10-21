# Contributing

This is an unpublished SDK under local preparation. Keep changes limited to the client, public contracts, documentation, and synthetic tests. Do not copy API implementation, analytics code, provider data, credentials, or internal operational notes into this repository.

## Development

Use supported Node.js 22.12+ or 24 LTS. Runtime dependencies remain empty. Contributor TypeScript tooling lives in `tooling/` and is separate from the distributable package.

```sh
npm --prefix tooling ci --ignore-scripts
node scripts/check-generated.mjs
npm run build
npm test
node scripts/check-local-examples.mjs
node scripts/verify-package.mjs
```

The unit suite uses synthetic responses. One HTTP regression opens ephemeral loopback ports to verify redirect protection. It does not use live credentials or a live Bharosa service. Packed-consumer verification writes to temporary directories and installs only the local tarball.

`node scripts/verify-package.mjs` uses the pinned tooling compiler by default. `BHAROSA_TSC` can select an already-installed compiler for compatibility checks. Build before running tests: they consume the distributable `dist/` files.

## Contracts and generated files

`test/openapi.json` is the public contract snapshot; `scripts/generate.mjs` derives runtime schemas, model declarations, and the contract digest. Change the canonical public contract with its owner first, then update the snapshot and regenerate. Review generated changes; never copy private service source to recreate them.

For a behavior change, add a regression that demonstrates the user's observable outcome. Check both JavaScript and TypeScript consumers. Update the relevant guide and examples. In the Bharosa workspace, coordinate corresponding marketing guides, capability/endpoint registry, examples, changelog, and reviewed source hashes with the marketing owner. Local verification does not establish deployed availability.

## Review hygiene

Use small, logical commits with accurate author attribution. Keep unrelated changes separate. Review staged files and package contents for credentials, personal data, and private source. Internal handoff notes and build archives should stay local and untracked. Preserve third-party notices and document any new dependency's license and purpose.

Report security concerns privately using the process in [SECURITY.md](SECURITY.md).
