# Contributing Libraries to Quarkid

## Introducción
El proyecto **Quarkid** agrupa múltiples librerías bajo un mismo monorepo. La estrategia propuesta se basa en:

- **Workspaces de pnpm** para manejar dependencias y builds en paralelo.
- **Changesets** para versionado semántico y generación de changelogs.
- **CI/CD con GitHub Actions** para ejecutar tests, validar paquetes y publicar automáticamente al registro npm.

⚠️ Actualmente el repositorio solo contiene `package.json` y `yarn.lock` en la raíz; no se encontraron `pnpm-workspace.yaml` ni directorio `.changeset/` ni flujos de GitHub Actions. 
Añadir para activar completamente esta estrategia.

## Organización del repositorio
- `package.json`: configuración raíz del workspace.
- `packages/`: cada librería dentro de su propio directorio.
- `test/`: scripts utilitarios para validaciones del monorepo.

## Flujo de trabajo recomendado
### Instalación
```bash
pnpm install
```
### Crear o editar una librería
1. Crear carpeta dentro de `packages/` y agregar `package.json` con nombre bajo el scope `@quarkid/*`.
2. Incluir `tsconfig.json`, entrypoint en `src/` y tests en `__tests__/`.
3. Agregar scripts de `build`, `test`, `lint` y `prepack` según corresponda.

### Build y test
```bash
pnpm -r build    # Construye todas las librerías
pnpm -r test     # Ejecuta tests
```

### Versionado con Changesets
```bash
pnpm changeset          # registrar cambios
pnpm changeset version  # actualizar versiones
```
⚠️ Faltan archivos de configuración de Changesets en el repositorio.

### Pull Requests
1. Asegúrate de que `pnpm -r build` y `pnpm -r test` pasen.
2. Ejecuta `pnpm changeset` si el cambio amerita release.
3. Abre un PR describiendo el cambio.

## Publicación en npm
Los paquetes se publican bajo el scope `@quarkid`.
La publicación debería realizarse mediante **GitHub Actions** que:
1. Ejecuten tests y builds.
2. Publiquen cambiosets nuevos con `pnpm publish`.

⚠️ No se encontró configuración de GitHub Actions; las publicaciones actuales podrían ser manuales.

## Buenas prácticas
- Seguir **SemVer** estricto.
- Mantener `exports` y `types` limpios en cada `package.json`.
- Utilizar `prepack` para limpiar artefactos antes de publicar.
- Incluir documentación mínima (`README.md`) y pruebas (`test/` o script `test`).
- Evitar dependencias innecesarias y usar `workspace:*` para dependencias internas.

