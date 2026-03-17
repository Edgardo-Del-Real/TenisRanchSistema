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
exports.Cuota = void 0;
const typeorm_1 = require("typeorm");
const estado_cuota_enum_1 = require("../common/enums/estado-cuota.enum");
const usuario_entity_1 = require("./usuario.entity");
let Cuota = class Cuota {
};
exports.Cuota = Cuota;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Cuota.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'socio_id' }),
    __metadata("design:type", String)
], Cuota.prototype, "socio_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'socio_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], Cuota.prototype, "socio", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Cuota.prototype, "mes", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Cuota.prototype, "anio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'monto_total', type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Cuota.prototype, "monto_total", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'monto_abonado', type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Cuota.prototype, "monto_abonado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: estado_cuota_enum_1.EstadoCuota.PENDIENTE }),
    __metadata("design:type", String)
], Cuota.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Cuota.prototype, "created_at", void 0);
exports.Cuota = Cuota = __decorate([
    (0, typeorm_1.Entity)('cuotas')
], Cuota);
//# sourceMappingURL=cuota.entity.js.map