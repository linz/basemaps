# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.16.0](https://github.com/linz/basemaps/compare/v6.15.0...v6.16.0) (2021-11-29)

**Note:** Version bump only for package @basemaps/infra





# [6.15.0](https://github.com/linz/basemaps/compare/v6.14.2...v6.15.0) (2021-11-28)


### Bug Fixes

* **infrastructure:** revert aws-cdk to 1.111 until ALB target bug is fixed ([#1962](https://github.com/linz/basemaps/issues/1962)) ([c73c292](https://github.com/linz/basemaps/commit/c73c2928075edefeac14e486d5951205c3f51424))





## [6.14.2](https://github.com/linz/basemaps/compare/v6.14.1...v6.14.2) (2021-11-09)


### Bug Fixes

* **infrastructure:** correct cors for s3 requests ([#1954](https://github.com/linz/basemaps/issues/1954)) ([8a33710](https://github.com/linz/basemaps/commit/8a337108768f32a51067b0e1f9f8c394759470e5))


### Performance Improvements

* lower the lambda size as the timeout bug has been fixed ([#1943](https://github.com/linz/basemaps/issues/1943)) ([d6d951b](https://github.com/linz/basemaps/commit/d6d951bacca5cd6bac6ee68ae2aca2c4209fc37b))





## [6.14.1](https://github.com/linz/basemaps/compare/v6.14.0...v6.14.1) (2021-10-27)


### Bug Fixes

* **infra:** allow cross origin requests to the static s3 bucket ([#1939](https://github.com/linz/basemaps/issues/1939)) ([68573a0](https://github.com/linz/basemaps/commit/68573a0775f37d8133cbb512470e14bc949c1f26))





## [6.12.1](https://github.com/linz/basemaps/compare/v6.12.0...v6.12.1) (2021-10-19)

**Note:** Version bump only for package @basemaps/infra





# [6.12.0](https://github.com/linz/basemaps/compare/v6.11.0...v6.12.0) (2021-10-05)


### Features

* **infrastructure:** increase performance of lambda function ([#1896](https://github.com/linz/basemaps/issues/1896)) ([af59300](https://github.com/linz/basemaps/commit/af59300798fa34119350fa856391cf0eac2ef374))





# [6.11.0](https://github.com/linz/basemaps/compare/v6.10.1...v6.11.0) (2021-10-03)

**Note:** Version bump only for package @basemaps/infra





## [6.10.1](https://github.com/linz/basemaps/compare/v6.10.0...v6.10.1) (2021-09-22)


### Bug Fixes

* **infra:** remove trailing "." as it causes resolution failure ([#1878](https://github.com/linz/basemaps/issues/1878)) ([0f9e105](https://github.com/linz/basemaps/commit/0f9e105d306d6b8c525e847cb23a6fa9ca84d1f9))





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Features

* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/infra





# [6.9.0](https://github.com/linz/basemaps/compare/v6.8.0...v6.9.0) (2021-09-09)

**Note:** Version bump only for package @basemaps/infra





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)

**Note:** Version bump only for package @basemaps/infra





# [6.7.0](https://github.com/linz/basemaps/compare/v6.6.1...v6.7.0) (2021-08-15)

**Note:** Version bump only for package @basemaps/infra





## [6.6.1](https://github.com/linz/basemaps/compare/v6.6.0...v6.6.1) (2021-07-29)

**Note:** Version bump only for package @basemaps/infra





# [6.6.0](https://github.com/linz/basemaps/compare/v6.5.0...v6.6.0) (2021-07-29)


### Features

* **infra:** move lambda into the same VPC as the ALB ([#1789](https://github.com/linz/basemaps/issues/1789)) ([0baa1ec](https://github.com/linz/basemaps/commit/0baa1ec651a52128b4d00139eac312b3a4503205))





# [6.5.0](https://github.com/linz/basemaps/compare/v6.4.0...v6.5.0) (2021-07-25)

**Note:** Version bump only for package @basemaps/infra





# [6.4.0](https://github.com/linz/basemaps/compare/v6.3.0...v6.4.0) (2021-07-13)


### Features

* **infra:** remove logging stack as that is now handled internally ([#1731](https://github.com/linz/basemaps/issues/1731)) ([e670099](https://github.com/linz/basemaps/commit/e6700993a057477c828a07befc75ba76e6903993))





# [6.3.0](https://github.com/linz/basemaps/compare/v6.2.0...v6.3.0) (2021-07-07)


### Features

* **infra:** remove logging stack as that is now handled internally ([#1701](https://github.com/linz/basemaps/issues/1701)) ([ffcbf35](https://github.com/linz/basemaps/commit/ffcbf35188cc3cda610839035cae3eb80ecfb36a))


### Reverts

* logging stack changes as its not ready yet. ([#1729](https://github.com/linz/basemaps/issues/1729)) ([4eaea4d](https://github.com/linz/basemaps/commit/4eaea4d2162787522f4ab421ba28368a23650844)), closes [#1701](https://github.com/linz/basemaps/issues/1701)





# [6.2.0](https://github.com/linz/basemaps/compare/v6.1.0...v6.2.0) (2021-06-24)


### Features

* disable edge lambda as its not really used. ([#1692](https://github.com/linz/basemaps/issues/1692)) ([38b02a5](https://github.com/linz/basemaps/commit/38b02a5c5050a076c69836861afc91cc92235a79))





# [6.1.0](https://github.com/linz/basemaps/compare/v6.0.0...v6.1.0) (2021-06-23)

**Note:** Version bump only for package @basemaps/infra





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)


### Bug Fixes

* default to basemaps.linz.govt.nz rather than tiles.basemaps.linz.govt.nz ([#1684](https://github.com/linz/basemaps/issues/1684)) ([95afdbf](https://github.com/linz/basemaps/commit/95afdbf7125edebf557ceace3e8e9f76d0317e1b))





# [5.2.0](https://github.com/linz/basemaps/compare/v5.1.0...v5.2.0) (2021-06-10)


### Features

* **infra:** add support for vector tile sources ([#1663](https://github.com/linz/basemaps/issues/1663)) ([8ab7687](https://github.com/linz/basemaps/commit/8ab7687f5b6cea262d224cf73ef606a95a7a3939))





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)

**Note:** Version bump only for package @basemaps/infra





## [5.0.3](https://github.com/linz/basemaps/compare/v5.0.2...v5.0.3) (2021-05-25)

**Note:** Version bump only for package @basemaps/infra





## [5.0.2](https://github.com/linz/basemaps/compare/v5.0.1...v5.0.2) (2021-05-19)

**Note:** Version bump only for package @basemaps/infra





## [5.0.1](https://github.com/linz/basemaps/compare/v5.0.0...v5.0.1) (2021-05-17)

**Note:** Version bump only for package @basemaps/infra





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)

**Note:** Version bump only for package @basemaps/infra





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)

**Note:** Version bump only for package @basemaps/infra





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)

**Note:** Version bump only for package @basemaps/infra





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)

**Note:** Version bump only for package @basemaps/infra





# [4.21.0](https://github.com/linz/basemaps/compare/v4.20.0...v4.21.0) (2021-02-16)

**Note:** Version bump only for package @basemaps/infra





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)


### Bug Fixes

* **infra:** update tile lambda duration to avoid timeout when generating attribution. ([#1428](https://github.com/linz/basemaps/issues/1428)) ([3eb0775](https://github.com/linz/basemaps/commit/3eb0775ab55096ccf2ca4b0c5ce2bc342c8c5e9b))





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)

**Note:** Version bump only for package @basemaps/infra





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)


### Features

* **infra:** actually check the health of the lambda before deploying ([#1327](https://github.com/linz/basemaps/issues/1327)) ([a51bd93](https://github.com/linz/basemaps/commit/a51bd9305c90c7efbc7f5dbe56cf2cc08484d004))





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)

**Note:** Version bump only for package @basemaps/infra





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)

**Note:** Version bump only for package @basemaps/infra





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)

**Note:** Version bump only for package @basemaps/infra





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)


### Features

* **infra:** check the health of the tiler every 30 seconds ([#1164](https://github.com/linz/basemaps/issues/1164)) ([b87dd18](https://github.com/linz/basemaps/commit/b87dd18b580208c63084f7975540679ef8adecaf))
* **lambda-analytics:** generate rolledup analyitics from cloudwatchedge logs ([#1180](https://github.com/linz/basemaps/issues/1180)) ([20fd5b1](https://github.com/linz/basemaps/commit/20fd5b1983b16fc1fcb1b731152da36430fedc63))





# [4.13.0](https://github.com/linz/basemaps/compare/v4.12.2...v4.13.0) (2020-09-14)

**Note:** Version bump only for package @basemaps/infra





## [4.12.2](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.2) (2020-09-10)

**Note:** Version bump only for package @basemaps/infra





## [4.12.1](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.1) (2020-09-10)

**Note:** Version bump only for package @basemaps/infra





# [4.12.0](https://github.com/linz/basemaps/compare/v4.11.2...v4.12.0) (2020-09-06)


### Features

* **infra:** drop out lambda start/end/report logs from being shipped to elasticsearch ([#1115](https://github.com/linz/basemaps/issues/1115)) ([b902487](https://github.com/linz/basemaps/commit/b9024876a78706d4e21a90f8c96f26f79a5af36c))





## [4.11.2](https://github.com/linz/basemaps/compare/v4.11.1...v4.11.2) (2020-09-01)

**Note:** Version bump only for package @basemaps/infra





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @basemaps/infra





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)


### Features

* upgrade to node 12.x ([#1079](https://github.com/linz/basemaps/issues/1079)) ([053cc2f](https://github.com/linz/basemaps/commit/053cc2f28087b41cbf7c715fd200357d41b8e2da))





# [4.10.0](https://github.com/linz/basemaps/compare/v4.9.0...v4.10.0) (2020-08-19)

**Note:** Version bump only for package @basemaps/infra





# [4.9.0](https://github.com/linz/basemaps/compare/v4.8.0...v4.9.0) (2020-08-17)


### Bug Fixes

* **infra:** fix broken log shipper path ([#1058](https://github.com/linz/basemaps/issues/1058)) ([633c0f8](https://github.com/linz/basemaps/commit/633c0f8e544a6f05231a3c5b4a61b904b5493386))





# [4.8.0](https://github.com/linz/basemaps/compare/v4.7.1...v4.8.0) (2020-08-12)

**Note:** Version bump only for package @basemaps/infra





## [4.7.1](https://github.com/linz/basemaps/compare/v4.7.0...v4.7.1) (2020-08-11)

**Note:** Version bump only for package @basemaps/infra





# [4.7.0](https://github.com/linz/basemaps/compare/v4.6.0...v4.7.0) (2020-08-10)


### Features

* **infra:** give dev readonly access to production COGs ([#1016](https://github.com/linz/basemaps/issues/1016)) ([5772a70](https://github.com/linz/basemaps/commit/5772a70e1f9dd58dac7c9d5e1f251ac8e138448b))
* **infra:** support point in time recovery of dynamodb databases ([#1015](https://github.com/linz/basemaps/issues/1015)) ([a488cb7](https://github.com/linz/basemaps/commit/a488cb73bc7d5e4b22aced85ee29f3b2f1d0bc0a))





# [4.6.0](https://github.com/linz/basemaps/compare/v4.5.0...v4.6.0) (2020-08-05)

**Note:** Version bump only for package @basemaps/infra





# [4.5.0](https://github.com/linz/basemaps/compare/v4.4.0...v4.5.0) (2020-07-30)

**Note:** Version bump only for package @basemaps/infra





# [4.4.0](https://github.com/linz/basemaps/compare/v4.3.0...v4.4.0) (2020-07-28)


### Bug Fixes

* inject git version and hash into all code ([#966](https://github.com/linz/basemaps/issues/966)) ([8b8eaec](https://github.com/linz/basemaps/commit/8b8eaec373286c81b425d485274edd7c588aefea))
* **lambda-api:** track api key usage ([#943](https://github.com/linz/basemaps/issues/943)) ([7c4689c](https://github.com/linz/basemaps/commit/7c4689cd0824ee678260ba5d84b25042aad72363))





# [4.3.0](https://github.com/linz/basemaps/compare/v4.2.0...v4.3.0) (2020-07-19)

**Note:** Version bump only for package @basemaps/infra





# [4.2.0](https://github.com/linz/basemaps/compare/v4.1.0...v4.2.0) (2020-07-16)

**Note:** Version bump only for package @basemaps/infra





# [4.1.0](https://github.com/linz/basemaps/compare/v4.0.0...v4.1.0) (2020-07-15)

**Note:** Version bump only for package @basemaps/infra





# [4.0.0](https://github.com/linz/basemaps/compare/v3.6.0...v4.0.0) (2020-07-09)

**Note:** Version bump only for package @basemaps/infra





# [3.6.0](https://github.com/linz/basemaps/compare/v3.5.0...v3.6.0) (2020-07-08)

**Note:** Version bump only for package @basemaps/infra





# [3.5.0](https://github.com/linz/basemaps/compare/v3.4.2...v3.5.0) (2020-07-05)

**Note:** Version bump only for package @basemaps/infra





## [3.4.1](https://github.com/linz/basemaps/compare/v3.4.0...v3.4.1) (2020-06-30)

**Note:** Version bump only for package @basemaps/infra





# [3.4.0](https://github.com/linz/basemaps/compare/v3.3.0...v3.4.0) (2020-06-29)


### Bug Fixes

* **cli:** show number of commits since last tag ([#836](https://github.com/linz/basemaps/issues/836)) ([a205215](https://github.com/linz/basemaps/commit/a2052156a761eddc7815632212007fa465c4d43d))





# [3.2.0](https://github.com/linz/basemaps/compare/v3.1.0...v3.2.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/infra





# [3.1.0](https://github.com/linz/basemaps/compare/v3.0.0...v3.1.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/infra





# [3.0.0](https://github.com/linz/basemaps/compare/v2.2.0...v3.0.0) (2020-06-23)


### Features

* increase maxvCpus for batch from 512 to 3000 ([#787](https://github.com/linz/basemaps/issues/787)) ([dd55e36](https://github.com/linz/basemaps/commit/dd55e36eebbfd34120e597cb2c3ee24aee2b2cf0))





# [2.2.0](https://github.com/linz/basemaps/compare/v2.1.0...v2.2.0) (2020-06-17)


### Features

* Allow composite imagery from different COG buckets ([#664](https://github.com/linz/basemaps/issues/664)) ([404a5a3](https://github.com/linz/basemaps/commit/404a5a3ad35ad6da5c8de6e1beebb134dcaec3ff))





# [2.1.0](https://github.com/linz/basemaps/compare/v2.0.0...v2.1.0) (2020-05-21)

**Note:** Version bump only for package @basemaps/infra





# [2.0.0](https://github.com/linz/basemaps/compare/v1.12.0...v2.0.0) (2020-05-18)

**Note:** Version bump only for package @basemaps/infra





# [1.12.0](https://github.com/linz/basemaps/compare/v1.11.0...v1.12.0) (2020-05-15)


### Bug Fixes

* **cli:** git hash cannot be fetched inside the docker cli ([#622](https://github.com/linz/basemaps/issues/622)) ([f53956d](https://github.com/linz/basemaps/commit/f53956de5f3be5b66b24d8ddf4794c4055558c6c))
* **infra:** docker enviroment needs to be name/value pairs ([#623](https://github.com/linz/basemaps/issues/623)) ([b4c2a44](https://github.com/linz/basemaps/commit/b4c2a44927e4bbdcfab9bda08460747f78e6b54b))





# [1.11.0](https://github.com/linz/basemaps/compare/v1.10.0...v1.11.0) (2020-05-14)

**Note:** Version bump only for package @basemaps/infra





# [1.10.0](https://github.com/linz/basemaps/compare/v1.9.0...v1.10.0) (2020-05-13)


### Bug Fixes

* correct path to cli ([#609](https://github.com/linz/basemaps/issues/609)) ([4195a46](https://github.com/linz/basemaps/commit/4195a468c482252b21799af73831eaa75164b12f))





# [1.9.0](https://github.com/linz/basemaps/compare/v1.8.0...v1.9.0) (2020-05-12)

**Note:** Version bump only for package @basemaps/infra





# [1.8.0](https://github.com/linz/basemaps/compare/v1.7.0...v1.8.0) (2020-05-11)

**Note:** Version bump only for package @basemaps/infra





# [1.7.0](https://github.com/linz/basemaps/compare/v1.6.0...v1.7.0) (2020-05-10)

**Note:** Version bump only for package @basemaps/infra





# [1.6.0](https://github.com/linz/basemaps/compare/v1.5.1...v1.6.0) (2020-05-08)

**Note:** Version bump only for package @basemaps/infra





## [1.5.1](https://github.com/linz/basemaps/compare/v1.5.0...v1.5.1) (2020-05-07)


### Bug Fixes

* **cli:** aws assume role needs to be able to assume any role provided via the cli ([#578](https://github.com/linz/basemaps/issues/578)) ([d432c89](https://github.com/linz/basemaps/commit/d432c891280bbf312d6a547c4ccb3a766eca3670))





# [1.5.0](https://github.com/linz/basemaps/compare/v1.4.2...v1.5.0) (2020-05-07)

**Note:** Version bump only for package @basemaps/infra





## [1.4.2](https://github.com/linz/basemaps/compare/v1.4.1...v1.4.2) (2020-05-06)

**Note:** Version bump only for package @basemaps/infra





## [1.4.1](https://github.com/linz/basemaps/compare/v1.4.0...v1.4.1) (2020-05-06)

**Note:** Version bump only for package @basemaps/infra





# [1.4.0](https://github.com/linz/basemaps/compare/v1.3.0...v1.4.0) (2020-05-06)

**Note:** Version bump only for package @basemaps/infra





# [1.3.0](https://github.com/linz/basemaps/compare/v1.2.0...v1.3.0) (2020-05-05)


### Bug Fixes

* allow cogify command access to tile metadata table ([9843670](https://github.com/linz/basemaps/commit/984367042bd384332213719e13086fde0dcfaeb7))





# [1.2.0](https://github.com/linz/basemaps/compare/v1.1.0...v1.2.0) (2020-03-25)

**Note:** Version bump only for package @basemaps/infra





# [1.1.0](https://github.com/linz/basemaps/compare/v1.0.0...v1.1.0) (2020-02-20)

**Note:** Version bump only for package @basemaps/infra





# [1.0.0](https://github.com/linz/basemaps/compare/v0.3.0...v1.0.0) (2020-02-18)


* refactor!: split packages out in preperation for publishing. ([c6f5cbb](https://github.com/linz/basemaps/commit/c6f5cbb5514659ce446460bc8637e7a00e403a49))


### BREAKING CHANGES

* this splits out the lambda/node dependencies from javascript so packages can be published for the browser





# [0.3.0](https://github.com/linz/basemaps/compare/v0.2.0...v0.3.0) (2020-02-11)

**Note:** Version bump only for package @basemaps/infra





# [0.2.0](https://github.com/linz/basemaps/compare/v0.1.0...v0.2.0) (2020-01-29)


### Bug Fixes

* allow more processing power to be applied to tasks ([b201683](https://github.com/linz/basemaps/commit/b201683f16be7a08bca2676d85cca018f9643d7b))
* allow more space for temporary tiff files. ([f0f8a28](https://github.com/linz/basemaps/commit/f0f8a285bdd140ec6c23df6121a51f9fec0a58bc))
* allow more than one c5 instance to process COGs ([2ff8844](https://github.com/linz/basemaps/commit/2ff884401836916a50c2f9d7500aefd28507ed08))
* running too many containers on the same machine runs it out of disk ([f344997](https://github.com/linz/basemaps/commit/f344997f2a27216eaf307413e31fcfdc3ca58a1a))
* supply a launch template to force the batch hosts to have larger local disk ([affaf88](https://github.com/linz/basemaps/commit/affaf88dcd9887187b58635203e51fc507612482))





# 0.1.0 (2020-01-23)


### Bug Fixes

* alb lambda's do not need specific versions ([1f26114](https://github.com/linz/basemaps/commit/1f26114b35a53d29387a1598c1ef5072a6b59bee))
* use the built cdk code ([0ddfccd](https://github.com/linz/basemaps/commit/0ddfccd6504bb4b167e9565edf4bcda3570431c8))


### Features

* adding aws cdk for deployment management ([df2a7be](https://github.com/linz/basemaps/commit/df2a7be665c85c9e14c64c57e79c963bbcf3c615))
* adding ssl listener for alb ([2c97c5c](https://github.com/linz/basemaps/commit/2c97c5c7ae3bd513ebf3b40a0c30907d538aa996))
* include git version information in deployments ([5877005](https://github.com/linz/basemaps/commit/5877005b2cb5d4e24eb1cfc9cd108fa332cacaeb))
* initial tiler to be used inside of the xyz service ([2b6b6e3](https://github.com/linz/basemaps/commit/2b6b6e305bb54324984d00a64db3fdbb1fc73ba5))
* lambda xyz tile server ([f115dfd](https://github.com/linz/basemaps/commit/f115dfd48ee352a8fc90abbfcbea15778f6c0961))
* process cogs using AWS batch ([8602ba8](https://github.com/linz/basemaps/commit/8602ba86db10c52267a71094c9836fc26f03bba5))
* simplify loading of required tiff files ([3676e52](https://github.com/linz/basemaps/commit/3676e52a03af44b74adba0218773bcd350427a0d))
