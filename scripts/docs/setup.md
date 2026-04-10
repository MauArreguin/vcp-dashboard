# Guía de instalación — Dashboard VCP

## Requisitos

- Cuenta de Google con acceso al Google Sheet
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Cuenta de GitHub (para publicar con GitHub Pages)

---

## Paso 1 — Instalar el Apps Script (backend)

1. Abre tu Google Sheet: [link al sheet]
2. Ve a **Extensions → Apps Script**
3. Borra el código que aparece por defecto
4. Copia y pega el contenido de `scripts/appsscript.gs`
5. Ajusta los nombres de tus pestañas (líneas 10-12):

```javascript
const SHEET_META    = 'Meta ADS Abril';   // nombre exacto de tu pestaña
const SHEET_GOOGLE  = 'Google ADS Abril';
const SHEET_REGS    = 'V1 Registros The Office';
```

6. Haz clic en **Save** (ícono de disco)
7. Selecciona la función `testLocal` en el menú desplegable y haz clic en **Run**
8. Revisa el **Execution Log** — deberías ver un JSON con tus datos
9. Si hay errores, verifica que los nombres de las pestañas coincidan exactamente

---

## Paso 2 — Publicar el Apps Script como Web App

1. Clic en **Deploy → New deployment**
2. Tipo: **Web App**
3. Description: `Dashboard VCP v1`
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Clic en **Deploy**
7. Autoriza los permisos cuando te los pida
8. Copia la **Web App URL** que aparece (se ve así):
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## Paso 3 — Conectar el dashboard

1. Abre `index.html` en un editor de texto
2. Busca esta línea cerca del inicio del `<script>`:
   ```javascript
   const APPS_SCRIPT_URL = '';
   ```
3. Pega tu URL entre las comillas:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
   ```
4. Guarda el archivo

---

## Paso 4 — Publicar en GitHub Pages (opcional pero recomendado)

1. Crea un repositorio nuevo en GitHub (público)
2. Sube todos los archivos de esta carpeta
3. Ve a **Settings → Pages**
4. Source: **Deploy from a branch → main → / (root)**
5. Espera 1-2 minutos
6. Tu dashboard estará en: `https://tuusuario.github.io/nombre-repo/`

---

## Actualizar datos cada nuevo mes

Cuando cambies de mes:

1. En `appsscript.gs`, actualiza las constantes de presupuesto y el array `SEMANAS_*` con las fechas del nuevo mes
2. En `index.html`, actualiza el array `SEMANAS` en el bloque de configuración
3. Re-deploya el Apps Script: **Deploy → Manage deployments → Edit → New version**

---

## Solución de problemas frecuentes

| Problema | Solución |
|---|---|
| El dashboard muestra datos hardcodeados | La URL del Apps Script está vacía o incorrecta |
| Error "Script function not found" | Verifica que el nombre de la función sea `doGet` |
| Error de permisos | Re-autoriza el script en Deploy → Manage |
| Las pestañas no se encuentran | Verifica el nombre exacto (mayúsculas incluidas) en las constantes |
| Los números de teléfono muestran `#ERROR!` | Es normal, el sheet tiene fórmulas de formato — no afecta el conteo |
