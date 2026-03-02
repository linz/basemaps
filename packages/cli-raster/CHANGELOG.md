# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [8.11.7](https://github.com/linz/basemaps/compare/cli-raster-v8.11.6...cli-raster-v8.11.7) (2026-02-26)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @basemaps/config-loader bumped from ^8.12.3 to ^8.12.4
    * @basemaps/shared bumped from ^8.9.7 to ^8.9.8

## [8.11.6](https://github.com/linz/basemaps/compare/cli-raster-v8.11.5...cli-raster-v8.11.6) (2026-02-15)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @basemaps/config-loader bumped from ^8.12.2 to ^8.12.3
    * @basemaps/shared bumped from ^8.9.6 to ^8.9.7

## [8.11.5](https://github.com/linz/basemaps/compare/cli-raster-v8.11.4...cli-raster-v8.11.5) (2025-12-18)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @basemaps/config bumped from ^8.13.0 to ^8.13.1
    * @basemaps/config-loader bumped from ^8.12.1 to ^8.12.2
    * @basemaps/shared bumped from ^8.9.5 to ^8.9.6

## [8.11.4](https://github.com/linz/basemaps/compare/cli-raster-v8.11.3...cli-raster-v8.11.4) (2025-12-17)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @basemaps/config bumped from ^8.12.0 to ^8.13.0
    * @basemaps/config-loader bumped from ^8.12.0 to ^8.12.1
    * @basemaps/shared bumped from ^8.9.4 to ^8.9.5

## [8.11.3](https://github.com/linz/basemaps/compare/cli-raster-v8.11.2...cli-raster-v8.11.3) (2025-12-11)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @basemaps/config bumped from ^8.11.0 to ^8.12.0
    * @basemaps/config-loader bumped from ^8.11.0 to ^8.12.0
    * @basemaps/shared bumped from ^8.9.3 to ^8.9.4

## [8.11.2](https://github.com/linz/basemaps/compare/cli-raster-v8.11.1...cli-raster-v8.11.2) (2025-11-16)


### Bug Fixes

