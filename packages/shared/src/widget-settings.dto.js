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
exports.WidgetSettingsDto = exports.WidgetPosition = void 0;
// src/projects/dto/widget-settings.dto.ts
const class_validator_1 = require("class-validator");
var WidgetPosition;
(function (WidgetPosition) {
    WidgetPosition["BOTTOM_RIGHT"] = "bottom-right";
    WidgetPosition["BOTTOM_LEFT"] = "bottom-left";
})(WidgetPosition || (exports.WidgetPosition = WidgetPosition = {}));
class WidgetSettingsDto {
    headerText;
    primaryColor;
    position;
    backgroundImageUrl;
    backgroundOpacity;
    companyLogoUrl;
    welcomeMessage;
    agentDisplayName;
    offlineMessage;
    autoOpenDelay;
}
exports.WidgetSettingsDto = WidgetSettingsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Header text must be a string.' }),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], WidgetSettingsDto.prototype, "headerText", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsHexColor)({ message: 'Primary color must be a valid hex color code.' }),
    __metadata("design:type", String)
], WidgetSettingsDto.prototype, "primaryColor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(WidgetPosition, { message: 'Invalid widget position.' }),
    __metadata("design:type", String)
], WidgetSettingsDto.prototype, "position", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'Background image must be a valid URL.' }),
    __metadata("design:type", String)
], WidgetSettingsDto.prototype, "backgroundImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Background opacity must be a number.' }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1),
    __metadata("design:type", Number)
], WidgetSettingsDto.prototype, "backgroundOpacity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'Company logo must be a valid URL.' }),
    __metadata("design:type", String)
], WidgetSettingsDto.prototype, "companyLogoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200, {
        message: 'Welcome message cannot be longer than 200 characters.',
    }),
    __metadata("design:type", String)
], WidgetSettingsDto.prototype, "welcomeMessage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], WidgetSettingsDto.prototype, "agentDisplayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], WidgetSettingsDto.prototype, "offlineMessage", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Auto open delay must be a number.' }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], WidgetSettingsDto.prototype, "autoOpenDelay", void 0);
//# sourceMappingURL=widget-settings.dto.js.map