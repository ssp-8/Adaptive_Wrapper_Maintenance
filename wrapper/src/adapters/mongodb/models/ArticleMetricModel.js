const mongoose = require("mongoose");

const articleMetricSchema = new mongoose.Schema(
  {
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    citations: { type: Number, default: 0 },
  },
  { _id: false }
);

const ArticleMetricModel = {
  tableName: "ArticleMetric",

  mapping: {
    views: "views",
    downloads: "downloads",
    citations: "citations",
  },

  primaryKey: null,

  attributes: ["views", "downloads", "citations"],
};

const ArticleMetric = mongoose.model("ArticleMetric", articleMetricSchema);

module.exports = { ArticleMetric, ArticleMetricModel, articleMetricSchema };