* **cli-raster:** zstd covering with smaller tiles than expected for single band sources ([#3551](https://github.com/linz/basemaps/issues/3551)) ([198aa69](https://github.com/linz/basemaps/commit/198aa697514935bf694b3f787412e5b63621f321))

## [8.11.1](https://github.com/linz/basemaps/compare/cli-raster-v8.11.0...cli-raster-v8.11.1) (2025-10-13)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @basemaps/config bumped from ^8.10.1 to ^8.11.0
    * @basemaps/config-loader bumped from ^8.10.1 to ^8.11.0
    * @basemaps/shared bumped from ^8.9.2 to ^8.9.3

## [8.11.0](https://github.com/linz/basemaps/compare/cli-raster-v8.10.1...cli-raster-v8.11.0) (2025-10-02)


### Features

* **cli-raster:** update topo-raster processes to support 600 DPI gridded map sheets BM-1375 ([#3532](https://github.com/linz/basemaps/issues/3532)) ([887e43a](https://github.com/linz/basemaps/commit/887e43a2680c60daf56a17066533497954487473))

## [8.10.1](https://github.com/linz/basemaps/compare/cli-raster-v8.10.0...cli-raster-v8.10.1) (2025-09-24)


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @basemaps/config bumped from ^8.10.0 to ^8.10.1
    * @basemaps/config-loader bumped from ^8.10.0 to ^8.10.1
    * @basemaps/shared bumped from ^8.9.1 to ^8.9.2

## [8.10.0](https://github.com/linz/basemaps/compare/cli-raster-v8.9.0...cli-raster-v8.10.0) (2025-09-22)


### Features

* add support for GDAL's colorinterp setting ([#3509](https://github.com/linz/basemaps/issues/3509)) ([f37be83](https://github.com/linz/basemaps/commit/f37be8328e7770fad17128f0b4e655b1127e7804))
* add ZSTD decompression and rgbi pipelines ([#3511](https://github.com/linz/basemaps/issues/3511)) ([5e27413](https://github.com/linz/basemaps/commit/5e2741373487c39d1d80418fff1f5c66a68f7006))
* **cli-raster:** Create multiple chart cogs for crossing anti meridian. BM-1336 ([#3504](https://github.com/linz/basemaps/issues/3504)) ([afe4281](https://github.com/linz/basemaps/commit/afe4281ef0e8b2c08654bdb1cfb71a362fe9d4f7))
* load gdal metadata for color interpretation ([#3510](https://github.com/linz/basemaps/issues/3510)) ([25ca54f](https://github.com/linz/basemaps/commit/25ca54fcd219c132153ef7bf3918ea634068a97a))


### Bug Fixes

* **cli-raster:** correct geotag to epsg code mappings BM-1372 ([#3513](https://github.com/linz/basemaps/issues/3513)) ([ea40863](https://github.com/linz/basemaps/commit/ea40863b01daf24c39dad6690755e5fa58c89b7f))
* **cli-raster:** Fix drop the dummy 4th band when gdalwrap charts. ([#3517](https://github.com/linz/basemaps/issues/3517)) ([4fb0110](https://github.com/linz/basemaps/commit/4fb0110c1216295df46e21edf7e43785fa7e0323))


### Dependencies

* The following workspace dependencies were updated
  * devDependencies
    * @basemaps/config bumped from ^8.9.0 to ^8.10.0
    * @basemaps/config-loader bumped from ^8.9.0 to ^8.10.0
    * @basemaps/shared bumped from ^8.9.0 to ^8.9.1

## [8.9.0](https://github.com/linz/basemaps/compare/v8.7.0...v8.9.0) (2025-09-09)


### Features

* **cli-raster:** Fetch chart imagery metadata from backup location.BM-1345 ([#3492](https://github.com/linz/basemaps/issues/3492)) ([2b42fa7](https://github.com/linz/basemaps/commit/2b42fa7a98730d8706506866f248cf2f43895e38))
* **cli-raster:** New cli to standardise charts map. BM-1338 ([#3483](https://github.com/linz/basemaps/issues/3483)) ([35b7854](https://github.com/linz/basemaps/commit/35b7854c50dffd1ee5a3cbeac2289a91cc87d1b3))
* **geo:** implement support for all raster topo map series projections BM-1160 ([#3480](https://github.com/linz/basemaps/issues/3480)) ([8652578](https://github.com/linz/basemaps/commit/8652578380c8d9fb64bce3d3724b8fb99bd1612a))
* **geo:** support tile matrixes that are not square ([#3484](https://github.com/linz/basemaps/issues/3484)) ([7720d02](https://github.com/linz/basemaps/commit/7720d02684874b17fb744b9cadff3557676f4d42))





## [8.8.0](https://github.com/linz/basemaps/compare/v8.7.0...v8.8.0) (2025-09-07)


### Features

* **cli-raster:** Fetch chart imagery metadata from backup location.BM-1345 ([#3492](https://github.com/linz/basemaps/issues/3492)) ([2b42fa7](https://github.com/linz/basemaps/commit/2b42fa7a98730d8706506866f248cf2f43895e38))
* **cli-raster:** New cli to standardise charts map. BM-1338 ([#3483](https://github.com/linz/basemaps/issues/3483)) ([35b7854](https://github.com/linz/basemaps/commit/35b7854c50dffd1ee5a3cbeac2289a91cc87d1b3))
* **geo:** implement support for all raster topo map series projections BM-1160 ([#3480](https://github.com/linz/basemaps/issues/3480)) ([8652578](https://github.com/linz/basemaps/commit/8652578380c8d9fb64bce3d3724b8fb99bd1612a))
* **geo:** support tile matrixes that are not square ([#3484](https://github.com/linz/basemaps/issues/3484)) ([7720d02](https://github.com/linz/basemaps/commit/7720d02684874b17fb744b9cadff3557676f4d42))





## [8.6.0](https://github.com/linz/basemaps/compare/v8.5.0...v8.6.0) (2025-08-06)

**Note:** Version bump only for package @basemaps/cli-raster





## [8.5.0](https://github.com/linz/basemaps/compare/v8.4.0...v8.5.0) (2025-07-15)

**Note:** Version bump only for package @basemaps/cli-raster





## [8.3.0](https://github.com/linz/basemaps/compare/v8.2.0...v8.3.0) (2025-06-17)

**Note:** Version bump only for package @basemaps/cli-raster





## [8.2.0](https://github.com/linz/basemaps/compare/v8.1.0...v8.2.0) (2025-06-12)

**Note:** Version bump only for package @basemaps/cli-raster





## [8.1.0](https://github.com/linz/basemaps/compare/v8.0.0...v8.1.0) (2025-05-18)

**Note:** Version bump only for package @basemaps/cli-raster





## [8.0.0](https://github.com/linz/basemaps/compare/v7.17.0...v8.0.0) (2025-05-11)


### Bug Fixes

* ensure all linzjs packages are correctly labeled as deps ([#3439](https://github.com/linz/basemaps/issues/3439)) ([de9df87](https://github.com/linz/basemaps/commit/de9df87031da70523b3f7683f53d113633fcd8be)), closes [#3438](https://github.com/linz/basemaps/issues/3438)


### Features

* **cli:** rename cogify package to cli-raster BM-1262 ([#3433](https://github.com/linz/basemaps/issues/3433)) ([36d4449](https://github.com/linz/basemaps/commit/36d44492fa84d6cbca8b5c735f4bc2c22773c649))





## [7.16.0](https://github.com/linz/basemaps/compare/v7.15.1...v7.16.0) (2025-04-07)

**Note:** Version bump only for package @basemaps/cogify





## [7.15.0](https://github.com/linz/basemaps/compare/v7.14.0...v7.15.0) (2025-03-17)


### Features

* **cogify:** Update cogify to support the topo raster processes. BM-1116 ([#3388](https://github.com/linz/basemaps/issues/3388)) ([4366df6](https://github.com/linz/basemaps/commit/4366df6d2149719d7f2d4002b6c6394966be2751)), closes [/github.com/linz/basemaps/issues/3365#issuecomment-2445444420](https://github.com//github.com/linz/basemaps/issues/3365/issues/issuecomment-2445444420)





## [7.14.0](https://github.com/linz/basemaps/compare/v7.13.0...v7.14.0) (2025-01-26)


### Features

* **cogify:** add background color support for overriding transparent pixels BM-1146 ([#3379](https://github.com/linz/basemaps/issues/3379)) ([b8bedc3](https://github.com/linz/basemaps/commit/b8bedc343719d445f4ca211eda03997bf51f78cb))





## [7.13.0](https://github.com/linz/basemaps/compare/v7.12.0...v7.13.0) (2025-01-06)

**Note:** Version bump only for package @basemaps/cogify





## [7.12.0](https://github.com/linz/basemaps/compare/v7.11.1...v7.12.0) (2024-11-14)

**Note:** Version bump only for package @basemaps/cogify





## [7.11.1](https://github.com/linz/basemaps/compare/v7.11.0...v7.11.1) (2024-10-01)

**Note:** Version bump only for package @basemaps/cogify





# [7.11.0](https://github.com/linz/basemaps/compare/v7.10.0...v7.11.0) (2024-09-29)

**Note:** Version bump only for package @basemaps/cogify





# [7.10.0](https://github.com/linz/basemaps/compare/v7.9.0...v7.10.0) (2024-09-16)

**Note:** Version bump only for package @basemaps/cogify





# [7.9.0](https://github.com/linz/basemaps/compare/v7.8.0...v7.9.0) (2024-08-26)

**Note:** Version bump only for package @basemaps/cogify





# [7.7.0](https://github.com/linz/basemaps/compare/v7.6.0...v7.7.0) (2024-07-28)

**Note:** Version bump only for package @basemaps/cogify





# [7.6.0](https://github.com/linz/basemaps/compare/v7.5.0...v7.6.0) (2024-07-11)


### Bug Fixes

* **cogify:** publish dist folder ([#3309](https://github.com/linz/basemaps/issues/3309)) ([6610322](https://github.com/linz/basemaps/commit/6610322a12b89c20060346b24763c62e0225e3bf))





# [7.5.0](https://github.com/linz/basemaps/compare/v7.4.0...v7.5.0) (2024-07-01)


### Bug Fixes

* **cogify:** correct loading path for "cogify" bin ([#3294](https://github.com/linz/basemaps/issues/3294)) ([cd67004](https://github.com/linz/basemaps/commit/cd67004589d4a0da85422ba7d8b765c6845ed714))


### Features

* **cogify:** error early if no source collection.json is found BM-1047 ([#3296](https://github.com/linz/basemaps/issues/3296)) ([aecb5e6](https://github.com/linz/basemaps/commit/aecb5e65e6dea474db7c5a5876364e8b034ee181))
* **cogify:** set zoom offsets for cogify to create smaller output files ([#3293](https://github.com/linz/basemaps/issues/3293)) ([259e4f4](https://github.com/linz/basemaps/commit/259e4f4aa7359f7d88977404efc4b178ee638a0a))





# [7.4.0](https://github.com/linz/basemaps/compare/v7.3.0...v7.4.0) (2024-06-13)


### Bug Fixes

* **cogify:** Fix the elevation target path to include dem/dsm. BM-1040 ([#3277](https://github.com/linz/basemaps/issues/3277)) ([2482ebb](https://github.com/linz/basemaps/commit/2482ebbbb33fe67973f9739d1ed810b173315ebb))


### Features

* **cogify:** Update the configs for lerc presets to include 1cm/2cm lerc. BM-1035 ([#3275](https://github.com/linz/basemaps/issues/3275)) ([49f9d53](https://github.com/linz/basemaps/commit/49f9d5339b2eda7ac235189df55e70ccc5cfa526))





# [7.3.0](https://github.com/linz/basemaps/compare/v7.2.0...v7.3.0) (2024-05-02)


### Features

* **cogify:** force fully qualified domain names for s3 to reduce DNS load TDE-1084 ([#3223](https://github.com/linz/basemaps/issues/3223)) ([95addbb](https://github.com/linz/basemaps/commit/95addbb8cc636fbd0be292fa7aa6f1d6e2a33b15))





# [7.2.0](https://github.com/linz/basemaps/compare/v7.1.1...v7.2.0) (2024-04-08)

**Note:** Version bump only for package @basemaps/cogify





## [7.1.1](https://github.com/linz/basemaps/compare/v7.1.0...v7.1.1) (2024-03-25)

**Note:** Version bump only for package @basemaps/cogify





# [7.1.0](https://github.com/linz/basemaps/compare/v7.0.0...v7.1.0) (2024-03-25)


### Bug Fixes

* **cli:** gzip the config before uploading to s3. ([#3079](https://github.com/linz/basemaps/issues/3079)) ([7a1c1e5](https://github.com/linz/basemaps/commit/7a1c1e5c150865ae4292379706654114da6d82b7))
* **cogify:** Fix the broken log for invalid cog with no assets defined. ([#3084](https://github.com/linz/basemaps/issues/3084)) ([53c47c2](https://github.com/linz/basemaps/commit/53c47c25b821b9ed26f912abc753fb235bd839d8))
* **cogify:** improve DEM quality when reprojecting and scaling BM-987 ([#3189](https://github.com/linz/basemaps/issues/3189)) ([fc1c609](https://github.com/linz/basemaps/commit/fc1c609dad7813ec2ba4e5b524eecb9c77f3f0b8))
* **cogify:** log key collisions ([#3190](https://github.com/linz/basemaps/issues/3190)) ([2d14bf8](https://github.com/linz/basemaps/commit/2d14bf857afb937bc5708be72f1aa4dbeacbf970))
* **cogify:** prevent empty tiffs from being stored ([#3018](https://github.com/linz/basemaps/issues/3018)) ([971600f](https://github.com/linz/basemaps/commit/971600fefc426ee599c1a31e21e7a06995a6ebf6))
* **cogify:** remove tiff caching while creating tile covering ([#3076](https://github.com/linz/basemaps/issues/3076)) ([31ac4bc](https://github.com/linz/basemaps/commit/31ac4bc4b30f6dfde745a9515d2a6ec7b7156767))


### Features

* **cogify:** add 1m preset ([#3062](https://github.com/linz/basemaps/issues/3062)) ([898ce58](https://github.com/linz/basemaps/commit/898ce58cab68ace7b3adb50fb34e82ae8a3d7df4))
* **cogify:** support config creation from tilesets with outputs ([#3186](https://github.com/linz/basemaps/issues/3186)) ([ee76662](https://github.com/linz/basemaps/commit/ee76662ad58c0eecbb9a72e10270fed56d5d8792))
* **config-loader:** cache imagery configs to speed up loading times ([#3167](https://github.com/linz/basemaps/issues/3167)) ([21b3ed7](https://github.com/linz/basemaps/commit/21b3ed7b0e8e61a222520ba0601b75314b18f178))
* **config:** use the same config loader for server and cli ([#3163](https://github.com/linz/basemaps/issues/3163)) ([72cb963](https://github.com/linz/basemaps/commit/72cb963c66ed1e392fc165946b5286d60095807b))
* upgrade to typescript 5 ([#3019](https://github.com/linz/basemaps/issues/3019)) ([53aeebb](https://github.com/linz/basemaps/commit/53aeebbf07f173ac01aab0300d6e430159817c7e))





# [7.0.0](https://github.com/linz/basemaps/compare/v6.46.0...v7.0.0) (2023-11-27)


### Features

* Add proof of concept docs site BM-917 ([#2990](https://github.com/linz/basemaps/issues/2990)) ([cabccc7](https://github.com/linz/basemaps/commit/cabccc730de0c0016e9d102dc8df6acbf1510e00))
* upgrade to gdal 3.8.0 and add max_z_overview setting ([#3014](https://github.com/linz/basemaps/issues/3014)) ([0d78a9a](https://github.com/linz/basemaps/commit/0d78a9acd8e260e3caba452e00b68a81a001a68f))





# [6.46.0](https://github.com/linz/basemaps/compare/v6.45.0...v6.46.0) (2023-10-10)

**Note:** Version bump only for package @basemaps/cogify





# [6.45.0](https://github.com/linz/basemaps/compare/v6.44.0...v6.45.0) (2023-09-18)


### Bug Fixes

* **cogify:** ignore existing overviews so they are not recompressed ([#2954](https://github.com/linz/basemaps/issues/2954)) ([131ec70](https://github.com/linz/basemaps/commit/131ec706df81a5e70bc97999fa67eb75cb657952))


### Features

* **cli:** include urlPreview for preview links ([#2938](https://github.com/linz/basemaps/issues/2938)) ([96fe7b5](https://github.com/linz/basemaps/commit/96fe7b515f52de4d8e2b78295ccd5d31d0a7f7b8))
* **cogify:** skip creating any tiles that are below 1 pixel in coverage ([#2959](https://github.com/linz/basemaps/issues/2959)) ([1f52b19](https://github.com/linz/basemaps/commit/1f52b1901a817d76c22d4ab75bede363663aa1c7))





# [6.44.0](https://github.com/linz/basemaps/compare/v6.43.0...v6.44.0) (2023-09-05)


### Bug Fixes

* **cogify:** validate that we have access to all the files before starting ([#2912](https://github.com/linz/basemaps/issues/2912)) ([2d43235](https://github.com/linz/basemaps/commit/2d43235923878664d7ebf2870e5e0054d9a506b8))
* skip creating cog when no source files BM-860 ([#2914](https://github.com/linz/basemaps/issues/2914)) ([f854789](https://github.com/linz/basemaps/commit/f8547894a1481d65ec65119990b77c94e1a2e859))
* **cogify:** correct import path ([#2907](https://github.com/linz/basemaps/issues/2907)) ([3ed4f5d](https://github.com/linz/basemaps/commit/3ed4f5dc9deb5eeb896691d88f628609163c9a0d))


### Features

* **cli:** Add imagery id in the create config done log for slack notifications. ([#2905](https://github.com/linz/basemaps/issues/2905)) ([821b628](https://github.com/linz/basemaps/commit/821b6287f307db608f013adcaba2910fcff5f431))
* **cogify:** add --concurrency to allow concurrent gdal_translates ([#2911](https://github.com/linz/basemaps/issues/2911)) ([7237c69](https://github.com/linz/basemaps/commit/7237c692ff1672a89ed6949633a89421492f1130))
* **lambda-tiler:** create preview images for og:image BM-264 ([#2921](https://github.com/linz/basemaps/issues/2921)) ([a074cc4](https://github.com/linz/basemaps/commit/a074cc45b40e35d5a593380f067f4932ef9e8da4))





# [6.43.0](https://github.com/linz/basemaps/compare/v6.42.1...v6.43.0) (2023-08-22)


### Features

* **cogify:** ensure cogify path-like args have trailing slashes. BM-858 ([#2903](https://github.com/linz/basemaps/issues/2903)) ([f6b35ed](https://github.com/linz/basemaps/commit/f6b35edc9ef3258e122c22456fce70516d4b4188))
* **cogify:** output single URL in cogify config command BM-822 ([#2899](https://github.com/linz/basemaps/issues/2899)) ([fbdbb95](https://github.com/linz/basemaps/commit/fbdbb9521ffc813fcb032345ab16f43230441b44))





## [6.42.1](https://github.com/linz/basemaps/compare/v6.42.0...v6.42.1) (2023-08-06)


### Bug Fixes

* **cogify:** lerc should be using bilinear resampling ([#2870](https://github.com/linz/basemaps/issues/2870)) ([5dfab8c](https://github.com/linz/basemaps/commit/5dfab8c4ae6928cdaf4932136d125b1c22867564))





# [6.42.0](https://github.com/linz/basemaps/compare/v6.41.0...v6.42.0) (2023-08-06)

**Note:** Version bump only for package @basemaps/cogify





# [6.41.0](https://github.com/linz/basemaps/compare/v6.40.0...v6.41.0) (2023-07-26)


### Bug Fixes

* **cogify:** cogify create should create from stac item json ([#2785](https://github.com/linz/basemaps/issues/2785)) ([637df77](https://github.com/linz/basemaps/commit/637df7736e78d38e19b62dfe29f7e4ad09e4205a))
* **cogify:** correct ordering of lat lon ([#2846](https://github.com/linz/basemaps/issues/2846)) ([b6afd57](https://github.com/linz/basemaps/commit/b6afd57cb63ca0ca7827674fe0c98504a90394b4)), closes [/github.com/linz/basemaps/blob/master/packages/landing/src/url.ts#L53](https://github.com//github.com/linz/basemaps/blob/master/packages/landing/src/url.ts/issues/L53)
* **cogify:** include collection and parent links in item.json ([#2778](https://github.com/linz/basemaps/issues/2778)) ([e79e440](https://github.com/linz/basemaps/commit/e79e44011f3fc9179b5d00f4302eca6761342f50))
* **cogify:** support blocksize being customized ([#2842](https://github.com/linz/basemaps/issues/2842)) ([9b859c8](https://github.com/linz/basemaps/commit/9b859c862b516dd0d58bb80db0ff2c04966b4957))
* **cogify:** use a URL in the cogify STAC documents ([#2843](https://github.com/linz/basemaps/issues/2843)) ([eb3f0fe](https://github.com/linz/basemaps/commit/eb3f0fe41b5a02ea71c2ea63e1a0057cc6d502d2))
* **cogify:** use datetime to be consistent with STAC ([#2832](https://github.com/linz/basemaps/issues/2832)) ([87a7e37](https://github.com/linz/basemaps/commit/87a7e3745b3a478b211a891f457a19a149a9066d))
* **config:** allow initializing config from URLs ([#2830](https://github.com/linz/basemaps/issues/2830)) ([0ea552e](https://github.com/linz/basemaps/commit/0ea552ec32ad723f98c96d533f18a8afc51d9657))


### Features

* add --from-file option to cogify create command ([#2851](https://github.com/linz/basemaps/issues/2851)) ([3fab3c7](https://github.com/linz/basemaps/commit/3fab3c7b703358b893f76f7058374c32d37bdd2a))
* **cogify:** add --preset lerc_0.01 to create a 1cm error lerc cog ([#2841](https://github.com/linz/basemaps/issues/2841)) ([c7e3605](https://github.com/linz/basemaps/commit/c7e3605ab01c19c2ec576a7347965d0af0bc8f8a))
* **cogify:** improve cogify ([#2800](https://github.com/linz/basemaps/issues/2800)) ([cb16a44](https://github.com/linz/basemaps/commit/cb16a44aa44aa10ed69d1ab188a0539756f9ee72))
* **cogify:** retile imagery into COGS aligned to a tile matrix ([#2759](https://github.com/linz/basemaps/issues/2759)) ([ddd99d3](https://github.com/linz/basemaps/commit/ddd99d3548c65ec4ce5b7c608d6bf9360f053635))
