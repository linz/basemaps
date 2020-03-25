# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
