# Documento de Requerimientos

## Introducción

El sistema de gestión del Club de Tenis es una aplicación web de tres capas (frontend, API REST y base de datos relacional) que centraliza la administración de turnos, socios, pagos y tarifas del club. Actualmente el club opera con 3 canchas habilitadas en un horario de 8:00 a 22:00 horas, gestionando turnos y finanzas mediante grupos de WhatsApp y planillas Excel. El sistema reemplaza esos procesos manuales, eliminando errores humanos y conflictos de horarios, y brinda estadísticas para la toma de decisiones.

## Glosario

- **Sistema**: La aplicación web de gestión del Club de Tenis.
- **Administrador**: Usuario con rol de administrador, responsable de la gestión general del club (ej. Adriana).
- **Socio**: Usuario registrado con membresía activa en el club, conoce el código de acceso al candado.
- **No_Socio**: Usuario registrado sin membresía activa en el club.
- **Usuario**: Persona registrada en el sistema con cualquier rol (Administrador, Socio o No_Socio).
- **Turno**: Reserva de una cancha por un período de tiempo determinado.
- **Cancha**: Espacio físico de juego disponible para reserva (el club cuenta con 3 canchas).
- **Cuota**: Pago mensual obligatorio que deben abonar los socios por su membresía.
- **Tarifa**: Valor económico configurado para turnos, luz o cuotas mensuales.
- **Luz**: Iluminación artificial de las canchas, activada en la franja horaria configurada por el Administrador (por defecto entre 18:30 y 19:00 horas).
- **Franja_Horaria**: Rango de horas y días en que el club opera o en que se activa la iluminación.
- **Historial**: Registro cronológico de eventos pasados (turnos, pagos, cambios de tarifas).
- **Pago_Parcial**: Abono de una fracción del monto total de una cuota mensual.
- **Estado_Cancha**: Condición operativa de una cancha (disponible, en mantenimiento, inhabilitada, etc.).
- **Cobrador**: Persona externa que recauda cuotas de socios y cobra una comisión por el servicio.
- **Sesión**: Período autenticado de acceso al sistema por parte de un Usuario.

---

## Requerimientos

### Requerimiento 1: Registro de Usuarios

**User Story:** Como visitante, quiero registrarme en el sistema con mis datos personales, para poder acceder a las funcionalidades del club.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir el registro de un nuevo Usuario con nombre, apellido, correo electrónico, contraseña y número de teléfono.
2. WHEN un visitante intenta registrarse con un correo electrónico ya existente, THE Sistema SHALL rechazar el registro y mostrar un mensaje indicando que el correo ya está en uso.
3. WHEN un visitante completa el formulario de registro con datos válidos, THE Sistema SHALL crear la cuenta con rol No_Socio por defecto.
4. IF el formulario de registro contiene campos obligatorios vacíos, THEN THE Sistema SHALL mostrar un mensaje de error indicando los campos faltantes sin procesar el registro.

---

### Requerimiento 2: Autenticación de Usuarios

**User Story:** Como Usuario registrado, quiero iniciar sesión en el sistema, para acceder a las funcionalidades correspondientes a mi rol.

#### Criterios de Aceptación

1. WHEN un Usuario ingresa credenciales válidas (correo y contraseña), THE Sistema SHALL iniciar una sesión autenticada y redirigir al panel correspondiente a su rol.
2. WHEN un Usuario ingresa credenciales inválidas, THE Sistema SHALL rechazar el acceso y mostrar un mensaje de error genérico sin revelar cuál campo es incorrecto.
3. WHILE una sesión está activa, THE Sistema SHALL mantener el acceso del Usuario a las funcionalidades de su rol.
4. WHEN un Usuario solicita cerrar sesión, THE Sistema SHALL terminar la sesión activa e invalidar el token de autenticación.
5. THE Sistema SHALL requerir autenticación para acceder a cualquier funcionalidad que no sea el registro o el inicio de sesión.

---

### Requerimiento 3: Gestión de Roles y Datos de Usuarios

**User Story:** Como Administrador, quiero gestionar los roles y la información de los usuarios, para mantener el control de acceso y los datos del club actualizados.

#### Criterios de Aceptación

