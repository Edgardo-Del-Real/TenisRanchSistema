"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupTestUsers = cleanupTestUsers;
exports.cleanupAllTestData = cleanupAllTestData;
async function cleanupTestUsers(usuarioRepository) {
    const dataSource = usuarioRepository.manager.connection;
    try {
        await dataSource.transaction(async (manager) => {
            await manager.query('SET FOREIGN_KEY_CHECKS = 0');
            await manager.query(`DELETE FROM pagos_cuota WHERE cuota_id IN (
        SELECT id FROM cuotas WHERE socio_id IN (
          SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
        )
      )`);
            await manager.query(`DELETE FROM cuotas WHERE socio_id IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
            await manager.query(`DELETE FROM pagos_turno WHERE turno_id IN (
        SELECT id FROM turnos WHERE usuario_id IN (
          SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
        )
      ) OR registrado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
            await manager.query(`DELETE FROM turnos WHERE usuario_id IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      ) OR cancelado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
            await manager.query(`DELETE FROM historial_cancha WHERE cambiado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
            await manager.query(`DELETE FROM tarifas WHERE modificado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
            await manager.query(`DELETE FROM pagos_luz WHERE registrado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
            await manager.query(`DELETE FROM usuarios WHERE email LIKE 'test-%@example.com'`);
            await manager.query('SET FOREIGN_KEY_CHECKS = 1');
        });
    }
    catch (error) {
        try {
            await dataSource.transaction(async (manager) => {
                const testUsers = await manager.query(`SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'`);
                const userIds = testUsers.map(u => `'${u.id}'`).join(',');
                if (userIds) {
                    await manager.query(`DELETE FROM pagos_cuota WHERE cuota_id IN (
            SELECT id FROM cuotas WHERE socio_id IN (${userIds})
          )`);
                    await manager.query(`DELETE FROM cuotas WHERE socio_id IN (${userIds})`);
                    await manager.query(`DELETE FROM pagos_turno WHERE turno_id IN (
            SELECT id FROM turnos WHERE usuario_id IN (${userIds})
          ) OR registrado_por IN (${userIds})`);
                    await manager.query(`DELETE FROM turnos WHERE usuario_id IN (${userIds}) OR cancelado_por IN (${userIds})`);
                    await manager.query(`DELETE FROM historial_cancha WHERE cambiado_por IN (${userIds})`);
                    await manager.query(`DELETE FROM tarifas WHERE modificado_por IN (${userIds})`);
                    await manager.query(`DELETE FROM pagos_luz WHERE registrado_por IN (${userIds})`);
                    await manager.query(`DELETE FROM usuarios WHERE id IN (${userIds})`);
                }
            });
        }
        catch (secondError) {
            console.error('Error during test cleanup (second attempt):', secondError);
        }
    }
}
async function cleanupAllTestData(dataSource) {
    try {
        await dataSource.transaction(async (manager) => {
            const testUsers = await manager.query(`SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'`);
            const userIds = testUsers.map(u => `'${u.id}'`).join(',');
            if (userIds) {
                await manager.query(`DELETE FROM pagos_cuota WHERE cuota_id IN (
          SELECT id FROM cuotas WHERE socio_id IN (${userIds})
        )`);
                await manager.query(`DELETE FROM cuotas WHERE socio_id IN (${userIds})`);
                await manager.query(`DELETE FROM pagos_turno WHERE turno_id IN (
          SELECT id FROM turnos WHERE usuario_id IN (${userIds})
        ) OR registrado_por IN (${userIds})`);
                await manager.query(`DELETE FROM turnos WHERE usuario_id IN (${userIds}) OR cancelado_por IN (${userIds})`);
                await manager.query(`DELETE FROM historial_cancha WHERE cambiado_por IN (${userIds})`);
                await manager.query(`DELETE FROM pagos_luz WHERE registrado_por IN (${userIds})`);
                await manager.query(`DELETE FROM turnos WHERE cancha_id IN (
          SELECT id FROM canchas WHERE numero > 100
        )`);
                await manager.query(`DELETE FROM historial_cancha WHERE cancha_id IN (
          SELECT id FROM canchas WHERE numero > 100
        )`);
                await manager.query(`DELETE FROM canchas WHERE numero > 100`);
                await manager.query(`DELETE FROM tarifas WHERE modificado_por IN (${userIds})`);
                await manager.query(`DELETE FROM configuracion_club WHERE id != '1'`);
                await manager.query(`DELETE FROM usuarios WHERE id IN (${userIds})`);
            }
        });
    }
    catch (error) {
        console.error('Error during comprehensive test cleanup:', error);
    }
}
//# sourceMappingURL=test-helpers.js.map