/** Compare shipping-relevant fields (excludes email). */
const ADDR_KEYS = [
  "firstName",
  "lastName",
  "company",
  "address1",
  "address2",
  "city",
  "state",
  "postcode",
  "country",
  "phone",
] as const;

export function shippingAddressDiffersFromBilling(
  billing: Record<string, string>,
  shipping: Record<string, string>
): boolean {
  return ADDR_KEYS.some((k) => (billing[k] ?? "").trim() !== (shipping[k] ?? "").trim());
}
