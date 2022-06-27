# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
