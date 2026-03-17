# Plan de Implementación: Gestión Club de Tenis

## Descripción General

Implementación incremental de la aplicación web de gestión del Club de Tenis usando NestJS (backend), React + TypeScript (frontend) y MySQL con TypeORM. Cada tarea construye sobre la anterior, finalizando con la integración completa de todos los módulos.

## Tareas

- [x] 1. Configuración inicial del proyecto y estructura base
  - Inicializar proyecto NestJS con TypeScript y configurar TypeORM con MySQL
  - Inicializar proyecto React + TypeScript con Vite
  - Configurar variables de entorno (`.env`) para conexión a base de datos, JWT secret y configuración de test
  - Definir todas las entidades TypeORM: `Usuario`, `Cancha`, `HistorialCancha`, `Turno`, `Cuota`, `PagoCuota`, `Tarifa`, `ConfiguracionClub`, `PagoLuz`, `PagoTurno`
  - Definir todos los enums: `Rol`, `EstadoCancha`, `EstadoTurno`, `EstadoCuota`, `TipoTarifa`
  - Configurar `ValidationPipe` global en NestJS con `class-validator`
  - Configurar base de datos MySQL separada para tests
  - _Requerimientos: 1.1, 2.5, 15.4_

- [x] 2. Módulo de autenticación (Auth)
  - [x] 2.1 Implementar registro de usuarios
    - Crear `AuthModule`, `AuthController`, `AuthService`
    - Endpoint `POST /api/auth/register` con DTOs validados (nombre, apellido, email, password, teléfono)
    - Hash de contraseña con bcrypt, asignación de rol `NO_SOCIO` por defecto
    - _Requerimientos: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Test de propiedad: registro con datos válidos crea usuario con rol No_Socio
    - **Propiedad 1: Registro con datos válidos crea usuario con rol No_Socio**
    - **Valida: Requerimientos 1.1, 1.3**

  - [x] 2.3 Test de propiedad: correo duplicado rechaza el registro
    - **Propiedad 2: Correo duplicado rechaza el registro**
    - **Valida: Requerimiento 1.2**

  - [x] 2.4 Test de propiedad: campos obligatorios vacíos rechazan el registro
    - **Propiedad 3: Campos obligatorios vacíos rechazan el registro**
    - **Valida: Requerimiento 1.4**

  - [x] 2.5 Implementar login y JWT
    - Endpoint `POST /api/auth/login` que valida credenciales y devuelve JWT
    - Endpoint `POST /api/auth/logout` con invalidación de token (blacklist en memoria o Redis)
    - Implementar `JwtAuthGuard` y `RolesGuard` con decorador `@Roles()`
    - Implementar `OwnerOrAdminGuard`
    - _Requerimientos: 2.1, 2.2, 2.3, 2.4, 2.5, 15.4_

  - [x] 2.6 Test de propiedad: credenciales válidas generan sesión autenticada
    - **Propiedad 4: Credenciales válidas generan sesión autenticada**
    - **Valida: Requerimientos 2.1, 2.3**

  - [x] 2.7 Test de propiedad: credenciales inválidas rechazan el acceso
    - **Propiedad 5: Credenciales inválidas rechazan el acceso**
    - **Valida: Requerimientos 2.2, 3.7**

  - [x] 2.8 Test de propiedad: logout invalida el token
    - **Propiedad 6: Logout invalida el token**
    - **Valida: Requerimiento 2.4**

  - [x] 2.9 Test de propiedad: endpoints protegidos requieren autenticación
    - **Propiedad 7: Endpoints protegidos requieren autenticación**
    - **Valida: Requerimientos 2.5, 15.4**

  - [x] 2.10 Test de propiedad: control de acceso por rol
    - **Propiedad 8: Control de acceso por rol**
    - **Valida: Requerimientos 15.1, 15.2, 15.3**

- [x] 3. Checkpoint — Asegurar que todos los tests pasen
  - Verificar que los guards de autenticación y roles funcionen correctamente en todos los endpoints implementados hasta aquí. Consultar al usuario si surgen dudas.

