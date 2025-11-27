const natural = require("natural");
const FileService = require("../../../services/FileService");
const path = require("path");

class CorrectionService {
  constructor() {}

  async triggerCorrection(schOld, schNew, isFullRegeneration = false) {
    try {
      const normOld = this._normalizeOldSchema(schOld);

      const normNew = this._normalizeNewSchema(schNew);

      const delta = this._computeSchemaDelta(normOld, normNew);

      const correctSchema = this._applyCorrections(normOld, delta);

      const denormalizedCorrectSchema = this._denormalizeSchema(correctSchema);

      // await this._writeCorrectedSchemaToFile(denormalizedCorrectSchema);
      return { success: true, schema: denormalizedCorrectSchema };
    } catch (error) {
      console.error("Error during correction process:", error);
      return { success: false, error: error.message };
    }
  }

  async _writeCorrectedSchemaToFile(schema) {
    try {
      for (const [tableName, model] of Object.entries(schema)) {
        // write at path: absolute path:
        const absolutePath = path.resolve(
          __dirname,
          `../../../adapters/postgres/models/${model.cdmName}Model.js`
        );
        console.log("Writing corrected schema to file:", absolutePath);
        await FileService.writeFile(absolutePath, this._writeFormat(model));
      }
    } catch (error) {
      console.error("Error writing corrected schema to file:", error);
    }
  }

  _writeFormat(model) {
    // expected format of model file is something like ArticleModel.js
    return `
// src/wrapper-postgresql/adapters/models/${model.cdmName}Model.js

const ${model.cdmName}Model = {
  tableName: "${model.tableName}", // The actual table name in PostgreSQL

  // CDM Attribute Name (CamelCase) : SQL Column Name (snake_case)
  mapping: {
    ${Object.entries(model.mapping)
      .map(([cdmAttr, localAttr]) => `${cdmAttr}: "${localAttr}"`)
      .join(",\n    ")}
  },

  // Defines the Primary Key attribute for this entity
  primaryKey: "${model.primaryKey}",
  cdmName: "${model.cdmName}", // The name of the entity in the CDM

  // All attributes exposed to the Mediator/CDM
  attributes: [
    ${model.attributes.map((attr) => `"${attr}"`).join(",\n    ")}

  ],
};

module.exports = ${model.cdmName}Model;
`;
  }

  _normalizeOldSchema(schOld) {
    // schOld is of the form: { tableName: model }
    // model has tableName, mapping: { cdmColumnName: localColumnName }, attributes: [... // cdmColumnNames]
    const normalized = {};
    for (const [tableName, model] of Object.entries(schOld)) {
      const normalizedTable = {
        attributes: [],
        mapping: { ...model.mapping },
        cdmName: model.cdmName,
        primaryKey: model.primaryKey,
      };
      for (const [cdmAttr, localAttr] of Object.entries(model.mapping)) {
        normalizedTable.attributes.push(localAttr);
      }
      normalized[tableName] = normalizedTable;
    }
    return normalized;
  }

  _normalizeNewSchema(schNew) {
    // schNew is of the form: [ { table_name: '', column_name: '', data_type: '' }, ... ]
    const normalized = {};
    for (const row of schNew) {
      if (!normalized[row.table_name]) {
        normalized[row.table_name] = { attributes: [], mapping: {} };
      }
      normalized[row.table_name].attributes.push(row.column_name);
    }
    return normalized;
  }

  _computeSchemaDelta(normOld, normNew) {
    const delta = {};
    for (const [tableName, newTable] of Object.entries(normNew)) {
      const oldTable = normOld[tableName] || { attributes: [], mapping: {} };
      const tableDelta = [];
      console.log("Comparing tables:", tableName, oldTable, newTable);
      for (const attr of newTable.attributes) {
        if (!oldTable.attributes.includes(attr)) {
          tableDelta.push({
            type: "added",
            newAttribute: attr,
            likelyCdmAttribute: this._getCdmAttributeName(
              oldTable.attributes,
              oldTable.mapping,
              attr
            ),
          });
        }
      }
      for (const attr of oldTable.attributes) {
        if (!newTable.attributes.includes(attr)) {
          tableDelta.push({ type: "removed", oldAttribute: attr });
        }
      }
      if (tableDelta.length > 0) {
        delta[tableName] = tableDelta;
      }
    }
    return delta;
  }

