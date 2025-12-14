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
exports.Conversation = exports.ConversationStatus = void 0;
const typeorm_1 = require("typeorm");
const message_entity_1 = require("./message.entity");
const project_entity_1 = require("./project.entity");
const visitor_entity_1 = require("./visitor.entity");
var ConversationStatus;
(function (ConversationStatus) {
    ConversationStatus["OPEN"] = "open";
    ConversationStatus["CLOSED"] = "closed";
    ConversationStatus["PENDING"] = "pending";
})(ConversationStatus || (exports.ConversationStatus = ConversationStatus = {}));
let Conversation = class Conversation {
    id;
    project;
    projectId;
    visitor;
    lastMessageSnippet;
    lastMessageTimestamp;
    status;
    unreadCount;
    messages;
    createdAt;
    updatedAt;
};
exports.Conversation = Conversation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment', { type: 'bigint' }),
    __metadata("design:type", Number)
], Conversation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => project_entity_1.Project, (project) => project.conversations, {
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'project_id' }),
    __metadata("design:type", project_entity_1.Project)
], Conversation.prototype, "project", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'project_id' }),
    __metadata("design:type", Number)
], Conversation.prototype, "projectId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => visitor_entity_1.Visitor, (visitor) => visitor.conversations, {
        onDelete: 'SET NULL',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'visitor_id' }),
    __metadata("design:type", visitor_entity_1.Visitor)
], Conversation.prototype, "visitor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true, name: 'last_message_snippet' }),
    __metadata("design:type", Object)
], Conversation.prototype, "lastMessageSnippet", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'timestamptz',
        nullable: true,
        name: 'last_message_timestamp',
    }),
    __metadata("design:type", Object)
], Conversation.prototype, "lastMessageTimestamp", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ConversationStatus,
        default: ConversationStatus.OPEN,
    }),
    __metadata("design:type", String)
], Conversation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'unread_count' }),
    __metadata("design:type", Number)
], Conversation.prototype, "unreadCount", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => message_entity_1.Message, (message) => message.conversation),
    __metadata("design:type", Array)
], Conversation.prototype, "messages", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz', name: 'created_at' }),
    __metadata("design:type", Date)
], Conversation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz', name: 'updated_at' }),
    __metadata("design:type", Date)
], Conversation.prototype, "updatedAt", void 0);
exports.Conversation = Conversation = __decorate([
    (0, typeorm_1.Entity)('conversations')
], Conversation);
//# sourceMappingURL=conversation.entity.js.map