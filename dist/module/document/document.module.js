"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentModule = void 0;
const common_1 = require("@nestjs/common");
const document_controller_1 = require("./document.controller");
const document_service_1 = require("./document.service");
const mongoose_1 = require("@nestjs/mongoose");
const document_schema_1 = require("./document.schema");
const document_gateway_1 = require("./document.gateway");
const page_module_1 = require("../page/page.module");
let DocumentModule = class DocumentModule {
};
exports.DocumentModule = DocumentModule;
exports.DocumentModule = DocumentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: document_schema_1.Document.name, schema: document_schema_1.DocumentSchema },
            ]),
            (0, common_1.forwardRef)(() => page_module_1.PageModule),
        ],
        controllers: [document_controller_1.DocumentController],
        providers: [document_service_1.DocumentService, document_gateway_1.DocumentGateway],
        exports: [
            mongoose_1.MongooseModule.forFeature([
                { name: document_schema_1.Document.name, schema: document_schema_1.DocumentSchema },
            ]),
            document_gateway_1.DocumentGateway,
        ],
    })
], DocumentModule);
//# sourceMappingURL=document.module.js.map