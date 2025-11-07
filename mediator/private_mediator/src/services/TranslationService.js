class TranslationService {
  constructor(cqlRules, cdmSchema) {
    this.cqlRules = cqlRules;
    this.cdmSchema = cdmSchema;
    this.errors = [];
    this.formattedQuery = {};
    this.requiredKey = cqlRules ? cqlRules.cqlKeys[0] : null;
  }

  async translateQuery(query = {}) {
    this.errors = [];
    this.formattedQuery = {};

    if (!this.cqlRules || !this.cdmSchema) {
      this.errors.push('CQL rules or CDM schema not loaded');
      return { errors: this.errors, formattedQuery: null, success: false };
    }

    const httpMethod = query[this.requiredKey];
    const methodDef = this.cqlRules[this.requiredKey][httpMethod];
    const operation = methodDef.name;
    const entityKey = this.cqlRules.cqlEntityKey;
    const entity = query[entityKey];

    const attributes =
      operation === 'SELECT' ? query[this.cqlRules.cqlSelectionKey] : undefined;

    const isValid = this._isEntityAndAttrValid(entity, attributes);
    if (!isValid || this.errors.length > 0)
      return { errors: this.errors, formattedQuery: null, success: false };

    const entitySchema = this.cdmSchema.definitions[entity];
    const cqlKeys = this.cqlRules.cqlKeys;

    for (const key of cqlKeys) {
      if (!query[key]) continue;
      const keyValue = this._formatKey(key, query[key], entitySchema);
      if (!keyValue || this.errors.length) break;
      else this.formattedQuery[key] = keyValue;
    }

    console.log('Formatted Query:', this.formattedQuery);
    return {
      errors: this.errors,
      formattedQuery: this.formattedQuery,
      success: this.errors.length === 0,
    };
  }

  _isEntityAndAttrValid(entity, attributes) {
    if (!entity) {
      this.errors.push('Entity is required');
      return false;
    }

    const def = this.cdmSchema.definitions[entity];
    if (!def) {
      this.errors.push(`Entity doesn't exist: ${entity}`);
      return false;
    }

    if (!attributes) return true;

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
        return false;
      }
    });
    return true;
  }

  _formatKey(key, value, schema = {}) {
    const keyFormat = this.cqlRules[key];

    // If no special rule for this key, copy as-is
    if (!keyFormat) {
      return value;
    } else if (key === 'sort') {
      return this._handleSort(value, schema, keyFormat);
    } else if (key === 'filter') {
      return this._handleFilter(value, schema);
    } else if (keyFormat[value]) {
      return keyFormat[value].name;
    } else {
      this.errors.push(`Invalid value for ${key}: ${value}`);
      return false;
    }
  }

  _handleSort(sortValue, schema, sortFormat) {
    // Expected format: "attr1:asc,attr2:desc"
    const parts = String(sortValue)
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    const orders = this.cqlRules.sort || {};
    const out = [];

    for (const part of parts) {
      const [attr, order = 'asc'] = part.split(':').map(p => p.trim());
      if (!schema.attributes || !schema.attributes.includes(attr)) {
        this.errors.push(`Sort attribute unknown: ${attr}`);
        return false;
      }
      if (!orders[order]) {
        this.errors.push(`Sort order unknown: ${order}`);
        return false;
      }
      out.push({ attribute: attr, order });
    }

    return out;
  }

  _handleFilter(filterValue, schema) {
    // Find comparators longest-first to avoid partial matches (e.g. '>=' before '>')
    const comparators = Object.keys(this.cqlRules.filter || {}).sort(
      (a, b) => b.length - a.length
    );
    const conditions = String(filterValue)
      .split('&&')
      .map(c => c.trim())
      .filter(Boolean);

    const out = [];

    for (const cond of conditions) {
      let matched = false;
      console.log('Processing filter condition:', cond);
      for (const comp of comparators) {
        const idx = cond.indexOf(comp);
        if (idx > -1) {
          const attr = cond.slice(0, idx).trim();
          const val = cond.slice(idx + comp.length).trim();
          if (!schema.attributes || !schema.attributes.includes(attr)) {
            this.errors.push(`Filter attribute unknown: ${attr}`);
            return false;
          }
          out.push({ attribute: attr, comparator: comp, value: val });
          matched = true;
          break;
        }
      }
      if (!matched) {
        this.errors.push(`Invalid filter condition: ${cond}`);
        return false;
      }
    }

    if (out.length === 0) {
      this.errors.push('Invalid filter');
    } else {
      return out;
    }
    return false;
  }
}
module.exports = TranslationService;
