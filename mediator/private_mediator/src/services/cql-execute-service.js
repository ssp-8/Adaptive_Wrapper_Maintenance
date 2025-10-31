const fs = require('fs');
const { configFilePaths } = require('../config/config');
const Logger = require('./logger');

const cqlRulesPath = configFilePaths.CQL_PATH;
const cdmPath = configFilePaths.CDM_PATH;

class CqlExecuteService {
  constructor() {
    this.cqlRules = undefined;
    this.cdmSchema = undefined;
    this.errors = [];
    this.formattedQuery = {};
    this.requiredKey = undefined;
  }

  async executeCqlQuery(query = {}) {
    this.errors = [];
    this.formattedQuery = {};

    const httpMethod = query[this.requiredKey];
    const methodDef = this.cqlRules[this.requiredKey][httpMethod];
    const operation = methodDef.name;
    const entityKey = this.cqlRules.cqlEntityKey;
    const entity = query[entityKey];

    const attributes =
      operation === 'SELECT' ? query[this.cqlRules.cqlSelectionKey] : undefined;

    this.validateEntity(entity, attributes);
    if (this.errors.length > 0) return;

    const entitySchema = this.cdmSchema.definitions[entity];
    const cqlKeys = this.cqlRules.cqlKeys;

    for (const key of cqlKeys) {
      if (!query[key]) continue;
      this.formatKey(key, query[key], entitySchema);
      if (this.errors.length) break;
    }

    return;
  }

  validateEntity(entity, attributes) {
    if (!entity) {
      this.errors.push('Entity is required');
      return;
    }

    const def = this.cdmSchema.definitions[entity];
    if (!def) {
      this.errors.push(`Entity doesn't exist: ${entity}`);
      return;
    }

    if (!attributes) return;

    const attrs = Array.isArray(attributes)
      ? attributes
      : String(attributes)
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);

    const allowedAttributes = def.attributes || [];

    attrs.forEach(attr => {
      if (attr != '*' && !allowedAttributes.includes(attr)) {
        this.errors.push(`Attribute doesn't exist: ${attr}`);
      }
    });
  }

  formatKey(key, value, schema = {}) {
    const keyFormat = this.cqlRules[key];

    // If no special rule for this key, copy as-is
    if (!keyFormat) {
      this.formattedQuery[key] = value;
      return;
    }

    if (key === 'sort') {
      // Expected format: "attr1:asc,attr2:desc"
      const parts = String(value)
        .split(',')
        .map(p => p.trim())
        .filter(Boolean);

      const orders = this.cqlRules.sort || {};
      const out = [];

      for (const part of parts) {
        const [attr, order = 'asc'] = part.split(':').map(p => p.trim());
        if (!schema.attributes || !schema.attributes.includes(attr)) {
          this.errors.push(`Sort attribute unknown: ${attr}`);
          return;
        }
        if (!orders[order]) {
          this.errors.push(`Sort order unknown: ${order}`);
          return;
        }
        out.push({ attribute: attr, order });
      }

      this.formattedQuery[key] = out;
      return;
    }

    if (key === 'filter') {
      // Find comparators longest-first to avoid partial matches (e.g. '>=' before '>')
      const comparators = Object.keys(this.cqlRules.filter || {}).sort(
        (a, b) => b.length - a.length
      );
      const conditions = String(value)
        .split('&&')
        .map(c => c.trim())
        .filter(Boolean);

      const out = [];

      for (const cond of conditions) {
        let matched = false;
        for (const comp of comparators) {
          const idx = cond.indexOf(comp);
          if (idx > -1) {
            const attr = cond.slice(0, idx).trim();
            const val = cond.slice(idx + comp.length).trim();
            if (!schema.attributes || !schema.attributes.includes(attr)) {
              this.errors.push(`Filter attribute unknown: ${attr}`);
              return;
            }
            out.push({ attribute: attr, comparator: comp, value: val });
            matched = true;
            break;
          }
        }
        if (!matched) {
          this.errors.push(`Invalid filter condition: ${cond}`);
          return;
        }
      }

      if (out.length === 0) {
        this.errors.push('Invalid filter');
      } else {
        this.formattedQuery[key] = out;
      }
      return;
    }

    // Default: map value via rules (if mapping exists) else pass-through
    const mapped = keyFormat[value];
    this.formattedQuery[key] = mapped ? mapped.name : value;
  }

  async loadConfigFiles() {
    this.errors = this.errors || [];
    const reads = await Promise.allSettled([
      fs.promises.readFile(cqlRulesPath, 'utf8'),
      fs.promises.readFile(cdmPath, 'utf8'),
    ]);

    // CQL rules
    if (reads[0].status === 'fulfilled') {
      try {
        this.cqlRules = JSON.parse(reads[0].value);
        this.requiredKey = this.cqlRules.cqlKeys[0];
      } catch (err) {
        Logger.logError(`Error parsing CQL rules JSON: ${err.message}`);
        this.errors.push(`CQL parse error: ${err.message}`);
      }
    } else {
      const reason = reads[0].reason;
      Logger.logError(
        `Error reading CQL rules file: ${reason?.message || reason}`
      );
      this.errors.push(`CQL read error: ${reason?.message || reason}`);
    }

    // CDM schema
    if (reads[1].status === 'fulfilled') {
      try {
        this.cdmSchema = JSON.parse(reads[1].value);
      } catch (err) {
        Logger.logError(`Error parsing CDM schema JSON: ${err.message}`);
        this.errors.push(`CDM parse error: ${err.message}`);
      }
    } else {
      const reason = reads[1].reason;
      Logger.logError(
        `Error reading CDM schema file: ${reason?.message || reason}`
      );
      this.errors.push(`CDM read error: ${reason?.message || reason}`);
    }
  }
}

module.exports = CqlExecuteService;