- [ ] 4. Módulo de usuarios
  - [x] 4.1 Implementar CRUD de usuarios (Admin)
    - Crear `UsuariosModule`, `UsuariosController`, `UsuariosService`
    - Endpoints: `GET /api/usuarios`, `GET /api/usuarios/:id`, `PUT /api/usuarios/:id`, `PATCH /api/usuarios/:id/rol`, `DELETE /api/usuarios/:id` (baja lógica)
    - Búsqueda y filtros por nombre/apellido, estado y rol
    - _Requerimientos: 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Implementar actualización de perfil propio (Socio/No_Socio)
    - Permitir que el usuario autenticado actualice nombre, teléfono y contraseña sin alterar rol ni estado
    - Redirigir a WhatsApp cuando un No_Socio solicita cambio de rol a Socio
    - _Requerimientos: 3.4, 3.6_

  - [x] 4.3 Test de propiedad: cambio de rol persiste y no puede ser auto-aplicado
    - **Propiedad 9: Cambio de rol persiste y no puede ser auto-aplicado**
    - **Valida: Requerimientos 3.1, 3.2**

  - [x] 4.4 Test de propiedad: actualización de datos personales no altera el rol
    - **Propiedad 10: Actualización de datos personales no altera el rol**
    - **Valida: Requerimientos 3.3, 3.4**

  - [x] 4.5 Test de propiedad: baja lógica conserva el historial
    - **Propiedad 11: Baja lógica conserva el historial**
    - **Valida: Requerimiento 3.5**

  - [x] 4.6 Test de propiedad: filtros de listado devuelven solo resultados coincidentes
    - **Propiedad 12: Filtros de listado devuelven solo resultados coincidentes**
    - **Valida: Requerimientos 4.2, 4.3, 4.4**

  - [x] 4.7 Test de propiedad: listados incluyen todos los campos requeridos
    - **Propiedad 13: Listados incluyen todos los campos requeridos**
    - **Valida: Requerimiento 4.1**

- [ ] 5. Módulo de canchas
  - [x] 5.1 Implementar gestión de canchas
    - Crear `CanchasModule`, `CanchasController`, `CanchasService`
    - Endpoints: `GET /api/canchas`, `PATCH /api/canchas/:id/estado`, `GET /api/canchas/:id/historial`
    - Registrar historial de cambios de estado con fecha, razón y usuario que realizó el cambio
    - _Requerimientos: 5.1, 5.2, 5.3_

  - [x] 5.2 Test de propiedad: cambio de estado de cancha bloquea reservas
    - **Propiedad 14: Cambio de estado de cancha bloquea reservas**
    - **Valida: Requerimientos 5.1, 5.2, 5.3**

- [ ] 6. Módulo de tarifas y configuración del club
  - [x] 6.1 Implementar gestión de tarifas
    - Crear `TarifasModule`, `TarifasController`, `TarifasService`
    - Endpoints: `GET /api/tarifas`, `PUT /api/tarifas/:tipo`, `GET /api/tarifas/historial`
    - Guardar snapshot de tarifa vigente al momento de cada reserva
    - Filtros de historial por fecha y monto
    - _Requerimientos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 6.2 Implementar configuración del club
    - Crear `ConfiguracionModule` con endpoint para leer y actualizar `ConfiguracionClub`
    - Gestionar franja horaria de funcionamiento, franja de luz y duración de turnos por tipo de día
    - _Requerimientos: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 6.3 Test de propiedad: modificación de tarifa conserva historial y actualiza vigente
    - **Propiedad 26: Modificación de tarifa conserva historial y actualiza vigente**
    - **Valida: Requerimientos 10.1, 10.2, 10.3, 10.4, 10.5**

  - [x] 6.4 Test de propiedad: configuración del club se aplica a nuevas reservas
    - **Propiedad 28: Configuración del club se aplica a nuevas reservas**
    - **Valida: Requerimientos 11.1, 11.2, 11.3, 11.4, 11.5**

- [x] 7. Checkpoint — Asegurar que todos los tests pasen
  - Verificar que los módulos de usuarios, canchas, tarifas y configuración estén correctamente integrados y que todos los tests pasen. Consultar al usuario si surgen dudas.

