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
exports.ConfiguracionClub = void 0;
const typeorm_1 = require("typeorm");
let ConfiguracionClub = class ConfiguracionClub {
};
exports.ConfiguracionClub = ConfiguracionClub;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ConfiguracionClub.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ConfiguracionClub.prototype, "apertura", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'time' }),
    __metadata("design:type", String)
], ConfiguracionClub.prototype, "cierre", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'luz_inicio', type: 'time' }),
    __metadata("design:type", String)
], ConfiguracionClub.prototype, "luz_inicio", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'luz_fin', type: 'time' }),
    __metadata("design:type", String)
], ConfiguracionClub.prototype, "luz_fin", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duracion_semana_min', default: 60 }),
    __metadata("design:type", Number)
], ConfiguracionClub.prototype, "duracion_semana_min", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'duracion_finde_min', default: 90 }),
    __metadata("design:type", Number)
], ConfiguracionClub.prototype, "duracion_finde_min", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ConfiguracionClub.prototype, "updated_at", void 0);
exports.ConfiguracionClub = ConfiguracionClub = __decorate([
    (0, typeorm_1.Entity)('configuracion_club')
], ConfiguracionClub);
//# sourceMappingURL=configuracion-club.entity.js.map