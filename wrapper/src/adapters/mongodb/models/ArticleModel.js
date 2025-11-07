// src/wrapper-postgresql/adapters/models/ArticleModel.js

const ArticleModel = {
  tableName: "article", // The actual table name in PostgreSQL

  // CDM Attribute Name (CamelCase) : SQL Column Name (snake_case)
  mapping: {
    articleId: "article_id",
    title: "title",
    summary: "summary",
    authors: "authors",
    categories: "categories",
    publishedDate: "published_date",
    latestVersion: "latest_version",
    doi: "doi",
    pdfLink: "pdf_link",
    // 'fullText' is included in your table definition but typically lives in MongoDB per CDM.
    // Assuming for simplicity that the PostgreSQL table also stores full_text.
    fullText: "full_text",
    // The foreign key to the metric table
    metrics: "metric_id",
  },

  // Defines the Primary Key attribute for this entity
  primaryKey: "articleId",

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
    "metrics", // This will be used to trigger joins/sub-lookups by the adapter
  ],
};

module.exports = ArticleModel;
