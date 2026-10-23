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

`node scripts/verify-package.mjs` uses the pinned tooling compiler by default. `BHAROSA_TSC` can select an already-installed compiler for compatibility checks. `npm test` builds, strictly typechecks runtime and tests, checks compatibility with the previous public declarations, then runs the compiled tests against `dist/`.

## Contracts and generated files

`test/openapi.json` is the public contract snapshot; `scripts/generate.mjs` derives runtime schemas, model type source, and the contract digest. Change the canonical public contract with its owner first, then update the snapshot and regenerate. Review generated changes; never copy private service source to recreate them.

For a behavior change, add a regression that demonstrates the user's observable outcome. Check both JavaScript and TypeScript consumers. Update the relevant guide and examples. In the Bharosa workspace, coordinate corresponding marketing guides, capability/endpoint registry, examples, changelog, and reviewed source hashes with the marketing owner. Local verification does not establish deployed availability.

## Review hygiene

Use small, logical commits with accurate author attribution. Keep unrelated changes separate. Review staged files and package contents for credentials, personal data, and private source. Internal handoff notes and build archives should stay local and untracked. Preserve third-party notices and document any new dependency's license and purpose.

Report security concerns privately using the process in [SECURITY.md](SECURITY.md).

## TypeScript implementation

Authored runtime modules are in `src/*.cts`; the ESM entry point is `src/index.mts`. `npm run build` compiles them with strict TypeScript and emits JavaScript plus declarations into ignored `dist/`. Public declarations come from this source, not a separately maintained client declaration file. CommonJS, ESM and browser-condition consumers use the same runtime.

Behavioral tests in `test/*.test.ts` are strictly compiled before execution. Synthetic JSON fixtures remain data. Tests deliberately exercising malformed JavaScript calls use checked reflective helpers; valid consumer examples and the frozen pre-migration API surface are checked separately. Do not use blanket `any` or disable compiler checks to make a migration pass.

The contract generators continue to own runtime schema data. TypeScript compilation does not replace network response validation. All credentials, session handling and first-party authorization remain the responsibility of the caller's transport and the server. No private service implementation belongs here.
