# BDX Studio — Discord Bot

Bot de moderación y comunidad desarrollado con **Node.js** y **Discord.js v14**.

## Funciones incluidas

- Comandos slash globales: `/ping`, `/anuncio`, `/ticket-panel`, `/sugerencia`, `/postulacion`, `/limpiar`, `/expulsar` y `/banear`.
- Tickets privados con botón de apertura y cierre.
- Formulario de postulaciones enviado al canal del equipo.
- Bienvenidas y despedidas.
- Logs de moderación y seguridad.
- Filtro configurable de enlaces y spam.

## Requisitos

- Node.js 20 o superior.
- Una aplicación y un bot creados en Discord Developer Portal.
- El bot invitado al servidor con los permisos necesarios.

## Instalación

1. Descarga o clona este repositorio.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env`.
4. Completa `DISCORD_TOKEN`, `CLIENT_ID` y los IDs de canales/roles que vayas a utilizar.
5. En Discord Developer Portal activa **Server Members Intent** y **Message Content Intent** en Bot → Privileged Gateway Intents.
6. Ejecuta `npm run deploy-commands` para registrar los comandos globales.
7. Ejecuta `npm start` para iniciar el bot.

## Variables de entorno

| Variable | Uso |
|---|---|
| `DISCORD_TOKEN` | Token privado del bot |
| `CLIENT_ID` | ID de la aplicación |
| `WELCOME_CHANNEL_ID` | Canal de bienvenidas |
| `GOODBYE_CHANNEL_ID` | Canal de despedidas |
| `LOG_CHANNEL_ID` | Canal de registros |
| `TICKET_CATEGORY_ID` | Categoría donde crear tickets (opcional) |
| `TICKET_SUPPORT_ROLE_ID` | Rol del equipo de soporte (opcional) |
| `APPLICATIONS_CHANNEL_ID` | Canal privado de postulaciones |
| `SUGGESTIONS_CHANNEL_ID` | Canal de sugerencias |
| `ANTI_LINK` | Activar filtro básico de enlaces: true/false |
| `ANTI_SPAM` | Activar filtro básico de spam: true/false |

## Seguridad

Nunca subas tu archivo `.env` ni compartas el token del bot. Si el token se filtra, regénéralo desde Discord Developer Portal.

Los filtros anti-spam y anti-enlaces son básicos y deben ajustarse a las reglas y excepciones de tu comunidad antes de activarlos en un servidor activo.
