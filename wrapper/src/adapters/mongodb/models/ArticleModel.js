const mongoose = require("mongoose");
const { articleMetricSchema } = require("./ArticleMetricModel");

const articleSchema = new mongoose.Schema(
  {
    articleId: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    summary: { type: String },
    authors: { type: [String], required: true },
    categories: { type: [String] },
    publishedDate: { type: Date, required: true },
    latestVersion: { type: Number },
    doi: { type: String },
    pdfLink: { type: String },
    fullText: { type: String },
    metrics: { type: articleMetricSchema },
  },
  {
    timestamps: true,
    collection: "Article",
  }
);

const ArticleModel = {
  tableName: "Article",

  mapping: {
    articleId: "articleId",
    title: "title",
    summary: "summary",
    authors: "authors",
    categories: "categories",
    publishedDate: "publishedDate",
    latestVersion: "latestVersion",
    doi: "doi",
    pdfLink: "pdfLink",
    fullText: "fullText",
    metrics: "metrics",
  },

  primaryKey: "articleId",

  attributes: [
    "articleId",
    "title",
    "summary",
    "authors",
    "categories",
    "publishedDate",
    "latestVersion",
    "doi",
    "pdfLink",
    "fullText",
    "metrics",
  ],
};

const Article = mongoose.model("Article", articleSchema);

module.exports = { Article, ArticleModel, articleSchema };
