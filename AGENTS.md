# Instrucciones para agentes

## Comandos
- Instalar dependencias de forma reproducible: `npm ci`.
- Desarrollo: `npm run dev`; build: `npm run build`; inicio: `npm start`; tests: `npm test`.
- Para aislar una comprobación de tipos: `npx tsc -p .`. Para diagnosticar Prisma: `npx prisma validate` y `npx prisma generate`.
- En PowerShell 5.1, separa comandos con `;` (no `&&`). Usa `npx prisma ...` en lugar de invocar el binario `prisma` directamente.

## Estructura y convenciones
- Backend Express con TypeScript estricto y módulos ES. `server.ts` registra el servidor; `*.route.ts` atiende HTTP y valida entradas; `*.service.ts` contiene lógica y persistencia; `priceChecker.ts` evalúa alertas y coordina notificaciones.
- Usa `prisma.ts` para el cliente compartido, `env.ts` para configuración y mantén el estilo de imports relativos con extensión `.js`.
- Los tests Vitest están en la raíz y usan `*.test.ts`; la ejecución es serial (`fileParallelism: false`). Algunos tests compilan TypeScript internamente, así que si uno agota su timeout, ejecuta `npx tsc -p .` por separado y reporta el fallo del test sin ocultarlo.
- Consulta [README.md](README.md) para endpoints, pero verifica sus instrucciones de base de datos contra la configuración vigente: el README todavía menciona MySQL.

## Prisma y datos
- `prisma.config.ts` selecciona `prisma-local/schema.prisma.local` cuando `DATABASE_URL` empieza con `file:`; para otras URLs selecciona `schema.prisma`. Conserva esta selección al cambiar schemas. El nombre `.prisma.local` es intencional para que el schema SQLite alternativo no se indexe como otro schema normal del workspace.
- Si VS Code reporta modelos/generadores duplicados, primero revisa la ruta `Resource` del diagnóstico y ejecuta `npx prisma validate`; no borres modelos ni edites `node_modules/.prisma/client/schema.prisma` por un aviso del editor. Distingue el resultado del CLI del análisis de la extensión; recarga la ventana solo después de verificar los archivos implicados.
- `.env` usa SQLite local; Render espera PostgreSQL mediante `DATABASE_URL` configurada en el servicio. No copies secretos al repositorio.
- Antes de ejecutar migraciones de producción, verifica la compatibilidad de extremo a extremo: el historial actual de `migrations/` está marcado para SQLite, mientras Render configura PostgreSQL; además, confirma que Prisma reciba `DATABASE_URL` para la configuración de producción. No declares seguro `prisma migrate deploy` hasta resolver y validar esas diferencias.
- Los tests de persistencia crean y borran registros con Prisma. Usa una base de datos de prueba aislada; nunca apuntes esos tests a datos reales o compartidos.
