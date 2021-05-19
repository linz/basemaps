# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.2](https://github.com/linz/basemaps/compare/v5.0.1...v5.0.2) (2021-05-19)


### Bug Fixes

* **shared:** avoid instance of as it breaks when multiple copies of basemaps are init ([#1620](https://github.com/linz/basemaps/issues/1620)) ([53f7d23](https://github.com/linz/basemaps/commit/53f7d23f68a0fee3a355eee409a32ebdf10b7216))





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)


### Bug Fixes

* **attribution:** correct import issue with openlayers  ([#1599](https://github.com/linz/basemaps/issues/1599)) ([1b464f3](https://github.com/linz/basemaps/commit/1b464f381a81448769521543787c060ef9b3efcf))
* **shared:** use a default of one hour for chainable credentials ([#1576](https://github.com/linz/basemaps/issues/1576)) ([33c996d](https://github.com/linz/basemaps/commit/33c996d98bbc6f3b74847b5384e7a560efba0fc7))


### Features

* **shared:** Cleanup - Remove TileSet Metatdata Record V1. ([#1541](https://github.com/linz/basemaps/issues/1541)) ([32e79af](https://github.com/linz/basemaps/commit/32e79afe630e9042edc1f936a657b7a31f1392ef))
* support serving of vector tiles ([#1535](https://github.com/linz/basemaps/issues/1535)) ([30083a5](https://github.com/linz/basemaps/commit/30083a57f981c2b2db6c50cad0f8db48be377d19))





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)

**Note:** Version bump only for package @basemaps/shared





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)

**Note:** Version bump only for package @basemaps/shared





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)


### Features

* **geo:** add support for NZTM2000Quad tile matrix set ([#1470](https://github.com/linz/basemaps/issues/1470)) ([b0d8cde](https://github.com/linz/basemaps/commit/b0d8cded0777e2ab024b27455f6a58d5860fe9ad))
* support custom tile matrix sets ([#1469](https://github.com/linz/basemaps/issues/1469)) ([13a42de](https://github.com/linz/basemaps/commit/13a42de2647d448e1a4130602f759e21e03651bf))





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)


### Bug Fixes

* **shared:** remove dependency on @types/sax and @types/pino ([#1406](https://github.com/linz/basemaps/issues/1406)) ([79ffca6](https://github.com/linz/basemaps/commit/79ffca66353c3e9c3a68dabe14c4e6690e4453d8))


### Features

* **attribution:** remove `@basemaps/shared` dependency to make it smaller to install ([#1415](https://github.com/linz/basemaps/issues/1415)) ([5152614](https://github.com/linz/basemaps/commit/51526145256e0b7a514dc1185691d27cead1a0c6))
* Allow alternative TileMatrixSet definitions ([#1321](https://github.com/linz/basemaps/issues/1321)) ([b7cfa7b](https://github.com/linz/basemaps/commit/b7cfa7b8bf1351d9e57e46c180a1d3cf01c29927))





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)


### Features

* **shared:** Add iterator into TileMetadataTileSet. ([#1351](https://github.com/linz/basemaps/issues/1351)) ([2cb9bde](https://github.com/linz/basemaps/commit/2cb9bde3ad248bcaab41347184046164b1c0bf77))





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)


### Bug Fixes

* **lambda-tiler:** correct s3 permissions when creating tiles ([#1317](https://github.com/linz/basemaps/issues/1317)) ([95d6d1a](https://github.com/linz/basemaps/commit/95d6d1ab71e600f1ad7e3107d765a493c9d18bd4))


### Features

* **lambda-tiler:** add smoke test in health endpoint ([#1308](https://github.com/linz/basemaps/issues/1308)) ([334f5dd](https://github.com/linz/basemaps/commit/334f5dd8f3d1bd67b770cf24cef9cad517e36f37))





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)


### Bug Fixes

* **cli:** allow using new tag ([#1304](https://github.com/linz/basemaps/issues/1304)) ([231fed2](https://github.com/linz/basemaps/commit/231fed2df7c3be0bc2d2c99c3a94353c63c3fde2))


### Features

* **cli:** Configure TileSet metedata DB from config file ([#1277](https://github.com/linz/basemaps/issues/1277)) ([b8c76d4](https://github.com/linz/basemaps/commit/b8c76d4d3aac3e49a4a01bfc88c58ab149d62482))





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)

**Note:** Version bump only for package @basemaps/shared





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)


### Bug Fixes

* Remove dashes from CC-BY-4.0 license text ([#1223](https://github.com/linz/basemaps/issues/1223)) ([ae88b81](https://github.com/linz/basemaps/commit/ae88b817f3f82288d3dbb5b0ca8c30302bdae959))
* **lambda-tiler:** regression in invalid url parsing causing 500 Error ([#1212](https://github.com/linz/basemaps/issues/1212)) ([400126c](https://github.com/linz/basemaps/commit/400126c9451819eaebfb7d51d95c4d8298361c0c))
* STAC files should comply to 1.0.0-beta.2 of the specification ([#1176](https://github.com/linz/basemaps/issues/1176)) ([d2fe323](https://github.com/linz/basemaps/commit/d2fe3236cacdbf9ae7118934c8936490faeab64c))


### Features

* **lambda-tiler:** attribution ([#1205](https://github.com/linz/basemaps/issues/1205)) ([69cca66](https://github.com/linz/basemaps/commit/69cca66d901a23f01868ce6fedc8991f01c55de2))





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)


### Features

* **lambda-analytics:** generate rolledup analyitics from cloudwatchedge logs ([#1180](https://github.com/linz/basemaps/issues/1180)) ([20fd5b1](https://github.com/linz/basemaps/commit/20fd5b1983b16fc1fcb1b731152da36430fedc63))
* **lambda-analytics:** include referer information in the rollup stats ([#1186](https://github.com/linz/basemaps/issues/1186)) ([e75ab1a](https://github.com/linz/basemaps/commit/e75ab1acd5e4dc89f05a52df833bb3563502f324))





# [4.13.0](https://github.com/linz/basemaps/compare/v4.12.2...v4.13.0) (2020-09-14)

**Note:** Version bump only for package @basemaps/shared





## [4.12.2](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.2) (2020-09-10)

**Note:** Version bump only for package @basemaps/shared





# [4.12.0](https://github.com/linz/basemaps/compare/v4.11.2...v4.12.0) (2020-09-06)


### Features

* **bathymetry:** allow input and output from s3 bucket ([#1122](https://github.com/linz/basemaps/issues/1122)) ([1f00d9a](https://github.com/linz/basemaps/commit/1f00d9aacc6d132c0761a35069ddab15f135ac4c))





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @basemaps/shared





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)


### Features

* allow imagery with the same id in the rendering process twice ([#1104](https://github.com/linz/basemaps/issues/1104)) ([d8cd642](https://github.com/linz/basemaps/commit/d8cd642c6215a5198e15414c14680afacad88faf))
* **shared:** align bathymetry STAC usage with cog creation ([#1092](https://github.com/linz/basemaps/issues/1092)) ([fd9bc27](https://github.com/linz/basemaps/commit/fd9bc27b05d7e772f1856bb0e81268ac2930ef24))





# [4.10.0](https://github.com/linz/basemaps/compare/v4.9.0...v4.10.0) (2020-08-19)


### Bug Fixes

* **shared:** Don't error if tile ext missing ([#1072](https://github.com/linz/basemaps/issues/1072)) ([8ed9e8d](https://github.com/linz/basemaps/commit/8ed9e8d1173cd01c55a7f2380f48617dc02f28b4))





# [4.9.0](https://github.com/linz/basemaps/compare/v4.8.0...v4.9.0) (2020-08-17)


### Features

* allow configuration of tile resize kernels ([#1051](https://github.com/linz/basemaps/issues/1051)) ([6b6d3d3](https://github.com/linz/basemaps/commit/6b6d3d32c735de6bf3f41819aaeb571c78f0921c))





# [4.8.0](https://github.com/linz/basemaps/compare/v4.7.1...v4.8.0) (2020-08-12)

**Note:** Version bump only for package @basemaps/shared





## [4.7.1](https://github.com/linz/basemaps/compare/v4.7.0...v4.7.1) (2020-08-11)

**Note:** Version bump only for package @basemaps/shared





# [4.7.0](https://github.com/linz/basemaps/compare/v4.6.0...v4.7.0) (2020-08-10)

**Note:** Version bump only for package @basemaps/shared





# [4.6.0](https://github.com/linz/basemaps/compare/v4.5.0...v4.6.0) (2020-08-05)


### Features

* **geojson:** Improve GeoJSON compliance ([#1005](https://github.com/linz/basemaps/issues/1005)) ([bf7fd26](https://github.com/linz/basemaps/commit/bf7fd26cf2b08d6417a0c710b821648e9f7c9b9a))





# [4.5.0](https://github.com/linz/basemaps/compare/v4.4.0...v4.5.0) (2020-07-30)


### Bug Fixes

* **cli:** correctly detect if a tiff file list is passed in ([#993](https://github.com/linz/basemaps/issues/993)) ([9147c8e](https://github.com/linz/basemaps/commit/9147c8e8a6264dab285d6ab4a646f09d9a2d7718))
* **cli:** folders must be mounted to allow docker to read the source files ([#995](https://github.com/linz/basemaps/issues/995)) ([8557afa](https://github.com/linz/basemaps/commit/8557afaf96c5153cd174d0af5475f1d2b3fe3f98))


### Features

* **cli:** support giving exact list of files to use ([#986](https://github.com/linz/basemaps/issues/986)) ([63b34ff](https://github.com/linz/basemaps/commit/63b34ff5414989b5d014b6d61f9be304ebd9e1e1))





# [4.4.0](https://github.com/linz/basemaps/compare/v4.3.0...v4.4.0) (2020-07-28)


### Bug Fixes

* inject git version and hash into all code ([#966](https://github.com/linz/basemaps/issues/966)) ([8b8eaec](https://github.com/linz/basemaps/commit/8b8eaec373286c81b425d485274edd7c588aefea))
* **lambda-api:** track api key usage ([#943](https://github.com/linz/basemaps/issues/943)) ([7c4689c](https://github.com/linz/basemaps/commit/7c4689cd0824ee678260ba5d84b25042aad72363))


### Features

* **lambda-xyz:** Serve WMTSCapabilities for all TileSets ([#953](https://github.com/linz/basemaps/issues/953)) ([49d0e88](https://github.com/linz/basemaps/commit/49d0e881b4726188ea937a9617c98bff5a78e44d))





# [4.2.0](https://github.com/linz/basemaps/compare/v4.1.0...v4.2.0) (2020-07-16)


### Bug Fixes

* **shared:** handle bounds crossing antimeridian ([#925](https://github.com/linz/basemaps/issues/925)) ([b4c049b](https://github.com/linz/basemaps/commit/b4c049bd816908214b145593f914054b84a9415e))





# [4.1.0](https://github.com/linz/basemaps/compare/v4.0.0...v4.1.0) (2020-07-15)


### Features

* **bathymetry:** create a process to convert gebco into hillshaded rasters ([#921](https://github.com/linz/basemaps/issues/921)) ([2cde6a9](https://github.com/linz/basemaps/commit/2cde6a9eb381452b3c5a6d855d42daf29148eca0))





# [4.0.0](https://github.com/linz/basemaps/compare/v3.6.0...v4.0.0) (2020-07-09)

**Note:** Version bump only for package @basemaps/shared





# [3.6.0](https://github.com/linz/basemaps/compare/v3.5.0...v3.6.0) (2020-07-08)

**Note:** Version bump only for package @basemaps/shared





# [3.5.0](https://github.com/linz/basemaps/compare/v3.4.2...v3.5.0) (2020-07-05)


### Bug Fixes

* **cli:** mitigate polygon intersection errors ([#834](https://github.com/linz/basemaps/issues/834)) ([5799137](https://github.com/linz/basemaps/commit/5799137e8fa53816c5a28b7e53ecd9ffbca70bb1))
* **cli:** refactor projection logic to allow chathams to be built ([#854](https://github.com/linz/basemaps/issues/854)) ([f799006](https://github.com/linz/basemaps/commit/f799006ccf1a45ec8aebfe132603a17c031e4825))





## [3.4.1](https://github.com/linz/basemaps/compare/v3.4.0...v3.4.1) (2020-06-30)


### Bug Fixes

* **cli:** ensure fatal errors set process exit code to 1 ([#842](https://github.com/linz/basemaps/issues/842)) ([f85c274](https://github.com/linz/basemaps/commit/f85c274c6bca05619312bce4eee59f5030a0d846))





# [3.4.0](https://github.com/linz/basemaps/compare/v3.3.0...v3.4.0) (2020-06-29)

**Note:** Version bump only for package @basemaps/shared





# [3.2.0](https://github.com/linz/basemaps/compare/v3.1.0...v3.2.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/shared





# [3.1.0](https://github.com/linz/basemaps/compare/v3.0.0...v3.1.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/shared





# [3.0.0](https://github.com/linz/basemaps/compare/v2.2.0...v3.0.0) (2020-06-23)


### Features

* Generate and render COGs using bounding boxes ([#774](https://github.com/linz/basemaps/issues/774)) ([e35bf1f](https://github.com/linz/basemaps/commit/e35bf1f0e20b74a16ff942dc88547afc56454c12))





# [2.2.0](https://github.com/linz/basemaps/compare/v2.1.0...v2.2.0) (2020-06-17)

**Note:** Version bump only for package @basemaps/shared





# [2.1.0](https://github.com/linz/basemaps/compare/v2.0.0...v2.1.0) (2020-05-21)

### Bug Fixes

-   **lambda-shared:** fix order equal priority images are sorted ([#640](https://github.com/linz/basemaps/issues/640)) ([3022336](https://github.com/linz/basemaps/commit/302233614aec815eb0d85c588d4a0c4be7f5cbc3))

# [2.0.0](https://github.com/linz/basemaps/compare/v1.12.0...v2.0.0) (2020-05-18)

**Note:** Version bump only for package @basemaps/shared

# [1.11.0](https://github.com/linz/basemaps/compare/v1.10.0...v1.11.0) (2020-05-14)

### Bug Fixes

-   **cli:** externalId is not always required ([#618](https://github.com/linz/basemaps/issues/618)) ([2c5d9d0](https://github.com/linz/basemaps/commit/2c5d9d02c28c74693e07baf60874edced132c86d))
-   **deps:** configure required deps to be runtime ([#619](https://github.com/linz/basemaps/issues/619)) ([a6df14d](https://github.com/linz/basemaps/commit/a6df14d90ad599fb02b593bf3a2d1e21e3c4c4e1))
-   **lambda-xyz:** add missing identifier for WMTS individual set ([#617](https://github.com/linz/basemaps/issues/617)) ([5f79609](https://github.com/linz/basemaps/commit/5f79609c478b9b9cf26006a9a428b05cdc39a7aa))

# [1.10.0](https://github.com/linz/basemaps/compare/v1.9.0...v1.10.0) (2020-05-13)

### Features

-   expose creation of CogJob ([#607](https://github.com/linz/basemaps/issues/607)) ([082dbfa](https://github.com/linz/basemaps/commit/082dbfacb894025deaed0ff443ca7277b9fb2e7d))
-   improve cutline traceability ([#610](https://github.com/linz/basemaps/issues/610)) ([8e33f8d](https://github.com/linz/basemaps/commit/8e33f8d453dfa5d900fc11791867bc3d491cad23))

# [1.9.0](https://github.com/linz/basemaps/compare/v1.8.0...v1.9.0) (2020-05-12)

### Features

-   **lambda-xyz:** Support tags and imagery sets for WMTSCapabilities.xml ([#599](https://github.com/linz/basemaps/issues/599)) ([9f4c6c2](https://github.com/linz/basemaps/commit/9f4c6c201224bf083ace2edfb2e8b885d741c6c5))

# [1.8.0](https://github.com/linz/basemaps/compare/v1.7.0...v1.8.0) (2020-05-11)

### Features

-   support rendering different backgrounds for tiles ([#591](https://github.com/linz/basemaps/issues/591)) ([22f38f5](https://github.com/linz/basemaps/commit/22f38f555a678e6968206351d8fbb62a604da39e))

# [1.7.0](https://github.com/linz/basemaps/compare/v1.6.0...v1.7.0) (2020-05-10)

### Bug Fixes

-   **cli:** role assumptions must have role names shorter than 64 chars ([#585](https://github.com/linz/basemaps/issues/585)) ([d889cb7](https://github.com/linz/basemaps/commit/d889cb7666685a8c3a4c7a0816c92fe62626e2e4))

# [1.6.0](https://github.com/linz/basemaps/compare/v1.5.1...v1.6.0) (2020-05-08)

### Bug Fixes

-   **serve:** allow any tile set name to be used ([#579](https://github.com/linz/basemaps/issues/579)) ([e3e6a03](https://github.com/linz/basemaps/commit/e3e6a03e66b496ae6f9247dc9cbbb0110f5993c5))

# [1.5.0](https://github.com/linz/basemaps/compare/v1.4.2...v1.5.0) (2020-05-07)

### Bug Fixes

-   **cli:** root quadkey causes issues with dynamodb so never use it ([#576](https://github.com/linz/basemaps/issues/576)) ([4dfa860](https://github.com/linz/basemaps/commit/4dfa86027980231514ae417ce59e94f02e78c3f6))

## [1.4.2](https://github.com/linz/basemaps/compare/v1.4.1...v1.4.2) (2020-05-06)

**Note:** Version bump only for package @basemaps/shared

## [1.4.1](https://github.com/linz/basemaps/compare/v1.4.0...v1.4.1) (2020-05-06)

**Note:** Version bump only for package @basemaps/shared

# [1.4.0](https://github.com/linz/basemaps/compare/v1.3.0...v1.4.0) (2020-05-06)

### Features

-   **cog:** GZip cutline.geojson ([#570](https://github.com/linz/basemaps/issues/570)) ([c5e2e5e](https://github.com/linz/basemaps/commit/c5e2e5e03be657f046a877e314ee3a16d28e67af))

# [1.3.0](https://github.com/linz/basemaps/compare/v1.2.0...v1.3.0) (2020-05-05)

### Features

-   **cli:** switch to priority numbers rather than array position ([#555](https://github.com/linz/basemaps/issues/555)) ([5dde7fd](https://github.com/linz/basemaps/commit/5dde7fd50ce1ea0faeb27c25030890a6c2fd6440))
-   support tileset history ([#537](https://github.com/linz/basemaps/issues/537)) ([06760d4](https://github.com/linz/basemaps/commit/06760d4f1a6a28d0edc4f40f55cdf9db8e91f93f))
-   **vdom:** add textContent attribute ([374c3dd](https://github.com/linz/basemaps/commit/374c3ddad1e55dddd7f178693be9d993ce816fa8))
-   **vdom:** improve iterating tags and elementChildren ([5c85b37](https://github.com/linz/basemaps/commit/5c85b37f5de871ef0ea9dd08075dfc4dd7f1ace0))
-   adding cli to configure rendering process ([13aae79](https://github.com/linz/basemaps/commit/13aae797b2143af8c08ed4da3c2013eacbbac082))
-   allow importing existing imagery into database ([#452](https://github.com/linz/basemaps/issues/452)) ([64ee961](https://github.com/linz/basemaps/commit/64ee9611bc35b767f8edbfbdb638ac2aadb9dd80))
-   make fetchImagery work with > 100 keys ([827c3a6](https://github.com/linz/basemaps/commit/827c3a68d07356a34dc5cda29a4dd4741a5afa9d))
-   parse vrt files so we can modify them ([ef985d8](https://github.com/linz/basemaps/commit/ef985d8b018e86a0cc2fd9e873da96cbcda336e5))

### Performance Improvements

-   **metadata:** avoid extra loop when fetching images ([5e0688f](https://github.com/linz/basemaps/commit/5e0688fc08c1cc9a7ee8566e68f588b83fe1a660))

# [1.2.0](https://github.com/linz/basemaps/compare/v1.1.0...v1.2.0) (2020-03-25)

### Features

-   **tile:** serve png, webp and jpeg ([44e9395](https://github.com/linz/basemaps/commit/44e93952dadfc4367f909fb1ac64cc811667d75b))
-   **wmts:** set cache-control max-age=0 for WMTSCapabilities.xml ([3e2c008](https://github.com/linz/basemaps/commit/3e2c0080faadf15e31d7646b8b711e4510313600))
-   improve vdom usability ([649b173](https://github.com/linz/basemaps/commit/649b173a2ab47d5a91c1596f5428e7b23ef2621c))
-   plug in wmts into tracker and lambda servers ([e57681b](https://github.com/linz/basemaps/commit/e57681b3ef42def0dc1a11de23c4e0a6a264d3f5))
-   simple virtual dom creator ([2d191d9](https://github.com/linz/basemaps/commit/2d191d917efd27ce24d934e5103eff82ed2a853e))

# [1.1.0](https://github.com/linz/basemaps/compare/v1.0.0...v1.1.0) (2020-02-20)

### Features

-   cli script to create api keys ([1ce5e75](https://github.com/linz/basemaps/commit/1ce5e7505f88dd1c9feb5c59af147ae685c92c11))

# [1.0.0](https://github.com/linz/basemaps/compare/v0.3.0...v1.0.0) (2020-02-18)

-   refactor!: split packages out in preperation for publishing. ([c6f5cbb](https://github.com/linz/basemaps/commit/c6f5cbb5514659ce446460bc8637e7a00e403a49))

### BREAKING CHANGES

-   this splits out the lambda/node dependencies from javascript so packages can be published for the browser

# [0.3.0](https://github.com/linz/basemaps/compare/v0.2.0...v0.3.0) (2020-02-11)

**Note:** Version bump only for package @basemaps/shared

# [0.2.0](https://github.com/linz/basemaps/compare/v0.1.0...v0.2.0) (2020-01-29)

### Bug Fixes

-   ask for 8 hours of access to s3 files. ([f1a0910](https://github.com/linz/basemaps/commit/f1a0910a8e120e65f79cd567c652a6f4a0760a97))

### Features

-   allow cli tiler to access data from s3 ([c033de3](https://github.com/linz/basemaps/commit/c033de32d09d69db997569ee61bd002f8ae62c82))
-   allow configuration of number of hours to assume a role ([f66f4f4](https://github.com/linz/basemaps/commit/f66f4f4f597959ec5d436ec15002ab26fc151a13))
-   configure the temp folder using TEMP_FOLDER environment var ([2762014](https://github.com/linz/basemaps/commit/27620144e31e687050225a33fb7a80f785161e54))

# 0.1.0 (2020-01-23)

### Bug Fixes

-   0 is not the root tile "" is ([61d2179](https://github.com/linz/basemaps/commit/61d21796f299954a844aa9617fc102b1e667a584))
-   assume responses are application/json unless told otherwise ([87b74d7](https://github.com/linz/basemaps/commit/87b74d7efefe4e8095aa57b5a057b41298ee06be))
-   bigint logging does not work ([2b3ed43](https://github.com/linz/basemaps/commit/2b3ed4380d4444120755eadfa41defc6c19ce4df))
-   duration must be the last thing calculated ([1766de6](https://github.com/linz/basemaps/commit/1766de689b544aaf913aa9b06c0d69d8fd5e9f33))
-   headers need to be lower cased ([a2932a0](https://github.com/linz/basemaps/commit/a2932a07d5ea7b3305154272a9cc33be41d8242d))
-   log errors into err so pino will serialize them ([b575de9](https://github.com/linz/basemaps/commit/b575de9f34caaf308960644c3f2013b0b3446e78))
-   provide a new stream to pino instead of changing the internal one ([025abed](https://github.com/linz/basemaps/commit/025abed6d62ed3a8870d567702be5a4d074333d1))
-   warn if timers are unfinished on exit ([13750d2](https://github.com/linz/basemaps/commit/13750d2c0b9d5a20a4c559cd54d4af093db0eceb))

### Features

-   adding aws dynamo db table for api key tracking ([ee1b2a6](https://github.com/linz/basemaps/commit/ee1b2a6f87e8dbfa04baca2047dff632508fb12b))
-   adding basic benchmark to track tile render performance ([f1cf534](https://github.com/linz/basemaps/commit/f1cf53465b70ed2a746fa15edc332bf77b0dc182))
-   adding cli to serve xyz a folder of cogs on localhost:5050 ([eeb4d2b](https://github.com/linz/basemaps/commit/eeb4d2b7912d1dc358afbc8f6ade5c40f7c06250))
-   adding gisborne_rural_2017-18_0.3m ([4491493](https://github.com/linz/basemaps/commit/449149344966948524b56f367cfd7c2de0cb3b1d))
-   adding improved metrics ([2b97eb5](https://github.com/linz/basemaps/commit/2b97eb5efc47dc1ef46c50d073f5df04ff0017de))
-   adding ping version and health endpoints ([af0a1dc](https://github.com/linz/basemaps/commit/af0a1dcddb80549971387cdda63f90dd0e64d755))
-   allow debug logging ([26cca8b](https://github.com/linz/basemaps/commit/26cca8bfa7d69c53c5637467f1448488643cac0c))
-   basic mosaic support ([cbd8e4c](https://github.com/linz/basemaps/commit/cbd8e4c1cb91974c4bced766d1c5167a3ab6d99a))
-   forward the api key to the rendering service ([2beddab](https://github.com/linz/basemaps/commit/2beddaba1521468c26da3550cf987a3d04f96372))
-   gdal docker build vrts ([54d8714](https://github.com/linz/basemaps/commit/54d8714789c896c624d1f6fd809537f5b96ac60e))
-   generate a ETag from the parameters for caching ([2d6c4be](https://github.com/linz/basemaps/commit/2d6c4be530fe52184664b812445444d0f90b6e79))
-   include api key in meta log ([67b4699](https://github.com/linz/basemaps/commit/67b4699c5d03662b56885bd82c39bb3687701c27))
-   include git version information in deployments ([5877005](https://github.com/linz/basemaps/commit/5877005b2cb5d4e24eb1cfc9cd108fa332cacaeb))
-   include request id in http headers ([a80d3e0](https://github.com/linz/basemaps/commit/a80d3e030bd95c7617e8e1ab10b90fbdb86c1a03))
-   include version information in logs ([da15f8d](https://github.com/linz/basemaps/commit/da15f8d5e14e9d57af133de57db1e1266df4329d))
-   initial tiler to be used inside of the xyz service ([2b6b6e3](https://github.com/linz/basemaps/commit/2b6b6e305bb54324984d00a64db3fdbb1fc73ba5))
-   lambda xyz tile server ([f115dfd](https://github.com/linz/basemaps/commit/f115dfd48ee352a8fc90abbfcbea15778f6c0961))
-   log out center of xyz tile from cloudfront requests too ([f0ca41e](https://github.com/linz/basemaps/commit/f0ca41eef8acbe82677642eeb3d9664bb467b3c7))
-   log out center of xyz tile so that we can plot it on a map easily ([0cc380d](https://github.com/linz/basemaps/commit/0cc380d923ecceee8b50d008de02ef6bd74f15f1))
-   prepare for splitting of polygons that span the antimeridian ([e7c3a51](https://github.com/linz/basemaps/commit/e7c3a510303d2ddd252f7f3dd18b2c7ce4a3fe8f))
-   process cogs using AWS batch ([8602ba8](https://github.com/linz/basemaps/commit/8602ba86db10c52267a71094c9836fc26f03bba5))
-   provide a lambda context with logging/error handling included ([72fe409](https://github.com/linz/basemaps/commit/72fe4099f1c8cb8e326fd81635bed4725bc3c7db))
-   quadkey intersections ([0c41194](https://github.com/linz/basemaps/commit/0c41194b50b0f569f344328f6234accdd891b618))
-   render full tiles and diff output ([ec1caf7](https://github.com/linz/basemaps/commit/ec1caf7b04654fe8154b364981c30f4fc1a15e5a))
-   simplify loading of required tiff files ([3676e52](https://github.com/linz/basemaps/commit/3676e52a03af44b74adba0218773bcd350427a0d))
-   supply aws credentials to gdal if needed ([1f57609](https://github.com/linz/basemaps/commit/1f5760940ac51dac9dbb0e62b601183ace7437a6))
-   support 3857 in projections ([816d8f6](https://github.com/linz/basemaps/commit/816d8f6873de969aca9a4a22ce222d5ed49d51a1))
-   validate api keys ([99d17ae](https://github.com/linz/basemaps/commit/99d17ae99f4b400868d207dc2b5a078618067a6f))
-   validate function tests ([fe4a41c](https://github.com/linz/basemaps/commit/fe4a41cfe1927a239cca3706c49630a5dfd336cb))
