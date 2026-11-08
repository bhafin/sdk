## v0.10 release provenance

The v0.10 release uses verified reconstructed SDK 0.9/API13 content. Original signed release ancestry remains unavailable; new source integration commits preserve existing public history without claiming recovery of those signatures. No production data migration or TER change is required. Publication requires coordinated API, SDK, documentation and plugin verification.

# Source and package release gates

Source preparation does not authorize a push, a visibility change, npm publication, API deployment, or release of any sibling project.

## Before making SDK source public

- Verify the MIT notice identifies Bharosa Technoserve Private Limited and covers the SDK only. Preserve third-party notices. Public API schemas and synthetic fixtures need clear redistribution provenance.
- Keep API implementation, analytics internals, ingestion adapters, provider datasets, credentials, and internal handoffs outside both the working tree selection and all published Git history.
- Confirm the repository destination and maintainer ownership before adding repository, homepage, or issue-tracker metadata. Do not invent URLs.
- Enable and test private vulnerability reporting; establish maintainers and contribution expectations.
- Review every intended tracked file, all commits, and generated artifacts for sensitive information. A clean current tree alone does not prove clean history.
- Verify a clean checkout using the contributor commands and supported runtime/compiler matrix. Confirm examples are synthetic and execute against the SDK.
- Reconcile marketing documentation with the verified SDK behavior and actual availability through the marketing owner.
- Obtain explicit authorization for the external push or visibility change. Keep npm publication guards in place unless separately authorized.

## Before publishing an npm package

- Confirm package-name ownership and intended registry, version, release notes, compatibility matrix, and source repository metadata.
- Confirm usable API access/provisioning instructions without claiming unverified deployment availability.
- Build and verify a fresh tarball; inspect its exact files, license, types, browser transport and server-only credential enforcement, and ESM/CommonJS behavior. Do not reuse an older local archive.
- Run tests, local examples, packed-consumer checks, and relevant website example checks. Record exact Node/TypeScript versions and artifact digest.
- Review dependency licenses and security findings, including development dependencies and CI changes.
- Obtain explicit publication authorization before changing `private` or `prepublishOnly`, tagging/pushing a release, or publishing. Document precisely what was released.
