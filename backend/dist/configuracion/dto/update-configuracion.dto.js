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
exports.UpdateConfiguracionDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateConfiguracionDto {
}
exports.UpdateConfiguracionDto = UpdateConfiguracionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'apertura debe tener formato HH:mm:ss',
    }),
    __metadata("design:type", String)
], UpdateConfiguracionDto.prototype, "apertura", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'cierre debe tener formato HH:mm:ss',
    }),
    __metadata("design:type", String)
], UpdateConfiguracionDto.prototype, "cierre", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'luz_inicio debe tener formato HH:mm:ss',
    }),
    __metadata("design:type", String)
], UpdateConfiguracionDto.prototype, "luz_inicio", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
        message: 'luz_fin debe tener formato HH:mm:ss',
    }),
    __metadata("design:type", String)
], UpdateConfiguracionDto.prototype, "luz_fin", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'duracion_semana_min debe ser al menos 1 minuto' }),
    __metadata("design:type", Number)
], UpdateConfiguracionDto.prototype, "duracion_semana_min", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1, { message: 'duracion_finde_min debe ser al menos 1 minuto' }),
    __metadata("design:type", Number)
], UpdateConfiguracionDto.prototype, "duracion_finde_min", void 0);
//# sourceMappingURL=update-configuracion.dto.js.map