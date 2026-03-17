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
exports.UsuariosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcrypt");
const usuario_entity_1 = require("../entities/usuario.entity");
let UsuariosService = class UsuariosService {
    constructor(usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }
    async findAll(filtros) {
        const where = {};
        if (filtros.nombre !== undefined) {
            where.nombre = (0, typeorm_2.Like)(`%${filtros.nombre}%`);
        }
        if (filtros.apellido !== undefined) {
            where.apellido = (0, typeorm_2.Like)(`%${filtros.apellido}%`);
        }
        if (filtros.activo !== undefined) {
            where.activo = filtros.activo;
        }
        if (filtros.rol !== undefined) {
            where.rol = filtros.rol;
        }
        const usuarios = await this.usuarioRepository.find({ where });
        return usuarios.map((u) => this.omitPassword(u));
    }
    async findOne(id) {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'USUARIO_NO_ENCONTRADO',
                    message: 'Usuario no encontrado.',
                },
            });
        }
        return this.omitPassword(usuario);
    }
    async update(id, dto) {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'USUARIO_NO_ENCONTRADO',
                    message: 'Usuario no encontrado.',
                },
            });
        }
        if (dto.nombre !== undefined)
            usuario.nombre = dto.nombre;
        if (dto.apellido !== undefined)
            usuario.apellido = dto.apellido;
        if (dto.telefono !== undefined)
            usuario.telefono = dto.telefono;
        const updated = await this.usuarioRepository.save(usuario);
        return this.omitPassword(updated);
    }
    async updateRol(id, dto, requestingUserId) {
        if (id === requestingUserId) {
            throw new common_1.ForbiddenException({
                error: {
                    code: 'ROL_PROPIO',
                    message: 'No puede modificar su propio rol.',
                },
            });
        }
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'USUARIO_NO_ENCONTRADO',
                    message: 'Usuario no encontrado.',
                },
            });
        }
        usuario.rol = dto.rol;
        const updated = await this.usuarioRepository.save(usuario);
        return this.omitPassword(updated);
    }
    async remove(id) {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'USUARIO_NO_ENCONTRADO',
                    message: 'Usuario no encontrado.',
                },
            });
        }
        usuario.activo = false;
        await this.usuarioRepository.save(usuario);
        return { message: 'Usuario dado de baja exitosamente' };
    }
    async updatePerfil(userId, dto) {
        const usuario = await this.usuarioRepository.findOne({ where: { id: userId } });
        if (!usuario) {
            throw new common_1.NotFoundException({
                error: {
                    code: 'USUARIO_NO_ENCONTRADO',
                    message: 'Usuario no encontrado.',
                },
            });
        }
        if (dto.nombre !== undefined)
            usuario.nombre = dto.nombre;
        if (dto.telefono !== undefined)
            usuario.telefono = dto.telefono;
        if (dto.password !== undefined) {
            usuario.password_hash = await bcrypt.hash(dto.password, 10);
        }
        const updated = await this.usuarioRepository.save(usuario);
        return this.omitPassword(updated);
    }
    solicitarSocio() {
        const whatsappUrl = 'https://wa.me/5491100000000?text=Hola%2C%20quisiera%20solicitar%20el%20cambio%20de%20rol%20a%20Socio.';
        return { whatsappUrl };
    }
    omitPassword(usuario) {
        const { password_hash, ...rest } = usuario;
        return rest;
    }
};
exports.UsuariosService = UsuariosService;
exports.UsuariosService = UsuariosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsuariosService);
//# sourceMappingURL=usuarios.service.js.map