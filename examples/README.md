# Synthetic examples

These TypeScript functions use the actual `bharosa` interface and receive a client from the caller. All identifiers, dates, values, and names are fictional. They are not live API samples or provider data.

| File                                     | Demonstrates                                         |
| ---------------------------------------- | ---------------------------------------------------- |
| [read-account.ts](read-account.ts)       | First read and an explicit list cursor               |
| [portfolio-mixes.ts](portfolio-mixes.ts) | Saved/in-memory mixes and MutualFund delegation      |
| [create-investor.ts](create-investor.ts) | Typed mutation with a caller-managed idempotency key |

From the SDK root, install contributor tooling and build as described in [CONTRIBUTING.md](../CONTRIBUTING.md), then run:

```sh
node scripts/check-local-examples.mjs
```

The checker strictly compiles these examples and executes them against the built SDK using synthetic responses. Its injected transport checks the operation, request body, account, and credentials. It makes no external HTTP requests and needs no environment secrets. Temporary outputs are removed when it finishes.

In your application, construct a client as shown in [Getting started](../docs/getting-started.md), then use IDs and dates from your authorized environment. For mutations, persist an idempotency key per logical operation before dispatch; never generate a new key merely because a response was lost.
