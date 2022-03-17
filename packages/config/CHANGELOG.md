# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.22.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.22.0) (2022-03-17)


### Bug Fixes

* **config:** fetch all unprocessed keys from dynamo if there are any ([#2101](https://github.com/linz/basemaps/issues/2101)) ([731430e](https://github.com/linz/basemaps/commit/731430e73756f05b2684f5b7ae7bd2852bc0a9b5))


### Features

* **config:** allow partial fetches from dynamo ([#2100](https://github.com/linz/basemaps/issues/2100)) ([1144d40](https://github.com/linz/basemaps/commit/1144d40482a302b6bca522ce105629209860242d))
* **config:** remove imagery year and resoltuion from config as it is not used ([#2097](https://github.com/linz/basemaps/issues/2097)) ([8be7c09](https://github.com/linz/basemaps/commit/8be7c09b9ce64898e5ab54b7fcb74c34405f558e))


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-16)


### Bug Fixes

* **config:** fetch all unprocessed keys from dynamo if there are any ([#2101](https://github.com/linz/basemaps/issues/2101)) ([731430e](https://github.com/linz/basemaps/commit/731430e73756f05b2684f5b7ae7bd2852bc0a9b5))


### Features

* **config:** allow partial fetches from dynamo ([#2100](https://github.com/linz/basemaps/issues/2100)) ([1144d40](https://github.com/linz/basemaps/commit/1144d40482a302b6bca522ce105629209860242d))
* **config:** remove imagery year and resoltuion from config as it is not used ([#2097](https://github.com/linz/basemaps/issues/2097)) ([8be7c09](https://github.com/linz/basemaps/commit/8be7c09b9ce64898e5ab54b7fcb74c34405f558e))





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
