# Bharosa SDK guides

Build a Node.js integration with the Bharosa resource API. Install the published SDK with `npm install bharosa`. Use an API key for baseline market data and optional authorized own-account access; other users' accounts require OAuth consent.

1. [Install and make your first request](getting-started.md).
2. [Work with portfolios and mixes](portfolios.md).
3. [Handle errors, cancellation, and retries](reliability.md).
4. [Use monthly market snapshots](monthly-market-data.md).
5. [Use deterministic synthetic sample portfolios](testing.md).
6. [Run the synthetic examples](../examples/README.md).

For development, start with [CONTRIBUTING.md](../CONTRIBUTING.md). See the [source and package release checklist](releasing.md) before any distribution.

The SDK contains client transport, public contract types, and validation. The service that computes analytics is separate and remains closed source. Public contracts describe observable behavior; they do not grant access to service source or provider datasets.

## SDK 0.8.0

[Stored indexes and fund benchmarks](benchmarks.md) describes the stored-index and benchmark methods introduced in SDK 0.8.0.

- [Fund portfolio AUM](fund-aum.md) — inspect public fund holdings and stored AUM together.
