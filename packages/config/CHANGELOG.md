# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.45.0](https://github.com/linz/basemaps/compare/v6.44.0...v6.45.0) (2023-09-18)


### Bug Fixes

* **cli:** Fix the missing return in plimit queue. ([#2952](https://github.com/linz/basemaps/issues/2952)) ([83c0ade](https://github.com/linz/basemaps/commit/83c0ade5ed138aa7fda3dbf3b5f516f98251c771))
* **config:** ignore the argo folder "flat/" in guessing imagery names ([#2939](https://github.com/linz/basemaps/issues/2939)) ([781d981](https://github.com/linz/basemaps/commit/781d9813ebdbb93053971472b06f6f738816b18e))


### Features

* **cli:** Sort the ts_all config by the imagery name. ([#2955](https://github.com/linz/basemaps/issues/2955)) ([7b29348](https://github.com/linz/basemaps/commit/7b293487b0e8ceb5f04b621a0a3ff40fd80b52e4))





# [6.44.0](https://github.com/linz/basemaps/compare/v6.43.0...v6.44.0) (2023-09-05)


### Bug Fixes

* **config:** do not use "rgb" or projection codes for imagery names ([#2908](https://github.com/linz/basemaps/issues/2908)) ([6f3c9a8](https://github.com/linz/basemaps/commit/6f3c9a8d28cade31114e5e449d39d2ff8bad6638))


### Features

* **cli:** Update config bundle to running asynchronously. ([#2923](https://github.com/linz/basemaps/issues/2923)) ([30b7d70](https://github.com/linz/basemaps/commit/30b7d70bde883806d170d63fd8d88ab6ac0e68df))
* **config:** detect empty images and ignore them ([#2915](https://github.com/linz/basemaps/issues/2915)) ([7b7cc1d](https://github.com/linz/basemaps/commit/7b7cc1d92d2437cff1ed38f9d8a2d487589e2e28))





# [6.43.0](https://github.com/linz/basemaps/compare/v6.42.1...v6.43.0) (2023-08-22)


### Bug Fixes

* **cli:** Add missing layer titles from the imagery to tileset. ([#2882](https://github.com/linz/basemaps/issues/2882)) ([8cfe830](https://github.com/linz/basemaps/commit/8cfe8301e579c266ff1f7d9543d36b190d5a085a))


### Features

* **cli:** Create standalone imagery config and remove disabled layer. BM-810 ([#2810](https://github.com/linz/basemaps/issues/2810)) ([e956851](https://github.com/linz/basemaps/commit/e956851983ad5f90d24cbb7c50f75824869e0e08))
* **cogify:** output single URL in cogify config command BM-822 ([#2899](https://github.com/linz/basemaps/issues/2899)) ([fbdbb95](https://github.com/linz/basemaps/commit/fbdbb9521ffc813fcb032345ab16f43230441b44))
* **config:** Create an all tileset from imagery configs. BM-805 ([#2794](https://github.com/linz/basemaps/issues/2794)) ([a2d64c8](https://github.com/linz/basemaps/commit/a2d64c8cdb03e6dd26cd16118880faaeab3143d9))
* **config:** Remove the chirld aerial: tileset from configs. BM-825 ([#2812](https://github.com/linz/basemaps/issues/2812)) ([4f26aac](https://github.com/linz/basemaps/commit/4f26aacdb54186273d67ffdac1b55bbe0bff88e3))





# [6.41.0](https://github.com/linz/basemaps/compare/v6.40.0...v6.41.0) (2023-07-26)


### Bug Fixes

* **cogify:** cogify create should create from stac item json ([#2785](https://github.com/linz/basemaps/issues/2785)) ([637df77](https://github.com/linz/basemaps/commit/637df7736e78d38e19b62dfe29f7e4ad09e4205a))
* **cogify:** use a URL in the cogify STAC documents ([#2843](https://github.com/linz/basemaps/issues/2843)) ([eb3f0fe](https://github.com/linz/basemaps/commit/eb3f0fe41b5a02ea71c2ea63e1a0057cc6d502d2))
* **config:** allow initializing config from URLs ([#2830](https://github.com/linz/basemaps/issues/2830)) ([0ea552e](https://github.com/linz/basemaps/commit/0ea552ec32ad723f98c96d533f18a8afc51d9657))


### Features

* **cogify:** improve cogify ([#2800](https://github.com/linz/basemaps/issues/2800)) ([cb16a44](https://github.com/linz/basemaps/commit/cb16a44aa44aa10ed69d1ab188a0539756f9ee72))
* **cogify:** retile imagery into COGS aligned to a tile matrix ([#2759](https://github.com/linz/basemaps/issues/2759)) ([ddd99d3](https://github.com/linz/basemaps/commit/ddd99d3548c65ec4ce5b7c608d6bf9360f053635))





# [6.40.0](https://github.com/linz/basemaps/compare/v6.39.0...v6.40.0) (2023-03-16)


### Bug Fixes

* **server:** allow a small variance between GSD ([#2687](https://github.com/linz/basemaps/issues/2687)) ([6713f0b](https://github.com/linz/basemaps/commit/6713f0b8e103c0cbce519c297fe605183bdf10bc))
* **server:** close tiff connections once they have been queried ([#2698](https://github.com/linz/basemaps/issues/2698)) ([cd43cb4](https://github.com/linz/basemaps/commit/cd43cb4f54aaa99feae9835f48207ca08d0e3253))
* **server:** gsd does not actually need to match ([#2694](https://github.com/linz/basemaps/issues/2694)) ([3737628](https://github.com/linz/basemaps/commit/373762875c2615515ce0853ba9dadcd04a2d988f))
* **server:** make --no-config actually load the configuration from tiffs ([#2682](https://github.com/linz/basemaps/issues/2682)) ([019ee50](https://github.com/linz/basemaps/commit/019ee50ee22cda2ce143f9a012d4aaa9ffc0edc9))


### Features

* **config:** generate configuration from a folder of tiffs ([#2677](https://github.com/linz/basemaps/issues/2677)) ([6afad20](https://github.com/linz/basemaps/commit/6afad20bd0014d5caa28dc49142fab92cecd283f))
* **config:** Make the config title as not null. ([#2667](https://github.com/linz/basemaps/issues/2667)) ([5e54854](https://github.com/linz/basemaps/commit/5e54854c10327385037122f7b7aada6adf312fae))
* **server:** change CLI interface to support multiple tiff folders ([#2688](https://github.com/linz/basemaps/issues/2688)) ([7fcd310](https://github.com/linz/basemaps/commit/7fcd310425aaf02bbadab2bb3b89cce5b7462c8f))





# [6.39.0](https://github.com/linz/basemaps/compare/v6.38.0...v6.39.0) (2023-01-25)


### Bug Fixes

* **cli:** Fix the TileSet id for the create-config output url. ([#2641](https://github.com/linz/basemaps/issues/2641)) ([3ed158d](https://github.com/linz/basemaps/commit/3ed158d9f917700d2bc58dcf6b483f293ba4b2d1))


### Features

* **tiler:** Exclude layers from style json. BM-730 ([#2629](https://github.com/linz/basemaps/issues/2629)) ([4683358](https://github.com/linz/basemaps/commit/468335895dc5b5536d780fdf1257df2408ef00ee)), closes [#2630](https://github.com/linz/basemaps/issues/2630)





# [6.38.0](https://github.com/linz/basemaps/compare/v6.37.0...v6.38.0) (2022-12-11)


### Features

* **config:** load the min/max zoom levels of a cotar overview from the wmtscapabilties ([#2621](https://github.com/linz/basemaps/issues/2621)) ([3fe70cf](https://github.com/linz/basemaps/commit/3fe70cf4f934a84e303a935bd3f7f8f6fcc41652))





# [6.37.0](https://github.com/linz/basemaps/compare/v6.36.0...v6.37.0) (2022-12-05)


### Features

* add overview archive to imagery config ([#2545](https://github.com/linz/basemaps/issues/2545)) ([ac463ef](https://github.com/linz/basemaps/commit/ac463efdaf8b6773c21b011a70327b606e4fafcb))
* **config:** remove all the processingJob configuration. ([#2598](https://github.com/linz/basemaps/issues/2598)) ([542401d](https://github.com/linz/basemaps/commit/542401d145f036518c0e14cd0873033122b5c096))





# [6.36.0](https://github.com/linz/basemaps/compare/v6.35.0...v6.36.0) (2022-10-18)


### Features

* **cli:** Add asset into config bundle record BM-693 ([#2528](https://github.com/linz/basemaps/issues/2528)) ([72bdd9b](https://github.com/linz/basemaps/commit/72bdd9bbccf6b9d4c865c931f1fafb3f56c98729))





# [6.35.0](https://github.com/linz/basemaps/compare/v6.34.0...v6.35.0) (2022-09-14)


### Bug Fixes

* **landing:** force config to always be in base58 ([#2463](https://github.com/linz/basemaps/issues/2463)) ([a2447e9](https://github.com/linz/basemaps/commit/a2447e9228c1fdc2f28af70699261f200a201226))


### Features

* allow loading config from ?config ([#2442](https://github.com/linz/basemaps/issues/2442)) ([8f946d8](https://github.com/linz/basemaps/commit/8f946d8ffb155304b80c26aca0faf4c64136390f))





# [6.34.0](https://github.com/linz/basemaps/compare/v6.33.0...v6.34.0) (2022-08-17)


### Features

* **lambda-tiler:** Assets provider to get assets from any location. ([#2374](https://github.com/linz/basemaps/issues/2374)) ([c145f28](https://github.com/linz/basemaps/commit/c145f283bf5875d5e7b15909cc37811b029303f4))
* **lambda-tiler:** Provide support for Arcgis online vector map. BM-78 ([#2403](https://github.com/linz/basemaps/issues/2403)) ([900a84e](https://github.com/linz/basemaps/commit/900a84e2b0275ae84fe327e9a91493f0aaa5c2e7))





## [6.32.1](https://github.com/linz/basemaps/compare/v6.32.0...v6.32.1) (2022-07-28)

**Note:** Version bump only for package @basemaps/config





# [6.32.0](https://github.com/linz/basemaps/compare/v6.31.0...v6.32.0) (2022-07-28)


### Features

* **config:** generate all the deprecated child tilesets BM-361 ([#2360](https://github.com/linz/basemaps/issues/2360)) ([1d9df13](https://github.com/linz/basemaps/commit/1d9df13b36b04af2e6749ce2d8ef45073cbc6f2b))





# [6.31.0](https://github.com/linz/basemaps/compare/v6.30.0...v6.31.0) (2022-07-22)


### Features

* **config:** Insert a config bundle records in dynamodb to refference the config file in s3. ([#2335](https://github.com/linz/basemaps/issues/2335)) ([143eeda](https://github.com/linz/basemaps/commit/143eeda69ab6eb6de70c7aed0247b6333ebb5bdf))
* **config:** use base58 hashes ([#2342](https://github.com/linz/basemaps/issues/2342)) ([8688351](https://github.com/linz/basemaps/commit/8688351834b0e00827024b25709d790d96522cb9))





# [6.30.0](https://github.com/linz/basemaps/compare/v6.29.0...v6.30.0) (2022-07-20)


### Bug Fixes

* **cli:** ensure diff is printed for changes ([#2328](https://github.com/linz/basemaps/issues/2328)) ([653fdb9](https://github.com/linz/basemaps/commit/653fdb9e98b74c08a2155d10f316c89658ead73e))
* **config:** improve handling of GSD math when standardizing layer names ([#2313](https://github.com/linz/basemaps/issues/2313)) ([cc8a14c](https://github.com/linz/basemaps/commit/cc8a14cf06c9aab47d3da7d680eec665a12fc1f6))


### Features

* **cli:** Add assets location into bundle json file. ([#2334](https://github.com/linz/basemaps/issues/2334)) ([f90a6be](https://github.com/linz/basemaps/commit/f90a6bea904fc22f7dbe5417be8642b837ba692f))
* use better names for WMTS ([#2314](https://github.com/linz/basemaps/issues/2314)) ([fbbf6c1](https://github.com/linz/basemaps/commit/fbbf6c140afe54b1a0227a15766bcc045a19bab2))
* **config:** add category and title to imagery ([#2278](https://github.com/linz/basemaps/issues/2278)) ([4d5d8e7](https://github.com/linz/basemaps/commit/4d5d8e79d87d42cc7f79f77949f7129df66fe3a0))
* **config:** create virtual tileset by imagery name ([#2309](https://github.com/linz/basemaps/issues/2309)) ([50ca2b5](https://github.com/linz/basemaps/commit/50ca2b5af5e63ff8b6fd2bee64df51def90a301c))
* **config:** ensure ids are prefixed before querying with them ([#2322](https://github.com/linz/basemaps/issues/2322)) ([ad0d3c4](https://github.com/linz/basemaps/commit/ad0d3c42a851767a8dadca2d7feb9965c78aa2f8))
* **config:** make layer names more standard ([#2308](https://github.com/linz/basemaps/issues/2308)) ([8be654c](https://github.com/linz/basemaps/commit/8be654c7ee037aa413283b903f0bb49ad242407d))





# [6.29.0](https://github.com/linz/basemaps/compare/v6.28.1...v6.29.0) (2022-06-27)


### Bug Fixes

* **config:** include missing zod dependency ([#2245](https://github.com/linz/basemaps/issues/2245)) ([94914dc](https://github.com/linz/basemaps/commit/94914dc728b60c51d6382c4460a1bd4e233f00c5))


### Features

* **config:** create a hash of config bundles and use bundle created timestamp for records ([#2274](https://github.com/linz/basemaps/issues/2274)) ([bd9c7bb](https://github.com/linz/basemaps/commit/bd9c7bbf3f651417b60ba6ad2ca655f89f1f5cd9))
* **config-cli:** Provide a cli for creating temporary server and dump screenshots. ([#2236](https://github.com/linz/basemaps/issues/2236)) ([0713b05](https://github.com/linz/basemaps/commit/0713b05e557f006ba6d253e854f57fd2de1ebf97))





## [6.28.1](https://github.com/linz/basemaps/compare/v6.28.0...v6.28.1) (2022-06-07)

**Note:** Version bump only for package @basemaps/config





# [6.28.0](https://github.com/linz/basemaps/compare/v6.27.0...v6.28.0) (2022-06-06)


### Features

* **server:** bundle basemaps-server cli so its easier to install ([#2218](https://github.com/linz/basemaps/issues/2218)) ([8457b66](https://github.com/linz/basemaps/commit/8457b66be6d0f54decf43b515bb78853cefbc8ed))
* **server:** provide a better error when loading configuration bundles ([#2222](https://github.com/linz/basemaps/issues/2222)) ([8318192](https://github.com/linz/basemaps/commit/83181920c8a9e061babd38a8ffd0dec93830dced))





# [6.27.0](https://github.com/linz/basemaps/compare/v6.26.0...v6.27.0) (2022-05-29)


### Bug Fixes

* **infra:** Fix the cog batch job to put record to dynamodb. ([#2197](https://github.com/linz/basemaps/issues/2197)) ([3c89246](https://github.com/linz/basemaps/commit/3c89246e33e65439352cc27f151ec9c85165a2db))


### Features

* **cli:** Insert imagery and tileset config after cog creation complete ([#2191](https://github.com/linz/basemaps/issues/2191)) ([3ea5efd](https://github.com/linz/basemaps/commit/3ea5efd049b956f882a05c90471d764efb5d39fd))
* **cli:** make cogs will update the process job status if exists. ([#2180](https://github.com/linz/basemaps/issues/2180)) ([855ce1c](https://github.com/linz/basemaps/commit/855ce1cb1f7b8bff575be342184e5ac387684f09))
* **config:** add configuration parser and bundler ([#2200](https://github.com/linz/basemaps/issues/2200)) ([795e3f2](https://github.com/linz/basemaps/commit/795e3f224ee0b4cd1e66a242d05a1fd5357cae3a))
* **lambda-cog:** New lambda Cog for import api. ([#2207](https://github.com/linz/basemaps/issues/2207)) ([79f4ae7](https://github.com/linz/basemaps/commit/79f4ae70ea3fc16a37dd575b843a0b60a1365df4))





# [6.26.0](https://github.com/linz/basemaps/compare/v6.25.0...v6.26.0) (2022-05-12)

**Note:** Version bump only for package @basemaps/config





# [6.25.0](https://github.com/linz/basemaps/compare/v6.24.2...v6.25.0) (2022-05-11)


### Features

* **config:** Add config job for imagery processing api ([#2162](https://github.com/linz/basemaps/issues/2162)) ([4ad2d37](https://github.com/linz/basemaps/commit/4ad2d370e7b75c45f4d16842e5399682fee475e0))
* **config:** add type guard for if the config object can be written to ([#2183](https://github.com/linz/basemaps/issues/2183)) ([0a00e0e](https://github.com/linz/basemaps/commit/0a00e0efc30ad4df8e5c49899768ad37d6301152))
* **config:** serve tilejson 3.0.0 and allow raster imagery ([#2173](https://github.com/linz/basemaps/issues/2173)) ([29f5313](https://github.com/linz/basemaps/commit/29f53131e917fa0b3ce6f280e8f9e09f4fe6e957))





## [6.24.2](https://github.com/linz/basemaps/compare/v6.24.1...v6.24.2) (2022-04-20)

**Note:** Version bump only for package @basemaps/config





## [6.21.1](https://github.com/linz/basemaps/compare/v6.21.0...v6.21.1) (2022-03-17)

**Note:** Version bump only for package @basemaps/config





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-17)


### Bug Fixes

* **config:** fetch all unprocessed keys from dynamo if there are any ([#2101](https://github.com/linz/basemaps/issues/2101)) ([731430e](https://github.com/linz/basemaps/commit/731430e73756f05b2684f5b7ae7bd2852bc0a9b5))


### Features

* **config:** allow partial fetches from dynamo ([#2100](https://github.com/linz/basemaps/issues/2100)) ([1144d40](https://github.com/linz/basemaps/commit/1144d40482a302b6bca522ce105629209860242d))
* **config:** remove imagery year and resoltuion from config as it is not used ([#2097](https://github.com/linz/basemaps/issues/2097)) ([8be7c09](https://github.com/linz/basemaps/commit/8be7c09b9ce64898e5ab54b7fcb74c34405f558e))


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2111) ([d07f8ab](https://github.com/linz/basemaps/commit/d07f8ab4037466b060bf7e83960737554ff064b4)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2111](https://github.com/linz/basemaps/issues/2111)
* Revert "release: v6.22.0 (#2108)" (#2110) ([abcd2e4](https://github.com/linz/basemaps/commit/abcd2e4732a6d606eed865f526d6df2e4617aad3)), closes [#2108](https://github.com/linz/basemaps/issues/2108) [#2110](https://github.com/linz/basemaps/issues/2110)
* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.18.0](https://github.com/linz/basemaps/compare/v6.17.0...v6.18.0) (2021-12-14)


### Features

* **config:** Add title into imagery config. ([#2021](https://github.com/linz/basemaps/issues/2021)) ([11b3ad1](https://github.com/linz/basemaps/commit/11b3ad1df908c3c7231e53795a1e6c58e6083644))





# [6.17.0](https://github.com/linz/basemaps/compare/v6.16.1...v6.17.0) (2021-12-05)


### Features

* **config:** Update the style json config to include attribution. ([#2010](https://github.com/linz/basemaps/issues/2010)) ([0994969](https://github.com/linz/basemaps/commit/0994969657f2b4da8961beba0338b16cf33a338e))





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Features

* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/config





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)


### Features

* **config:** enable configuration to be stored in memory rather than dynamodb ([#1817](https://github.com/linz/basemaps/issues/1817)) ([eb56f26](https://github.com/linz/basemaps/commit/eb56f2633c99c5372710ae12fc128a9e7fa7ed7d))
* **config:** enable swapping of configuration providers dynamically ([#1818](https://github.com/linz/basemaps/issues/1818)) ([e548ae5](https://github.com/linz/basemaps/commit/e548ae5219c7a5c6d5c6ed80c9f41c9637c3b554))
* **server:** create a standalone express server ([#1819](https://github.com/linz/basemaps/issues/1819)) ([83488af](https://github.com/linz/basemaps/commit/83488af658a3ed8f3080dd2ea9f120ac3abd2444))





# [6.7.0](https://github.com/linz/basemaps/compare/v6.6.1...v6.7.0) (2021-08-15)


### Features

* **lambda-tiler:** Support both aerial and vector basemap urls in style json. ([#1811](https://github.com/linz/basemaps/issues/1811)) ([9d30db8](https://github.com/linz/basemaps/commit/9d30db82d13bf84690c463644df664ab4c6735ce))





# [6.6.0](https://github.com/linz/basemaps/compare/v6.5.0...v6.6.0) (2021-07-29)


### Bug Fixes

* **config:** do not cache tile sets forever as they can be updated ([#1790](https://github.com/linz/basemaps/issues/1790)) ([d0b1c89](https://github.com/linz/basemaps/commit/d0b1c89ff155004b778ddca3003e3d5ea29e7b7f))





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)

**Note:** Version bump only for package @basemaps/config





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)

**Note:** Version bump only for package @basemaps/config





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)


### Bug Fixes

* **config:** do not duplicate prefix ([#1608](https://github.com/linz/basemaps/issues/1608)) ([a871051](https://github.com/linz/basemaps/commit/a87105151d5bb73dbf1594bf18b3de34b6e42383))


### Features

* **config:** Tidy up the config and cli to be able to config style json. ([#1555](https://github.com/linz/basemaps/issues/1555)) ([95b4c0e](https://github.com/linz/basemaps/commit/95b4c0ed5a42a5b7c6c7884c9bfe24f97e3677e5))
* **lambda-tiler:** serve vector map style json. ([#1553](https://github.com/linz/basemaps/issues/1553)) ([f9dadcd](https://github.com/linz/basemaps/commit/f9dadcdc2369c1ce30432ed231f5be4b466dc9cd))