- [ ] 8. Módulo de turnos
  - [x] 8.1 Implementar reserva de turnos con todas las reglas de negocio
    - Crear `TurnosModule`, `TurnosController`, `TurnosService`
    - Endpoint `POST /api/turnos`: validar disponibilidad de cancha, conflicto de horario, franja horaria de funcionamiento, límite diario (2 turnos para no-admin), anticipación máxima (1 día), bloqueo por deuda de cuotas (≥2 impagas)
    - Calcular duración según tipo de día (60 min semana / 90 min finde), cargo de luz según franja configurada, snapshot de tarifa vigente
    - _Requerimientos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11_

  - [x] 8.2 Test de propiedad: conflicto de horario rechaza la reserva
    - **Propiedad 15: Conflicto de horario rechaza la reserva**
    - **Valida: Requerimiento 6.1**

  - [x] 8.3 Test de propiedad: cargo de luz según franja horaria
    - **Propiedad 16: Cargo de luz según franja horaria**
    - **Valida: Requerimientos 6.2, 6.3, 6.4**

  - [x] 8.4 Test de propiedad: duración de turno según tipo de día
    - **Propiedad 17: Duración de turno según tipo de día**
    - **Valida: Requerimiento 6.5**

  - [x] 8.5 Test de propiedad: reservas fuera del horario de funcionamiento son rechazadas
    - **Propiedad 18: Reservas fuera del horario de funcionamiento son rechazadas**
    - **Valida: Requerimiento 6.6**

  - [x] 8.6 Test de propiedad: límite diario de turnos por usuario no-administrador
    - **Propiedad 19: Límite diario de turnos por usuario no-administrador**
    - **Valida: Requerimientos 6.7, 6.11**

  - [x] 8.7 Test de propiedad: restricción de anticipación máxima de reserva
    - **Propiedad 20: Restricción de anticipación máxima de reserva**
    - **Valida: Requerimiento 6.8**

  - [x] 8.8 Test de propiedad: bloqueo de reservas por deuda de cuotas
    - **Propiedad 21: Bloqueo de reservas por deuda de cuotas**
    - **Valida: Requerimiento 6.9**

  - [x] 8.9 Test de propiedad: snapshot de tarifa al momento de la reserva
    - **Propiedad 27: Snapshot de tarifa al momento de la reserva**
    - **Valida: Requerimiento 10.7**

  - [x] 8.10 Implementar cancelación de turnos
    - Endpoint `DELETE /api/turnos/:id`: validar anticipación mínima de 1 hora, registrar fecha/hora y usuario que canceló
    - _Requerimientos: 7.1, 7.2, 7.3_

  - [x] 8.11 Test de propiedad: cancelación según anticipación
    - **Propiedad 22: Cancelación según anticipación**
    - **Valida: Requerimientos 7.1, 7.2, 7.3**

  - [x] 8.12 Implementar consulta de turnos
    - Endpoints: `GET /api/turnos` (Admin: todos con filtros; Usuario: propios), `GET /api/turnos/historial`
    - Filtros por nombre/apellido y fecha para Admin; aislamiento de datos para Socio/No_Socio
    - _Requerimientos: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 8.13 Test de propiedad: aislamiento de datos entre usuarios no-administradores
    - **Propiedad 23: Aislamiento de datos entre usuarios no-administradores**
    - **Valida: Requerimientos 8.4, 8.5, 9.9**

- [x] 9. Checkpoint — Asegurar que todos los tests pasen
  - Verificar que todas las reglas de negocio de turnos estén correctamente implementadas y que los tests de propiedad pasen. Consultar al usuario si surgen dudas.

- [ ] 10. Módulo de cuotas
  - [x] 10.1 Implementar generación y gestión de cuotas
    - Crear `CuotasModule`, `CuotasController`, `CuotasService`
    - Tarea programada (cron) con `@nestjs/schedule` para generar cuotas al inicio de cada mes para todos los socios activos
    - Endpoints: `GET /api/cuotas`, `POST /api/cuotas/:id/pagos`
    - Actualizar estado de cuota (`PENDIENTE` → `PARCIAL` → `PAGADA`) según suma de pagos parciales
    - Filtros por nombre/apellido, estado y fecha de generación
    - _Requerimientos: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9_

  - [x] 10.2 Test de propiedad: generación de cuotas cubre todos los socios activos
    - **Propiedad 24: Generación de cuotas cubre todos los socios activos**
    - **Valida: Requerimiento 9.1**

  - [x] 10.3 Test de propiedad: estado de cuota refleja la suma de pagos parciales
    - **Propiedad 25: Estado de cuota refleja la suma de pagos parciales**
    - **Valida: Requerimientos 9.2, 9.3, 9.4**

- [ ] 11. Módulo de pagos
  - [x] 11.1 Implementar registro de pagos de turnos y luz
    - Crear `PagosModule`, `PagosController`, `PagosService`
    - Endpoint para registrar pago de turno de No_Socio: asociar monto, fecha y método de pago al turno
    - Endpoints: `POST /api/pagos-luz`, `GET /api/pagos-luz`
    - _Requerimientos: 12.1, 12.2, 12.3, 13.1, 13.2_

  - [x] 11.2 Test de propiedad: pagos de turnos y luz quedan asociados correctamente
    - **Propiedad 29: Pagos de turnos y luz quedan asociados correctamente**
    - **Valida: Requerimientos 12.1, 12.2, 13.1**

- [ ] 12. Módulo de estadísticas
  - [x] 12.1 Implementar panel de estadísticas
    - Crear `EstadisticasModule`, `EstadisticasController`, `EstadisticasService`
    - Endpoint `GET /api/estadisticas/generales`: total socios activos, total turnos en período, canchas más utilizadas, horas pico
    - Endpoint `GET /api/estadisticas/financieras`: recaudación por cuotas, turnos No_Socio, cargos de luz y pagos de luz en período
    - Filtrado por rango de fechas en todos los indicadores
    - _Requerimientos: 14.1, 14.2, 14.3_

  - [x] 12.2 Test de propiedad: estadísticas son consistentes con los datos subyacentes
    - **Propiedad 30: Estadísticas son consistentes con los datos subyacentes**
    - **Valida: Requerimientos 14.1, 14.2, 14.3**

