# Graph Report - clinica-odonto  (2026-10-16)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3597 nodes · 5677 edges · 306 communities (25 shown, 281 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 306 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `504fc84d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- types.d.ts
- App
- BaseApp
- ODONTO-PLUS-parche-2/pb_public/js/compartir.js
- pb_public/js/compartir.js
- Command
- Se
- Se
- Record
- Oa
- time
- Oa
- SelectQuery
- pb_public/js/vendor/jspdf.umd.min.js
- DB
- ODONTO-PLUS-parche-2/pb_hooks/lib/odonto.js
- ODONTO-PLUS-parche-2/pb_public/js/vendor/jspdf.umd.min.js
- Event
- Root
- pb_hooks/lib/odonto.js
- e
- Provider
- Builder
- dualDBBuilder
- e
- BaseBuilder
- File
- Reader
- Request
- a
- FileField
- s
- PasswordField
- FieldsList
- RelationField
- SelectField
- System
- TextField
- r
- a
- ApiError
- AutodateField
- Collection
- DateTime
- Query
- Conn
- EditorField
- JSONField
- NumberField
- RouterGroup
- store
- url
- i
- BoolField
- DateField
- EmailField
- ExternalAuth
- Field
- GeoPointField
- Logger
- SqliteBuilder
- settings
- URLField
- i
- MFA
- OTP
- Tx
- Value
- actualizacion-marca/pb_public/js/app.js
- s
- AuthOrigin
- BaseQueryBuilder
- Client
- RecordUpsert
- cron
- Writer
- Cmd
- Duration
- _TygojaDict
- MysqlBuilder
- Rows
- ge
- MssqlBuilder
- PgsqlBuilder
- ProcessState
- QueryBuilder
- Error
- Header
- OciBuilder
- Server
- gzipResponseWriter
- Level
- Protocols
- RWMutex
- Stmt
- BaseModel
- Broker
- ColumnType
- dirFS
- FileInfo
- fileStat
- hook
- JSONMap
- MapClaims
- Model
- ModelQuery
- RecordFieldResolver
- Values
- Context
- Errno
- Executor
- FileMode
- Handler
- JSONRaw
- Message
- MigrationsList
- Token
- unixDirent
- AppleClientSecretCreate
- BatchResponseError
- DirEntry
- GeoPoint
- Job
- JSONArray
- limitedReader
- MigrationsRunner
- Part
- Process
- Registry
- RequestEvent
- Response
- TaggedHook
- StandardBuilder
- TestEmailSend
- TestS3Filesystem
- BaseRecordProxy
- Cookie
- LikeExp
- Listener
- Location
- Mutex
- NumericDate
- PathError
- PocketBase
- RateLimitRule
- RateLimitsConfig
- rawConn
- ResponseWriter
- Route
- SqliteQueryBuilder
- SyscallError
- Userinfo
- Addr
- Attr
- bytesReadSeekCloser
- ClaimStrings
- EmailTemplate
- fieldWithType
- FormData
- LinkError
- Locker
- Log
- MFAConfig
- MssqlQueryBuilder
- NullString
- OAuth2Config
- OAuth2ProviderConfig
- OciQueryBuilder
- OTPConfig
- Param
- RecordProxy
- RequestInfo
- Result
- router
- Row
- Signal
- SMTPConfig
- TokenConfig
- TrustedProxyConfig
- entrypoint.sh
- ODONTO-PLUS-parche-2/entrypoint.sh
- ODONTO-PLUS-parche-2/pb_public/vercel.json
- AndOrExp
- AuthAlertConfig
- AuthUser
- BackupEvent
- BackupsConfig
- baseCollection
- baseCollectionEventData
- baseModelEventData
- baseRecordEventData
- BatchConfig
- batchProcessor
- BatchRequestEvent
- BetweenExp
- BootstrapEvent
- BytesReader
- closer
- CollectionErrorEvent
- CollectionEvent
- CollectionRequestEvent
- CollectionsImportRequestEvent
- CollectionsListRequestEvent
- coloredWriter
- CompletionOptions
- ConnState
- DBExporter
- DriverValuer
- DynamicModel
- EncloseExp
- Errors
- errSymlink
- ExistsExp
- Exp
- Expression
- FileDownloadRequestEvent
- FileHeader
- FileReader
- FilesManager
- FileTokenRequestEvent
- fileWithoutReadFrom
- fileWithoutWriteTo
- Form
- FParseErrWhitelist
- fs
- GetterFinder
- HookTagger
- InExp
- InternalRequest
- IsolationLevel
- Kind
- LogsConfig
- LogValuer
- mailer
- MailerEvent
- MailerRecordEvent
- mainHook
- mapExtractor
- MaxBodySizeCalculator
- MetaConfig
- Middleware
- ModelErrorEvent
- ModelEvent
- Month
- MultiMatchSubquery
- MultipartReader
- MultiValuer
- noReadFrom
- NotExp
- noWriteTo
- openFuncAsReader
- PasswordAuthConfig
- PasswordFieldValue
- PathReader
- PostScanner
- PostValidator
- PreValidator
- rateClient
- rateLimiter
- ReadWriter
- RealtimeConnectRequestEvent
- RealtimeMessageEvent
- RealtimeSubscribeRequestEvent
- RecordAuthRefreshRequestEvent
- RecordAuthRequestEvent
- RecordAuthWithOAuth2RequestEvent
- RecordAuthWithOTPRequestEvent
- RecordAuthWithPasswordRequestEvent
- RecordConfirmEmailChangeRequestEvent
- RecordConfirmPasswordResetRequestEvent
- RecordConfirmVerificationRequestEvent
- RecordCreateOTPRequestEvent
- RecordEnrichEvent
- RecordErrorEvent
- RecordEvent
- RecordInterceptor
- RecordRequestEmailChangeRequestEvent
- RecordRequestEvent
- RecordRequestPasswordResetRequestEvent
- RecordRequestVerificationRequestEvent
- RecordsListRequestEvent
- Renderer
- replaceWithExpression
- S3Config
- ServeEvent
- serverErrorLogWriter
- SetterFinder
- SettingsListRequestEvent
- SettingsReloadEvent
- SettingsUpdateRequestEvent
- structValue
- _svwsFqW
- TableModel
- timeout
- TxAppInfo
- VarTypeError
- Weekday
- pb_public/vercel.json

