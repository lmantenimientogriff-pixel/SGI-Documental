# IA SGI — Transporte Griffouliere

Aplicación web de consulta del Sistema de Gestión Integrado.

## Estructura del proyecto

```
sgi-griffouliere/
├── index.html              # App principal
├── css/
│   └── style.css           # Estilos
├── js/
│   └── app.js              # Lógica: búsqueda KB + Claude API
├── data/
│   └── knowledge-base.json # Base de procedimientos del SGI
└── README.md
```

## Deploy en GitHub Pages

### Paso 1 — Crear repositorio en GitHub
1. Ir a https://github.com/new
2. Nombre del repo: `sgi-griffouliere` (o el que prefieras)
3. Visibilidad: **Private** (recomendado para documentación interna)
4. Click en "Create repository"

### Paso 2 — Subir los archivos
Desde tu computadora, con Git instalado:

```bash
git init
git add .
git commit -m "IA SGI v1.0"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/sgi-griffouliere.git
git push -u origin main
```

O simplemente arrastrá los archivos desde la interfaz web de GitHub.

### Paso 3 — Activar GitHub Pages
1. Ir a Settings del repositorio
2. Sección "Pages"
3. Source: **Deploy from a branch**
4. Branch: **main**, folder: **/ (root)**
5. Click en Save

En 1-2 minutos la app va a estar disponible en:
`https://TU_USUARIO.github.io/sgi-griffouliere/`

## Configuración de la API de Claude

Para que el fallback a Claude funcione, hay que agregar la API key.

**Opción A — Variable de entorno (recomendado para producción):**
Si usás Vercel o similar, configurar `ANTHROPIC_API_KEY` como variable de entorno.

**Opción B — Para pruebas locales:**
Crear el archivo `js/config.js`:
```javascript
window.ANTHROPIC_API_KEY = "sk-ant-...tu-api-key...";
```
Y agregar en `index.html` antes de `app.js`:
```html
<script src="js/config.js"></script>
```
⚠️ Nunca subas la API key a un repositorio público.

**Nota importante:** GitHub Pages es estático, por lo que la llamada a la API de Claude se hace desde el navegador del usuario. Para mayor seguridad en producción, se recomienda usar un backend serverless (Vercel Functions, Cloudflare Workers) que guarde la API key en el servidor.

## Agregar nuevos procedimientos

Editar el archivo `data/knowledge-base.json` agregando una nueva entrada:

```json
"codigo_clave": {
  "codigo": "P-TA-01",
  "titulo": "Mantenimiento Preventivo",
  "sector": "TA",
  "revision": "03",
  "fecha": "01/2026",
  "url": "https://drive.google.com/...",
  "keywords": ["mantenimiento preventivo", "pm", "checklist mantenimiento"],
  "respuesta": "Descripción natural del procedimiento...",
  "alerta": "Opcional: texto de advertencia",
  "normas": ["ISO 9001", "ISO 45001"]
}
```

## Sectores disponibles

| Código | Sector |
|--------|--------|
| SI | Sistema Integrado |
| SE | Seguridad |
| OP | Operaciones |
| SV | Seguridad Vial |
| MA | Medio Ambiente |
| TA | Taller / Mantenimiento |
| ADM | Administración |
| RRHH | Recursos Humanos |
