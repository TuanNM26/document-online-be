"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRoleDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const createRole_dto_1 = require("./createRole.dto");
class UpdateRoleDto extends (0, mapped_types_1.PartialType)(createRole_dto_1.CreateRoleDto) {
}
exports.UpdateRoleDto = UpdateRoleDto;
//# sourceMappingURL=updateRole.dto.js.map