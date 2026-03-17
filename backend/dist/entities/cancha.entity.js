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
exports.Cancha = void 0;
const typeorm_1 = require("typeorm");
const estado_cancha_enum_1 = require("../common/enums/estado-cancha.enum");
let Cancha = class Cancha {
};
exports.Cancha = Cancha;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Cancha.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Cancha.prototype, "numero", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: estado_cancha_enum_1.EstadoCancha.DISPONIBLE }),
    __metadata("design:type", String)
], Cancha.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'razon_estado', length: 500, nullable: true }),
    __metadata("design:type", String)
], Cancha.prototype, "razon_estado", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Cancha.prototype, "updated_at", void 0);
exports.Cancha = Cancha = __decorate([
    (0, typeorm_1.Entity)('canchas')
], Cancha);
//# sourceMappingURL=cancha.entity.js.map