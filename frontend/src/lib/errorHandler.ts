import { AxiosError } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ErrorResponse {
  error?: ApiError;
  message?: string;
}

/**
 * Maps HTTP error codes to user-friendly messages
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) {
    return 'Ha ocurrido un error inesperado';
  }

  const axiosError = error as AxiosError<ErrorResponse>;
  
  if (!axiosError.response) {
    // Network error or no response
    return 'Error de conexión. Por favor, verifique su conexión a internet.';
  }

  const { status, data } = axiosError.response;

  // Try to get the error message from the response
  const errorMessage = data?.error?.message || data?.message;

  switch (status) {
    case 400:
      // Bad Request - validation errors
      return errorMessage || 'Los datos ingresados no son válidos. Por favor, verifique la información.';
    
    case 401:
      // Unauthorized - authentication required or invalid token
      return errorMessage || 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.';
    
    case 403:
      // Forbidden - insufficient permissions
      return errorMessage || 'No tiene permisos para realizar esta acción.';
    
    case 404:
      // Not Found - resource doesn't exist
      return errorMessage || 'El recurso solicitado no fue encontrado.';
    
    case 409:
      // Conflict - duplicate or business rule violation
      return errorMessage || 'Ya existe un registro con estos datos o hay un conflicto con la operación.';
    
    case 500:
    case 502:
    case 503:
    case 504:
      // Server errors
      return 'Error del servidor. Por favor, intente nuevamente más tarde.';
    
    default:
      return errorMessage || 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.';
  }
};

/**
 * Maps specific error codes to user-friendly messages
 */
export const getSpecificErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    // Auth errors
    'EMAIL_DUPLICADO': 'El correo electrónico ya está registrado en el sistema.',
    'CREDENCIALES_INVALIDAS': 'Correo electrónico o contraseña incorrectos.',
    'USUARIO_INACTIVO': 'Su cuenta ha sido desactivada. Contacte al administrador.',
    
    // Cancha errors
    'CANCHA_NO_DISPONIBLE': 'La cancha seleccionada no está disponible en este momento.',
    
    // Turno errors
    'TURNO_CONFLICTO': 'Ya existe una reserva en ese horario para la cancha seleccionada.',
    'LIMITE_DIARIO': 'Ha alcanzado el límite de 2 turnos por día.',
    'ANTICIPACION_EXCEDIDA': 'Solo puede reservar turnos con hasta 1 día de anticipación.',
    'FUERA_HORARIO': 'El horario seleccionado está fuera del horario de funcionamiento del club.',
    'CANCELACION_TARDIA': 'No se puede cancelar el turno con menos de 1 hora de anticipación.',
    'SOCIO_BLOQUEADO': 'Tiene cuotas pendientes. Regularice su situación para reservar más turnos.',
    
    // User errors
    'ROL_PROPIO': 'No puede modificar su propio rol.',
    
    // Generic errors
    'RECURSO_NO_ENCONTRADO': 'El recurso solicitado no existe.',
    'ACCESO_DENEGADO': 'No tiene permisos para acceder a este recurso.',
  };

  return errorMessages[errorCode] || errorCode;
};

/**
 * Handles API errors and returns a user-friendly message
 */
export const handleApiError = (error: unknown): string => {
  const axiosError = error as AxiosError<ErrorResponse>;
  
  // Check if there's a specific error code
  const errorCode = axiosError.response?.data?.error?.code;
  if (errorCode) {
    return getSpecificErrorMessage(errorCode);
  }
  
  // Fall back to generic error message based on status code
  return getErrorMessage(error);
};
