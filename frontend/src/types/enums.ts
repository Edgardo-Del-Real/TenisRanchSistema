export enum Rol {
  ADMINISTRADOR = 'administrador',
  SOCIO = 'socio',
  NO_SOCIO = 'no_socio',
}

export enum EstadoCancha {
  DISPONIBLE = 'disponible',
  MANTENIMIENTO = 'mantenimiento',
  INHABILITADA = 'inhabilitada',
}

export enum EstadoTurno {
  ACTIVO = 'activo',
  CANCELADO = 'cancelado',
}

export enum EstadoCuota {
  PENDIENTE = 'pendiente',
  PARCIAL = 'parcialmente_pagada',
  PAGADA = 'pagada',
}

export enum TipoTarifa {
  TURNO_NO_SOCIO = 'turno_no_socio',
  LUZ = 'luz',
  CUOTA = 'cuota',
}
