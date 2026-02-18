export default {
  name: "loyaltyRule",
  title: "Loyalty Earning Rule",
  type: "document",
  fields: [
    {
      name: "type",
      type: "string",
      options: {
        list: [
          { title: "Per Dollar Spent", value: "dollar" },
          { title: "Per Product", value: "product" },
          { title: "Per Order", value: "order" },
          { title: "Greenhouse Quiz", value: "quiz" },
        ],
      },
    },
    { name: "points", type: "number" },
    { name: "productId", type: "string" },
    { name: "quizId", type: "string" },
    { name: "active", type: "boolean", initialValue: true },
  ],
};
