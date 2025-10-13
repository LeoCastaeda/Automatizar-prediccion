# Crypto Alert Backend

### Requisitos
- Node 18+
- MySQL en marcha

### Instalación
1. Clona el repo y entra en la carpeta.
2. Copia `.env.example` a `.env` y completa los valores.
3. Instala dependencias: `npm i`.
4. Genera el cliente Prisma: `npm run prisma:generate`.
5. Ejecuta migraciones: `npm run prisma:migrate` (te pedirá un nombre, por ej. "init").
6. Arranca en desarrollo: `npm run dev`.

### Probar endpoints (usa el header `x-api-key`)
- Salud: `GET /health`
- Precio simple: `GET /api/prices/simple?symbols=bitcoin,ethereum&currency=eur`
- Crear alerta PRICE:
  - `POST /api/alerts`
  - Body JSON:
```json
{
  "userId": 1,
  "symbol": "bitcoin",
  "currency": "eur",
  "type": "PRICE",
  "targetValue": 55000
}
```

- Listar alertas: `GET /api/alerts?userId=1`
- Desactivar alerta: `POST /api/alerts/:id/deactivate`

### Notas
- Crea un usuario inicial en DB:
```sql
INSERT INTO User (email, name) VALUES ("leo@example.com", "Leo");
```
- La lógica de `CHANGE_%` requiere almacenar un **precio base** al crear; puedes añadir un campo `basePrice` en `Alert`.
- En producción, sustituye el `setInterval` por un **cron** y añade colas (BullMQ) si escalas.
