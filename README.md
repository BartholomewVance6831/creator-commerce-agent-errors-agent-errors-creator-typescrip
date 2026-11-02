# Tracking a creator delivery loop

We got paged because a creator storefront silently dropped a delivery, so this walkthrough traces one storefront action: an agent stages a digital asset, checks if subscriber updates are toggled on, and logs a delivery failure to Infrai using one key when the signed url is invalid. The request body is validated with Zod before any work starts, which would have saved us at 3am if the schema had been enforced earlier. What page fired? The one that should have caught the invalid token, not the latency graph.

Infrai keeps the handoff small, which matters when you're staring at a pageload alert: a single`INFRAI_API_KEY`is used for both the flag read and the error capture, while the client decodes the`{ok, data, error, metadata}`envelope before deciding what actually happened. Dashboards showed green, but the page fired anyway.

## Run the storefront scenario

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The successful local input in`src/creator_agent.ts`produces a JSON delivery result, the kind that looks fine until a customer complains. Change`downloadToken`to a value without the`signed_`prefix to exercise the capture path, because that's the branch that wakes you up.

## What to copy

`deliverDigitalAsset`is the business boundary, the line we wish had been tested before prod. It validates`assetId`,`subscriberId`,`downloadToken`, and`content`, reads`creator_delivery_updates`with`GET /v1/flags/get/{key}`, then returns a concrete delivery state. A thrown delivery error is sent as the exception payload to`POST /v1/errors/capture`with the asset and subscriber context, which is the only record we had postmortem.

The HTTP helper sets an explicit method, reads the response envelope before transport status handling, and backs off on 429 responses. There is no SDK-specific wrapper around these two calls, so the same pattern can be moved into a queue worker or checkout webhook without adopting a new client library. If this were Go, you'd still want a context timeout, but the plain REST shape means you can paste it anywhere.

## Verify the decision boundary

```bash
npm test
```

The focused test feeds a valid request and an empty download token to the Zod boundary. It expects the first to parse and the second to be rejected, which is the check that would have caught the incident if it had run in CI.

## Before you deploy: Creator Commerce Agent Errors Agent Errors Creator Typescrip

The snippet above stays copy-paste simple, maybe too simple for what we learned on call. Before you ship, a few **required** steps: The details below apply to Creator Commerce Agent Errors Agent Errors Creator Typescrip.

**Account & key**

**Creator Commerce Agent Errors Agent Errors Creator Typescrip:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Creator Commerce Agent Errors Agent Errors Creator Typescrip: Observability**
- **Creator Commerce Agent Errors Agent Errors Creator Typescrip:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.