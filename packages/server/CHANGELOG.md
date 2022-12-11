# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.38.0](https://github.com/linz/basemaps/compare/v6.37.0...v6.38.0) (2022-12-11)

**Note:** Version bump only for package @basemaps/server





# [6.37.0](https://github.com/linz/basemaps/compare/v6.36.0...v6.37.0) (2022-12-05)

**Note:** Version bump only for package @basemaps/server





# [6.36.0](https://github.com/linz/basemaps/compare/v6.35.0...v6.36.0) (2022-10-18)


### Bug Fixes

* Remove AssetLocation and using cb_lastest to get default assets. BM-693 ([#2527](https://github.com/linz/basemaps/issues/2527)) ([fce8607](https://github.com/linz/basemaps/commit/fce860786fb838a6fcbe65f35ca9ec6f12eeaf97))





# [6.35.0](https://github.com/linz/basemaps/compare/v6.34.0...v6.35.0) (2022-09-14)


### Bug Fixes

* **lambda-tiler:** send 408 timeout response rather than timing out. ([#2460](https://github.com/linz/basemaps/issues/2460)) ([8d31469](https://github.com/linz/basemaps/commit/8d31469829a65739ccbe525031897259d9ae2ae4))
* **landing:** ensure tileMatrix is being passed correctly ([#2454](https://github.com/linz/basemaps/issues/2454)) ([3b66dee](https://github.com/linz/basemaps/commit/3b66dee9700074d578328d434cae9c6f6c20dfff))


### Features

* allow loading config from ?config ([#2442](https://github.com/linz/basemaps/issues/2442)) ([8f946d8](https://github.com/linz/basemaps/commit/8f946d8ffb155304b80c26aca0faf4c64136390f))





# [6.34.0](https://github.com/linz/basemaps/compare/v6.33.0...v6.34.0) (2022-08-17)


### Bug Fixes

* **server:** error if port is in use ([#2418](https://github.com/linz/basemaps/issues/2418)) ([a469af3](https://github.com/linz/basemaps/commit/a469af3685899c9ece6f6a4394089a341c0672b5))


### Features

* **lambda-tiler:** Provide get info api and post tileserver api for arcgis BM-78 ([#2407](https://github.com/linz/basemaps/issues/2407)) ([d9b091b](https://github.com/linz/basemaps/commit/d9b091bf4e6fd2b91804a7b9bbcd388dd8b75ee8))





# [6.33.0](https://github.com/linz/basemaps/compare/v6.32.2...v6.33.0) (2022-08-01)

**Note:** Version bump only for package @basemaps/server





## [6.32.2](https://github.com/linz/basemaps/compare/v6.32.1...v6.32.2) (2022-07-28)

**Note:** Version bump only for package @basemaps/server





## [6.32.1](https://github.com/linz/basemaps/compare/v6.32.0...v6.32.1) (2022-07-28)

**Note:** Version bump only for package @basemaps/server





# [6.32.0](https://github.com/linz/basemaps/compare/v6.31.0...v6.32.0) (2022-07-28)

**Note:** Version bump only for package @basemaps/server





# [6.31.0](https://github.com/linz/basemaps/compare/v6.30.0...v6.31.0) (2022-07-22)


### Bug Fixes

* **server:** actually start the server from the cli ([#2347](https://github.com/linz/basemaps/issues/2347)) ([a5e382b](https://github.com/linz/basemaps/commit/a5e382b681d80136a1602dbe681a8b2c511aa818))


### Features

* **server:** Allow to start server from a config bundle dynamo reference ([#2339](https://github.com/linz/basemaps/issues/2339)) ([366ef79](https://github.com/linz/basemaps/commit/366ef793312b82a498d3ab56bc60b01e0574f6d4))





# [6.30.0](https://github.com/linz/basemaps/compare/v6.29.0...v6.30.0) (2022-07-20)


### Features

* use better names for WMTS ([#2314](https://github.com/linz/basemaps/issues/2314)) ([fbbf6c1](https://github.com/linz/basemaps/commit/fbbf6c140afe54b1a0227a15766bcc045a19bab2))
* **cli:** add bmc serve to create a server from a bundled config ([#2306](https://github.com/linz/basemaps/issues/2306)) ([700c729](https://github.com/linz/basemaps/commit/700c7295ddae15d436bbf1932757c88feb4686ea))
* **cli:** install playwright and basemaps/landing for the screenshot util ([#2286](https://github.com/linz/basemaps/issues/2286)) ([4e6559b](https://github.com/linz/basemaps/commit/4e6559be31da2f2eb578533fc8c88667ea27dca4))





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
