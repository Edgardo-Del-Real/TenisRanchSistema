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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PagosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const rol_enum_1 = require("../common/enums/rol.enum");
let PagosService = class PagosService {
    constructor(pagoTurnoRepository, pagoLuzRepository, turnoRepository) {
        this.pagoTurnoRepository = pagoTurnoRepository;
        this.pagoLuzRepository = pagoLuzRepository;
        this.turnoRepository = turnoRepository;
    }
    async registrarPagoTurno(createPagoTurnoDto, userId) {
        const { turno_id, monto, metodo_pago } = createPagoTurnoDto;
        const turno = await this.turnoRepository.findOne({
            where: { id: turno_id },
            relations: ['usuario'],
        });
        if (!turno) {
            throw new common_1.NotFoundException('Turno no encontrado');
        }
        if (turno.usuario.rol !== rol_enum_1.Rol.NO_SOCIO) {
            throw new common_1.BadRequestException('Solo se pueden registrar pagos para turnos de No_Socios');
        }
        const pagoExistente = await this.pagoTurnoRepository.findOne({
            where: { turno_id },
        });
        if (pagoExistente) {
            throw new common_1.BadRequestException('Ya existe un pago registrado para este turno');
        }
        const pagoTurno = this.pagoTurnoRepository.create({
            turno_id,
            monto,
            metodo_pago,
            fecha_pago: new Date(),
            registrado_por: userId,
        });
        return await this.pagoTurnoRepository.save(pagoTurno);
    }
    async registrarPagoLuz(createPagoLuzDto, userId) {
        const { monto, descripcion } = createPagoLuzDto;
        const pagoLuz = this.pagoLuzRepository.create({
            monto,
            descripcion,
            fecha_pago: new Date(),
            registrado_por: userId,
        });
        return await this.pagoLuzRepository.save(pagoLuz);
    }
    async obtenerPagosLuz() {
        return await this.pagoLuzRepository.find({
            relations: ['registrado_por_usuario'],
            order: { fecha_pago: 'DESC' },
        });
    }
};
exports.PagosService = PagosService;
exports.PagosService = PagosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.PagoTurno)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.PagoLuz)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Turno)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PagosService);
//# sourceMappingURL=pagos.service.js.map