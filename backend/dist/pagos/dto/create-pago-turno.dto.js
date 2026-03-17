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
exports.CreatePagoTurnoDto = void 0;
const class_validator_1 = require("class-validator");
class CreatePagoTurnoDto {
}
exports.CreatePagoTurnoDto = CreatePagoTurnoDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
        message: 'turno_id must be a valid UUID',
    }),
    __metadata("design:type", String)
], CreatePagoTurnoDto.prototype, "turno_id", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'El monto debe ser un número válido' }),
    (0, class_validator_1.IsPositive)({ message: 'El monto debe ser mayor a 0' }),
    (0, class_validator_1.Min)(0.01, { message: 'El monto debe ser mayor a 0' }),
    __metadata("design:type", Number)
], CreatePagoTurnoDto.prototype, "monto", void 0);
__decorate([
    (0, class_validator_1.IsString)({ message: 'El método de pago es requerido' }),
    __metadata("design:type", String)
], CreatePagoTurnoDto.prototype, "metodo_pago", void 0);
//# sourceMappingURL=create-pago-turno.dto.js.map