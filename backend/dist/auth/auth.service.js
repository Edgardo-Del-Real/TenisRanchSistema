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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const jwt_1 = require("@nestjs/jwt");
const usuario_entity_1 = require("../entities/usuario.entity");
const rol_enum_1 = require("../common/enums/rol.enum");
let AuthService = class AuthService {
    constructor(usuarioRepository, jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.usuarioRepository.findOne({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException({
                error: {
                    code: 'EMAIL_DUPLICADO',
                    message: 'El correo ya está en uso.',
                },
            });
        }
        const password_hash = await bcrypt.hash(dto.password, 10);
        const usuario = this.usuarioRepository.create({
            nombre: dto.nombre,
            apellido: dto.apellido,
            email: dto.email,
            password_hash,
            telefono: dto.telefono,
            rol: rol_enum_1.Rol.NO_SOCIO,
        });
        const saved = await this.usuarioRepository.save(usuario);
        const { password_hash: _, ...result } = saved;
        return result;
    }
    async login(dto) {
        const usuario = await this.usuarioRepository.findOne({
            where: { email: dto.email },
        });
        const invalidError = new common_1.UnauthorizedException({
            error: {
                code: 'CREDENCIALES_INVALIDAS',
                message: 'Credenciales inválidas.',
            },
        });
        if (!usuario) {
            throw invalidError;
        }
        const passwordValid = await bcrypt.compare(dto.password, usuario.password_hash);
        if (!passwordValid) {
            throw invalidError;
        }
        if (!usuario.activo) {
            throw invalidError;
        }
        const payload = {
            sub: usuario.id,
            email: usuario.email,
            rol: usuario.rol,
        };
        const access_token = this.jwtService.sign(payload);
        return { access_token };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map