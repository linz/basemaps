# Changelog

## [8.10.4](https://github.com/linz/basemaps/compare/cli-vector-v8.10.3...cli-vector-v8.10.4) (2025-12-11)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @basemaps/config bumped from ^8.11.0 to ^8.12.0
    * @basemaps/shared bumped from ^8.9.3 to ^8.9.4

## [8.10.3](https://github.com/linz/basemaps/compare/cli-vector-v8.10.2...cli-vector-v8.10.3) (2025-11-16)


### Bug Fixes

* **cli-vector:** Fix ETL concurrency issue to process half downloaded data. BM-1406 ([#3557](https://github.com/linz/basemaps/issues/3557)) ([fbefe5f](https://github.com/linz/basemaps/commit/fbefe5fa6aa4a43ffe9b73c975e97394149ec831))

## [8.10.2](https://github.com/linz/basemaps/compare/cli-vector-v8.10.1...cli-vector-v8.10.2) (2025-10-13)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @basemaps/config bumped from ^8.10.1 to ^8.11.0
    * @basemaps/shared bumped from ^8.9.2 to ^8.9.3

## [8.10.1](https://github.com/linz/basemaps/compare/cli-vector-v8.10.0...cli-vector-v8.10.1) (2025-09-24)


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @basemaps/config bumped from ^8.10.0 to ^8.10.1
    * @basemaps/shared bumped from ^8.9.1 to ^8.9.2

## [8.10.0](https://github.com/linz/basemaps/compare/cli-vector-v8.9.0...cli-vector-v8.10.0) (2025-09-22)


### Features

* **cli-vector:** update import zoom levels BM-1168 ([#3488](https://github.com/linz/basemaps/issues/3488)) ([41d9b86](https://github.com/linz/basemaps/commit/41d9b8633b85191e61e15a5b61fe5d64c31c077c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @basemaps/config bumped from ^8.9.0 to ^8.10.0
    * @basemaps/shared bumped from ^8.9.0 to ^8.9.1

## Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [8.9.0](https://github.com/linz/basemaps/compare/v8.7.0...v8.9.0) (2025-09-09)


### Bug Fixes

* **cli-vector:** Fix the tmp path of download layers and add try catch. BM-1352 ([#3494](https://github.com/linz/basemaps/issues/3494)) ([3769175](https://github.com/linz/basemaps/commit/376917570a2373d347d09098ccbac5e5d7515655))





## [8.8.0](https://github.com/linz/basemaps/compare/v8.7.0...v8.8.0) (2025-09-07)


### Bug Fixes

* **cli-vector:** Fix the tmp path of download layers and add try catch. BM-1352 ([#3494](https://github.com/linz/basemaps/issues/3494)) ([3769175](https://github.com/linz/basemaps/commit/376917570a2373d347d09098ccbac5e5d7515655))





## [8.7.0](https://github.com/linz/basemaps/compare/v8.6.0...v8.7.0) (2025-08-10)


### Features

* **cli-vector:** update the parsing logic for place_labels layer features BM-1318 ([#3470](https://github.com/linz/basemaps/issues/3470)) ([29d2593](https://github.com/linz/basemaps/commit/29d25938363255f05b91cced54397928a2a092da))





## [8.6.0](https://github.com/linz/basemaps/compare/v8.5.0...v8.6.0) (2025-08-06)

**Note:** Version bump only for package @basemaps/cli-vector





## [8.5.0](https://github.com/linz/basemaps/compare/v8.4.0...v8.5.0) (2025-07-15)


### Features

* **cli-vector:** Add stac collection and stac catalog for the extract command. BM-1307 ([#3472](https://github.com/linz/basemaps/issues/3472)) ([b357022](https://github.com/linz/basemaps/commit/b3570226f61ab035b5c6449dd0077cac5a6320db))





## [8.4.0](https://github.com/linz/basemaps/compare/v8.3.0...v8.4.0) (2025-06-25)


### Bug Fixes

* **cli-vector:** Fix the stac item format missing datetime in properties. BM-1317 ([#3464](https://github.com/linz/basemaps/issues/3464)) ([6c7719f](https://github.com/linz/basemaps/commit/6c7719f7514160158b6ad14b680fe1bdd10fd1e3))
* **cli-vector:** revert polylabel version to 1.1.0 BM-1309 ([#3467](https://github.com/linz/basemaps/issues/3467)) ([e2039fa](https://github.com/linz/basemaps/commit/e2039fa587467010e399f064f187381eee8a3ac0))


### Features

* **cli-vector:** adjust the layers assigned to each schema layer BM-1299 ([#3462](https://github.com/linz/basemaps/issues/3462)) ([0770163](https://github.com/linz/basemaps/commit/0770163665557390feab74f865132139fa9c3560))





## [8.3.0](https://github.com/linz/basemaps/compare/v8.2.0...v8.3.0) (2025-06-17)


### Bug Fixes

* **cli-vector:** collapse large analysis report in pr comment ([#3457](https://github.com/linz/basemaps/issues/3457)) ([19a4d85](https://github.com/linz/basemaps/commit/19a4d85bb90058694c0a5cd3cd2530cd9e60b9a1))


### Features

* **cli-vector:** Support NZTM mbtiles creation.BM-1300 ([#3452](https://github.com/linz/basemaps/issues/3452)) ([f601a73](https://github.com/linz/basemaps/commit/f601a73185aad7f22f6e0e5551d41ba49588c932))





## [8.2.0](https://github.com/linz/basemaps/compare/v8.1.0...v8.2.0) (2025-06-12)


### Features

* **cli-vector:** analyse mbtiles BM-1270 ([#3444](https://github.com/linz/basemaps/issues/3444)) ([e721392](https://github.com/linz/basemaps/commit/e721392d52866ef0d31e110d32e718460ce3008b))
* **cli-vector:** New cli to create and join mbtiles for vector map. BM-1268 ([#3435](https://github.com/linz/basemaps/issues/3435)) ([8cbef0b](https://github.com/linz/basemaps/commit/8cbef0b0a9ef3db804d05b533b6858f55c9064c9))





## [8.1.0](https://github.com/linz/basemaps/compare/v8.0.0...v8.1.0) (2025-05-18)

**Note:** Version bump only for package @basemaps/cli-vector





## [8.0.0](https://github.com/linz/basemaps/compare/v7.17.0...v8.0.0) (2025-05-11)


### Features

* **cli-vector:** Extract cli to load schema json and prepare jobs to process vector mbtiles. BM-1267 ([#3429](https://github.com/linz/basemaps/issues/3429)) ([db113e2](https://github.com/linz/basemaps/commit/db113e27ad935fab4538ffad607c2cd04f52dbdd))
* **cli:** move cogify create-config into cli-config package BM-1261 ([#3432](https://github.com/linz/basemaps/issues/3432)) ([5f72430](https://github.com/linz/basemaps/commit/5f72430690d330e8542d272ede461d3a711493de))





## Change Log
