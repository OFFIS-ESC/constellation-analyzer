# Changelog

## 1.0.0 (2026-05-08)


### ⚠ BREAKING CHANGES

* History is now per-document instead of per-timeline-state. Existing undo/redo stacks will be cleared on first load with this change.

### Features

* add a way to show the description in the nodes description ([bf908f6](https://github.com/OFFIS-ESC/constellation-analyzer/commit/bf908f6a30440ab7d1f764e1d486c328b7166eb3))
* add atomic transaction pattern to type management operations ([1059c05](https://github.com/OFFIS-ESC/constellation-analyzer/commit/1059c0524226143c10a78980994c298dd9069dc9))
* add auto-zoom to filtered search results ([58e0465](https://github.com/OFFIS-ESC/constellation-analyzer/commit/58e04650c08ee01adfbf8474fa151021dbabad4a))
* add comprehensive bibliography and citation system ([36f44d6](https://github.com/OFFIS-ESC/constellation-analyzer/commit/36f44d61ac69925dd05949d24acf902f9b998d49))
* add comprehensive test infrastructure and CI/CD pipelines ([343dcd0](https://github.com/OFFIS-ESC/constellation-analyzer/commit/343dcd090acc165f7856746b84bfebcabe5493b6))
* add crispy PNG/SVG graph export with tight cropping 🔥 ([d7d9179](https://github.com/OFFIS-ESC/constellation-analyzer/commit/d7d91798f1ec89d486d31a650b7ff56e6b9b021e))
* add document naming dialog before creation ([c1a2d92](https://github.com/OFFIS-ESC/constellation-analyzer/commit/c1a2d926cd33cdf0c39e7e7d2f4574198c3bc790))
* add edge search functionality to filter section ([f9c208d](https://github.com/OFFIS-ESC/constellation-analyzer/commit/f9c208d7ac61df1ce31a5f72313e3399b56877be))
* add github action to deploy to github pages ([0bd9a94](https://github.com/OFFIS-ESC/constellation-analyzer/commit/0bd9a943371235cb6424c60437384e68748ff408))
* add graph metrics and analysis to right panel ([0e90f02](https://github.com/OFFIS-ESC/constellation-analyzer/commit/0e90f022fca28358887d2bb5ecf5dde712c7b1c2))
* add group minimize/maximize with floating edges and React Flow v12 ([b1e634d](https://github.com/OFFIS-ESC/constellation-analyzer/commit/b1e634d3c48b864615573796eecace3818b4e465))
* add label management button to property panels ([bc8ab6c](https://github.com/OFFIS-ESC/constellation-analyzer/commit/bc8ab6c9c7d30e1d9f0156135967eac137eda54f))
* add multi-select properties panel with bulk operations ([3b7497e](https://github.com/OFFIS-ESC/constellation-analyzer/commit/3b7497ec99680c3e2db745b953e5026a4359691b))
* add node shape variants with five distinct shapes ([e0784ff](https://github.com/OFFIS-ESC/constellation-analyzer/commit/e0784ff3d8fb2acf95d1aae97096ebaad3625804))
* add PubMed and software citation format support ([ef16b9d](https://github.com/OFFIS-ESC/constellation-analyzer/commit/ef16b9d06077a53b4e65a0383959f1a6ef5c2c26))
* add quick edit button for actor types in properties panel ([47957b4](https://github.com/OFFIS-ESC/constellation-analyzer/commit/47957b41881e4d9c46b6b13a159f40beee60e133))
* add quick edit button for relation types in properties panel ([cfd7a0b](https://github.com/OFFIS-ESC/constellation-analyzer/commit/cfd7a0b76f6ad9be17a6fa048871baf793e66614))
* add resizable actor grouping with full undo/redo support ([f5adbc8](https://github.com/OFFIS-ESC/constellation-analyzer/commit/f5adbc8ead1eaf21b389f13b30564faa18e38da8))
* add search and filter functionality with Ctrl+F shortcut ([1646cfb](https://github.com/OFFIS-ESC/constellation-analyzer/commit/1646cfb0cef89814fe15d8dfaba05f78305aef2b))
* add settings icons to left panel section headers ([7f8af78](https://github.com/OFFIS-ESC/constellation-analyzer/commit/7f8af78432955168f4daddf8fb6e25004c6dd4a6))
* add timeline system for multi-state constellation analysis ([28f8224](https://github.com/OFFIS-ESC/constellation-analyzer/commit/28f8224284922a295543fe266820664dd049309c))
* add toast notification system for visual feedback ([8998061](https://github.com/OFFIS-ESC/constellation-analyzer/commit/89980612625841905c99362401153c7ac025f7e5))
* aggregate multiple relations between minimized groups ([ace816f](https://github.com/OFFIS-ESC/constellation-analyzer/commit/ace816f2a5a8eb9e281f58221968f7f639aa514c))
* apply custom background colors to maximized groups ([1782924](https://github.com/OFFIS-ESC/constellation-analyzer/commit/178292435fb967772a3693f3bd956d64df409540))
* centralize keyboard shortcuts through shortcut manager ([e778b29](https://github.com/OFFIS-ESC/constellation-analyzer/commit/e778b29b564cf3d54c11e9b3d5446343edad74dc))
* display actor type icons in left panel add buttons ([cd1a93f](https://github.com/OFFIS-ESC/constellation-analyzer/commit/cd1a93f88fb6829d9631da35939c1a4639fb27c7))
* enhance relation properties panel with live updates ([2db8b25](https://github.com/OFFIS-ESC/constellation-analyzer/commit/2db8b25d9ef6a055140dd0e5cfa1c7089cafe8ca))
* expand smart import to support additional citation formats ([14ccb2d](https://github.com/OFFIS-ESC/constellation-analyzer/commit/14ccb2da5b90bd6b0a83f3c7271a96683afb81ca))
* implement directional relationships for edges ([3a64d37](https://github.com/OFFIS-ESC/constellation-analyzer/commit/3a64d37f02a660b51b5510bcc013a9c8617e5f79))
* implement global settings system with localStorage persistence ([084a3bb](https://github.com/OFFIS-ESC/constellation-analyzer/commit/084a3bb48647606d4acaaa67f65400a38d983ce7))
* implement label system and redesign filtering with positive filters ([d98acf9](https://github.com/OFFIS-ESC/constellation-analyzer/commit/d98acf963b95369ec33506b3641b438e455978f9))
* implement presentation mode for touch table displays ([9ffd62d](https://github.com/OFFIS-ESC/constellation-analyzer/commit/9ffd62d54ab57cb53c8b14b7b6686efa866b0807))
* improve actor type form layout and UX ([bc6ffb5](https://github.com/OFFIS-ESC/constellation-analyzer/commit/bc6ffb5bc3df08adc865d8e7af4196391d301899))
* improve connection display with reusable component and instant actor type updates ([fab5c03](https://github.com/OFFIS-ESC/constellation-analyzer/commit/fab5c035a5ff9218393d216f066c0c1be6ac29aa))
* improve label deletion atomicity with immutable timeline updates ([60748a2](https://github.com/OFFIS-ESC/constellation-analyzer/commit/60748a22350da77d04892d7414fe2d5c549bd512))
* increase zoom range to support larger charts ([63ec8eb](https://github.com/OFFIS-ESC/constellation-analyzer/commit/63ec8eb2e316034ce041f5c319407bcd3d49bc78))
* maximize minimized groups on double-click ([59096a5](https://github.com/OFFIS-ESC/constellation-analyzer/commit/59096a5644a868723da41ab0d1cc661b7ce00561))
* redesign relation type configuration with improved UX ([a4db401](https://github.com/OFFIS-ESC/constellation-analyzer/commit/a4db401ff742e11c1a9d280481cc3e03e3a3b3bd))
* render edges between minimized groups with floating edges ([7c49ad0](https://github.com/OFFIS-ESC/constellation-analyzer/commit/7c49ad0baa363045c69f1db64a3c174be648f929))
* side panels for properties and tools ([e7ff53d](https://github.com/OFFIS-ESC/constellation-analyzer/commit/e7ff53dcd7c1f0f3fa31a0963dfbcce3884546ef))


### Bug Fixes

* allow double click on state nodes and improve their design ([3ab90e5](https://github.com/OFFIS-ESC/constellation-analyzer/commit/3ab90e5dd3ded1445cdd88d63424fae9aba8a2cb))
* change folder location base path for imports to deploy ([236d394](https://github.com/OFFIS-ESC/constellation-analyzer/commit/236d39427620ad6d498f4105f033ae82c5d8e273))
* clear graph editor when no document is active ([09b62c6](https://github.com/OFFIS-ESC/constellation-analyzer/commit/09b62c69bdedc26bd274f478402b598371d00ad2))
* convert HSL color generation to hex format in label selector ([c1cd2d3](https://github.com/OFFIS-ESC/constellation-analyzer/commit/c1cd2d3114d1ab892416d44fe51b10851d577d69))
* correct history timing in createGroupWithActors for proper undo behavior ([3f24e4b](https://github.com/OFFIS-ESC/constellation-analyzer/commit/3f24e4be0b7e483fb7381ba22916b2c33f9af221))
* correct Material-UI icon prop usage in RightPanel ([2435c98](https://github.com/OFFIS-ESC/constellation-analyzer/commit/2435c984ba539666c3c76a8209d8ece8b5337ad3))
* dont show anything in pane if more than one item is selected ([8d8ff2d](https://github.com/OFFIS-ESC/constellation-analyzer/commit/8d8ff2d200441a6a400f8c0987fabd10acda922a))
* dont show description in node visualization ([ba6606d](https://github.com/OFFIS-ESC/constellation-analyzer/commit/ba6606d8b986702b6ba2b6b2c4ad3bf5fa128428))
* enable scrollbar in graph analysis panel when content overflows ([74f5da0](https://github.com/OFFIS-ESC/constellation-analyzer/commit/74f5da0c7b4d52fa017c6a8110c81edf9132ded9))
* ensure edge labels stay above selected groups ([5bfd302](https://github.com/OFFIS-ESC/constellation-analyzer/commit/5bfd3029e1b269ce197d8ceffc1bb0114a2b8a35))
* ensure only newly created items are selected ([5aeb187](https://github.com/OFFIS-ESC/constellation-analyzer/commit/5aeb187efe0a4b88555b07c79be14bfa1ca045c6))
* fit view to content shortcut overrides typing the F letter everywhere ([df95a7c](https://github.com/OFFIS-ESC/constellation-analyzer/commit/df95a7c84c1df1f4c39a5c7854fd335717af4ee8))
* improve bottom panel collapsed state and remove broken right panel close button ([227b61b](https://github.com/OFFIS-ESC/constellation-analyzer/commit/227b61b2a00ec186c6cc332f30484532a83fd958))
* improve GraphMetrics header with collapse button ([3db4898](https://github.com/OFFIS-ESC/constellation-analyzer/commit/3db4898902d29737d376cca09124f0df12e771ff))
* improve minimized group label contrast and typography ([f29c55a](https://github.com/OFFIS-ESC/constellation-analyzer/commit/f29c55a1b87f33b6094a258facdebf86f2739ca9))
* lint issues unused fns ([869e4d5](https://github.com/OFFIS-ESC/constellation-analyzer/commit/869e4d5f681ae22f81e898d78fffdef0e81035f0))
* logo path ([ce0ee71](https://github.com/OFFIS-ESC/constellation-analyzer/commit/ce0ee711931d42fa013abb8443f6b2486cf64071))
* preserve timeline states in document import/export ([aa2bd7e](https://github.com/OFFIS-ESC/constellation-analyzer/commit/aa2bd7e5d7215931d9392f5b5ba082138b235d94))
* prevent cross-document state contamination in useActiveDocument ([99ab514](https://github.com/OFFIS-ESC/constellation-analyzer/commit/99ab514c0c536b8501e85f98a15cee5b7d744bc8))
* refactor keyboard shortcut context ([4e335a8](https://github.com/OFFIS-ESC/constellation-analyzer/commit/4e335a8fde4c88790424f7f25700ab409840fcbb))
* remove non-functional panel toggle keyboard shortcuts ([045b1aa](https://github.com/OFFIS-ESC/constellation-analyzer/commit/045b1aa4d6a4c301afb45e15abb6385ed80978a0))
* remove unused eslint-disable directives ([60d13ed](https://github.com/OFFIS-ESC/constellation-analyzer/commit/60d13eda19cce05dc7b04a0e6dfcd1824b5e4137))
* remove unused variable ([79bfd52](https://github.com/OFFIS-ESC/constellation-analyzer/commit/79bfd525ddd9382d92319ae6c30fe61a2544d304))
* remove unused variables ([79edc90](https://github.com/OFFIS-ESC/constellation-analyzer/commit/79edc902c56c9b602b7513767e90ac200f71042c))
* remove wrong options from release-please ([e295b8d](https://github.com/OFFIS-ESC/constellation-analyzer/commit/e295b8d7a5105f1f4a6355ad20e17a6c15d921d3))
* replace any types with explicit function signatures ([f308edb](https://github.com/OFFIS-ESC/constellation-analyzer/commit/f308edbfa6cc8b315363e4dae79c4e303cd39503))
* resolve build and type errors ([a554aa1](https://github.com/OFFIS-ESC/constellation-analyzer/commit/a554aa156f02b7ed4ed9ab84d4f8a5e39a6febca))
* resolve effect dependencies ([75cb26a](https://github.com/OFFIS-ESC/constellation-analyzer/commit/75cb26a991e7070cad031b5f3fe48bf58fd58bb4))
* show keyboard shortcut help should be used with ctrl ([ac252dc](https://github.com/OFFIS-ESC/constellation-analyzer/commit/ac252dc5ed10e4e1059f058a1ec44f270e7e5591))
* update group minimize/maximize button label in real-time ([d03be68](https://github.com/OFFIS-ESC/constellation-analyzer/commit/d03be6886097ff78bcf0b5d3773314d90f2d8efb))
* whoopsie doopsie accident - correct onAddNodeRequest type signature ([38cae3c](https://github.com/OFFIS-ESC/constellation-analyzer/commit/38cae3cdd9972b91d61ace0d4ae14090efeaa5b3))


### Performance Improvements

* make relation directionality changes instant ([e3e5b07](https://github.com/OFFIS-ESC/constellation-analyzer/commit/e3e5b0768b892d9caf1f52739c10acc53cf90c5b))


### Code Refactoring

* migrate undo/redo from per-state to per-document level ([d775cb8](https://github.com/OFFIS-ESC/constellation-analyzer/commit/d775cb88633dfbd5a2f7daa62e480d141660cc02))
