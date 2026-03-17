# Frontend - Sistema de Gestión Club de Tenis

## Descripción

Frontend desarrollado en React + TypeScript para el sistema de gestión del Club de Tenis. Implementa autenticación, navegación por roles y diseño responsivo.

## Tecnologías Utilizadas

- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **React Router DOM** - Navegación y enrutamiento
- **Axios** - Cliente HTTP para comunicación con la API
- **Vite** - Herramienta de desarrollo y build
- **Vitest** - Framework de testing
- **Testing Library** - Utilidades de testing para React

## Funcionalidades Implementadas

### ✅ Autenticación
- **Registro de usuarios** con validación de formularios
- **Inicio de sesión** con manejo de errores
- **Contexto de autenticación** para gestión de estado global
- **Interceptores HTTP** para manejo automático de JWT
- **Logout** con invalidación de tokens
- **Redirección automática** según estado de sesión

### ✅ Navegación y Layout
- **Layout responsivo** que se adapta a móviles, tablets y escritorio
- **Navegación diferenciada por rol**:
  - **Administrador**: Acceso a usuarios, canchas, tarifas, cuotas, pagos luz, estadísticas
  - **Socio**: Acceso a turnos y cuotas propias
  - **No_Socio**: Acceso a turnos y perfil
- **Rutas protegidas** con control de acceso por rol
- **Componente ProtectedRoute** para validación de permisos

### ✅ Páginas Implementadas
- **Login** - Formulario de inicio de sesión
- **Register** - Formulario de registro con validaciones
- **Home** - Dashboard principal con tarjetas informativas
- **Turnos** - Placeholder para gestión de turnos
- **Perfil** - Visualización de información del usuario

### ✅ Diseño Responsivo
- **CSS Variables** para consistencia de colores y espaciado
- **Grid y Flexbox** para layouts adaptativos
- **Media queries** para móviles (768px) y dispositivos pequeños (480px)
- **Navegación colapsable** en dispositivos móviles
- **Formularios optimizados** para touch devices

### ✅ Validaciones
- **Campos obligatorios** en formularios de registro y login
- **Validación de email** con tipo de input apropiado
- **Contraseña mínima** de 8 caracteres
- **Teléfono mínimo** de 8 dígitos
- **Manejo de errores** de la API con mensajes apropiados

### ✅ Testing
- **Tests unitarios** para componentes principales
- **Tests de integración** para flujos de autenticación
- **Mocks** para API y contextos
- **Configuración de Vitest** con jsdom y testing-library

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── Layout.tsx       # Layout principal con navegación
│   │   └── ProtectedRoute.tsx # Componente de rutas protegidas
│   ├── contexts/            # Contextos de React
│   │   └── AuthContext.tsx  # Contexto de autenticación
│   ├── lib/                 # Utilidades y configuraciones
│   │   └── api.ts          # Cliente HTTP con interceptores
│   ├── pages/              # Páginas de la aplicación
│   │   ├── Home.tsx        # Dashboard principal
│   │   ├── Login.tsx       # Página de inicio de sesión
│   │   ├── Register.tsx    # Página de registro
│   │   ├── Turnos.tsx      # Gestión de turnos (placeholder)
│   │   └── Perfil.tsx      # Perfil de usuario (placeholder)
│   ├── types/              # Definiciones de tipos TypeScript
│   │   ├── enums.ts        # Enumeraciones del sistema
│   │   └── index.ts        # Interfaces principales
│   ├── __tests__/          # Tests
│   │   ├── App.test.tsx    # Test del componente principal
│   │   └── auth.integration.test.tsx # Tests de integración
│   ├── App.tsx             # Componente principal con routing
│   ├── main.tsx            # Punto de entrada
│   ├── index.css           # Estilos globales y responsivos
│   └── test-setup.ts       # Configuración de tests
├── package.json            # Dependencias y scripts
├── vite.config.ts          # Configuración de Vite
└── README.md              # Este archivo
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo en puerto 5173

# Testing
npm run test         # Ejecuta tests en modo watch
npm run test:run     # Ejecuta tests una vez

# Build
npm run build        # Construye la aplicación para producción
npm run preview      # Previsualiza el build de producción

# Linting
npm run lint         # Ejecuta ESLint
```

## Configuración de Desarrollo

### Prerrequisitos
- Node.js 18+
- Backend ejecutándose en `http://localhost:3000`

### Instalación
```bash
cd frontend
npm install
npm run dev
```

### Variables de Entorno
El frontend está configurado para conectarse al backend en `http://localhost:3000/api` mediante proxy de Vite.

## Validaciones Implementadas

### Registro
- ✅ Todos los campos obligatorios
- ✅ Email único (validado por backend)
- ✅ Contraseña mínima 8 caracteres
- ✅ Teléfono mínimo 8 dígitos
- ✅ Asignación automática de rol NO_SOCIO

### Login
- ✅ Email y contraseña obligatorios
- ✅ Manejo de credenciales inválidas
- ✅ Redirección según rol del usuario

## Próximas Implementaciones

Las siguientes funcionalidades serán implementadas en tareas posteriores:

- **Módulos de administración** (usuarios, canchas, tarifas, cuotas)
- **Gestión completa de turnos** (reserva, cancelación, historial)
- **Panel de estadísticas** con gráficos y reportes
- **Perfil de usuario editable**
- **Gestión de cuotas para socios**
- **Módulo de pagos**

## Compatibilidad

- ✅ **Móviles**: Diseño optimizado para pantallas pequeñas
- ✅ **Tablets**: Layout adaptativo para pantallas medianas  
- ✅ **Escritorio**: Experiencia completa en pantallas grandes
- ✅ **Navegadores modernos**: Chrome, Firefox, Safari, Edge

## Estado del Proyecto

**Task 14 - COMPLETADA** ✅

- ✅ React Router configurado
- ✅ Contexto de autenticación implementado
- ✅ Cliente HTTP con interceptores JWT
- ✅ Páginas de registro y login con validaciones
- ✅ Layout responsivo con navegación por rol
- ✅ Logout y redirección según sesión
- ✅ Tests unitarios y de integración
- ✅ Validación de requerimientos 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 15.5