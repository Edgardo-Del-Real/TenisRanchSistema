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
exports.HistorialCancha = void 0;
const typeorm_1 = require("typeorm");
const estado_cancha_enum_1 = require("../common/enums/estado-cancha.enum");
const cancha_entity_1 = require("./cancha.entity");
const usuario_entity_1 = require("./usuario.entity");
let HistorialCancha = class HistorialCancha {
};
exports.HistorialCancha = HistorialCancha;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], HistorialCancha.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancha_id' }),
    __metadata("design:type", String)
], HistorialCancha.prototype, "cancha_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cancha_entity_1.Cancha),
    (0, typeorm_1.JoinColumn)({ name: 'cancha_id' }),
    __metadata("design:type", cancha_entity_1.Cancha)
], HistorialCancha.prototype, "cancha", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_anterior', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], HistorialCancha.prototype, "estado_anterior", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'estado_nuevo', type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], HistorialCancha.prototype, "estado_nuevo", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], HistorialCancha.prototype, "razon", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cambiado_por' }),
    __metadata("design:type", String)
], HistorialCancha.prototype, "cambiado_por", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'cambiado_por' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], HistorialCancha.prototype, "cambiado_por_usuario", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'fecha_cambio' }),
    __metadata("design:type", Date)
], HistorialCancha.prototype, "fecha_cambio", void 0);
exports.HistorialCancha = HistorialCancha = __decorate([
    (0, typeorm_1.Entity)('historial_cancha')
], HistorialCancha);
//# sourceMappingURL=historial-cancha.entity.js.map