1. WHEN un Administrador modifica el rol de un Usuario, THE Sistema SHALL actualizar el rol al valor seleccionado (Administrador, Socio o No_Socio) y registrar el cambio.
2. THE Sistema SHALL impedir que un Usuario modifique su propio rol.
3. WHEN un Administrador modifica los datos personales de un Usuario, THE Sistema SHALL guardar los cambios y reflejarlos de forma inmediata en el sistema.
4. WHEN un Socio o No_Socio modifica su propia información personal (nombre, teléfono, contraseña), THE Sistema SHALL guardar los cambios sin alterar el rol ni el estado del Usuario.
5. WHEN un Administrador solicita dar de baja a un Usuario, THE Sistema SHALL aplicar una baja lógica, conservando el registro histórico y marcando al Usuario como inactivo.
6. WHEN un Usuario con rol No_Socio solicita cambiar su rol a Socio, THE Sistema SHALL redirigir al Usuario a WhatsApp con un mensaje predefinido dirigido al Administrador.
7. THE Sistema SHALL impedir que un Usuario inactivo inicie sesión.

---

### Requerimiento 4: Consulta y Búsqueda de Usuarios

**User Story:** Como Administrador, quiero consultar, buscar y filtrar el listado de usuarios, para gestionar eficientemente la información del club.

#### Criterios de Aceptación

1. WHEN un Administrador accede al listado de usuarios, THE Sistema SHALL mostrar nombre, apellido, correo electrónico, teléfono, rol y estado de cada Usuario.
2. WHEN un Administrador ingresa un nombre o apellido en el buscador de usuarios, THE Sistema SHALL mostrar únicamente los Usuarios cuyo nombre o apellido coincida parcialmente con el texto ingresado.
3. WHEN un Administrador aplica un filtro por estado, THE Sistema SHALL mostrar únicamente los Usuarios que coincidan con el estado seleccionado (activo o inactivo).
4. WHEN un Administrador aplica un filtro por rol, THE Sistema SHALL mostrar únicamente los Usuarios que tengan el rol seleccionado (Administrador, Socio o No_Socio).

---

### Requerimiento 5: Gestión de Canchas

**User Story:** Como Administrador, quiero gestionar el estado de las canchas, para reflejar su disponibilidad real en el sistema.

#### Criterios de Aceptación

1. WHEN un Administrador asigna un estado a una Cancha, THE Sistema SHALL actualizar el estado de la Cancha con la razón indicada y registrar la fecha y hora del cambio.
2. WHILE una Cancha tiene un estado distinto a "disponible", THE Sistema SHALL impedir que los Usuarios reserven turnos en esa Cancha.
3. THE Sistema SHALL mantener el registro histórico de cambios de estado de cada Cancha.

---

### Requerimiento 6: Reserva de Turnos

**User Story:** Como Usuario registrado, quiero reservar un turno en una cancha disponible, para asegurar mi espacio de juego.

#### Criterios de Aceptación

1. WHEN un Usuario solicita reservar un Turno, THE Sistema SHALL verificar que la Cancha esté disponible en el horario seleccionado antes de confirmar la reserva.
2. WHEN un Usuario solicita reservar un Turno en un horario que requiere iluminación, THE Sistema SHALL informar al Usuario el costo adicional de luz ($4000) antes de confirmar la reserva.
3. WHEN un Usuario confirma una reserva con uso de luz, THE Sistema SHALL registrar el Turno incluyendo el cargo adicional de luz.
4. WHEN un Usuario confirma una reserva sin uso de luz, THE Sistema SHALL registrar el Turno sin cargo adicional de luz.
5. THE Sistema SHALL asignar una duración de 1 hora a los Turnos reservados en días de semana y de 1 hora y media a los Turnos reservados en fines de semana y feriados.
6. IF un Usuario intenta reservar un Turno fuera de la Franja_Horaria de funcionamiento del club (8:00 a 22:00), THEN THE Sistema SHALL rechazar la reserva y mostrar un mensaje indicando el horario válido.
7. IF un Usuario intenta reservar más de 2 Turnos en el mismo día, THEN THE Sistema SHALL rechazar la reserva y mostrar un mensaje indicando el límite diario.
8. IF un Usuario intenta reservar un Turno con más de 1 día de anticipación, THEN THE Sistema SHALL rechazar la reserva y mostrar un mensaje indicando la restricción de anticipación.
9. WHILE un Socio acumula 2 o más cuotas mensuales impagas, THE Sistema SHALL permitir al Socio reservar únicamente 1 Turno adicional antes de bloquear nuevas reservas hasta regularizar su deuda.
10. THE Sistema SHALL requerir que el Usuario esté autenticado para realizar una reserva.
11. WHERE el Usuario es Administrador, THE Sistema SHALL permitir la reserva de Turnos sin restricción de cantidad diaria.

---

### Requerimiento 7: Cancelación de Turnos

**User Story:** Como Usuario registrado, quiero cancelar un turno vigente, para liberar la cancha cuando no pueda asistir.

#### Criterios de Aceptación

