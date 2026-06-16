---
sidebar_position: 7
sidebar_label: 📝 Intents Declarativos
---

# Intenciones Declarativas (Intents en YAML)

Para garantizar la reproducibilidad de los flujos de trabajo de los Agentes IA y evitar la ambigüedad típica de las conversaciones por chat, OPO Studio utiliza un motor basado en **Intents Declarativos**.

Un Intent es un archivo estructurado en formato **YAML** que define el objetivo que quieres alcanzar, los agentes involucrados y los límites de ejecución de forma explícita.

---

## Por qué usar YAML en lugar de un Chat libre

Aunque chatear con un agente es excelente para pruebas rápidas y debugging (gracias a la vista de Mosaico), en un entorno de producción empresarial necesitas:
- **Previsibilidad:** Que la automatización se ejecute de la misma forma todas las noches.
- **Seguridad:** Limitar qué herramientas e información puede usar el agente para cumplir su objetivo.
- **Auditoría:** Poder versionar los flujos de trabajo en repositorios de Git como código.

---

## Estructura de un Intent en OPO

OPO Studio cuenta con un editor de YAML integrado (`IntentEditor`). Un archivo de Intent estándar tiene la siguiente forma:

```yaml
# Objetivo principal que debe resolver el enjambre de agentes
goal: "Identificar las 3 facturas vencidas con mayor monto y preparar el borrador de mail de reclamo para el cliente"

# Selección de agentes. 'auto' deja que el Router Semántico decida.
# También puedes forzar una lista de agentes específicos (ej: [AuditorContable, AsistenteEmail])
agents: auto

# Capa de memoria semántica a inyectar
memory:
  useOntology: true
  injectRegistry: true # Inyecta el registro de sinónimos/alias del ERP

# Configuración de límites y ejecución
execution:
  provider: "openai"
  model: "gpt-4o"
  maxSteps: 8 # Límite de iteraciones para evitar bucles infinitos de agentes
  
# Habilitar o deshabilitar aprobación humana antes de realizar acciones en el ERP
review:
  requireHumanApproval: true
  channel: "n8n-webhook"
```

---

## Cómo ejecutar un Intent

1. Abre el panel de **"Execute Mesh"** o el editor de Intents en OPO Studio.
2. Escribe o selecciona tu archivo YAML.
3. Haz clic en **"Ejecutar Flujo"**.
4. La Malla Cognitiva tomará el archivo, instanciará los agentes, inyectará el mapa de ontologías relevante, y comenzará la ejecución, mostrando en vivo cada paso en la pantalla de la malla cognitiva.
5. Si el paso requiere aprobación final (configurado con `requireHumanApproval: true`), el motor detendrá el flujo y te mostrará el botón de "Aprobar" en pantalla o enviará un webhook a n8n.
