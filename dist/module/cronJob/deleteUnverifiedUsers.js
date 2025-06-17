"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DeleteUnverifiedUsersTask_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteUnverifiedUsersTask = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../module/user/user.schema");
let DeleteUnverifiedUsersTask = DeleteUnverifiedUsersTask_1 = class DeleteUnverifiedUsersTask {
    userModel;
    logger = new common_1.Logger(DeleteUnverifiedUsersTask_1.name);
    constructor(userModel) {
        this.userModel = userModel;
    }
    async handleCron() {
        console.log('da vao');
        const expiredUsers = await this.userModel.find({
            isActive: false,
            verificationExpires: { $lt: new Date() },
        });
        console.log('co user', expiredUsers);
        if (expiredUsers.length > 0) {
            const idsToDelete = expiredUsers.map((user) => user._id);
            await this.userModel.deleteMany({ _id: { $in: idsToDelete } });
        }
    }
};
exports.DeleteUnverifiedUsersTask = DeleteUnverifiedUsersTask;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DeleteUnverifiedUsersTask.prototype, "handleCron", null);
exports.DeleteUnverifiedUsersTask = DeleteUnverifiedUsersTask = DeleteUnverifiedUsersTask_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DeleteUnverifiedUsersTask);
//# sourceMappingURL=deleteUnverifiedUsers.js.map