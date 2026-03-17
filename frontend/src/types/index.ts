export * from './enums';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: import('./enums').Rol;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cancha {
  id: string;
  numero: number;
  estado: import('./enums').EstadoCancha;
  razon_estado: string | null;
  updated_at: string;
}

export interface Turno {
  id: string;
  usuario_id: string;
  cancha_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  requiere_luz: boolean;
  costo_turno: number;
  costo_luz: number;
  estado: import('./enums').EstadoTurno;
  cancelado_en: string | null;
  cancelado_por: string | null;
  created_at: string;
}

export interface Cuota {
  id: string;
  socio_id: string;
  mes: number;
  anio: number;
  monto_total: number;
  monto_abonado: number;
  estado: import('./enums').EstadoCuota;
  created_at: string;
}

export interface Tarifa {
  id: string;
  tipo: import('./enums').TipoTarifa;
  valor: number;
  vigente_desde: string;
  modificado_por: string | null;
  modificado_por_usuario?: {
    nombre: string;
    apellido: string;
  };
}

export interface ConfiguracionClub {
  id: string;
  apertura: string;
  cierre: string;
  luz_inicio: string;
  luz_fin: string;
  duracion_semana_min: number;
  duracion_finde_min: number;
  updated_at: string;
}

export interface PagoLuz {
  id: string;
  monto: number;
  fecha_pago: string;
  descripcion: string | null;
  registrado_por: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  user: Usuario;
}

export interface EstadisticasGenerales {
  totalSociosActivos: number;
  totalTurnos: number;
  canchasMasUtilizadas: Array<{
    numero: number;
    cantidad: number;
  }>;
  horasPico: Array<{
    hora: number;
    cantidad: number;
  }>;
}

export interface EstadisticasFinancieras {
  recaudacionCuotas: number;
  recaudacionTurnosNoSocio: number;
  cargosLuz: number;
  pagosLuz: number;
}

export interface FiltroEstadisticas {
  fechaInicio?: string;
  fechaFin?: string;
}
