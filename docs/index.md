# Bharosa SDK guides

Build a Node.js integration with the Bharosa resource API. This SDK is currently a private, unpublished local package. An SDK checkout does not supply API access or credentials.

1. [Install locally and make your first request](getting-started.md).
2. [Work with portfolios and mixes](portfolios.md).
3. [Handle errors, cancellation, and retries](reliability.md).
4. [Run the synthetic examples](../examples/README.md).

For development, start with [CONTRIBUTING.md](../CONTRIBUTING.md). See the [source and package release checklist](releasing.md) before any distribution.

The SDK contains client transport, public contract types, and validation. The service that computes analytics is separate and remains closed source. Public contracts describe observable behavior; they do not grant access to service source or provider datasets.
