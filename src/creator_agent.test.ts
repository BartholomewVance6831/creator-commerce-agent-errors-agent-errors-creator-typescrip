import assert from "node:assert/strict";
import { DeliveryRequest } from "./creator_agent.js";

const valid = { assetId: "asset-1", subscriberId: "buyer-9", downloadToken: "signed_token", content: "lookbook" };
assert.equal(DeliveryRequest.safeParse(valid).success, true);
assert.equal(DeliveryRequest.safeParse({ ...valid, downloadToken: "" }).success, false);
console.log("delivery request boundary checks passed");
