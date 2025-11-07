class TranslatorService {
  translateQuery(cqlQuery) {
    const { mongooseModel, entityModel } = this._getEntityModel(
      cqlQuery.entity
    );
    this.entityModel = entityModel;
    this.mongooseModel = mongooseModel;

    const operation = cqlQuery.operation;
    if (operation === "SELECT") {
      return this._translateSelectQuery(cqlQuery);
    } else if (operation === "INSERT") {
      return this._translateInsertQuery(cqlQuery);
    } else if (operation === "UPDATE") {
      return this._translateUpdateQuery(cqlQuery);
    } else if (operation === "DELETE") {
      return this._translateDeleteQuery(cqlQuery);
    } else {
      throw new Error(`Unsupported operation: ${operation}`);
    }
  }

  _translateSelectQuery(cqlQuery) {
    const translatedFilter = this._handleFilter(cqlQuery.filter);
    const translatedSort = this._handleSort(cqlQuery.sort);
    const limit = cqlQuery.limit ? parseInt(cqlQuery.limit, 10) : null;
    const translatedSelection = this._handleSelection(cqlQuery.selection);
    return this.mongooseModel
      .find(translatedFilter, translatedSelection)
      .sort(translatedSort)
      .limit(limit);
  }

  _translateInsertQuery(cqlQuery) {
    const translatedPayload = this._translatePayload(cqlQuery.payload);
    return this.mongooseModel.insertMany([translatedPayload]);
  }

  _translateUpdateQuery(cqlQuery) {
    const translatedPayload = this._translatePayload(cqlQuery.payload);
    const translatedFilter = this._handleFilter(cqlQuery.filter);
    return this.mongooseModel.updateMany(translatedFilter, {
      $set: translatedPayload,
    });
  }

  _translateDeleteQuery(cqlQuery) {
    const translatedFilter = this._handleFilter(cqlQuery.filter);
    return this.mongooseModel.deleteMany(translatedFilter);
  }

  _handleSelection(selection) {
    if (!selection || selection.trim() === "*") return null;
    const fields = selection
      .split(",")
      .map((attr) => this.entityModel.mapping[attr.trim()])
      .filter((field) => field !== undefined);
    return fields.length > 0 ? fields.join(" ") : null;
  }

  _handleFilter(filters = []) {
    if (!Array.isArray(filters) || filters.length === 0) return {};
    const query = {};
    filters.forEach((f) => {
      const col = this.entityModel.mapping[f.attribute];
      const comp = (f.comparator || "=").toUpperCase();
      const val = this._normalizeValue(f.value);
      if (val === null && (comp === "IS" || comp === "IS NOT")) {
        query[col] = comp === "IS" ? null : { $ne: null };
        return;
      }
      switch (comp) {
        case "=":
          query[col] = val;
          break;
        case "!=":
          query[col] = { $ne: val };
          break;
        case ">":
          query[col] = { $gt: val };
          break;
        case "<":
          query[col] = { $lt: val };
          break;
        case ">=":
          query[col] = { $gte: val };
          break;
        case "<=":
          query[col] = { $lte: val };
          break;
        case "IN":
          query[col] = { $in: Array.isArray(val) ? val : [val] };
          break;
        case "NOT IN":
          query[col] = { $nin: Array.isArray(val) ? val : [val] };
          break;
        default:
          throw new Error(`Unsupported comparator: ${comp}`);
      }
    });
    return query;
  }

  _normalizeValue(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string" && value.trim().startsWith("[")) {
      try {
        const jsonSafe = value.replace(/'/g, '"');
        const parsed = JSON.parse(jsonSafe);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return value;
  }

  _handleLimit(limit) {
    return limit === undefined || limit === null ? 0 : parseInt(limit, 10);
  }

  _handleSort(sort = []) {
    if (!Array.isArray(sort) || sort.length === 0) return {};
    const sortObj = {};
    sort.forEach((s) => {
      const col = this.entityModel.mapping[s.attribute];
      const order = s.order.toLowerCase() === "asc" ? 1 : -1;
      sortObj[col] = order;
    });
    return sortObj;
  }

  translateResult(sqlResult) {
    console.log("Translated MongoDB Result:", sqlResult);
    return sqlResult;
  }

  _getEntityModel(entity) {
    try {
      const modelName = entity.charAt(0).toUpperCase() + entity.slice(1);
      const models = require(`../models/${modelName}Model`);

      return {
        mongooseModel: models[modelName],
        entityModel: models[`${modelName}Model`],
      };
    } catch (e) {
      throw new Error(
        `Model not found for entity: ${entity} with error ${e.message}`
      );
    }
  }

  _translatePayload(payload) {
    const translatedPayload = {};
    for (const key of Object.keys(payload)) {
      const translatedAttr = this.entityModel.mapping[key];
      if (translatedAttr) translatedPayload[translatedAttr] = payload[key];
    }
    return translatedPayload;
  }
}

module.exports = TranslatorService;
