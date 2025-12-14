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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwoFactorRecoveryCode = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let TwoFactorRecoveryCode = class TwoFactorRecoveryCode {
    id;
    userId;
    user;
    hashedCode;
    isUsed;
};
exports.TwoFactorRecoveryCode = TwoFactorRecoveryCode;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("increment", { type: "bigint" }),
    __metadata("design:type", Number)
], TwoFactorRecoveryCode.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], TwoFactorRecoveryCode.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.recoveryCodes, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "user_id" }),
    __metadata("design:type", user_entity_1.User)
], TwoFactorRecoveryCode.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], TwoFactorRecoveryCode.prototype, "hashedCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], TwoFactorRecoveryCode.prototype, "isUsed", void 0);
exports.TwoFactorRecoveryCode = TwoFactorRecoveryCode = __decorate([
    (0, typeorm_1.Entity)("two_factor_recovery_codes")
], TwoFactorRecoveryCode);
//# sourceMappingURL=two-factor-recovery-code.entity.js.map