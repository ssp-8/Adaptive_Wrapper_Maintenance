const UserActionModel = {
  tableName: "user_action",

  mapping: {
    actionId: "action_id",
    userId: "user_id",
    articleId: "article_id",
    type: "type",
    timestamp: "timestamp",
    status: "status",
  },

  primaryKey: "actionId",

  attributes: [
    "actionId",
    "userId",
    "articleId",
    "type",
    "timestamp",
    "status",
  ],
};

module.exports = UserActionModel;
