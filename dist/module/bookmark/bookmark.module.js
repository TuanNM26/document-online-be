"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkModule = void 0;
const common_1 = require("@nestjs/common");
const bookmark_controller_1 = require("./bookmark.controller");
const bookmark_service_1 = require("./bookmark.service");
const mongoose_1 = require("@nestjs/mongoose");
const bookmark_schema_1 = require("./bookmark.schema");
const page_module_1 = require("../page/page.module");
const document_module_1 = require("../document/document.module");
let BookmarkModule = class BookmarkModule {
};
exports.BookmarkModule = BookmarkModule;
exports.BookmarkModule = BookmarkModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: bookmark_schema_1.Bookmark.name, schema: bookmark_schema_1.BookmarkSchema },
            ]),
            page_module_1.PageModule,
            document_module_1.DocumentModule,
        ],
        controllers: [bookmark_controller_1.BookmarkController],
        providers: [bookmark_service_1.BookmarkService],
    })
], BookmarkModule);
//# sourceMappingURL=bookmark.module.js.map