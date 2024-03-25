# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [7.1.0](https://github.com/linz/basemaps/compare/v7.0.0...v7.1.0) (2024-03-25)


### Bug Fixes

* only allow f32 lerc ([#3124](https://github.com/linz/basemaps/issues/3124)) ([85ab67f](https://github.com/linz/basemaps/commit/85ab67f6d7f596c5391a56cac7d9d288cb575d4a))
* **tiler-sharp:** do not resample if its not needed ([#3179](https://github.com/linz/basemaps/issues/3179)) ([6e0752d](https://github.com/linz/basemaps/commit/6e0752d448ff4ae6e0e87d6fadd0a320d7c5d9a0))
* **tiler-sharp:** resampling should set no-data ([#3177](https://github.com/linz/basemaps/issues/3177)) ([0432fa7](https://github.com/linz/basemaps/commit/0432fa7304fd44220f9108a575399e327d6382f8))


### Features

* **config:** improve the default color ramp with more color ranges ([#3172](https://github.com/linz/basemaps/issues/3172)) ([2c7b8e5](https://github.com/linz/basemaps/commit/2c7b8e5383527ba3c854790fbf27b99d54625b4e))
* **tiler-sharp:** add terrain-rgb pipeline ([#3125](https://github.com/linz/basemaps/issues/3125)) ([159d064](https://github.com/linz/basemaps/commit/159d0647af110788aedda710a53dfc856febab45))
* **tiler-sharp:** allow outputs to customise how output is compressed ([#3126](https://github.com/linz/basemaps/issues/3126)) ([f13b8fb](https://github.com/linz/basemaps/commit/f13b8fb2aae7ad224c3fde6cfb4cd8f70d4f1f9e))
* **tiler-sharp:** directly resize/resample DEM inputs rather than RGBA outputs ([#3173](https://github.com/linz/basemaps/issues/3173)) ([b901f83](https://github.com/linz/basemaps/commit/b901f837757d59ddc8e1b8eb3beb87fa96dbc053))
* **tiler:** add bilinear resampler for DEM/DSM ([#3176](https://github.com/linz/basemaps/issues/3176)) ([c10c84a](https://github.com/linz/basemaps/commit/c10c84a06788e4e9bd7dbd54378666e680abf3ef))
* upgrade to typescript 5 ([#3019](https://github.com/linz/basemaps/issues/3019)) ([53aeebb](https://github.com/linz/basemaps/commit/53aeebbf07f173ac01aab0300d6e430159817c7e))





# [7.0.0](https://github.com/linz/basemaps/compare/v6.46.0...v7.0.0) (2023-11-27)


### Features

* Add proof of concept docs site BM-917 ([#2990](https://github.com/linz/basemaps/issues/2990)) ([cabccc7](https://github.com/linz/basemaps/commit/cabccc730de0c0016e9d102dc8df6acbf1510e00))
* **doc:** Improve the individual package documentations. BM-776 ([#2981](https://github.com/linz/basemaps/issues/2981)) ([5a4adcb](https://github.com/linz/basemaps/commit/5a4adcbbff15857a6f4c315d54280d542f785fec))





# [6.45.0](https://github.com/linz/basemaps/compare/v6.44.0...v6.45.0) (2023-09-18)


### Bug Fixes

* **tiler-sharp:** do not multiply imagery with the background color BM-885 ([#2953](https://github.com/linz/basemaps/issues/2953)) ([412676d](https://github.com/linz/basemaps/commit/412676d2abf813d0f25fe2971ce64aa187801af3))





# [6.44.0](https://github.com/linz/basemaps/compare/v6.43.0...v6.44.0) (2023-09-05)


### Features

* **lambda-tiler:** create preview images for og:image BM-264 ([#2921](https://github.com/linz/basemaps/issues/2921)) ([a074cc4](https://github.com/linz/basemaps/commit/a074cc45b40e35d5a593380f067f4932ef9e8da4))





# [6.43.0](https://github.com/linz/basemaps/compare/v6.42.1...v6.43.0) (2023-08-22)


### Features

* **tiler-sharp:** do not recompress intermediate tiffs ([#2864](https://github.com/linz/basemaps/issues/2864)) ([dd44ee9](https://github.com/linz/basemaps/commit/dd44ee9227affd8abefa37cd487244b189730511))





# [6.41.0](https://github.com/linz/basemaps/compare/v6.40.0...v6.41.0) (2023-07-26)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.40.0](https://github.com/linz/basemaps/compare/v6.39.0...v6.40.0) (2023-03-16)


### Bug Fixes

* **server:** make --no-config actually load the configuration from tiffs ([#2682](https://github.com/linz/basemaps/issues/2682)) ([019ee50](https://github.com/linz/basemaps/commit/019ee50ee22cda2ce143f9a012d4aaa9ffc0edc9))
* **tiler:** when scaling rectangles if the scaleX and scaleY differ scale using the larger dimension BM-772 ([#2693](https://github.com/linz/basemaps/issues/2693)) ([c498856](https://github.com/linz/basemaps/commit/c498856b1851026d0f3cb87fc9be4ac8cb0b4bc2))


### Reverts

* Revert "fix(tiler): when scaling rectangles if the scaleX and scaleY differ scale using the larger dimension BM-772 (#2693)" (#2711) ([c682963](https://github.com/linz/basemaps/commit/c682963171dce0a178e281ad62099edc53df93eb)), closes [#2693](https://github.com/linz/basemaps/issues/2693) [#2711](https://github.com/linz/basemaps/issues/2711)





# [6.37.0](https://github.com/linz/basemaps/compare/v6.36.0...v6.37.0) (2022-12-05)


### Features

* add overview archive to imagery config ([#2545](https://github.com/linz/basemaps/issues/2545)) ([ac463ef](https://github.com/linz/basemaps/commit/ac463efdaf8b6773c21b011a70327b606e4fafcb))





# [6.35.0](https://github.com/linz/basemaps/compare/v6.34.0...v6.35.0) (2022-09-14)

**Note:** Version bump only for package @basemaps/tiler-sharp





## [6.32.1](https://github.com/linz/basemaps/compare/v6.32.0...v6.32.1) (2022-07-28)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.32.0](https://github.com/linz/basemaps/compare/v6.31.0...v6.32.0) (2022-07-28)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.31.0](https://github.com/linz/basemaps/compare/v6.30.0...v6.31.0) (2022-07-22)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.30.0](https://github.com/linz/basemaps/compare/v6.29.0...v6.30.0) (2022-07-20)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.29.0](https://github.com/linz/basemaps/compare/v6.28.1...v6.29.0) (2022-06-27)


### Bug Fixes

* upgrade sharp to fix the bad webp upscalling behaviour ([#2261](https://github.com/linz/basemaps/issues/2261)) ([68fe14c](https://github.com/linz/basemaps/commit/68fe14c0549a884c0c4ededa40eb2d4bd7098590))
* **tiler-sharp:** resize to the target window after extracting the region ([#2243](https://github.com/linz/basemaps/issues/2243)) ([4a29606](https://github.com/linz/basemaps/commit/4a2960605ad16ba7bd3a2e0f5a95adb9125b2cdf))


### Features

* **lambda-tiler:** serve assets via /v1/sprites and /v1/fonts ([#2246](https://github.com/linz/basemaps/issues/2246)) ([0e04c63](https://github.com/linz/basemaps/commit/0e04c631363d5b540ae16bfc8c4c7910e1308412))
* **tiler-sharp:** extract regions before rescaling them when overzooming ([#2240](https://github.com/linz/basemaps/issues/2240)) ([fe9b858](https://github.com/linz/basemaps/commit/fe9b8588bbbe1aa8e719f7c8c645eada8c7e2876))





## [6.28.1](https://github.com/linz/basemaps/compare/v6.28.0...v6.28.1) (2022-06-07)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.28.0](https://github.com/linz/basemaps/compare/v6.27.0...v6.28.0) (2022-06-06)


### Bug Fixes

* **tiler:** down grade sharp to 0.29.2 as we are scaling webp past 16k ([#2237](https://github.com/linz/basemaps/issues/2237)) ([53cd5ef](https://github.com/linz/basemaps/commit/53cd5ef420698c2d8528735b5c02b84189c6b7f9))


### Features

* **server:** bundle basemaps-server cli so its easier to install ([#2218](https://github.com/linz/basemaps/issues/2218)) ([8457b66](https://github.com/linz/basemaps/commit/8457b66be6d0f54decf43b515bb78853cefbc8ed))
* **sprites:** create sprites using sharp ([#2235](https://github.com/linz/basemaps/issues/2235)) ([e7b6a9e](https://github.com/linz/basemaps/commit/e7b6a9e9c95359dc866b40e7a6988837a71d9d96))





# [6.26.0](https://github.com/linz/basemaps/compare/v6.25.0...v6.26.0) (2022-05-12)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.25.0](https://github.com/linz/basemaps/compare/v6.24.2...v6.25.0) (2022-05-11)


### Features

* **config:** serve tilejson 3.0.0 and allow raster imagery ([#2173](https://github.com/linz/basemaps/issues/2173)) ([29f5313](https://github.com/linz/basemaps/commit/29f53131e917fa0b3ce6f280e8f9e09f4fe6e957))





## [6.24.2](https://github.com/linz/basemaps/compare/v6.24.1...v6.24.2) (2022-04-20)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.23.0](https://github.com/linz/basemaps/compare/v6.22.1...v6.23.0) (2022-04-04)

**Note:** Version bump only for package @basemaps/tiler-sharp





## [6.21.1](https://github.com/linz/basemaps/compare/v6.21.0...v6.21.1) (2022-03-17)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-17)


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2111) ([d07f8ab](https://github.com/linz/basemaps/commit/d07f8ab4037466b060bf7e83960737554ff064b4)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2111](https://github.com/linz/basemaps/issues/2111)
* Revert "release: v6.22.0 (#2108)" (#2110) ([abcd2e4](https://github.com/linz/basemaps/commit/abcd2e4732a6d606eed865f526d6df2e4617aad3)), closes [#2108](https://github.com/linz/basemaps/issues/2108) [#2110](https://github.com/linz/basemaps/issues/2110)
* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.20.0](https://github.com/linz/basemaps/compare/v6.19.0...v6.20.0) (2022-02-01)

**Note:** Version bump only for package @basemaps/tiler-sharp





## [6.16.1](https://github.com/linz/basemaps/compare/v6.16.0...v6.16.1) (2021-11-30)


### Performance Improvements

* **tiler-sharp:** cache empty images as they are requested a lot ([#2002](https://github.com/linz/basemaps/issues/2002)) ([00bab89](https://github.com/linz/basemaps/commit/00bab89017ef45bdc7f771f0558b0ee30a8b11aa))
* **tiler-sharp:** if the output tile is the exact same as the input tiff tile serve the tiff tile directly ([#2001](https://github.com/linz/basemaps/issues/2001)) ([95c3612](https://github.com/linz/basemaps/commit/95c36128cf3f619a3ace7fc6524ba49523999eba))





# [6.11.0](https://github.com/linz/basemaps/compare/v6.10.1...v6.11.0) (2021-10-03)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Bug Fixes

* correctly bundle with esm modules ([#1858](https://github.com/linz/basemaps/issues/1858)) ([708a22e](https://github.com/linz/basemaps/commit/708a22ec1006c25cf2c057b75f61cc813e943aac))


### Features

* replace s3fs with chunkd/fs ([#1859](https://github.com/linz/basemaps/issues/1859)) ([9b6f2d3](https://github.com/linz/basemaps/commit/9b6f2d3609c336f96c2ae32246f241cb396e71c8))
* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.9.0](https://github.com/linz/basemaps/compare/v6.8.0...v6.9.0) (2021-09-09)


### Features

* **tiler-sharp:** start tracking tile composing performance ([#1838](https://github.com/linz/basemaps/issues/1838)) ([b6cff4d](https://github.com/linz/basemaps/commit/b6cff4d982595f2bdd2dd16362c59500d2d8119e))





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.1.0](https://github.com/linz/basemaps/compare/v6.0.0...v6.1.0) (2021-06-23)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)


### Features

* **tiler:** support rendering avif tiles ([#1409](https://github.com/linz/basemaps/issues/1409)) ([8474d32](https://github.com/linz/basemaps/commit/8474d327aaab14aad96c1d7793b44b8e8daad946))





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.12.0](https://github.com/linz/basemaps/compare/v4.11.2...v4.12.0) (2020-09-06)

**Note:** Version bump only for package @basemaps/tiler-sharp





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.9.0](https://github.com/linz/basemaps/compare/v4.8.0...v4.9.0) (2020-08-17)


### Bug Fixes

* **tiler:** Use nearest smoothing when down sizing ([#1050](https://github.com/linz/basemaps/issues/1050)) ([3a95844](https://github.com/linz/basemaps/commit/3a9584430e373effe44ee1c8879e4f733a7f6c5f))


### Features

* allow configuration of tile resize kernels ([#1051](https://github.com/linz/basemaps/issues/1051)) ([6b6d3d3](https://github.com/linz/basemaps/commit/6b6d3d32c735de6bf3f41819aaeb571c78f0921c))





# [4.8.0](https://github.com/linz/basemaps/compare/v4.7.1...v4.8.0) (2020-08-12)

**Note:** Version bump only for package @basemaps/tiler-sharp





## [4.7.1](https://github.com/linz/basemaps/compare/v4.7.0...v4.7.1) (2020-08-11)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.7.0](https://github.com/linz/basemaps/compare/v4.6.0...v4.7.0) (2020-08-10)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.6.0](https://github.com/linz/basemaps/compare/v4.5.0...v4.6.0) (2020-08-05)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.4.0](https://github.com/linz/basemaps/compare/v4.3.0...v4.4.0) (2020-07-28)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.2.0](https://github.com/linz/basemaps/compare/v4.1.0...v4.2.0) (2020-07-16)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.1.0](https://github.com/linz/basemaps/compare/v4.0.0...v4.1.0) (2020-07-15)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [4.0.0](https://github.com/linz/basemaps/compare/v3.6.0...v4.0.0) (2020-07-09)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [3.5.0](https://github.com/linz/basemaps/compare/v3.4.2...v3.5.0) (2020-07-05)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [3.2.0](https://github.com/linz/basemaps/compare/v3.1.0...v3.2.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [3.1.0](https://github.com/linz/basemaps/compare/v3.0.0...v3.1.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [3.0.0](https://github.com/linz/basemaps/compare/v2.2.0...v3.0.0) (2020-06-23)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [2.2.0](https://github.com/linz/basemaps/compare/v2.1.0...v2.2.0) (2020-06-17)


### Bug Fixes

* do not use full tiff files for generating etags ([#672](https://github.com/linz/basemaps/issues/672)) ([9fa9e73](https://github.com/linz/basemaps/commit/9fa9e73e9c650b5f2be198032d7a055a2c22e101))


### Features

* render tiles using tile matrix sets ([#699](https://github.com/linz/basemaps/issues/699)) ([5b8156a](https://github.com/linz/basemaps/commit/5b8156aac4d23087c399667fba265af8383cd60a))





# [2.1.0](https://github.com/linz/basemaps/compare/v2.0.0...v2.1.0) (2020-05-21)


### Features

* better sparse cog handling ([#634](https://github.com/linz/basemaps/issues/634)) ([1b60a87](https://github.com/linz/basemaps/commit/1b60a87f4a3f4751f203e3c927ca34784e5745b2))





# [2.0.0](https://github.com/linz/basemaps/compare/v1.12.0...v2.0.0) (2020-05-18)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [1.8.0](https://github.com/linz/basemaps/compare/v1.7.0...v1.8.0) (2020-05-11)


### Features

* support rendering different backgrounds for tiles ([#591](https://github.com/linz/basemaps/issues/591)) ([22f38f5](https://github.com/linz/basemaps/commit/22f38f555a678e6968206351d8fbb62a604da39e))





# [1.7.0](https://github.com/linz/basemaps/compare/v1.6.0...v1.7.0) (2020-05-10)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [1.6.0](https://github.com/linz/basemaps/compare/v1.5.1...v1.6.0) (2020-05-08)

**Note:** Version bump only for package @basemaps/tiler-sharp





## [1.4.2](https://github.com/linz/basemaps/compare/v1.4.1...v1.4.2) (2020-05-06)

**Note:** Version bump only for package @basemaps/tiler-sharp





## [1.4.1](https://github.com/linz/basemaps/compare/v1.4.0...v1.4.1) (2020-05-06)

**Note:** Version bump only for package @basemaps/tiler-sharp





# [1.3.0](https://github.com/linz/basemaps/compare/v1.2.0...v1.3.0) (2020-05-05)


### Features

* support tileset history ([#537](https://github.com/linz/basemaps/issues/537)) ([06760d4](https://github.com/linz/basemaps/commit/06760d4f1a6a28d0edc4f40f55cdf9db8e91f93f))





# [1.2.0](https://github.com/linz/basemaps/compare/v1.1.0...v1.2.0) (2020-03-25)


### Features

* adding suport for png, webp and jpeg tiles. ([8ad61e7](https://github.com/linz/basemaps/commit/8ad61e737a3cd153540abd8811bac680d00afeda))





# [1.1.0](https://github.com/linz/basemaps/compare/v1.0.0...v1.1.0) (2020-02-20)


### Bug Fixes

* limit the maximum zoom level for low resolution imagery ([c6e13a9](https://github.com/linz/basemaps/commit/c6e13a984bb6d6549daf5a5458e28a81039e1e5b))





# [1.0.0](https://github.com/linz/basemaps/compare/v0.3.0...v1.0.0) (2020-02-18)


* refactor!: split packages out in preperation for publishing. ([c6f5cbb](https://github.com/linz/basemaps/commit/c6f5cbb5514659ce446460bc8637e7a00e403a49))


### BREAKING CHANGES

* this splits out the lambda/node dependencies from javascript so packages can be published for the browser
