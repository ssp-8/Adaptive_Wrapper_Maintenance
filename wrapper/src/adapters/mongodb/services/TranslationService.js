class TranslatorService {
  translateToSqlQuery(cqlQuery) {
    this.entityModel = this._getEntityModel(cqlQuery.entity);
    this.paramIndex = 1;
    const params = [];
    let sql = "";

    sql += this._getOperationPrefix(cqlQuery.operation);
    sql += this._handleEntity(cqlQuery.operation, cqlQuery.selection);
    sql += this._handlePayload(cqlQuery.operation, cqlQuery.payload, params);
    sql += this._handleFilter(cqlQuery.filter, params);
    sql += this._handleSort(cqlQuery.sort);
    sql += this._handleLimit(cqlQuery.limit);

    return { query: sql.trim(), params };
  }

  translateResult(sqlResult) {
    const results = Array.isArray(sqlResult) ? sqlResult : [sqlResult];

    return results
      .map((row) => {
        const translatedRow = {};
        for (const [key, value] of Object.entries(row)) {
          const attr = Object.keys(this.entityModel.mapping).find(
            (k) => this.entityModel.mapping[k] === key
          );

          translatedRow[attr || key] = value;
        }
        return translatedRow;
      })
      .filter((row) => Object.keys(row).length > 0);
  }

  _getEntityModel(entity) {
    try {
      const modelName = entity.charAt(0).toUpperCase() + entity.slice(1);
      return require(`../models/${modelName}Model`);
    } catch (e) {
      console.error(`Error loading model for entity: ${entity}`, e);
      throw new Error(`Model not found for entity: ${entity}`);
    }
  }

  _getOperationPrefix(op) {
    const ops = {
      SELECT: "SELECT",
      INSERT: "INSERT INTO",
      DELETE: "DELETE FROM",
      UPDATE: "UPDATE",
    };
    return ops[op] ? `${ops[op]} ` : "";
  }

  _handleEntity(op, attrs) {
    if (op === "SELECT") {
      const cols = attrs
        .split(",")
        .map((a) => {
          const attr = a.trim();
          if (attr === "*") return "*";

          const col = this.entityModel.mapping[attr];
          return col ? `${col} AS ${attr}` : null;
        })
        .filter((col) => col !== null);

      return `${cols.join(", ")} FROM ${this.entityModel.tableName} `;
    }
    return `${this.entityModel.tableName} `;
  }

  _handlePayload(op, payload, params) {
    if (!payload) return "";
    const { columns, placeholders } = this._extractColumnsAndValues(
      payload,
      params
    );

    if (op === "INSERT")
      return `(${columns.join(", ")}) VALUES (${placeholders.join(", ")}) `;

    if (op === "UPDATE")
      return `SET ${columns
        .map((c, i) => `${c} = ${placeholders[i]}`)
        .join(", ")} `;

    return "";
  }

  _extractColumnsAndValues(payload, params) {
    const columns = [],
      placeholders = [];

    for (const key of Object.keys(payload)) {
      if (!this.entityModel.mapping[key]) continue;

      columns.push(this.entityModel.mapping[key]);

      placeholders.push(`$${this.paramIndex++}`);
      params.push(payload[key]);
    }
    return { columns, placeholders };
  }

  _handleSort(sort = []) {
    if (!Array.isArray(sort) || sort.length === 0) return "";
    return `ORDER BY ${sort
      .map((s) => `${this.entityModel.mapping[s.attribute]} ${s.order}`)
      .join(", ")} `;
  }
  _handleFilter(filters = [], params) {
    if (!Array.isArray(filters) || filters.length === 0) return "";

    const conds = filters.map((f) => {
      const col = this.entityModel.mapping[f.attribute];
      const comp = (f.comparator || "=").toUpperCase();
      const val = this._normalizeValue(f.value);

      if (val === null && (comp === "IS" || comp === "IS NOT")) {
        return `${col} ${comp} NULL`;
      }

      if (Array.isArray(val) && (comp === "IN" || comp === "NOT IN")) {
        const ph = val.map(() => `$${this.paramIndex++}`).join(", ");
        params.push(...val);
        return `${col} ${comp} (${ph})`;
      }

      if (Array.isArray(val)) {
        if (val.length === 1) {
          params.push(val[0]);
          const p = `$${this.paramIndex++}`;
          return `${p} = ANY(${col})`;
        } else {
          const ph = val.map(() => `$${this.paramIndex++}`).join(", ");
          params.push(...val);
          return `${col} @> ARRAY[${ph}]`;
        }
      }

      params.push(val);
      const p = `$${this.paramIndex++}`;
      return `${col} ${comp} ${p}`;
    });

    return `WHERE ${conds.join(" AND ")} `;
  }

  _normalizeValue(value) {
    if (Array.isArray(value)) return value;

    if (typeof value === "string" && value.trim().startsWith("[")) {
      try {
        const jsonSafe = value.replace(/'/g, '"');
        const parsed = JSON.parse(jsonSafe);
        if (Array.isArray(parsed)) return parsed;
      } catch (err) {
        console.warn("Could not parse array-like string:", value);
      }
    }

    // Otherwise, return as-is
    return value;
  }

  _handleLimit(limit) {
    if (limit === undefined || limit === null) return "";
    const num = Number(limit);
    if (!Number.isFinite(num)) return "";
    return `LIMIT ${num} `;
  }
}

module.exports = TranslatorService;
