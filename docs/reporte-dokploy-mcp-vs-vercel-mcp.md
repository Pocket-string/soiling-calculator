# Reporte: Dokploy MCP vs Vercel MCP para Despliegue y Administracion

> Fecha: 2026-02-21
> Contexto: Evaluacion de plataformas MCP para gestion de infraestructura de aplicaciones Next.js self-hosted vs cloud-managed.

---

## 1. Resumen Ejecutivo

| Dimension | Dokploy MCP | Vercel MCP |
|---|---|---|
| **Tools totales** | **67** | **13** |
| **Tipo de MCP** | Local (npx, corre en tu maquina) | Remoto (cloud-hosted) |
| **Autenticacion** | API Key (`x-api-key`) | OAuth con consent screen |
| **Operaciones de escritura** | SI (deploy, stop, delete, create DBs) | Limitado (solo deploy y buy domain) |
| **Bases de datos** | SI (PostgreSQL + MySQL completos) | NO |
| **Costo** | $0 (self-hosted en VPS propio) | $0-20+/mes (segun plan) |
| **Infraestructura** | Tu propio VPS | Cloud managed |

---

## 2. Cobertura de Tools por Categoria

### Dokploy: 67 tools en 5 categorias

| Categoria | Tools | Operaciones |
|---|---|---|
| **Application** | 26 | deploy, redeploy, start, stop, cancel, reload, create, update, delete, move, config build type, env vars, 6 git providers, monitoring, traefik config |
| **PostgreSQL** | 13 | create, deploy, start, stop, reload, rebuild, remove, move, env vars, external port, change status |
| **MySQL** | 13 | create, deploy, start, stop, reload, rebuild, remove, move, env vars, external port, change status |
| **Domain** | 9 | create, update, delete, list by app/compose, validate, generate subdomain, traefik.me check |
| **Project** | 6 | list all, get one, create, update, duplicate, remove |

### Vercel: 13 tools en 6 categorias

| Categoria | Tools | Operaciones |
|---|---|---|
| **Documentation** | 1 | search_documentation |
| **Project Management** | 3 | list_teams, list_projects, get_project |
| **Deployments** | 4 | list_deployments, get_deployment, get_build_logs, get_runtime_logs |
| **Domains** | 2 | check_availability_and_price, buy_domain |
| **Access** | 2 | get_access_to_url, web_fetch_url |
| **CLI** | 1 | use_vercel_cli, deploy_to_vercel |

---

## 3. Comparativa Detallada por Caso de Uso

### 3.1 Despliegue

| Accion | Dokploy MCP | Vercel MCP |
|---|---|---|
| Trigger deploy | `application-deploy` | `deploy_to_vercel` |
| Re-deploy | `application-redeploy` | Requiere CLI manual |
| Cancel deploy | `application-cancelDeployment` | NO disponible |
| Ver build logs | NO (requiere dashboard) | `get_deployment_build_logs` |
| Ver runtime logs | NO (requiere dashboard) | `get_runtime_logs` (filtros avanzados) |
| Start/Stop app | `application-start` / `application-stop` | NO (always-on) |
| Rollback | Via redeploy de commit anterior | Via dashboard/CLI |

**Veredicto**: Dokploy tiene mas control operacional (start/stop/cancel). Vercel tiene mejor observabilidad (logs filtrados por nivel, status code, timeframe).

### 3.2 Configuracion de Aplicaciones

| Accion | Dokploy MCP | Vercel MCP |
|---|---|---|
| Crear app nueva | `application-create` | NO (requiere dashboard/CLI) |
| Configurar build type | `application-saveBuildType` (dockerfile, heroku, nixpacks, buildpacks) | NO (auto-detect) |
| Set env vars | `application-saveEnvironment` | NO (requiere dashboard/CLI) |
| Conectar GitHub | `application-saveGithubProvider` | NO (requiere dashboard) |
| Conectar GitLab | `application-saveGitlabProvider` | NO |
| Conectar Bitbucket | `application-saveBitbucketProvider` | NO |
| Mover entre proyectos | `application-move` | NO |
| Leer monitoring | `application-readAppMonitoring` | Solo via runtime logs |
| Actualizar proxy | `application-updateTraefikConfig` | NO (managed) |

