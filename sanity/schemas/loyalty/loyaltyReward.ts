export default {
  name: "loyaltyReward",
  title: "Loyalty Reward",
  type: "document",
  fields: [
    { name: "title", type: "string" },
    { name: "description", type: "text" },
    { name: "costPoints", type: "number" },
    {
      name: "rewardType",
      type: "string",
      options: {
        list: [
          { title: "Dollar Off", value: "dollar_off" },
          { title: "Percent Off", value: "percent_off" },
          { title: "Free Product", value: "free_product" },
          { title: "Gear", value: "gear" },
        ],
      },
    },
    { name: "discountValue", type: "number" },
    { name: "tierRequired", type: "reference", to: [{ type: "loyaltyTier" }] },
    { name: "image", type: "image" },
    { name: "active", type: "boolean", initialValue: true },
    { name: "startDate", type: "datetime" },
    { name: "endDate", type: "datetime" },
  ],
};