## God Nodes (most connected - your core abstractions)
1. `App` - 193 edges
2. `BaseApp` - 193 edges
3. `Command` - 133 edges
4. `Oa()` - 110 edges
5. `Oa()` - 110 edges
6. `r()` - 97 edges
7. `r()` - 97 edges
8. `Record` - 68 edges
9. `Se` - 55 edges
10. `Se` - 55 edges

## Surprising Connections (you probably didn't know these)
- `pacOpts()` --calls--> `list()`  [EXTRACTED]
  parche maestro/ODONTO-PLUS-parche-2/pb_public/js/modulos.js → parche maestro/ODONTO-PLUS-parche-2/pb_public/js/api.js
- `finanzas()` --indirect_call--> `conMoneda()`  [INFERRED]
  parche maestro/ODONTO-PLUS-parche-2/pb_public/js/modulos.js → parche maestro/ODONTO-PLUS-parche-2/pb_public/js/tasas.js
- `finanzas()` --indirect_call--> `tasaForm()`  [INFERRED]
  parche maestro/ODONTO-PLUS-parche-2/pb_public/js/modulos.js → parche maestro/ODONTO-PLUS-parche-2/pb_public/js/tasas.js
- `detalle()` --indirect_call--> `conMoneda()`  [INFERRED]
  parche maestro/ODONTO-PLUS-parche-2/pb_public/js/pacientes.js → parche maestro/ODONTO-PLUS-parche-2/pb_public/js/tasas.js
- `detalle()` --indirect_call--> `tasaForm()`  [INFERRED]
  parche maestro/ODONTO-PLUS-parche-2/pb_public/js/pacientes.js → parche maestro/ODONTO-PLUS-parche-2/pb_public/js/tasas.js

## Import Cycles
- None detected.

## Communities (306 total, 281 thin omitted)

### Community 0 - "types.d.ts"
Cohesion: 0.01
Nodes (352): RFC-2388, RFC-2396, RFC-2617, RFC-3339, RFC-3986, RFC-6265, RFC-6335, RFC-6749 (+344 more)

### Community 3 - "ODONTO-PLUS-parche-2/pb_public/js/compartir.js"
Cohesion: 0.05
Nodes (128): ajustes(), ZONAS, authed(), clinica(), del(), enviarHistoria(), estadoCorreo(), fileUrl() (+120 more)

### Community 4 - "pb_public/js/compartir.js"
Cohesion: 0.05
Nodes (128): ajustes(), ZONAS, authed(), clinica(), del(), enviarHistoria(), estadoCorreo(), fileUrl() (+120 more)

### Community 6 - "Se"
Cohesion: 0.05
Nodes (7): ea(), fa, ha(), Se, ua(), Vi(), xe()

