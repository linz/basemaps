# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [8.3.0](https://github.com/linz/basemaps/compare/v8.2.0...v8.3.0) (2025-06-17)

**Note:** Version bump only for package @basemaps/tiler





# [8.0.0](https://github.com/linz/basemaps/compare/v7.17.0...v8.0.0) (2025-05-11)

**Note:** Version bump only for package @basemaps/tiler





# [7.16.0](https://github.com/linz/basemaps/compare/v7.15.1...v7.16.0) (2025-04-07)

**Note:** Version bump only for package @basemaps/tiler





# [7.15.0](https://github.com/linz/basemaps/compare/v7.14.0...v7.15.0) (2025-03-17)

**Note:** Version bump only for package @basemaps/tiler





# [7.12.0](https://github.com/linz/basemaps/compare/v7.11.1...v7.12.0) (2024-11-14)

**Note:** Version bump only for package @basemaps/tiler





# [7.11.0](https://github.com/linz/basemaps/compare/v7.10.0...v7.11.0) (2024-09-29)

**Note:** Version bump only for package @basemaps/tiler





# [7.5.0](https://github.com/linz/basemaps/compare/v7.4.0...v7.5.0) (2024-07-01)

**Note:** Version bump only for package @basemaps/tiler





# [7.4.0](https://github.com/linz/basemaps/compare/v7.3.0...v7.4.0) (2024-06-13)

**Note:** Version bump only for package @basemaps/tiler





# [7.1.0](https://github.com/linz/basemaps/compare/v7.0.0...v7.1.0) (2024-03-25)


### Bug Fixes

