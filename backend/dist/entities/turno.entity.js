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
exports.Turno = void 0;
const typeorm_1 = require("typeorm");
const estado_turno_enum_1 = require("../common/enums/estado-turno.enum");
const usuario_entity_1 = require("./usuario.entity");
const cancha_entity_1 = require("./cancha.entity");
const pago_turno_entity_1 = require("./pago-turno.entity");
let Turno = class Turno {
};
exports.Turno = Turno;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Turno.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'usuario_id' }),
    __metadata("design:type", String)
], Turno.prototype, "usuario_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], Turno.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancha_id' }),
    __metadata("design:type", String)
], Turno.prototype, "cancha_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cancha_entity_1.Cancha),
    (0, typeorm_1.JoinColumn)({ name: 'cancha_id' }),
    __metadata("design:type", cancha_entity_1.Cancha)
], Turno.prototype, "cancha", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_inicio', type: 'datetime2' }),
    __metadata("design:type", Date)
], Turno.prototype, "fecha_inicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_fin', type: 'datetime2' }),
    __metadata("design:type", Date)
], Turno.prototype, "fecha_fin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'requiere_luz', default: false }),
    __metadata("design:type", Boolean)
], Turno.prototype, "requiere_luz", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'costo_turno', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Turno.prototype, "costo_turno", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'costo_luz', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Turno.prototype, "costo_luz", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: estado_turno_enum_1.EstadoTurno.ACTIVO }),
    __metadata("design:type", String)
], Turno.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelado_en', type: 'datetime2', nullable: true }),
    __metadata("design:type", Date)
], Turno.prototype, "cancelado_en", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelado_por', nullable: true }),
    __metadata("design:type", String)
], Turno.prototype, "cancelado_por", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'cancelado_por' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], Turno.prototype, "cancelado_por_usuario", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Turno.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => pago_turno_entity_1.PagoTurno, pagoTurno => pagoTurno.turno, { nullable: true }),
    __metadata("design:type", pago_turno_entity_1.PagoTurno)
], Turno.prototype, "pago_turno", void 0);
exports.Turno = Turno = __decorate([
    (0, typeorm_1.Entity)('turnos')
], Turno);
//# sourceMappingURL=turno.entity.js.map