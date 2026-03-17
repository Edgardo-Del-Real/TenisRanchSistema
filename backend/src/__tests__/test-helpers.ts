import { Repository, DataSource } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';

/**
 * Clean up all test users from the database
 * Deletes all users with emails matching the test pattern
 * Handles foreign key constraints by deleting related records first
 */
export async function cleanupTestUsers(usuarioRepository: Repository<Usuario>): Promise<void> {
  const dataSource = usuarioRepository.manager.connection;
  
  try {
    // Use a transaction to ensure all deletions are atomic
    await dataSource.transaction(async (manager) => {
      // Disable foreign key checks temporarily for SQL Server
      await manager.query('SET FOREIGN_KEY_CHECKS = 0');
      
      // Delete in order to respect foreign key constraints
      
      // 1. Delete pagos_cuota (references cuotas)
      await manager.query(`DELETE FROM pagos_cuota WHERE cuota_id IN (
        SELECT id FROM cuotas WHERE socio_id IN (
          SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
        )
      )`);
      
      // 2. Delete cuotas (references usuarios)
      await manager.query(`DELETE FROM cuotas WHERE socio_id IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
      
      // 3. Delete pagos_turno (references turnos and usuarios)
      await manager.query(`DELETE FROM pagos_turno WHERE turno_id IN (
        SELECT id FROM turnos WHERE usuario_id IN (
          SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
        )
      ) OR registrado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
      
      // 4. Delete turnos (references usuarios and canchas)
      await manager.query(`DELETE FROM turnos WHERE usuario_id IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      ) OR cancelado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
      
      // 5. Delete historial_cancha (references usuarios)
      await manager.query(`DELETE FROM historial_cancha WHERE cambiado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
      
      // 6. Delete tarifas (references usuarios)
      await manager.query(`DELETE FROM tarifas WHERE modificado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
      
      // 7. Delete pagos_luz (references usuarios)
      await manager.query(`DELETE FROM pagos_luz WHERE registrado_por IN (
        SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'
      )`);
      
      // 8. Finally delete usuarios
      await manager.query(`DELETE FROM usuarios WHERE email LIKE 'test-%@example.com'`);
      
      // Re-enable foreign key checks
      await manager.query('SET FOREIGN_KEY_CHECKS = 1');
    });
  } catch (error) {
    // For SQL Server, the SET FOREIGN_KEY_CHECKS command doesn't exist
    // Let's try a different approach - delete in the correct order without disabling constraints
    try {
      await dataSource.transaction(async (manager) => {
        // Get all test user IDs first
        const testUsers = await manager.query(`SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'`);
        const userIds = testUsers.map(u => `'${u.id}'`).join(',');
        
        if (userIds) {
          // Delete in correct order
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
    } catch (secondError) {
      console.error('Error during test cleanup (second attempt):', secondError);
      // Don't throw - let tests continue even if cleanup fails
    }
  }
}

/**
 * Comprehensive cleanup for all test data
 * Use this for tests that create canchas, configuracion, etc.
 */
export async function cleanupAllTestData(dataSource: DataSource): Promise<void> {
  try {
    await dataSource.transaction(async (manager) => {
      // Get all test user IDs first
      const testUsers = await manager.query(`SELECT id FROM usuarios WHERE email LIKE 'test-%@example.com'`);
      const userIds = testUsers.map(u => `'${u.id}'`).join(',');
      
      if (userIds) {
        // Delete all test data in correct order
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
        
        // Delete test canchas (those with numero > 100 are test canchas)
        await manager.query(`DELETE FROM turnos WHERE cancha_id IN (
          SELECT id FROM canchas WHERE numero > 100
        )`);
        
        await manager.query(`DELETE FROM historial_cancha WHERE cancha_id IN (
          SELECT id FROM canchas WHERE numero > 100
        )`);
        
        await manager.query(`DELETE FROM canchas WHERE numero > 100`);
        
        // Delete test tarifas (those modified by test users)
        await manager.query(`DELETE FROM tarifas WHERE modificado_por IN (${userIds})`);
        
        // Delete test configuracion (keep only id = 1 which is the default)
        await manager.query(`DELETE FROM configuracion_club WHERE id != '1'`);
        
        // Finally delete test usuarios
        await manager.query(`DELETE FROM usuarios WHERE id IN (${userIds})`);
      }
    });
  } catch (error) {
    console.error('Error during comprehensive test cleanup:', error);
  }
}
