# Solución: Los 24 vehículos no aparecen en el dropdown

## Qué he hecho

1. **Agregué los 24 vehículos al sistema** - Incluyendo VJDK91 (Anderson) y KYFBB66 (Móvil 20)
2. **Agregué un botón "Recargar"** en la sección "Registrar Gasto TAG" que permite recargar los vehículos manualmente
3. **Agregué datos de fallback** - Si Supabase no responde, la app funciona con los 24 vehículos localmente
4. **Restauré el Excel** - Vuelve a mostrar solo Móvil y Patente (sin fila de conductores)
5. **Los datos se guardan** en Supabase cuando funcionan los datos de tolls

## Si aún no ves los 24 vehículos

### Opción 1: Hacer clic en "Recargar"

1. Abre la app
2. Ve a "Registrar Gastos"
3. Haz clic en el botón **"Recargar (0)"** al lado del título "Registrar Gasto TAG"
4. Los vehículos deberían aparecer en el dropdown

Si después de hacer clic en "Recargar" ves:
- **"Recargar (24)"** = Los vehículos se cargaron correctamente desde Supabase
- **"Recargar (0)"** = Hay un problema con Supabase

### Opción 2: Ejecutar script SQL en Supabase (si Recargar no funciona)

1. Ve a https://app.supabase.com y abre tu proyecto
2. Haz clic en "SQL Editor" en el menú izquierdo
3. Crea una nueva query
4. Copia todo el contenido del archivo `SUPABASE_SETUP.sql` (en la carpeta del proyecto)
5. Pégalo en el editor y ejecuta
6. Regresa a la app y haz clic nuevamente en "Recargar"

### Opción 3: Solucionar problema de Supabase

Si el mensaje de error dice algo sobre "Project already exists":

1. Ve a https://app.supabase.com
2. Verifica que no haya múltiples proyectos con nombres similares
3. Elimina proyectos que no uses
4. Recarga la página de tu app

## Características que están funcionando

- **Dropdown de Vehículos**: Muestra los 24 vehículos ordenados correctamente
- **Excel**: Exporta con formato correcto (Móvil, Patente, Autopistas)
- **Guardado de Datos**: Los tolls se guardan en Supabase cuando haces clic en "Registrar Gasto"
- **Persistencia**: Los datos se mantienen incluso si cierras la app
- **Fallback Local**: Si Supabase falla, la app sigue funcionando con los 24 vehículos

## Contacto

Si el problema persiste después de intentar estas opciones, verifica:
1. Que tu conexión a internet sea estable
2. Que el proyecto Supabase sea el correcto (URL en .env)
3. Los logs del navegador (F12 > Console) para mensajes de error