1. WHEN un Usuario solicita cancelar un Turno con al menos 1 hora de anticipación a su inicio, THE Sistema SHALL cancelar el Turno y liberar la disponibilidad de la Cancha.
2. IF un Usuario intenta cancelar un Turno con menos de 1 hora de anticipación a su inicio, THEN THE Sistema SHALL rechazar la cancelación y mostrar un mensaje indicando la restricción de tiempo.
3. WHEN un Turno es cancelado, THE Sistema SHALL registrar la fecha y hora de la cancelación y el Usuario que la realizó.

---

### Requerimiento 8: Consulta de Turnos

**User Story:** Como Usuario, quiero consultar los turnos vigentes y mi historial de turnos, para tener visibilidad sobre mis reservas y las del club.

#### Criterios de Aceptación

1. WHEN un Administrador accede al listado de turnos vigentes, THE Sistema SHALL mostrar todos los Turnos activos del club con cancha, fecha, hora, duración, Usuario y estado de luz.
2. WHEN un Administrador busca turnos por nombre o apellido, THE Sistema SHALL mostrar únicamente los Turnos asociados al Usuario cuyo nombre o apellido coincida con el texto ingresado.
3. WHEN un Administrador filtra turnos por fecha, THE Sistema SHALL mostrar únicamente los Turnos que correspondan a la fecha seleccionada.
4. WHEN un Socio o No_Socio accede a sus turnos vigentes, THE Sistema SHALL mostrar únicamente los Turnos activos asociados a ese Usuario.
5. WHEN un Socio accede a su historial de turnos, THE Sistema SHALL mostrar todos los Turnos pasados y cancelados asociados a ese Usuario en orden cronológico descendente.

---

### Requerimiento 9: Gestión de Cuotas de Socios

**User Story:** Como Administrador, quiero gestionar las cuotas mensuales de los socios, para mantener el control financiero de las membresías del club.

#### Criterios de Aceptación

1. WHEN el Sistema genera cuotas mensuales, THE Sistema SHALL crear automáticamente una Cuota para cada Socio activo correspondiente al mes en curso.
2. WHEN un Administrador registra un pago de Cuota, THE Sistema SHALL actualizar el estado de la Cuota reflejando el monto abonado y la fecha de pago.
3. WHEN un Socio realiza un Pago_Parcial de su Cuota, THE Sistema SHALL registrar el pago parcial y actualizar el saldo pendiente de la Cuota sin marcarla como pagada hasta que el monto total sea cubierto.
4. WHEN la suma de los Pagos_Parciales de una Cuota iguala o supera el valor total de la Cuota, THE Sistema SHALL marcar la Cuota como pagada.
5. WHEN un Administrador accede al listado de cuotas, THE Sistema SHALL mostrar nombre, apellido del Socio, mes, monto total, monto abonado, saldo pendiente y estado de cada Cuota.
6. WHEN un Administrador busca en el listado de cuotas por nombre o apellido, THE Sistema SHALL mostrar únicamente las Cuotas asociadas al Socio cuyo nombre o apellido coincida con el texto ingresado.
7. WHEN un Administrador filtra cuotas por estado, THE Sistema SHALL mostrar únicamente las Cuotas que tengan el estado seleccionado (pendiente, parcialmente pagada, pagada).
8. WHEN un Administrador filtra cuotas por fecha de generación, THE Sistema SHALL mostrar únicamente las Cuotas generadas en el período seleccionado.
9. WHEN un Socio accede a su listado de cuotas, THE Sistema SHALL mostrar todas las Cuotas del Socio con su estado, monto total, monto abonado y saldo pendiente.

---

### Requerimiento 10: Gestión de Tarifas

**User Story:** Como Administrador, quiero modificar las tarifas de turnos, luz y cuotas, para mantener los valores actualizados según las necesidades del club.

#### Criterios de Aceptación

1. WHEN un Administrador modifica la tarifa de turnos para No_Socios, THE Sistema SHALL registrar el nuevo valor con la fecha de vigencia y conservar el valor anterior en el historial.
2. WHEN un Administrador modifica la tarifa de luz por turno, THE Sistema SHALL registrar el nuevo valor con la fecha de vigencia y conservar el valor anterior en el historial.
3. WHEN un Administrador modifica el valor de la Cuota mensual, THE Sistema SHALL registrar el nuevo valor con la fecha de vigencia y conservar el valor anterior en el historial.
4. WHEN un Usuario consulta los valores actuales, THE Sistema SHALL mostrar las tarifas vigentes de turnos, luz y cuotas mensuales.
5. WHEN un Administrador consulta el historial de cambios de tarifas de cuotas, THE Sistema SHALL mostrar todos los valores históricos con fecha de vigencia en orden cronológico descendente.
6. WHEN un Administrador filtra el historial de tarifas por fecha o monto, THE Sistema SHALL mostrar únicamente los registros que coincidan con los criterios seleccionados.
7. THE Sistema SHALL aplicar la tarifa vigente al momento de la reserva para el cálculo del costo de cada Turno.

