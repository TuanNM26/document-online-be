"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
async function paginate(model, page = 1, limit = 10, filter = {}, sort = {}, populate) {
    let query = model
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sort);
    if (populate) {
        query = query.populate(populate);
    }
    const [data, total] = await Promise.all([
        query.lean(),
        model.countDocuments(filter),
    ]);
    return {
        data,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
    };
}
//# sourceMappingURL=pagination.interface.js.map