# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.29.0](https://github.com/linz/basemaps/compare/v6.28.1...v6.29.0) (2022-06-27)


### Bug Fixes

* upgrade sharp to fix the bad webp upscalling behaviour ([#2261](https://github.com/linz/basemaps/issues/2261)) ([68fe14c](https://github.com/linz/basemaps/commit/68fe14c0549a884c0c4ededa40eb2d4bd7098590))


### Features

* **lambda-tiler:** serve assets via /v1/sprites and /v1/fonts ([#2246](https://github.com/linz/basemaps/issues/2246)) ([0e04c63](https://github.com/linz/basemaps/commit/0e04c631363d5b540ae16bfc8c4c7910e1308412))
* **tiler-sharp:** extract regions before rescaling them when overzooming ([#2240](https://github.com/linz/basemaps/issues/2240)) ([fe9b858](https://github.com/linz/basemaps/commit/fe9b8588bbbe1aa8e719f7c8c645eada8c7e2876))





## [6.28.1](https://github.com/linz/basemaps/compare/v6.28.0...v6.28.1) (2022-06-07)

**Note:** Version bump only for package @basemaps/server





# [6.28.0](https://github.com/linz/basemaps/compare/v6.27.0...v6.28.0) (2022-06-06)


### Features

* **docker:** add a container of basemaps-server and basemaps-landing ([#2225](https://github.com/linz/basemaps/issues/2225)) ([13f8144](https://github.com/linz/basemaps/commit/13f814446de0b2896e0ccca620d4b0a017380c14))
* **server:** bundle basemaps-server cli so its easier to install ([#2218](https://github.com/linz/basemaps/issues/2218)) ([8457b66](https://github.com/linz/basemaps/commit/8457b66be6d0f54decf43b515bb78853cefbc8ed))
* **server:** provide a better error when loading configuration bundles ([#2222](https://github.com/linz/basemaps/issues/2222)) ([8318192](https://github.com/linz/basemaps/commit/83181920c8a9e061babd38a8ffd0dec93830dced))
* **sprites:** create sprites using sharp ([#2235](https://github.com/linz/basemaps/issues/2235)) ([e7b6a9e](https://github.com/linz/basemaps/commit/e7b6a9e9c95359dc866b40e7a6988837a71d9d96))





# [6.27.0](https://github.com/linz/basemaps/compare/v6.26.0...v6.27.0) (2022-05-29)


### Features

* **config:** add configuration parser and bundler ([#2200](https://github.com/linz/basemaps/issues/2200)) ([795e3f2](https://github.com/linz/basemaps/commit/795e3f224ee0b4cd1e66a242d05a1fd5357cae3a))
* **lambda-cog:** New lambda Cog for import api. ([#2207](https://github.com/linz/basemaps/issues/2207)) ([79f4ae7](https://github.com/linz/basemaps/commit/79f4ae70ea3fc16a37dd575b843a0b60a1365df4))
* **server:** use a bundled `@basemaps/landing` to serve static assets ([#2202](https://github.com/linz/basemaps/issues/2202)) ([c60f518](https://github.com/linz/basemaps/commit/c60f518893fe037a03f8bfd489c84d8427481678))





# [6.26.0](https://github.com/linz/basemaps/compare/v6.25.0...v6.26.0) (2022-05-12)

**Note:** Version bump only for package @basemaps/server





# [6.25.0](https://github.com/linz/basemaps/compare/v6.24.2...v6.25.0) (2022-05-11)

**Note:** Version bump only for package @basemaps/server





## [6.24.2](https://github.com/linz/basemaps/compare/v6.24.1...v6.24.2) (2022-04-20)


### Bug Fixes

* **server:** indexing local tiffs should not crash ([#2152](https://github.com/linz/basemaps/issues/2152)) ([066f39f](https://github.com/linz/basemaps/commit/066f39f42bec2558353c03741ca2226028ac424a))





## [6.24.1](https://github.com/linz/basemaps/compare/v6.24.0...v6.24.1) (2022-04-07)

**Note:** Version bump only for package @basemaps/server





# [6.24.0](https://github.com/linz/basemaps/compare/v6.23.0...v6.24.0) (2022-04-05)

**Note:** Version bump only for package @basemaps/server





# [6.23.0](https://github.com/linz/basemaps/compare/v6.22.1...v6.23.0) (2022-04-04)

**Note:** Version bump only for package @basemaps/server





## [6.22.1](https://github.com/linz/basemaps/compare/v6.22.0...v6.22.1) (2022-03-23)

**Note:** Version bump only for package @basemaps/server





# [6.22.0](https://github.com/linz/basemaps/compare/v6.21.1...v6.22.0) (2022-03-20)


### Features

* **server:** support loading config from dynamodb ([#2119](https://github.com/linz/basemaps/issues/2119)) ([e550505](https://github.com/linz/basemaps/commit/e550505193df3cf148313e364c7c0670e16756e2))





## [6.21.1](https://github.com/linz/basemaps/compare/v6.21.0...v6.21.1) (2022-03-17)

**Note:** Version bump only for package @basemaps/server





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-17)


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2111) ([d07f8ab](https://github.com/linz/basemaps/commit/d07f8ab4037466b060bf7e83960737554ff064b4)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2111](https://github.com/linz/basemaps/issues/2111)
* Revert "release: v6.22.0 (#2108)" (#2110) ([abcd2e4](https://github.com/linz/basemaps/commit/abcd2e4732a6d606eed865f526d6df2e4617aad3)), closes [#2108](https://github.com/linz/basemaps/issues/2108) [#2110](https://github.com/linz/basemaps/issues/2110)
* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.20.0](https://github.com/linz/basemaps/compare/v6.19.0...v6.20.0) (2022-02-01)

**Note:** Version bump only for package @basemaps/server





# [6.19.0](https://github.com/linz/basemaps/compare/v6.18.1...v6.19.0) (2021-12-20)

**Note:** Version bump only for package @basemaps/server





# [6.18.0](https://github.com/linz/basemaps/compare/v6.17.0...v6.18.0) (2021-12-14)

**Note:** Version bump only for package @basemaps/server





# [6.17.0](https://github.com/linz/basemaps/compare/v6.16.1...v6.17.0) (2021-12-05)

**Note:** Version bump only for package @basemaps/server





## [6.16.1](https://github.com/linz/basemaps/compare/v6.16.0...v6.16.1) (2021-11-30)

**Note:** Version bump only for package @basemaps/server





# [6.16.0](https://github.com/linz/basemaps/compare/v6.15.0...v6.16.0) (2021-11-29)

**Note:** Version bump only for package @basemaps/server





# [6.15.0](https://github.com/linz/basemaps/compare/v6.14.2...v6.15.0) (2021-11-28)

**Note:** Version bump only for package @basemaps/server





## [6.12.1](https://github.com/linz/basemaps/compare/v6.12.0...v6.12.1) (2021-10-19)

**Note:** Version bump only for package @basemaps/server





# [6.12.0](https://github.com/linz/basemaps/compare/v6.11.0...v6.12.0) (2021-10-05)

**Note:** Version bump only for package @basemaps/server





# [6.11.0](https://github.com/linz/basemaps/compare/v6.10.1...v6.11.0) (2021-10-03)


### Features

* **server:** add ability to serve a folder full of tiffs ([#1889](https://github.com/linz/basemaps/issues/1889)) ([adefde1](https://github.com/linz/basemaps/commit/adefde176ce03db5c6c978d8b85a11fc7cd15693))
* **server:** use the lambda handler directly ([#1870](https://github.com/linz/basemaps/issues/1870)) ([408ff56](https://github.com/linz/basemaps/commit/408ff5654cc04aae35d05eb5bbc47a51f99ec5b2))





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Bug Fixes

* **lambda-tiler:** move to NZTM2000Quad for health check endpoint ([#1867](https://github.com/linz/basemaps/issues/1867)) ([d4613f0](https://github.com/linz/basemaps/commit/d4613f04f1081f785831488ea53bc8d8da7aae70))


### Features

* replace s3fs with chunkd/fs ([#1859](https://github.com/linz/basemaps/issues/1859)) ([9b6f2d3](https://github.com/linz/basemaps/commit/9b6f2d3609c336f96c2ae32246f241cb396e71c8))
* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/server





# [6.9.0](https://github.com/linz/basemaps/compare/v6.8.0...v6.9.0) (2021-09-09)

**Note:** Version bump only for package @basemaps/server





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)


### Features

* **lambda-tiler:** remove `@basemaps/lambda` and replace with `@linzjs/lambda` ([#1821](https://github.com/linz/basemaps/issues/1821)) ([cb22b3d](https://github.com/linz/basemaps/commit/cb22b3d2c62b7430839f3e35c18dd96a162fb39a))
* **server:** create a standalone express server ([#1819](https://github.com/linz/basemaps/issues/1819)) ([83488af](https://github.com/linz/basemaps/commit/83488af658a3ed8f3080dd2ea9f120ac3abd2444))