**Veredicto**: Dokploy da control total de configuracion via MCP. Vercel es deliberadamente **read-only** por seguridad -- las mutaciones se hacen por dashboard/CLI.

### 3.3 Dominios

| Accion | Dokploy MCP | Vercel MCP |
|---|---|---|
| Crear dominio | `domain-create` | NO |
| Validar dominio | `domain-validateDomain` | NO |
| Generar subdominio | `domain-generateDomain` | NO |
| Comprar dominio | NO | `buy_domain` |
| Check disponibilidad | NO | `check_domain_availability_and_price` |
| Listar por app | `domain-byApplicationId` | Via `get_project` |
| SSL/Certificados | Let's Encrypt via `domain-create` | Automatico (managed) |

**Veredicto**: Dokploy permite CRUD completo de dominios. Vercel agrega la compra directa de dominios, pero no permite gestionarlos via MCP (solo dashboard).

### 3.4 Bases de Datos

| Accion | Dokploy MCP | Vercel MCP |
|---|---|---|
| Crear PostgreSQL | `postgres-create` | NO |
| Crear MySQL | `mysql-create` | NO |
| Deploy/Start/Stop DB | SI (6 tools por motor) | NO |
| Set env vars DB | `postgres-saveEnvironment` | NO |
| External port | `postgres-saveExternalPort` | NO |
| Rebuild DB | `postgres-rebuild` | NO |

**Veredicto**: Dokploy gestiona bases de datos completas via MCP (26 tools). Vercel no tiene tools de DB -- usa servicios externos (Supabase, PlanetScale, Neon).

### 3.5 Observabilidad

| Accion | Dokploy MCP | Vercel MCP |
|---|---|---|
| Build logs | NO via MCP | `get_deployment_build_logs` con limite configurable |
| Runtime logs | NO via MCP | `get_runtime_logs` (con filtros) |
| Monitoring | `application-readAppMonitoring` | Via runtime logs |
| Deployment history | Via `application-one` | `list_deployments` + `get_deployment` |
| Search docs | NO | `search_documentation` |
| Fetch deployment content | NO | `web_fetch_vercel_url` |

**Veredicto**: Vercel tiene mejor observabilidad via MCP -- logs con filtros granulares (nivel, status code, timerange, full-text search). Dokploy requiere ir al dashboard para logs.

---

## 4. Arquitectura y Seguridad

| Aspecto | Dokploy MCP | Vercel MCP |
|---|---|---|
| **Hosting** | Tu VPS ($5-20/mes) | Cloud managed ($0-20+/mes) |
| **Data residency** | Tu servidor, tu jurisdiccion | Servidores del proveedor (US/EU) |
| **Auth model** | API Key estatica | OAuth con consent screen por cliente |
| **Operaciones destructivas** | SI (delete app, stop, remove DB) | NO (read-only por diseno) |
| **Semantic annotations** | SI (readOnlyHint, destructiveHint) | NO documentado |
| **Clients soportados** | Claude, Cursor, VS Code, Windsurf | 12 clientes verificados + allowlist |
| **Transport** | stdio (local process) | Streamable HTTP (remoto) |
| **Offline operation** | SI (no requiere internet para MCP) | NO (requiere conexion al cloud) |

---

## 5. Beneficios Practicos del MCP de Dokploy

### Antes vs Despues