### Community 7 - "Se"
Cohesion: 0.06
Nodes (5): fa, ha(), Se, ua(), Vi()

### Community 9 - "Oa"
Cohesion: 0.08
Nodes (56): Dt(), Et(), Oa(), at(), be(), ce(), de(), dn() (+48 more)

### Community 11 - "Oa"
Cohesion: 0.11
Nodes (43): Dt(), Et(), Oa(), be(), ce(), dn(), ee(), en() (+35 more)

### Community 13 - "pb_public/js/vendor/jspdf.umd.min.js"
Cohesion: 0.08
Nodes (23): aa(), C(), Ca(), ea(), Gi(), I(), Ia(), j() (+15 more)

### Community 15 - "ODONTO-PLUS-parche-2/pb_hooks/lib/odonto.js"
Cohesion: 0.17
Nodes (30): bloqueCita(), cfg(), datosCita(), descripcion(), despuesDeGuardar(), destinoDoctora(), DIAS, enviar() (+22 more)

### Community 16 - "ODONTO-PLUS-parche-2/pb_public/js/vendor/jspdf.umd.min.js"
Cohesion: 0.10
Nodes (18): aa(), Ca(), Gi(), I(), Ia(), Ji(), Ki(), La() (+10 more)

### Community 19 - "pb_hooks/lib/odonto.js"
Cohesion: 0.17
Nodes (30): bloqueCita(), cfg(), datosCita(), descripcion(), despuesDeGuardar(), destinoDoctora(), DIAS, enviar() (+22 more)

### Community 20 - "e"
Cohesion: 0.14
Nodes (30): C(), l(), n(), o(), at(), b(), bt(), ct() (+22 more)

### Community 24 - "e"
Cohesion: 0.20
Nodes (28): a(), e(), n(), b(), bn(), bt(), ct(), dt() (+20 more)

### Community 29 - "a"
Cohesion: 0.16
Nodes (21): o(), a(), c(), d(), f(), ft(), h(), j() (+13 more)

### Community 31 - "s"
Cohesion: 0.16
Nodes (20): d(), ja(), B(), E(), M(), O(), R(), m() (+12 more)

### Community 38 - "r"
Cohesion: 0.16
Nodes (16): a(), e(), j(), ja(), E(), M(), O(), R() (+8 more)

### Community 39 - "a"
Cohesion: 0.21
Nodes (16): a(), c(), d(), f(), h(), ke(), l(), ot() (+8 more)

### Community 40 - "ApiError"
Cohesion: 0.12
Nodes (7): ApiError, BadRequestError, ForbiddenError, InternalServerError, NotFoundError, TooManyRequestsError, UnauthorizedError

### Community 52 - "i"
Cohesion: 0.19
Nodes (15): er(), g(), ae(), et(), g(), i(), k(), kt() (+7 more)

### Community 63 - "i"
Cohesion: 0.18
Nodes (15): b(), er(), g(), ae(), g(), i(), k(), kt() (+7 more)

### Community 68 - "actualizacion-marca/pb_public/js/app.js"
Cohesion: 0.19
Nodes (6): loginView(), N, root, route(), shell(), start()

### Community 69 - "s"
Cohesion: 0.26
Nodes (13): b(), B(), an(), cn(), hn(), ln(), nn(), rn() (+5 more)

### Community 78 - "_TygojaDict"
Cohesion: 0.18
Nodes (5): HashExp, MIMEHeader, NullStringMap, Params, _TygojaDict

### Community 81 - "ge"
Cohesion: 0.29
Nodes (10): d(), ge(), pe(), qe(), ve(), we(), x(), Te() (+2 more)

### Community 114 - "Message"
Cohesion: 0.33
Nodes (3): MailerMessage, Message, SubscriptionMessage

## Knowledge Gaps
- **13 isolated node(s):** `RFC-2388`, `RFC-2396`, `RFC-2617`, `RFC-3339`, `RFC-3986` (+8 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 2458 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **281 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BaseApp` connect `BaseApp` to `types.d.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `Oa()` (e.g. with `Dt()` and `kn()`) actually correct?**
  _`Oa()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-2388`, `RFC-2396`, `RFC-2617` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `types.d.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0056179775280898875 - nodes in this community are weakly interconnected._
- **Why does `App` connect `App` to `types.d.ts`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `Oa()` (e.g. with `Dt()` and `kn()`) actually correct?**
  _`Oa()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Should `App` be split into smaller, more focused modules?**
  _Cohesion score 0.010362694300518135 - nodes in this community are weakly interconnected._