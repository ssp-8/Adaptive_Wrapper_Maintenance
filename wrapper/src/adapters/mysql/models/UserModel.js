const UserModel = {
  tableName: "user",
  mapping: {
    userId: "user_id",
    email: "email",
    name: "user_name",
    role: "role",
    createdAt: "created_at",
  },

  primaryKey: "userId",

  attributes: ["userId", "email", "name", "role", "createdAt"],
};

module.exports = UserModel;