---

### Requerimiento 11: Gestión de Franja Horaria y Funcionamiento del Club

**User Story:** Como Administrador, quiero configurar los horarios de funcionamiento del club y la activación de la iluminación, para reflejar cambios operativos en el sistema.

#### Criterios de Aceptación

1. WHEN un Administrador registra una Franja_Horaria de funcionamiento, THE Sistema SHALL guardar los días de la semana y el rango horario de operación del club.
2. WHEN un Administrador modifica la Franja_Horaria de funcionamiento, THE Sistema SHALL actualizar los días y horarios de operación y aplicar los cambios a las nuevas reservas.
3. WHEN un Administrador modifica la franja horaria de activación de iluminación, THE Sistema SHALL actualizar el rango horario a partir del cual los Turnos incluyen cargo de luz.
4. WHEN un Administrador modifica la duración de los Turnos, THE Sistema SHALL actualizar la duración aplicable a los nuevos Turnos según el tipo de día (semana o fin de semana/feriado).
5. THE Sistema SHALL aplicar la Franja_Horaria y duración vigentes al momento de la reserva para validar y registrar cada Turno.

---

### Requerimiento 12: Registro de Pagos de Turnos de No Socios

**User Story:** Como Administrador, quiero registrar los pagos de turnos de los no socios, para mantener el control financiero de los ingresos por uso de canchas.

#### Criterios de Aceptación

1. WHEN un Administrador registra el pago de un Turno de un No_Socio, THE Sistema SHALL asociar el pago al Turno correspondiente con monto, fecha y método de pago.
2. WHEN un Administrador registra el pago de luz de un Turno, THE Sistema SHALL registrar el pago del cargo adicional de luz asociado al Turno.
3. THE Sistema SHALL mostrar el estado de pago de cada Turno de No_Socio en el listado de turnos del Administrador.

---

### Requerimiento 13: Registro y Consulta de Pagos de Luz

**User Story:** Como Administrador, quiero registrar y consultar los pagos de luz del club, para controlar los gastos operativos de iluminación.

#### Criterios de Aceptación

1. WHEN un Administrador registra un pago de luz, THE Sistema SHALL guardar el monto, la fecha y una descripción opcional del pago.
2. WHEN un Administrador consulta el historial de pagos de luz, THE Sistema SHALL mostrar todos los pagos registrados en orden cronológico descendente con monto, fecha y descripción.

---

### Requerimiento 14: Estadísticas y Reportes

**User Story:** Como Administrador, quiero visualizar estadísticas generales y financieras del club, para tomar decisiones informadas sobre la operación.

#### Criterios de Aceptación

1. WHEN un Administrador accede al panel de estadísticas generales, THE Sistema SHALL mostrar el total de socios activos, total de turnos reservados en el período, canchas más utilizadas y horas pico de uso.
2. WHEN un Administrador accede al panel de estadísticas financieras, THE Sistema SHALL mostrar el total recaudado por cuotas, el total recaudado por turnos de No_Socios, el total recaudado por cargos de luz y el total de pagos de luz registrados en el período seleccionado.
3. WHEN un Administrador selecciona un período para las estadísticas, THE Sistema SHALL filtrar todos los indicadores al rango de fechas seleccionado.

---

### Requerimiento 15: Seguridad y Control de Acceso

**User Story:** Como Administrador, quiero que el sistema controle el acceso según el rol de cada usuario, para proteger la información y las operaciones del club.

#### Criterios de Aceptación

1. THE Sistema SHALL restringir el acceso a las funcionalidades de administración (gestión de usuarios, tarifas, canchas, estadísticas financieras) únicamente a Usuarios con rol Administrador.
2. THE Sistema SHALL restringir la consulta del historial de turnos y cuotas propias únicamente al Usuario autenticado propietario de esos registros o a un Administrador.
3. WHEN un Usuario intenta acceder a una funcionalidad para la que no tiene permisos, THE Sistema SHALL rechazar la solicitud y devolver un mensaje de acceso denegado.
4. THE Sistema SHALL utilizar autenticación basada en tokens para proteger todas las rutas de la API REST.
5. THE Sistema SHALL funcionar correctamente en dispositivos móviles, tablets y computadoras de escritorio mediante un diseño responsivo.