* **tiler:** do not read past the end of a tiff BM-948 ([#3059](https://github.com/linz/basemaps/issues/3059)) ([cf03dba](https://github.com/linz/basemaps/commit/cf03dba035921166c1447d8f82d27f2ca7be3891))


### Features

* **tiler-sharp:** directly resize/resample DEM inputs rather than RGBA outputs ([#3173](https://github.com/linz/basemaps/issues/3173)) ([b901f83](https://github.com/linz/basemaps/commit/b901f837757d59ddc8e1b8eb3beb87fa96dbc053))
* **tiler:** add bilinear resampler for DEM/DSM ([#3176](https://github.com/linz/basemaps/issues/3176)) ([c10c84a](https://github.com/linz/basemaps/commit/c10c84a06788e4e9bd7dbd54378666e680abf3ef))
* upgrade to typescript 5 ([#3019](https://github.com/linz/basemaps/issues/3019)) ([53aeebb](https://github.com/linz/basemaps/commit/53aeebbf07f173ac01aab0300d6e430159817c7e))





# [7.0.0](https://github.com/linz/basemaps/compare/v6.46.0...v7.0.0) (2023-11-27)


### Features

* Add proof of concept docs site BM-917 ([#2990](https://github.com/linz/basemaps/issues/2990)) ([cabccc7](https://github.com/linz/basemaps/commit/cabccc730de0c0016e9d102dc8df6acbf1510e00))
* **doc:** Improve the individual package documentations. BM-776 ([#2981](https://github.com/linz/basemaps/issues/2981)) ([5a4adcb](https://github.com/linz/basemaps/commit/5a4adcbbff15857a6f4c315d54280d542f785fec))





# [6.44.0](https://github.com/linz/basemaps/compare/v6.43.0...v6.44.0) (2023-09-05)


### Features

* **lambda-tiler:** create preview images for og:image BM-264 ([#2921](https://github.com/linz/basemaps/issues/2921)) ([a074cc4](https://github.com/linz/basemaps/commit/a074cc45b40e35d5a593380f067f4932ef9e8da4))





# [6.43.0](https://github.com/linz/basemaps/compare/v6.42.1...v6.43.0) (2023-08-22)


### Bug Fixes

* **tiler:** allow modification of the rounding bias to help reduce aspect ratio skews ([#2877](https://github.com/linz/basemaps/issues/2877)) ([ec899a7](https://github.com/linz/basemaps/commit/ec899a73e5802dd502dc0b6c4f8956b6156ca860))





# [6.41.0](https://github.com/linz/basemaps/compare/v6.40.0...v6.41.0) (2023-07-26)

**Note:** Version bump only for package @basemaps/tiler





# [6.40.0](https://github.com/linz/basemaps/compare/v6.39.0...v6.40.0) (2023-03-16)


### Bug Fixes

* **server:** make --no-config actually load the configuration from tiffs ([#2682](https://github.com/linz/basemaps/issues/2682)) ([019ee50](https://github.com/linz/basemaps/commit/019ee50ee22cda2ce143f9a012d4aaa9ffc0edc9))
* **tiler:** when scaling rectangles if the scaleX and scaleY differ scale using the larger dimension BM-772 ([#2693](https://github.com/linz/basemaps/issues/2693)) ([c498856](https://github.com/linz/basemaps/commit/c498856b1851026d0f3cb87fc9be4ac8cb0b4bc2))


### Reverts

* Revert "fix(tiler): when scaling rectangles if the scaleX and scaleY differ scale using the larger dimension BM-772 (#2693)" (#2711) ([c682963](https://github.com/linz/basemaps/commit/c682963171dce0a178e281ad62099edc53df93eb)), closes [#2693](https://github.com/linz/basemaps/issues/2693) [#2711](https://github.com/linz/basemaps/issues/2711)





# [6.37.0](https://github.com/linz/basemaps/compare/v6.36.0...v6.37.0) (2022-12-05)


### Bug Fixes

* **cli:** Fix the output for the overview cli as fsa.stream corrupt the file write to aws. ([#2585](https://github.com/linz/basemaps/issues/2585)) ([5875514](https://github.com/linz/basemaps/commit/5875514baeb5bbf3905460aad0dcef9ba0887322))


### Features

* add overview archive to imagery config ([#2545](https://github.com/linz/basemaps/issues/2545)) ([ac463ef](https://github.com/linz/basemaps/commit/ac463efdaf8b6773c21b011a70327b606e4fafcb))





# [6.35.0](https://github.com/linz/basemaps/compare/v6.34.0...v6.35.0) (2022-09-14)


### Features

* switch to aws role provider from chunkd ([#2473](https://github.com/linz/basemaps/issues/2473)) ([87be0e0](https://github.com/linz/basemaps/commit/87be0e08610f02003cb4ec3f6ced9b2051ee1617))





## [6.32.1](https://github.com/linz/basemaps/compare/v6.32.0...v6.32.1) (2022-07-28)

**Note:** Version bump only for package @basemaps/tiler





# [6.31.0](https://github.com/linz/basemaps/compare/v6.30.0...v6.31.0) (2022-07-22)

**Note:** Version bump only for package @basemaps/tiler





# [6.29.0](https://github.com/linz/basemaps/compare/v6.28.1...v6.29.0) (2022-06-27)


### Bug Fixes

* **cli:** look into batch to get exact list of tiffs being processed ([#2249](https://github.com/linz/basemaps/issues/2249)) ([69b722e](https://github.com/linz/basemaps/commit/69b722ea3190488231baf3b7023ce83e60e432c1))





## [6.28.1](https://github.com/linz/basemaps/compare/v6.28.0...v6.28.1) (2022-06-07)

**Note:** Version bump only for package @basemaps/tiler





# [6.28.0](https://github.com/linz/basemaps/compare/v6.27.0...v6.28.0) (2022-06-06)


### Features

* **server:** bundle basemaps-server cli so its easier to install ([#2218](https://github.com/linz/basemaps/issues/2218)) ([8457b66](https://github.com/linz/basemaps/commit/8457b66be6d0f54decf43b515bb78853cefbc8ed))





# [6.26.0](https://github.com/linz/basemaps/compare/v6.25.0...v6.26.0) (2022-05-12)

**Note:** Version bump only for package @basemaps/tiler





# [6.25.0](https://github.com/linz/basemaps/compare/v6.24.2...v6.25.0) (2022-05-11)


### Features

* **config:** serve tilejson 3.0.0 and allow raster imagery ([#2173](https://github.com/linz/basemaps/issues/2173)) ([29f5313](https://github.com/linz/basemaps/commit/29f53131e917fa0b3ce6f280e8f9e09f4fe6e957))





## [6.24.2](https://github.com/linz/basemaps/compare/v6.24.1...v6.24.2) (2022-04-20)

**Note:** Version bump only for package @basemaps/tiler





# [6.23.0](https://github.com/linz/basemaps/compare/v6.22.1...v6.23.0) (2022-04-04)

**Note:** Version bump only for package @basemaps/tiler





## [6.21.1](https://github.com/linz/basemaps/compare/v6.21.0...v6.21.1) (2022-03-17)

**Note:** Version bump only for package @basemaps/tiler





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-17)


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2111) ([d07f8ab](https://github.com/linz/basemaps/commit/d07f8ab4037466b060bf7e83960737554ff064b4)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2111](https://github.com/linz/basemaps/issues/2111)
* Revert "release: v6.22.0 (#2108)" (#2110) ([abcd2e4](https://github.com/linz/basemaps/commit/abcd2e4732a6d606eed865f526d6df2e4617aad3)), closes [#2108](https://github.com/linz/basemaps/issues/2108) [#2110](https://github.com/linz/basemaps/issues/2110)
* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.20.0](https://github.com/linz/basemaps/compare/v6.19.0...v6.20.0) (2022-02-01)

**Note:** Version bump only for package @basemaps/tiler





# [6.11.0](https://github.com/linz/basemaps/compare/v6.10.1...v6.11.0) (2021-10-03)

**Note:** Version bump only for package @basemaps/tiler





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Features

* replace s3fs with chunkd/fs ([#1859](https://github.com/linz/basemaps/issues/1859)) ([9b6f2d3](https://github.com/linz/basemaps/commit/9b6f2d3609c336f96c2ae32246f241cb396e71c8))
* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/tiler





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)

**Note:** Version bump only for package @basemaps/tiler





# [6.1.0](https://github.com/linz/basemaps/compare/v6.0.0...v6.1.0) (2021-06-23)


### Features

* switch to a binary cotar index ([#1691](https://github.com/linz/basemaps/issues/1691)) ([6fa0b3f](https://github.com/linz/basemaps/commit/6fa0b3f223ab251fe94011cbda88ff9aa5b6922f))





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)

**Note:** Version bump only for package @basemaps/tiler





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)

**Note:** Version bump only for package @basemaps/tiler





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)


### Features

* support serving of vector tiles ([#1535](https://github.com/linz/basemaps/issues/1535)) ([30083a5](https://github.com/linz/basemaps/commit/30083a57f981c2b2db6c50cad0f8db48be377d19))





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)

**Note:** Version bump only for package @basemaps/tiler





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)

**Note:** Version bump only for package @basemaps/tiler





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)


### Features

* **bathymetry:** generate the bathy tiles based on the output tile matrix set not hard coded ([#1478](https://github.com/linz/basemaps/issues/1478)) ([536c643](https://github.com/linz/basemaps/commit/536c643a216ac1378f53b3cb15c5897a428fb492))





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)


### Features

* **tiler:** support rendering avif tiles ([#1409](https://github.com/linz/basemaps/issues/1409)) ([8474d32](https://github.com/linz/basemaps/commit/8474d327aaab14aad96c1d7793b44b8e8daad946))
* Allow alternative TileMatrixSet definitions ([#1321](https://github.com/linz/basemaps/issues/1321)) ([b7cfa7b](https://github.com/linz/basemaps/commit/b7cfa7b8bf1351d9e57e46c180a1d3cf01c29927))





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)

**Note:** Version bump only for package @basemaps/tiler





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)

**Note:** Version bump only for package @basemaps/tiler





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)

**Note:** Version bump only for package @basemaps/tiler





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)

**Note:** Version bump only for package @basemaps/tiler





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)

**Note:** Version bump only for package @basemaps/tiler





# [4.12.0](https://github.com/linz/basemaps/compare/v4.11.2...v4.12.0) (2020-09-06)

**Note:** Version bump only for package @basemaps/tiler





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @basemaps/tiler





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)

**Note:** Version bump only for package @basemaps/tiler





# [4.9.0](https://github.com/linz/basemaps/compare/v4.8.0...v4.9.0) (2020-08-17)


### Bug Fixes

* **tiler:** Use nearest smoothing when down sizing ([#1050](https://github.com/linz/basemaps/issues/1050)) ([3a95844](https://github.com/linz/basemaps/commit/3a9584430e373effe44ee1c8879e4f733a7f6c5f))


### Features

* allow configuration of tile resize kernels ([#1051](https://github.com/linz/basemaps/issues/1051)) ([6b6d3d3](https://github.com/linz/basemaps/commit/6b6d3d32c735de6bf3f41819aaeb571c78f0921c))





# [4.8.0](https://github.com/linz/basemaps/compare/v4.7.1...v4.8.0) (2020-08-12)

**Note:** Version bump only for package @basemaps/tiler





## [4.7.1](https://github.com/linz/basemaps/compare/v4.7.0...v4.7.1) (2020-08-11)


### Bug Fixes

* **tiler:** Ensure rendered tiles does not exceed bounds ([#1036](https://github.com/linz/basemaps/issues/1036)) ([87d5493](https://github.com/linz/basemaps/commit/87d549320b41556e3b2cc13f2b202ee9a72d722a))





# [4.7.0](https://github.com/linz/basemaps/compare/v4.6.0...v4.7.0) (2020-08-10)


### Features

* **geo:** Add an optional bias when rounding bounds ([#1033](https://github.com/linz/basemaps/issues/1033)) ([c381733](https://github.com/linz/basemaps/commit/c3817332ab89d213bc87f0988f06b6331dc4c572))





# [4.6.0](https://github.com/linz/basemaps/compare/v4.5.0...v4.6.0) (2020-08-05)

**Note:** Version bump only for package @basemaps/tiler





# [4.4.0](https://github.com/linz/basemaps/compare/v4.3.0...v4.4.0) (2020-07-28)


### Features

* **lambda-xyz:** Serve WMTSCapabilities for all TileSets ([#953](https://github.com/linz/basemaps/issues/953)) ([49d0e88](https://github.com/linz/basemaps/commit/49d0e881b4726188ea937a9617c98bff5a78e44d))





# [4.2.0](https://github.com/linz/basemaps/compare/v4.1.0...v4.2.0) (2020-07-16)

**Note:** Version bump only for package @basemaps/tiler





# [4.1.0](https://github.com/linz/basemaps/compare/v4.0.0...v4.1.0) (2020-07-15)


### Bug Fixes

* **tiler:** try to minimize the error when rounding boundaries ([#913](https://github.com/linz/basemaps/issues/913)) ([e94b49d](https://github.com/linz/basemaps/commit/e94b49d7f818d31f2ee62ebd854c3b633b17a372))





# [4.0.0](https://github.com/linz/basemaps/compare/v3.6.0...v4.0.0) (2020-07-09)

**Note:** Version bump only for package @basemaps/tiler





# [3.5.0](https://github.com/linz/basemaps/compare/v3.4.2...v3.5.0) (2020-07-05)

**Note:** Version bump only for package @basemaps/tiler





# [3.2.0](https://github.com/linz/basemaps/compare/v3.1.0...v3.2.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/tiler





# [3.1.0](https://github.com/linz/basemaps/compare/v3.0.0...v3.1.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/tiler





# [3.0.0](https://github.com/linz/basemaps/compare/v2.2.0...v3.0.0) (2020-06-23)


### Features

* Generate and render COGs using bounding boxes ([#774](https://github.com/linz/basemaps/issues/774)) ([e35bf1f](https://github.com/linz/basemaps/commit/e35bf1f0e20b74a16ff942dc88547afc56454c12))





# [2.2.0](https://github.com/linz/basemaps/compare/v2.1.0...v2.2.0) (2020-06-17)


### Bug Fixes

* do not use full tiff files for generating etags ([#672](https://github.com/linz/basemaps/issues/672)) ([9fa9e73](https://github.com/linz/basemaps/commit/9fa9e73e9c650b5f2be198032d7a055a2c22e101))


### Features

* render tiles using tile matrix sets ([#699](https://github.com/linz/basemaps/issues/699)) ([5b8156a](https://github.com/linz/basemaps/commit/5b8156aac4d23087c399667fba265af8383cd60a))





# [2.1.0](https://github.com/linz/basemaps/compare/v2.0.0...v2.1.0) (2020-05-21)


### Features

* better sparse cog handling ([#634](https://github.com/linz/basemaps/issues/634)) ([1b60a87](https://github.com/linz/basemaps/commit/1b60a87f4a3f4751f203e3c927ca34784e5745b2))





# [2.0.0](https://github.com/linz/basemaps/compare/v1.12.0...v2.0.0) (2020-05-18)

**Note:** Version bump only for package @basemaps/tiler





# [1.8.0](https://github.com/linz/basemaps/compare/v1.7.0...v1.8.0) (2020-05-11)


### Features

* support rendering different backgrounds for tiles ([#591](https://github.com/linz/basemaps/issues/591)) ([22f38f5](https://github.com/linz/basemaps/commit/22f38f555a678e6968206351d8fbb62a604da39e))





# [1.6.0](https://github.com/linz/basemaps/compare/v1.5.1...v1.6.0) (2020-05-08)


### Bug Fixes

* **tiler:** position non square COGs correctly ([#580](https://github.com/linz/basemaps/issues/580)) ([3eb267a](https://github.com/linz/basemaps/commit/3eb267a1cfceefcdc9fa9872183a71d8da5818f7))





## [1.4.2](https://github.com/linz/basemaps/compare/v1.4.1...v1.4.2) (2020-05-06)

**Note:** Version bump only for package @basemaps/tiler





## [1.4.1](https://github.com/linz/basemaps/compare/v1.4.0...v1.4.1) (2020-05-06)

**Note:** Version bump only for package @basemaps/tiler





# [1.3.0](https://github.com/linz/basemaps/compare/v1.2.0...v1.3.0) (2020-05-05)


### Bug Fixes

* **wmts:** change image format order for ArcGIS Pro ([90c4cc8](https://github.com/linz/basemaps/commit/90c4cc8c2bed15e5aa5a36afd1270ee634b53e02))





# [1.2.0](https://github.com/linz/basemaps/compare/v1.1.0...v1.2.0) (2020-03-25)


### Bug Fixes

* offset is outside of the bounds. ([a3a786c](https://github.com/linz/basemaps/commit/a3a786c98aa0879d9d17af133c33996a87a830c4))


### Features

* adding suport for png, webp and jpeg tiles. ([8ad61e7](https://github.com/linz/basemaps/commit/8ad61e737a3cd153540abd8811bac680d00afeda))





# [1.1.0](https://github.com/linz/basemaps/compare/v1.0.0...v1.1.0) (2020-02-20)

**Note:** Version bump only for package @basemaps/tiler





# [1.0.0](https://github.com/linz/basemaps/compare/v0.3.0...v1.0.0) (2020-02-18)


* refactor!: split packages out in preperation for publishing. ([c6f5cbb](https://github.com/linz/basemaps/commit/c6f5cbb5514659ce446460bc8637e7a00e403a49))


### BREAKING CHANGES

* this splits out the lambda/node dependencies from javascript so packages can be published for the browser





# [0.3.0](https://github.com/linz/basemaps/compare/v0.2.0...v0.3.0) (2020-02-11)

**Note:** Version bump only for package @basemaps/tiler





# [0.2.0](https://github.com/linz/basemaps/compare/v0.1.0...v0.2.0) (2020-01-29)

**Note:** Version bump only for package @basemaps/tiler





# 0.1.0 (2020-01-23)


### Bug Fixes

* add tiffName to log output ([0b4e1a8](https://github.com/linz/basemaps/commit/0b4e1a8abe8336d82492f858565418a2abc6f127))
* bigint logging does not work ([2b3ed43](https://github.com/linz/basemaps/commit/2b3ed4380d4444120755eadfa41defc6c19ce4df))
* provide a new stream to pino instead of changing the internal one ([025abed](https://github.com/linz/basemaps/commit/025abed6d62ed3a8870d567702be5a4d074333d1))
* warn if timers are unfinished on exit ([13750d2](https://github.com/linz/basemaps/commit/13750d2c0b9d5a20a4c559cd54d4af093db0eceb))


### Features

* adding basic benchmark to track tile render performance ([f1cf534](https://github.com/linz/basemaps/commit/f1cf53465b70ed2a746fa15edc332bf77b0dc182))
* adding cli to serve xyz a folder of cogs on localhost:5050 ([eeb4d2b](https://github.com/linz/basemaps/commit/eeb4d2b7912d1dc358afbc8f6ade5c40f7c06250))
* adding improved metrics ([2b97eb5](https://github.com/linz/basemaps/commit/2b97eb5efc47dc1ef46c50d073f5df04ff0017de))
* adding mosiac json interface ([0531ebb](https://github.com/linz/basemaps/commit/0531ebbbcfc419853ae1e51956642ef65270effe))
* color test tiles black to see flaws ([9c635be](https://github.com/linz/basemaps/commit/9c635be6e67e18fa974ca8d30909387c86415d5e))
* expand tile creation to 4096 sized tiles ([e1ce06d](https://github.com/linz/basemaps/commit/e1ce06da97f2ee10c8d345b84bae37d8efdb8285))
* gdal docker build vrts ([54d8714](https://github.com/linz/basemaps/commit/54d8714789c896c624d1f6fd809537f5b96ac60e))
* generate a ETag from the parameters for caching ([2d6c4be](https://github.com/linz/basemaps/commit/2d6c4be530fe52184664b812445444d0f90b6e79))
* if image diffs occur write out the diff image ([d4307c2](https://github.com/linz/basemaps/commit/d4307c27efc3e914bffe1a1db63229a2ce9b3585))
* initial tiler to be used inside of the xyz service ([2b6b6e3](https://github.com/linz/basemaps/commit/2b6b6e305bb54324984d00a64db3fdbb1fc73ba5))
* log out center of xyz tile so that we can plot it on a map easily ([0cc380d](https://github.com/linz/basemaps/commit/0cc380d923ecceee8b50d008de02ef6bd74f15f1))
* render full tiles and diff output ([ec1caf7](https://github.com/linz/basemaps/commit/ec1caf7b04654fe8154b364981c30f4fc1a15e5a))
* switch tests to using a webmercator aligned test tiff ([56a88f0](https://github.com/linz/basemaps/commit/56a88f046775136f126fcaf6be58e0bb8edde41d))
* upgrade to cogeotiff 0.4.1 ([f161a67](https://github.com/linz/basemaps/commit/f161a67a539eb85eaf79e9af119bac777f0ca95a))
