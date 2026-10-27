import { z } from "zod";
import * as infrai from "./infrai_client.js";

export const DeliveryRequest = z.object({
  assetId: z.string().min(1),
  subscriberId: z.string().min(1),
  downloadToken: z.string().min(1),
  content: z.string().min(1)
});
export type DeliveryRequest = z.infer<typeof DeliveryRequest>;

export async function deliverDigitalAsset(input: unknown) {
  const request = DeliveryRequest.parse(input);
  const flag = await infrai.flags.get("creator_delivery_updates");
  const updatesEnabled = flag.default_value ?? false;
  try {
    if (!request.downloadToken.startsWith("signed_")) throw new Error("delivery token was not signed");
    const result = { assetId: request.assetId, subscriberId: request.subscriberId, delivered: true, subscriberUpdated: updatesEnabled };
    return result;
  } catch (cause) {
    await infrai.errors.capture({
      title: "digital asset delivery failed",
      message: cause instanceof Error ? cause.message : String(cause),
      exception: cause,
      context: { assetId: request.assetId, subscriberId: request.subscriberId }
    });
    throw cause;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = { assetId: "preset-hoodie", subscriberId: "sub-42", downloadToken: "signed_demo", content: "new drop" };
  deliverDigitalAsset(input).then((result) => console.log(JSON.stringify(result))).catch((error) => console.error(error.message));
}
