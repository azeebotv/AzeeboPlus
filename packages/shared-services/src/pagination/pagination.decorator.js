"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pagination = exports.MAX_LIMIT = exports.DEFAULT_LIMIT = exports.DEFAULT_PAGE = void 0;
exports.paginate = paginate;
const common_1 = require("@nestjs/common");
exports.DEFAULT_PAGE = 1;
exports.DEFAULT_LIMIT = 20;
exports.MAX_LIMIT = 100;
exports.Pagination = (0, common_1.createParamDecorator)((_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const page = Math.max(1, parseInt(request.query.page) || exports.DEFAULT_PAGE);
    const limit = Math.max(1, Math.min(parseInt(request.query.limit) || exports.DEFAULT_LIMIT, exports.MAX_LIMIT));
    const offset = (page - 1) * limit;
    return {
        page,
        limit,
        offset,
    };
});
function paginate(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    };
}