  _applyCorrections(normOld, delta, isFullRegeneration = false) {
    let correctedSchema;

    if (isFullRegeneration) {
      // full copy of original schema
      correctedSchema = JSON.parse(JSON.stringify(normOld));
    } else {
      // start empty → only changed tables will be added
      correctedSchema = {};
    }

    for (const [tableName, changes] of Object.entries(delta)) {
      // If table does not exist in the incremental schema, create it
      if (!correctedSchema[tableName]) {
        correctedSchema[tableName] = { attributes: [], mapping: {} };

        // If incremental mode and this table existed previously,
        // initialize with old values first
        if (!isFullRegeneration && normOld[tableName]) {
          correctedSchema[tableName] = JSON.parse(
            JSON.stringify(normOld[tableName])
          );
        }
      }

      // Apply changes
      for (const change of changes) {
        if (change.type === "added") {
          correctedSchema[tableName].attributes.push(change.newAttribute);

          if (change.likelyCdmAttribute) {
            correctedSchema[tableName].mapping[change.likelyCdmAttribute] =
              change.newAttribute;
          }
        } else if (change.type === "removed") {
          const idx = correctedSchema[tableName].attributes.indexOf(
            change.oldAttribute
          );

          if (idx > -1) {
            correctedSchema[tableName].attributes.splice(idx, 1);

            for (const [cdmAttr, localAttr] of Object.entries(
              correctedSchema[tableName].mapping
            )) {
              if (localAttr === change.oldAttribute) {
                delete correctedSchema[tableName].mapping[cdmAttr];
                break;
              }
            }
          }
        }
      }
    }

    return correctedSchema;
  }

  _getCdmAttributeName(oldAttributes, oldMapping, attr) {
    // heuristic to get CDM attribute name from local attribute, checking with older attributes, if the name matches or is similar
    console.log(
      "Finding CDM attribute for local attribute:",
      oldAttributes,
      oldMapping,
      attr
    );
    // trying to find similarity between two names
    const similarities = {};
    for (const oldAttr of oldAttributes) {
      similarities[oldAttr] = this._similarityScore(oldAttr, attr);
    }
    console.log("Similarities computed:", similarities);
    const sorted = Object.entries(similarities).sort((a, b) => b[1] - a[1]);
    // threshold of 0.6 for similarity
    if (sorted.length > 0 && sorted[0][1] >= 0.6) {
      const likelyLocalAttr = sorted[0][0];
      // find corresponding CDM attribute
      for (const [cdmAttr, localAttr] of Object.entries(oldMapping)) {
        if (localAttr === likelyLocalAttr) {
          return cdmAttr;
        }
      }
    }
    return null;
  }
  _similarityScore(a, b) {
    a = a.toLowerCase();
    b = b.toLowerCase();

    // 1. Levenshtein similarity
    const lev =
      1 - natural.LevenshteinDistance(a, b) / Math.max(a.length, b.length);

    // 2. Token similarity (snake/camel split)
    const split = (s) =>
      s.split(/[_\W]+|(?=[A-Z])/).map((x) => x.toLowerCase());
    const ta = new Set(split(a));
    const tb = new Set(split(b));
    const inter = [...ta].filter((x) => tb.has(x)).length;
    const token = inter / Math.max(ta.size, tb.size);

    // 3. Jaccard of character trigrams
    const ngrams = (s) =>
      new Set(natural.NGrams.trigrams(s).map((t) => t.join("")));
    const na = ngrams(a);
    const nb = ngrams(b);
    const inter2 = [...na].filter((x) => nb.has(x)).length;
    const union2 = na.size + nb.size - inter2;
    let ngramSim = inter2 / union2;
    if (isNaN(ngramSim)) ngramSim = 0;

    // 4. Soundex similarity
    const sx = new natural.SoundEx();
    const sxA = sx.process(a);
    const sxB = sx.process(b);
    const soundexSim = sxA === sxB ? 1 : 0;

    console.log(
      `Similarity between "${a}" and "${b}": Lev=${lev}, Token=${token}, NGram=${ngramSim}, Soundex=${soundexSim}`
    );

    // returning this as of now
    return lev;
  }

  _denormalizeSchema(correctSchema) {
    // convert back to original schema format with table models
    const denormalized = {};
    for (const [tableName, table] of Object.entries(correctSchema)) {
      const model = {
        tableName: tableName,
        mapping: {},
        attributes: [],
        cdmName: table.cdmName,
        primaryKey: table.primaryKey,
      };
      for (const [cdmAttr, localAttr] of Object.entries(table.mapping)) {
        model.mapping[cdmAttr] = localAttr;
        model.attributes.push(cdmAttr);
      }
      denormalized[tableName] = model;
    }
    return denormalized;
  }
}

module.exports = CorrectionService;