- [x] 13. Checkpoint — Asegurar que todos los tests pasen
  - Verificar que los módulos de cuotas, pagos y estadísticas estén correctamente integrados. Consultar al usuario si surgen dudas.

- [x] 14. Frontend — Estructura base y autenticación
  - Configurar React Router, contexto de autenticación y cliente HTTP (axios/fetch con interceptores para JWT)
  - Implementar páginas de registro y login con validación de formularios
  - Implementar layout responsivo con navegación diferenciada por rol
  - Implementar logout y redirección según estado de sesión
  - _Requerimientos: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 15.5_

- [ ] 15. Frontend — Módulos de administración
  - [x] 15.1 Implementar módulo de usuarios (Admin)
    - Listado con búsqueda por nombre/apellido y filtros por estado y rol
    - Formulario de edición de datos y cambio de rol
    - Acción de baja lógica
    - _Requerimientos: 3.1, 3.2, 3.3, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 15.2 Implementar módulo de canchas (Admin)
    - Listado de canchas con estado actual
    - Formulario para cambiar estado con razón obligatoria
    - Vista de historial de cambios por cancha
    - _Requerimientos: 5.1, 5.2, 5.3_

  - [x] 15.3 Implementar módulo de tarifas y configuración (Admin)
    - Formulario para modificar tarifas (turno No_Socio, luz, cuota mensual)
    - Vista de historial de tarifas con filtros
    - Formulario de configuración del club (horarios, franja de luz, duración de turnos)
    - _Requerimientos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.3, 11.4_

  - [x] 15.4 Implementar módulo de cuotas (Admin)
    - Listado de cuotas con búsqueda y filtros por estado y fecha
    - Formulario para registrar pagos parciales o totales
    - _Requerimientos: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x] 15.5 Implementar módulo de pagos de luz (Admin)
    - Formulario para registrar pago de luz con monto, fecha y descripción
    - Historial de pagos de luz en orden cronológico descendente
    - _Requerimientos: 13.1, 13.2_

  - [x] 15.6 Implementar panel de estadísticas (Admin)
    - Panel de estadísticas generales con selector de período
    - Panel de estadísticas financieras con selector de período
    - _Requerimientos: 14.1, 14.2, 14.3_

- [ ] 16. Frontend — Módulos de usuario (Socio/No_Socio)
  - [x] 16.1 Implementar módulo de turnos para usuarios
    - Vista de canchas disponibles con selector de horario
    - Confirmación de reserva mostrando costo de turno y cargo de luz si aplica
    - Listado de turnos vigentes propios con opción de cancelación
    - Historial de turnos propios (solo Socio)
    - _Requerimientos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 7.1, 7.2, 8.4, 8.5_

  - [x] 16.2 Implementar módulo de cuotas para Socio
    - Listado de cuotas propias con estado, monto total, monto abonado y saldo pendiente
    - _Requerimientos: 9.9_

  - [x] 16.3 Implementar perfil de usuario
    - Formulario para actualizar nombre, teléfono y contraseña
    - Botón de solicitud de cambio de rol a Socio (redirige a WhatsApp)
    - _Requerimientos: 3.4, 3.6_

- [ ] 17. Integración final y checkpoint
  - [x] 17.1 Conectar todos los módulos frontend con la API
    - Verificar que todos los flujos end-to-end funcionen correctamente mediante tests de integración con Supertest
    - Asegurar manejo de errores HTTP (400, 401, 403, 404, 409) con mensajes de usuario apropiados en el frontend
    - _Requerimientos: 1.1–15.5_

  - [x] 17.2 Tests de integración de flujos críticos
    - Test de flujo completo: registro → login → reserva → cancelación
    - Test de flujo de cuotas: generación → pago parcial → pago total
    - Test de flujo de tarifas: modificación → reserva con nueva tarifa → verificar snapshot
    - _Requerimientos: 6.1–7.3, 9.1–9.4, 10.7_

- [x] 18. Checkpoint final — Asegurar que todos los tests pasen
  - Ejecutar la suite completa de tests unitarios, de propiedad e integración. Verificar que no haya tests fallidos. Consultar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requerimientos específicos para trazabilidad
- Los tests de propiedad usan `fast-check` con mínimo 100 iteraciones (`numRuns: 100`)
- Los tests de integración usan una base de datos MySQL dedicada con teardown entre suites
- Los tests de propiedad que involucren la base de datos deben usar transacciones revertidas para mantener aislamiento
