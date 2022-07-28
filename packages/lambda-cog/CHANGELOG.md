# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.32.1](https://github.com/linz/basemaps/compare/v6.32.0...v6.32.1) (2022-07-28)

**Note:** Version bump only for package @basemaps/lambda-cog





# [6.32.0](https://github.com/linz/basemaps/compare/v6.31.0...v6.32.0) (2022-07-28)


### Features

* **lambda-tiler:** log cache hit percentages ([#2368](https://github.com/linz/basemaps/issues/2368)) ([3f7bf0c](https://github.com/linz/basemaps/commit/3f7bf0c39ba46797b1a271a191fe51fc578abffc))





# [6.31.0](https://github.com/linz/basemaps/compare/v6.30.0...v6.31.0) (2022-07-22)

**Note:** Version bump only for package @basemaps/lambda-cog





# [6.30.0](https://github.com/linz/basemaps/compare/v6.29.0...v6.30.0) (2022-07-20)


### Features

* **cli:** add cli for listing, filtering and grouping files in AWS ([#2281](https://github.com/linz/basemaps/issues/2281)) ([b4dec98](https://github.com/linz/basemaps/commit/b4dec98c3006161972250f7a535423d874b1dd4e))
* **cli:** allow using a local path for role configuration ([#2282](https://github.com/linz/basemaps/issues/2282)) ([e985ea2](https://github.com/linz/basemaps/commit/e985ea26ef70edd2beb5a5d474932a3a3ed1f4b1))
* **lambda-tiler:** prefer using route handler for managing routes ([#2312](https://github.com/linz/basemaps/issues/2312)) ([3c481dd](https://github.com/linz/basemaps/commit/3c481dd60032f277d38a7cf5bc0ec69a21aefb3b))





# [6.29.0](https://github.com/linz/basemaps/compare/v6.28.1...v6.29.0) (2022-06-27)


### Bug Fixes

* **lambda-cog:** ensure /v1/version, health and ping endpoints exist ([#2247](https://github.com/linz/basemaps/issues/2247)) ([8eea093](https://github.com/linz/basemaps/commit/8eea09350b0d01027764ebf74f3fc9afb55036c8))
* **lambda-cog:** only assume a read-only role if the current role does not have permission ([#2253](https://github.com/linz/basemaps/issues/2253)) ([189aec7](https://github.com/linz/basemaps/commit/189aec703ff8c7956842f159b60fcabe14debf18))





## [6.28.1](https://github.com/linz/basemaps/compare/v6.28.0...v6.28.1) (2022-06-07)

**Note:** Version bump only for package @basemaps/lambda-cog





# [6.28.0](https://github.com/linz/basemaps/compare/v6.27.0...v6.28.0) (2022-06-06)

**Note:** Version bump only for package @basemaps/lambda-cog





# [6.27.0](https://github.com/linz/basemaps/compare/v6.26.0...v6.27.0) (2022-05-29)


### Features

* **infra:** Increase the import api size limitation to 1200GB. ([#2215](https://github.com/linz/basemaps/issues/2215)) ([94c4da8](https://github.com/linz/basemaps/commit/94c4da8eb0f07f03e46f5ac7a6759c486e56f5d4))
* **lambda-cog:** New lambda Cog for import api. ([#2207](https://github.com/linz/basemaps/issues/2207)) ([79f4ae7](https://github.com/linz/basemaps/commit/79f4ae70ea3fc16a37dd575b843a0b60a1365df4))
* **lambda-cog:** reduce the max pixel size and increase the limit of processing size ([#2208](https://github.com/linz/basemaps/issues/2208)) ([451109e](https://github.com/linz/basemaps/commit/451109ebf2ffe2f622a8f8f00616c880c73417bf))
* **lambda-cog:** Update the import api output path ([#2220](https://github.com/linz/basemaps/issues/2220)) ([0122f85](https://github.com/linz/basemaps/commit/0122f854572c86a96e5e22564f1d741b26825810))
