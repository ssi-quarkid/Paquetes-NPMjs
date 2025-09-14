# QuarkID SDKs

[![npm version](https://img.shields.io/npm/v/@quarkid/core)](https://www.npmjs.com/package/@quarkid/core)
[![Build Status](https://img.shields.io/github/actions/workflow/status/quarkid/quarkid-npm/ci.yml?branch=main)](https://github.com/quarkid/quarkid-npm/actions)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)
[![Coverage Status](https://img.shields.io/codecov/c/github/quarkid/quarkid-npm)](https://codecov.io/gh/quarkid/quarkid-npm)

## TL;DR

- Conjunto de librerías núcleo del protocolo **QuarkID** para identidad descentralizada y credenciales verificables.
- Publicadas bajo el scope [`@quarkid/*`](https://www.npmjs.com/org/quarkid) y mantenidas en un monorepo.
- Arquitectura modular: DID, KMS, DWN, VC, WACI, agente y plugins.
- Construidas en TypeScript con soporte para Node.js y navegadores modernos.
- Listas para ser integradas en wallets, agentes y servicios de credenciales.

## Arquitectura y alcance

Este monorepo agrupa las librerías que implementan los distintos componentes del ecosistema QuarkID:

- **Agente** y plugins.
- **DID**: creación, resolución y registro.
- **KMS**: cliente, núcleo, storage y suites criptográficas.
- **DWN**: clientes y schedulers.
- **VC**: emisión y verificación de credenciales.
- **WACI**: flujos de intercambio de credenciales.
- **SDKs adicionales**: Modena, One Click, AMI.

Todas las librerías se empaquetan y versionan de manera independiente, pero comparten configuración y dependencias mediante Yarn Workspaces.

## Tabla de paquetes

| Paquete | Versión | Descripción | Estado |
| --- | --- | --- | --- |
| `@quarkid/agent` | 0.10.0-5 | SDK para construir un agente QuarkID | Pre-release |
| `@quarkid/ami-agent-plugin` | 0.1.1 | Plugin del agente para AMI | Pre-release |
| `@quarkid/one-click-agent-plugin` | 0.3.0 | Plugin del agente para One Click Issuance | Pre-release |
| `@quarkid/status-list-agent-plugin` | 0.1.1 | Plugin del agente para listas de estado | Pre-release |
| `@quarkid/ami-core` | 0.1.0 | Núcleo de AMI (Attribute Management Interface) | Pre-release |
| `@quarkid/ami-sdk` | 0.1.1 | SDK para interactuar con AMI | Pre-release |
| `@quarkid/core` | 1.0.5 | Utilidades comunes del ecosistema | Estable |
| `@quarkid/did-core` | 1.1.0 | Operaciones básicas de DID | Estable |
| `@quarkid/did-comm` | 1.1.0 | Mensajería segura basada en DIDComm | Estable |
| `@quarkid/did-registry` | 1.5.0 | Interacción con registries de DIDs | Estable |
| `@quarkid/did-resolver` | 1.4.4 | Resolución de DIDs | Estable |
| `@quarkid/dwn-client` | 1.2.0 | Cliente para Decentralized Web Nodes | Estable |
| `@quarkid/dwn-client-scheduler` | 1.1.0 | Scheduler de tareas DWN | Estable |
| `@quarkid/dwn-client-ami` | 1.0.1 | Cliente DWN especializado en AMI | Estable |
| `@quarkid/kms-client` | 1.4.0-2 | Cliente para el servicio de gestión de llaves | Pre-release |
| `@quarkid/kms-client-mobile` | 1.0.0 | Cliente KMS para entornos móviles | Estable |
| `@quarkid/kms-core` | 1.4.0-2 | Núcleo criptográfico del KMS | Pre-release |
| `@quarkid/kms-storage-vault` | 1.6.1 | Backend de almacenamiento en Hashicorp Vault | Estable |
| `@quarkid/kms-suite-didcomm` | 1.1.0 | Suite criptográfica para DIDComm v1 | Estable |
| `@quarkid/kms-suite-didcomm-v2` | 1.3.0 | Suite criptográfica para DIDComm v2 | Estable |
| `@quarkid/kms-suite-es256k` | 1.2.2 | Suite de firmas ES256K | Estable |
| `@quarkid/kms-suite-bbsbls2020` | 1.2.0-0 | Suite de firmas BBS+ 2020 | Pre-release |
| `@quarkid/kms-suite-jsonld` | 1.1.1 | Soporte de firmas JSON-LD | Estable |
| `@quarkid/kms-suite-rsa-signature-2018` | 1.1.1 | Suite de firmas RSA 2018 | Estable |
| `@quarkid/modena-sdk` | 1.3.2 | SDK TypeScript para el método Modena | Estable |
| `@quarkid/oneclick-sdk` | 0.3.1 | SDK para flujos de One Click | Pre-release |
| `@quarkid/vc-core` | 1.1.0-0 | Núcleo para trabajar con VC | Pre-release |
| `@quarkid/vc-verifier` | 1.2.0-0 | Verificador de credenciales | Pre-release |
| `@quarkid/waci` | 3.2.0 | Flujos WACI para intercambio de credenciales | Estable |

## Requisitos

- Node.js ≥ 16
- Yarn ≥ 3 (monorepo con Yarn Workspaces)
- Sistemas operativos soportados: Linux, macOS y Windows

## Quickstart

```bash
# Clonar el repositorio
git clone https://github.com/quarkid/quarkid-npm.git
cd quarkid-npm

# Instalar dependencias (requiere acceso a los repos de npm)
yarn install

# Construir todas las librerías
yarn build

# Ejecutar pruebas básicas
yarn test
```

## Guía de desarrollo

Scripts principales disponibles en la raíz del repositorio:

- `yarn build`: compila todas las librerías.
- `yarn test`: ejecuta las pruebas definidas.
- `yarn clean`: elimina artefactos de `dist/`, `lib/` y `node_modules/`.

Para trabajar sobre una librería específica se recomienda:

```bash
yarn workspace <paquete> build
yarn workspace <paquete> test
```

## Toolchain del monorepo

- **Yarn Workspaces** para manejar dependencias y comandos por paquete.
- **TypeScript** como lenguaje principal.
- Se planea integrar **Changesets** y flujos de CI/CD con GitHub Actions.
- Convención de commits sugerida: [Conventional Commits](https://www.conventionalcommits.org/).

## Entornos y variables

Algunas librerías requieren configuraciones adicionales (por ejemplo, endpoints de KMS o DWN). Proveer un archivo `.env` con las variables mínimas necesarias para ejecutar ejemplos.

> ⚠️ No incluir secretos en el repositorio. Usa `.env.example` para documentar las variables requeridas.

## Publicación y versionado

- Versionado siguiendo **SemVer**.
- Los paquetes se publican en npm bajo el scope `@quarkid`.
- Flujo de release previsto mediante **Changesets** y GitHub Actions.
- Canales sugeridos: `stable` y `next`.

## Compatibilidad

- Node.js ≥16.
- Bundles ESM/CJS generados desde TypeScript.
- La mayoría de las librerías son agnósticas de entorno; revisar cada paquete para soporte de navegador.

## Seguridad y supply chain

- Cada paquete declara licencia Apache 2.0.
- Usar versionados firmados y provenance npm (en preparación).
- Reportar vulnerabilidades de forma privada a security@quarkid.org.

## Observabilidad y telemetría

Actualmente no se recopilan métricas ni telemetría. Si se añaden en el futuro deberán poder desactivarse y declararse las implicancias de privacidad.

## Roadmap y propuestas de arquitectura

Los cambios de diseño se discuten mediante RFC/ADR dentro de issues o pull requests. Se alienta a la comunidad a proponer mejoras con ejemplos y justificación técnica.

## Contribución y Código de Conducta

Consulta [CONTRIBUTING_LIBS.md](CONTRIBUTING_LIBS.md) para lineamientos de desarrollo y estilos.

1. Crea un fork y un branch por funcionalidad.
2. Ejecuta `yarn build` y `yarn test` antes de enviar un PR.
3. Describe claramente los cambios y motivaciones.

Se espera respeto mutuo conforme al [Código de Conducta de la comunidad](https://www.contributor-covenant.org/).

## Soporte

- Discusiones y preguntas: GitHub Discussions.
- Chat en tiempo real: canal de Discord de QuarkID.
- Email: info@quarkid.org

## Licencia

Distribuido bajo la licencia Apache 2.0. Ver [LICENSE](LICENSE) para más información.

## FAQ y troubleshooting

- **`yarn install` devuelve 403**: asegúrate de tener acceso al registro npm privado requerido.
- **Errores de compilación**: ejecuta `yarn clean` y luego `yarn build`.
- **Faltan variables de entorno**: copia `.env.example` a `.env` y completa los valores necesarios.

## Agradecimientos

Proyecto impulsado por el equipo de QuarkID y la comunidad open source.
