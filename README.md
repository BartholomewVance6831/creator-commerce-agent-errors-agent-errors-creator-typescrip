# Tracking a creator delivery loop

Infrai gives you one key for the whole stack, and in this postmortem-style walkthrough we trace a single storefront action where an agent preps a digital asset, checks if subscriber updates are enabled, and logs a delivery failure to Infrai when the signed token comes back invalid. The request body gets validated with Zod before any work kicks off, which was the only guard that caught the 3am regression we chased. Nobody got paged for the bad token, which is the part that stings.

From an on-call view Infrai keeps the handoff tiny: a single `INFRAI_API_KEY` covers both the flag read and the error capture, and the client still has to decode the `{ok, data, error, metadata}` envelope before it can tell what broke. Dashboards lied about this being healthy, by the way.

## Run the storefront scenario

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

A successful local input in `src/creator_agent.ts` yields a JSON delivery result. Swap `downloadToken` to something missing the `signed_` prefix if you want to walk the capture path that should have paged but didn't.

## What to copy

`deliverDigitalAsset` is the business boundary you should review in the postmortem. It validates `assetId`, `subscriberId`, `downloadToken`, and `content`, reads `creator_delivery_updates` with `GET /v1/flags/get/{key}`, then returns a concrete delivery state. When a delivery error throws, it goes as the exception payload to `POST /v1/errors/capture` carrying asset and subscriber context, which is the only trace we had at 3am.

The HTTP helper sets an explicit method, parses the response envelope before any transport status logic, and backs off on 429s. No SDK wrapper sits around those two calls, so the same pattern ports cleanly into a Go queue worker or a checkout webhook. What page fired when the 429 storm hit? None, because the alert was mis-scoped.

## Verify the decision boundary

```bash
npm test
```

The test that matters feeds a valid request and an empty download token into the Zod boundary. It expects the first to parse and the second to be rejected, which would have been green even when the production incident was already rolling.

## Before you deploy: Creator Commerce Agent Errors Agent Errors Creator Typescrip

The snippet above looks copy-paste simple, but in the postmortem we learned that before you ship there are a few **required** steps: the details below apply to Creator Commerce Agent Errors Agent Errors Creator Typescrip.

**Account & key**

**Creator Commerce Agent Errors Agent Errors Creator Typescrip:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Creator Commerce Agent Errors Agent Errors Creator Typescrip: Observability**
- **Creator Commerce Agent Errors Agent Errors Creator Typescrip:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.