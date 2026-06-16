# Guía de Onboarding Unificado: Ollama + TOTVS Protheus (MSSQL)

Esta guía documenta los tres caminos equivalentes para configurar y validar la conexión a la base de datos SQL Server de **TOTVS Protheus** y al motor de Inteligencia Artificial local **Ollama** (o proveedores cloud como Gemini).

---

## Camino A — Web UI (Studio & Consultas)

Si preferís realizar la configuración mediante una interfaz gráfica:

1. **Instalá las dependencias y construí el CLI:**
   ```bash
   npm install
   npm run build:cli
   ```
2. **Iniciá el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
3. **Completá el Wizard de Onboarding:**
   - Abrí [http://localhost:3000/consultas](http://localhost:3000/consultas) en tu navegador.
   - Si no tenés un espacio de trabajo configurado, se presentará el asistente simplificado de un paso.
   - **Paso IA:** Indicá la dirección de Ollama (por defecto `http://localhost:11434`), seleccioná un modelo disponible y presioná "Probar conexión".
   - **Paso ERP:** Completá los campos del servidor SQL Server en vivo (Servidor, Puerto, Base de datos, Usuario, Contraseña, Filial y Sufijo de tablas) o seleccioná "Modo Demostración". Presioná "Probar conexión" (es obligatorio que sea exitosa en base real) y continuá.
   - El sistema ejecutará la introspección semántica SX2/SX3/SX9 en segundo plano y te redirigirá automáticamente a la pantalla de consultas en lenguaje natural.

---

## Camino B — Solo Consola (CLI interactivo)

Para inicializar y consultar tu ERP directamente desde la terminal de comandos de Windows o Linux:

1. **Instalá las dependencias:**
   ```bash
   npm install
   ```
2. **Ejecutá el asistente interactivo de onboarding:**
   ```bash
   npm run onboard
   ```
   *Alternativamente, si instalaste el CLI globalmente:* `opo onboard`
3. **Seguí los pasos interactivos en pantalla:**
   - **IA:** Elegí el proveedor (Ollama, Gemini, OpenAI). Si es Ollama, detectará automáticamente tus modelos locales instalados.
   - **Base de datos:** Indicá si querés usar demostración o conexión en vivo. Si elegís conexión en vivo, completá los campos del formulario SQL Server.
   - El CLI comprobará la conexión, leerá el diccionario de datos SX y generará los archivos en tu espacio de trabajo:
     - `.well-known/opo.json` (Manifiesto de la ontología)
     - `.opo/workspace.json` (Configuración de espacio de trabajo y metadatos visuales)
4. **Verificá la conexión:**
   ```bash
   npm run health
   ```
5. **Realizá consultas en lenguaje natural:**
   ```bash
   npm run query "¿Cuánto debe el cliente 000219?"
   ```

---

## Camino C — Híbrido (Configuración TI + Consulta Usuario Final)

Pensado para implementaciones típicas de Protheus on-premise, donde el equipo de TI realiza la configuración inicial y el usuario final solo consulta:

1. **El administrador TI realiza el setup inicial vía CLI no interactivo:**
   ```bash
   npm run onboard -- \
     --erp protheus \
     --mode live \
     --server 192.168.1.10 \
     --port 1433 \
     --database PROTHEUS_PROD \
     --user opo_reader \
     --password "ContraseñaSQLSegura" \
     --filial 01 \
     --company-suffix 010 \
     --ollama http://localhost:11434 \
     --model llama3.1
   ```
2. **Validá la salud de la infraestructura:**
   ```bash
   npm run health
   ```
3. **Levantá la consola para los usuarios finales:**
   ```bash
   npm run consultas
   ```
   Los usuarios finales podrán acceder directamente a [http://localhost:3000/consultas](http://localhost:3000/consultas) sin pasar por ningún paso técnico de conexión ni ver contraseñas.

---

## Comandos Útiles del CLI

### Validar Salud del Entorno (`health`)
Verifica de forma rápida la conectividad al ERP y el proveedor de IA. Devuelve código de salida `0` si todo está operativo y `1` si hay fallos críticos en base de datos real.
```bash
# Comprobación completa
npm run health

# Filtrado por componente
npm run health -- --ollama-only
npm run health -- --erp-only
```

### Consultas Rápidas (`query`)
Ejecuta consultas en lenguaje natural o por identificador de consulta recurrente desde la terminal.
```bash
# Lenguaje Natural
npm run query "¿Cuánto debe el cliente 000219?"

# Por ID recurrente con parámetros
npm run query -- --recurring customer-debt-summary --param customerId=000219

# Salida estructurada
npm run query -- "¿Cuánto debe el cliente 000219?" --format json
npm run query -- "¿Cuánto debe el cliente 000219?" --format csv
```

### Studio UI (`studio`)
Lanza el lienzo avanzado y la UI local de OPO Studio sincronizado con el espacio de trabajo local actual.
```bash
opo studio -p 3000
```

---

## Seguridad de Credenciales

Tus contraseñas e API keys están protegidas:
- **Encriptación local:** La contraseña de SQL Server y las API keys de la nube se guardan de forma encriptada en la bóveda local de SQLite (`CredentialVault`).
- **Secretos del Sistema de Archivos:** Se genera un archivo de respaldo seguro en `.opo/.db_secret` con permisos estrictos de lectura y escritura (`600`) visibles únicamente por el propietario del proceso.
- **Sin datos en claro:** El archivo `.opo/workspace.json` solo almacena referencias a la bóveda (`vault:xxx`) y versiones enmascaradas de los strings de conexión para depuración.