## Recursos útiles
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Changesets](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions](https://docs.github.com/actions)

## Catálogo de librerías


### @quarkid/agent

- Versión: 0.10.0-5
- Descripción: Agent SDK
- Scripts: build, prepublishOnly, test
- Dependencias internas: @quarkid/did-core@1.1.0, @quarkid/did-registry@^1.5.0, @quarkid/did-resolver@^1.4.1, @quarkid/dwn-client@^1.2.0, @quarkid/dwn-client-ami@^1.0.1, @quarkid/kms-client@1.4.0-2, @quarkid/kms-core@1.4.0-2, @quarkid/modena-sdk@1.3.2, @quarkid/vc-core@1.1.0-0, @quarkid/vc-verifier@1.2.0-0, @quarkid/waci@~3.1.0
- Dependencias externas: @types/base-64@^1.0.0, async-lock@^1.4.0, axios@^1.4.0, base-64@^1.0.0, jsonpath@^1.1.1, jsonschema@^1.4.1, jwt-decode@^3.1.2, lru-cache@4.1.5, socket.io@4.6.1, socket.io-client@4.6.1
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/ami-agent-plugin

- Versión: 0.1.1
- Descripción: Ami Agent Plugin
- Scripts: build, test
- Dependencias internas: @quarkid/ami-core@0.1.0, @quarkid/ami-sdk@0.1.2
- Dependencias externas: Ninguna
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/one-click-agent-plugin

- Versión: 0.3.0
- Descripción: One Click Agent Plugin
- Scripts: build, test
- Dependencias internas: @quarkid/oneclick-sdk@0.3.0
- Dependencias externas: Ninguna
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/status-list-agent-plugin

- Versión: 0.1.1
- Descripción: Extrimian Status List Agent Plugin
- Scripts: build, test
- Dependencias internas: Ninguna
- Dependencias externas: axios@^1.7.2
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/ami-core

- Versión: 0.1.0
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-core@1.1.0
- Dependencias externas: Ninguna
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/ami-sdk

- Versión: 0.1.1
- Scripts: start, build, test
- Dependencias internas: @quarkid/ami-core@0.1.0, @quarkid/kms-core@1.3.0
- Dependencias externas: Ninguna
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/core

- Versión: 1.0.5
- Scripts: start, build, test
- Dependencias internas: Ninguna
- Dependencias externas: reflect-metadata@^0.1.13
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/did-core

- Versión: 1.1.0
- Scripts: start, build, test
- Dependencias internas: Ninguna
- Dependencias externas: reflect-metadata@^0.1.13
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/did-comm

- Versión: 1.1.0
- Scripts: build
- Dependencias internas: @quarkid/core@1.0.5, @quarkid/did-core@1.1.0, @quarkid/did-resolver@1.1.0, @quarkid/kms-client@1.1.0, @quarkid/kms-core@1.1.0
- Dependencias externas: Ninguna
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/did-registry

- Versión: 1.5.0
- Scripts: build, test
- Dependencias internas: @quarkid/core@1.0.5, @quarkid/did-core@1.1.0, @quarkid/kms-client@1.4.0-0, @quarkid/kms-core@1.4.0-0, @quarkid/modena-sdk@^1.3.1
- Dependencias externas: @decentralized-identity/ion-sdk@0.5.0, @types/node-fetch@^2.6.1, bs58@^5.0.0, multibase@^4.0.6, node-fetch@^2.6.1, text-encoding@^0.7.0
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/did-resolver

- Versión: 1.4.4
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-core@1.1.0
- Dependencias externas: axios@^0.27.2, reflect-metadata@^0.1.13
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/dwn-client

- Versión: 1.2.0
- Scripts: build, test
- Dependencias internas: Ninguna
- Dependencias externas: @ipld/dag-pb@^2.1.17, axios@^0.27.2, axios-retry@^3.3.1, base-64@^1.0.0, cids@^1.1.9, multiformats@^9.6.5, uuid@^8.3.2
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/dwn-client-scheduler

- Versión: 1.1.0
- Scripts: build, start
- Dependencias internas: @quarkid/dwn-client@^1.1.0
- Dependencias externas: node-cron@^3.0.0
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/dwn-client-ami

- Versión: 1.0.1
- Scripts: build, test
- Dependencias internas: Ninguna
- Dependencias externas: @ipld/dag-pb@^2.1.17, axios@^0.27.2, axios-retry@^3.3.1, base-64@^1.0.0, cids@^1.1.9, multiformats@^9.6.5, uuid@^8.3.2
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/dwn-client-scheduler

- Versión: 1.1.0
- Scripts: build, start
- Dependencias internas: @quarkid/dwn-client@^1.1.0
- Dependencias externas: node-cron@^3.0.0
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/kms-client

- Versión: 1.4.0-2
- Scripts: start, build, test
- Dependencias internas: @quarkid/kms-suite-bbsbls2020@1.2.0-0, @quarkid/kms-suite-didcomm@^1.1.0, @quarkid/kms-suite-didcomm-v2@^1.3.0, @quarkid/kms-suite-es256k@^1.2.2, @quarkid/kms-suite-rsa-signature-2018@^1.1.0, @quarkid/vc-core@1.0.7, @quarkid/kms-core@^1.4.0-2
- Dependencias externas: ts-jest@^28.0.1
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/kms-client-mobile

- Versión: 1.0.0
- Scripts: start, build, test
- Dependencias internas: @quarkid/kms-core@^1.1.0, @quarkid/kms-suite-bbsbls2020@^1.1.0, @quarkid/kms-suite-didcomm@^1.1.0, @quarkid/kms-suite-es256k@^1.1.0, @quarkid/vc-core@1.0.7
- Dependencias externas: ts-jest@^28.0.1
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/kms-core

- Versión: 1.4.0-2
- Scripts: start, build, test
- Dependencias internas: Ninguna
- Dependencias externas: base64url@^3.0.1, bs58@^5.0.0, did-jwt@^6.11.0, jsonld@^5.2.0, multibase@^4.0.6, multiformats@^9.6.5, text-encoding@^0.7.0
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/kms-storage-vault

- Versión: 1.6.1
- Scripts: start, build, test
- Dependencias internas: @quarkid/kms-core@^1.2.0
- Dependencias externas: hashi-vault-js@0.4.11, ts-jest@^28.0.1
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/kms-suite-didcomm

- Versión: 1.1.0
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-core@1.1.0, @quarkid/kms-core@^1.1.0
- Dependencias externas: @hearro/didcomm@^0.6.0, @types/libsodium-wrappers@^0.7.9, did-jwt@^6.8.0, jsonld@^5.2.0, libsodium@^0.7.9, libsodium-wrappers@^0.7.9
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/kms-suite-didcomm-v2

- Versión: 1.3.0
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-core@1.1.0, @quarkid/kms-core@^1.3.0
- Dependencias externas: @ethersproject/bytes@^5.7.0, @hearro/didcomm@^0.6.0, @stablelib/ed25519@^1.0.3, @types/libsodium-wrappers@^0.7.9, @veramo/core@^4.0.0, @veramo/did-comm@^4.0.2, jsonld@^5.2.0, libsodium@^0.7.9, libsodium-wrappers@^0.7.9
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/kms-suite-es256k

- Versión: 1.2.2
- Scripts: start, build, test
- Dependencias internas: @quarkid/kms-core@^1.4.0-2
- Dependencias externas: @transmute/did-key-secp256k1@^0.2.1-unstable.35, @transmute/es256k-jws-ts@^0.1.3, ethers@^5.6.8, jsonld@^5.2.0
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/kms-suite-bbsbls2020

- Versión: 1.2.0-0
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-core@1.1.0, @quarkid/kms-suite-jsonld@^1.1.1, @quarkid/vc-core@1.1.0-0
- Dependencias externas: @mattrglobal/jsonld-signatures-bbs@0.12.0
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/kms-suite-jsonld

- Versión: 1.1.1
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-core@1.1.0, @quarkid/kms-core@^1.1.0
- Dependencias externas: axios@^0.27.2, jsonld@^5.2.0, jsonld-signatures@5.0.1
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/kms-suite-rsa-signature-2018

- Versión: 1.1.1
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-core@1.1.0, @quarkid/kms-core@^1.1.0, @quarkid/kms-suite-jsonld@^1.1.0
- Dependencias externas: @types/jwk-to-pem@^2.0.1, crypto-ld@3.8.0, js-crypto-rsa@^1.0.4, jsonld@3.1.0, jsonld-signatures@5.2.0, jwk-to-pem@^2.0.5
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/modena-sdk

- Versión: 1.3.2
- Descripción: TypeScript SDK for Modena
- Scripts: build, test, lint, lint:fix
- Dependencias internas: @quarkid/kms-client@1.4.0-0, @quarkid/kms-core@1.4.0-0
- Dependencias externas: @transmute/did-key-secp256k1@^0.2.1-unstable.35, @waiting/base64@4.2.9, canonicalize@1.0.1, jest@^28.0.3, ts-jest@^28.0.1, multihashes@0.4.14, randombytes@2.1.0, uri-js@4.4.0
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/oneclick-sdk

- Versión: 0.3.1
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-registry@1.5.0, @quarkid/did-resolver@1.4.4
- Dependencias externas: axios@^1.3.5, class-transformer@^0.5.1, class-validator@^0.14.0, dotenv@^16.0.3
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE


### @quarkid/vc-core

- Versión: 1.1.0-0
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-core@1.1.0
- Dependencias externas: jsonld@^5.2.0
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/vc-verifier

- Versión: 1.2.0-0
- Scripts: start, build, test
- Dependencias internas: @quarkid/did-core@1.1.0, @quarkid/kms-core@^1.1.0, @quarkid/vc-core@^1.0.7
- Dependencias externas: @mattrglobal/jsonld-signatures-bbs@1.1.0, axios@^0.27.2, jsonld@3.1.0, jsonld-document-loader@1.2.1, jsonld-signatures@5.0.1, jwk-to-pem@^2.0.5
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE, Faltan tests


### @quarkid/waci

- Versión: 3.2.0
- Scripts: build, test
- Dependencias internas: Ninguna
- Dependencias externas: jsonpath@^1.1.1, jsonschema@^1.4.1, lodash@^4.17.21, uuid@^8.3.2
- Exports definidos: No
- ⚠️ Falta README, Falta LICENSE