| Antes (curl manual) | Ahora (MCP) |
|---|---|
| `source <(grep...) && curl -X POST...` | "Deploya la app" |
| Ir al dashboard para ver estado | "Muestra el estado de la aplicacion" |
| Copiar env vars manualmente | "Agrega DATABASE_URL=xxx a la app" |
| Configurar dominio via dashboard | "Agrega staging.miapp.com con SSL" |
| Sin gestion de DB via terminal | "Crea una instancia PostgreSQL para staging" |

**67 operaciones de infraestructura** accesibles por lenguaje natural sin salir del editor.

---

## 6. Limitaciones de Dokploy MCP vs Vercel

| Lo que Dokploy MCP NO tiene | Vercel MCP SI tiene |
|---|---|
| Build logs via MCP | `get_deployment_build_logs` con limite configurable |
| Runtime logs filtrados | `get_runtime_logs` con 10 filtros |
| Search de documentacion | `search_documentation` |
| Compra de dominios | `buy_domain` |
| Access/shareable links | `get_access_to_vercel_url` |
| Fetch content de deployments | `web_fetch_vercel_url` |

---

## 7. Configuracion del MCP

### Dokploy MCP Server

```json
{
  "mcpServers": {
    "dokploy": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@ahdev/dokploy-mcp"],
      "env": {
        "DOKPLOY_URL": "https://tu-instancia-dokploy.com/api",
        "DOKPLOY_API_KEY": "tu-api-key"
      }
    }
  }
}
```

> En Linux/macOS, usar `"command": "npx"` y `"args": ["-y", "@ahdev/dokploy-mcp"]`.

### Prerequisitos

- Node.js v18+
- Instancia de Dokploy corriendo con API habilitada
- API Key generada desde Settings > API Keys en el dashboard de Dokploy

### Tools disponibles (67 total)

| Categoria | Cantidad | Ejemplos |
|---|---|---|
| Project | 6 | `project-all`, `project-create`, `project-remove` |
| Application | 26 | `application-deploy`, `application-saveEnvironment`, `application-stop` |
| Domain | 9 | `domain-create`, `domain-validateDomain`, `domain-delete` |
| PostgreSQL | 13 | `postgres-create`, `postgres-deploy`, `postgres-saveEnvironment` |
| MySQL | 13 | `mysql-create`, `mysql-deploy`, `mysql-saveEnvironment` |

---

## 8. Conclusion

| Criterio | Mejor opcion |
|---|---|
| **Control total de infraestructura** | Dokploy (67 tools, full CRUD) |
| **Observabilidad y debugging** | Vercel (logs filtrados, build logs) |
| **Gestion de bases de datos** | Dokploy (26 tools PostgreSQL + MySQL) |
| **Seguridad del MCP** | Vercel (read-only by design, OAuth) |
| **Costo a largo plazo** | Dokploy ($5-10/mes VPS fijo vs pricing variable) |
| **Velocidad de setup** | Vercel (zero config, auto-detect) |
| **Para proyectos self-hosted** | **Dokploy** |

### Recomendacion

Mantener Dokploy MCP como plataforma primaria para proyectos self-hosted. Si en el futuro se necesita mejor observabilidad (logs, monitoring), evaluar agregar herramientas de logging al VPS (Grafana/Loki) en vez de migrar a Vercel.

Para proyectos que requieran zero-ops y escalado automatico, Vercel sigue siendo la opcion mas rapida -- pero con menor control y mayor costo a escala.

---

## Fuentes

- [Dokploy MCP Server (GitHub)](https://github.com/Dokploy/mcp)
- [Dokploy MCP TOOLS.md](https://github.com/Dokploy/mcp/blob/main/TOOLS.md)
- [Dokploy API Documentation](https://docs.dokploy.com/docs/api)
- [Vercel MCP Server](https://vercel.com/docs/agent-resources/vercel-mcp)
- [Vercel MCP Tools Reference](https://vercel.com/docs/agent-resources/vercel-mcp/tools)
- [Vercel MCP Blog Post](https://vercel.com/blog/introducing-vercel-mcp-connect-vercel-to-your-ai-tools)
