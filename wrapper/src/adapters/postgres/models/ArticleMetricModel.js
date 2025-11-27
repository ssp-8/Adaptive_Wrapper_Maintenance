// src/wrapper-postgresql/adapters/models/ArticleMetricModel.js

const ArticleMetricModel = {
  tableName: "article_metric", // The actual table name in PostgreSQL

  // CDM Attribute Name (CamelCase) : SQL Column Name (snake_case)
  mapping: {
    id: "id", // Primary key for the metric table itself
    views: "views",
    downloads: "downloads",
    citationCount: "citation_count", // CDM 'citationCount' maps to SQL 'citation_count'
    lastUpdated: "last_updated", // CDM 'lastUpdated' maps to SQL 'last_updated'
  },

  // Defines the Primary Key attribute for this entity
  // This is used internally by the Wrapper, not typically exposed to the Mediator directly
  primaryKey: "id",

  // All attributes exposed to the Mediator/CDM (excluding the internal ID)
  attributes: ["views", "downloads", "citationCount", "lastUpdated"],

  cdmName: "ArticleMetric", // The name of the entity in the CDM
};

module.exports = ArticleMetricModel;
