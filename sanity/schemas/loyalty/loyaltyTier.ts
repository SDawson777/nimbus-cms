export default {
  name: "loyaltyTier",
  title: "Loyalty Tier",
  type: "document",
  fields: [
    { name: "name", type: "string" },
    { name: "minPoints", type: "number" },
    {
      name: "multiplier",
      type: "number",
      description: "Point multiplier (1.0 = base)",
    },
    { name: "icon", type: "image" },
    { name: "color", type: "string" },
    { name: "active", type: "boolean", initialValue: true },
  ],
};
