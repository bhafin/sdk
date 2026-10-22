# Source and fixture provenance

The SDK source and public contract snapshots are Bharosa project material. Included schemas and examples are project-authored; test fixtures contain invented data. Test account and investor names, resource IDs, fund IDs, amounts, and dates are fixture values, not production records. They must not be used to identify real customers or provider holdings.

Generated runtime schemas and TypeScript models originate from `test/openapi.json`. `CONTRACT-SHA256` records the exact input digest; the canonical path in that file identifies provenance rather than a required sibling checkout. Generation and ordinary SDK tests run from this repository alone. The optional marketing example check requires a separate marketing checkout.

Runtime code imports no third-party packages. Contributor tooling pins TypeScript, which is distributed under Apache-2.0 with its own notices; its installed files are excluded from the SDK tarball and Git. Preserve upstream license and notice files when handling or redistributing tooling. Node.js and CI actions are external tooling with their own licenses.

The MIT license in this repository covers the SDK and included documentation/contracts. It does not license the API service implementation, analytics engine, ingestion adapters, or provider datasets. Do not add those materials to SDK source, fixtures, documentation, packages, or Git history.
