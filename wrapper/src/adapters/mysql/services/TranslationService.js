class TranslatorService {
  translateToSqlQuery(cqlQuery) {
    this.entityModel = this._getEntityModel(cqlQuery.entity);
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
    if (!Array.isArray(sqlResult)) return [sqlResult];
    return sqlResult.map((row) => {
      const translatedRow = {};
      for (const [key, value] of Object.entries(row)) {
        const attr = Object.keys(this.entityModel.mapping).find(
          (k) => this.entityModel.mapping[k] === key
        );
        translatedRow[attr || key] = value;
      }
      return translatedRow;
    });
  }

  _getEntityModel(entity) {
    return require(`../models/${entity}Model`);
  }

  _getOperationPrefix(op) {
    const ops = {
      SELECT: "SELECT ",
      INSERT: "INSERT INTO ",
      DELETE: "DELETE FROM ",
      UPDATE: "UPDATE ",
    };
    return ops[op] || "";
  }

  _handleEntity(op, attrs) {
    if (op === "SELECT") {
      const cols = attrs
        .split(",")
        .map((a) => {
          const attr = a.trim();
          if (attr === "*") return "*";
          return this.entityModel.mapping[attr] || attr;
        })
        .filter((c) => c !== undefined && c !== null && c !== "");
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
        .map((c, i) => `${c}=${placeholders[i]}`)
        .join(", ")} `;
    return "";
  }

  _extractColumnsAndValues(payload, params) {
    const columns = [],
      placeholders = [];
    for (const key of Object.keys(payload)) {
      const col = this.entityModel.mapping[key];
      if (!col) continue;
      columns.push(col);
      placeholders.push("?");
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

      if (Array.isArray(val)) {
        if (comp === "IN" || comp === "NOT IN") {
          const ph = val.map(() => "?").join(", ");
          params.push(...val);
          return `${col} ${comp} (${ph})`;
        }

        if (val.length === 1) {
          params.push(val[0]);
          return `JSON_CONTAINS(${col}, JSON_ARRAY(?))`;
        }

        // multi-element array: check any of the elements contained in the JSON array
        const condsForArray = val
          .map(() => `JSON_CONTAINS(${col}, JSON_ARRAY(?))`)
          .join(" OR ");
        params.push(...val);
        return `(${condsForArray})`;
      }

      params.push(val);
      return `${col} ${comp} ?`;
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
