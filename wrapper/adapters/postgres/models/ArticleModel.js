
// src/wrapper-postgresql/adapters/models/ArticleModel.js

const ArticleModel = {
  tableName: "article", // The actual table name in PostgreSQL

  // CDM Attribute Name (CamelCase) : SQL Column Name (snake_case)
  mapping: {
    articleId: "article_id",
    title: "title",
    summary: "summaries",
    authors: "authors",
    categories: "categories",
    publishedDate: "published_date",
    latestVersion: "latest_version",
    doi: "doi",
    pdfLink: "pdf_link",
    fullText: "full_text",
    metrics: "metric_id"
  },

  // Defines the Primary Key attribute for this entity
  primaryKey: "articleId",
  cdmName: "Article", // The name of the entity in the CDM

  // All attributes exposed to the Mediator/CDM
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
    "metrics"

  ],
};

module.exports = ArticleModel;
