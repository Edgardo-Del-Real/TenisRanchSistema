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
exports.PagoCuota = void 0;
const typeorm_1 = require("typeorm");
const cuota_entity_1 = require("./cuota.entity");
const usuario_entity_1 = require("./usuario.entity");
let PagoCuota = class PagoCuota {
};
exports.PagoCuota = PagoCuota;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PagoCuota.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cuota_id' }),
    __metadata("design:type", String)
], PagoCuota.prototype, "cuota_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cuota_entity_1.Cuota),
    (0, typeorm_1.JoinColumn)({ name: 'cuota_id' }),
    __metadata("design:type", cuota_entity_1.Cuota)
], PagoCuota.prototype, "cuota", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PagoCuota.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'fecha_pago', type: 'timestamptz' }),
    __metadata("design:type", Date)
], PagoCuota.prototype, "fecha_pago", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'registrado_por' }),
    __metadata("design:type", String)
], PagoCuota.prototype, "registrado_por", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario),
    (0, typeorm_1.JoinColumn)({ name: 'registrado_por' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], PagoCuota.prototype, "registrado_por_usuario", void 0);
exports.PagoCuota = PagoCuota = __decorate([
    (0, typeorm_1.Entity)('pagos_cuota')
], PagoCuota);
//# sourceMappingURL=pago-cuota.entity.js.map