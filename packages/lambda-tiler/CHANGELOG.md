# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [8.3.0](https://github.com/linz/basemaps/compare/v8.2.0...v8.3.0) (2025-06-17)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [8.2.0](https://github.com/linz/basemaps/compare/v8.1.0...v8.2.0) (2025-06-12)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [8.1.0](https://github.com/linz/basemaps/compare/v8.0.0...v8.1.0) (2025-05-18)


### Features

* **lambda-tiler:** expose configuration id and hash if present ([#3446](https://github.com/linz/basemaps/issues/3446)) ([43803b4](https://github.com/linz/basemaps/commit/43803b48a404591417453331ac9e3aa16c85248f))





# [8.0.0](https://github.com/linz/basemaps/compare/v7.17.0...v8.0.0) (2025-05-11)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [7.16.0](https://github.com/linz/basemaps/compare/v7.15.1...v7.16.0) (2025-04-07)


### Bug Fixes

* **lambda-tiler:** automatically choose pipelines ([#3416](https://github.com/linz/basemaps/issues/3416)) ([c206a8e](https://github.com/linz/basemaps/commit/c206a8e0a579bd542afa43f6a3186c88bf6a451c))


### Features

* **lambda-tiler:** load config from s3 ([#3415](https://github.com/linz/basemaps/issues/3415)) ([e6b89c3](https://github.com/linz/basemaps/commit/e6b89c3c941c15b8fe2adcb0189a9fed46cbe024))





# [7.15.0](https://github.com/linz/basemaps/compare/v7.14.0...v7.15.0) (2025-03-17)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [7.14.0](https://github.com/linz/basemaps/compare/v7.13.0...v7.14.0) (2025-01-26)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [7.13.0](https://github.com/linz/basemaps/compare/v7.12.0...v7.13.0) (2025-01-06)


### Bug Fixes

* **lambda-tiler:** NZTM terrain been multiplied twice. BM-1122 ([#3373](https://github.com/linz/basemaps/issues/3373)) ([5d2d9c6](https://github.com/linz/basemaps/commit/5d2d9c6069ce31bd22539fa41e9b41cc2aa53947))





# [7.12.0](https://github.com/linz/basemaps/compare/v7.11.1...v7.12.0) (2024-11-14)


### Bug Fixes

* **lambda-tiler:** correctly log fetch requests ([#3359](https://github.com/linz/basemaps/issues/3359)) ([9fa3681](https://github.com/linz/basemaps/commit/9fa3681acc2ce25037c5d6e0326255aad9815b7d))


### Features

* **lambda-tiler:** update imagery layer attributions to show licensor details BM-897 ([#3357](https://github.com/linz/basemaps/issues/3357)) ([e702c7e](https://github.com/linz/basemaps/commit/e702c7e53d28aaa8db9d624acab048f8ec3a2309))
* **server:** add redirect route to pre-zoomed tileset BM-1076 ([#3354](https://github.com/linz/basemaps/issues/3354)) ([5b207de](https://github.com/linz/basemaps/commit/5b207de92b76e0d445a41ef8e1e9b9b91e5363c6))





# [7.11.0](https://github.com/linz/basemaps/compare/v7.10.0...v7.11.0) (2024-09-29)


### Features

* **landing:** store the maps bounds to provide a better bounding box intersection ([#3346](https://github.com/linz/basemaps/issues/3346)) ([a420f57](https://github.com/linz/basemaps/commit/a420f57b2d21354c3fbf1a1be2e01a66d5c38d76))





# [7.10.0](https://github.com/linz/basemaps/compare/v7.9.0...v7.10.0) (2024-09-16)


### Features

* **lambda-tiler:** Add vector test tiles for the health endpoint. BM-1061 ([#3337](https://github.com/linz/basemaps/issues/3337)) ([74119c0](https://github.com/linz/basemaps/commit/74119c044f94d3e53f2c4717781266b1aba23bad))
* **lambda-tiler:** automatically rescale style JSON's into NZTM2000Quad when requests ([#3339](https://github.com/linz/basemaps/issues/3339)) ([960b926](https://github.com/linz/basemaps/commit/960b92652da686c18712fa566e63c7eb6453a2f7))
* **lambda-tiler:** remove restrictions on 3857 from vector tiles ([#3338](https://github.com/linz/basemaps/issues/3338)) ([8eede97](https://github.com/linz/basemaps/commit/8eede97676c8a905468b4a133b98c44e10873d3b))





# [7.9.0](https://github.com/linz/basemaps/compare/v7.8.0...v7.9.0) (2024-08-26)


### Bug Fixes

* **lambda-tiler:** do not join layers where ids would be duplicated ([#3334](https://github.com/linz/basemaps/issues/3334)) ([c2d51f2](https://github.com/linz/basemaps/commit/c2d51f270eae7d87d9656fa7cb47b6b96c31b3e4))
* **lambda-tiler:** do not keep failed tiffs in memory ([#3331](https://github.com/linz/basemaps/issues/3331)) ([89e72ea](https://github.com/linz/basemaps/commit/89e72ead8553481f8d11936d56ec0b20b24ceb61))
* **lambda-tiler:** prevent unhandled promise rejections when the rejection is handled BM-1067 ([#3329](https://github.com/linz/basemaps/issues/3329)) ([445da7f](https://github.com/linz/basemaps/commit/445da7fcd6829cde9f18e1130a31a97a32097466))


### Features

* **landing:** show labels on landing page ([#3330](https://github.com/linz/basemaps/issues/3330)) ([b9fe33f](https://github.com/linz/basemaps/commit/b9fe33f05168f0ca6945bf5a3773ab5efe162fdd))
* **landing:** track label button clicks BM-1066 ([#3335](https://github.com/linz/basemaps/issues/3335)) ([555f8b5](https://github.com/linz/basemaps/commit/555f8b59f9b55dc80b8063629e33e1eea4a93937))





# [7.7.0](https://github.com/linz/basemaps/compare/v7.6.0...v7.7.0) (2024-07-28)


### Bug Fixes

* **lambda-tiler:** prefer geojson files to be downloaded  BM-1048 ([#3316](https://github.com/linz/basemaps/issues/3316)) ([8391416](https://github.com/linz/basemaps/commit/8391416d89ab597c8fc16a7f4ee304b45ea3f619))
* **landing:** Support Terrain for NZTM and add default LINZ-Terrain into debug ([#3307](https://github.com/linz/basemaps/issues/3307)) ([15a1aba](https://github.com/linz/basemaps/commit/15a1abaaa6255fd8edbc4e1ddfcdb22571ce6dc5))





# [7.6.0](https://github.com/linz/basemaps/compare/v7.5.0...v7.6.0) (2024-07-11)


### Bug Fixes

* compiler issue with typescript v5.5.x ([#3310](https://github.com/linz/basemaps/issues/3310)) ([2734115](https://github.com/linz/basemaps/commit/2734115cae3377348484f15c27fd4efdb079dcc5))


### Features

* **config:** Update the config to support sky in the style json. BM-1052 ([#3314](https://github.com/linz/basemaps/issues/3314)) ([60db515](https://github.com/linz/basemaps/commit/60db515cab6619302c1bda25023007d433f1a408))





# [7.5.0](https://github.com/linz/basemaps/compare/v7.4.0...v7.5.0) (2024-07-01)


### Bug Fixes

* **lambda-tiler:** Fix the missing LINZ-terrain source for the elevation layer. ([#3302](https://github.com/linz/basemaps/issues/3302)) ([ef8b0f3](https://github.com/linz/basemaps/commit/ef8b0f3d40d90594864834c0a7beb40f6a9ef2b6))
* **lambda-tiler:** tile matrix not supported is a 400 not 500 ([#3285](https://github.com/linz/basemaps/issues/3285)) ([310290c](https://github.com/linz/basemaps/commit/310290c27ced47d69ada72ff9b966d6cf62e6886))
* **lambda-tiler:** wmts should support tile pipelines ([#3305](https://github.com/linz/basemaps/issues/3305)) ([3ff3f7f](https://github.com/linz/basemaps/commit/3ff3f7f1115d14bb97109b1ed92df586d403dd96))


### Features

* **lambda-tile:** Enable elevation source in the individual raster style json. ([#3286](https://github.com/linz/basemaps/issues/3286)) ([a0b6c0c](https://github.com/linz/basemaps/commit/a0b6c0c230819b2ee665845338ef0147bb6a67c3))
* **lambda-tiler:** Ensure terrain source for all style json configs. ([#3299](https://github.com/linz/basemaps/issues/3299)) ([13aedf8](https://github.com/linz/basemaps/commit/13aedf8944adda80d985a7e642c4408788369497))
* **landing:** Add terrain parameter in the url ([#3292](https://github.com/linz/basemaps/issues/3292)) ([781bbe8](https://github.com/linz/basemaps/commit/781bbe8c009c287f4eff64f81e673a52931b6011))





# [7.4.0](https://github.com/linz/basemaps/compare/v7.3.0...v7.4.0) (2024-06-13)


### Bug Fixes

* **lambda-tiler:** Remove the stylejson metadata, sprite, glphys if no required. ([#3280](https://github.com/linz/basemaps/issues/3280)) ([edaf034](https://github.com/linz/basemaps/commit/edaf03413eafabd7330bccd228956d678a5de95f))


### Features

* **lambda-tiler:** Update the tileMatrix from stylejson source if exists. ([#3279](https://github.com/linz/basemaps/issues/3279)) ([07ee06c](https://github.com/linz/basemaps/commit/07ee06c9fdc8ab8ced4e8b327767cd2a77cfee63))





# [7.3.0](https://github.com/linz/basemaps/compare/v7.2.0...v7.3.0) (2024-05-02)


### Bug Fixes

* **lambda-tiler:** ensure wmts limits extent to the bounding box of the tile matrix extent BM-1012 ([#3235](https://github.com/linz/basemaps/issues/3235)) ([b8d56cd](https://github.com/linz/basemaps/commit/b8d56cdbbf2cb08f1ef96bc6de82ce94563da945))





# [7.2.0](https://github.com/linz/basemaps/compare/v7.1.1...v7.2.0) (2024-04-08)


### Bug Fixes

* **lambda-tiler:** content type for jpg should be image/jpeg ([#3208](https://github.com/linz/basemaps/issues/3208)) ([26efdd5](https://github.com/linz/basemaps/commit/26efdd5732033235742a3148c63e4beff0a51cc8))
* **lambda-tiler:** do not error when no layers are found ([#3209](https://github.com/linz/basemaps/issues/3209)) ([2e58255](https://github.com/linz/basemaps/commit/2e58255df9b22d525ee539aa8754fdb755ddc8c9))





## [7.1.1](https://github.com/linz/basemaps/compare/v7.1.0...v7.1.1) (2024-03-25)


### Bug Fixes

* **lambda-tiler:** allow .jpg for jpeg images ([#3206](https://github.com/linz/basemaps/issues/3206)) ([a23a63a](https://github.com/linz/basemaps/commit/a23a63a417a39e6c873c8d4d9c6206d9c845e57b))





# [7.1.0](https://github.com/linz/basemaps/compare/v7.0.0...v7.1.0) (2024-03-25)


### Bug Fixes

* **cli:** Update the chunkd verison for the fix, and allow trailing slash uri ([#3140](https://github.com/linz/basemaps/issues/3140)) ([a0b3d9e](https://github.com/linz/basemaps/commit/a0b3d9e5cb464c4d2bfcada1d0a27c06c2809893))
* **lambda-tiler:** fixup up bundling of arm libvips ([#3043](https://github.com/linz/basemaps/issues/3043)) ([3214192](https://github.com/linz/basemaps/commit/3214192020a3a956468e51120721679ec2b313bc))
* **lambda-tiler:** lerc needs to be external to allow wasm import ([#3153](https://github.com/linz/basemaps/issues/3153)) ([d27b61d](https://github.com/linz/basemaps/commit/d27b61d9ec00636011f9a6ea73b424a397a315df))
* **lambda-tiler:** only use a compose pipeline if a pipeline is defined ([#3200](https://github.com/linz/basemaps/issues/3200)) ([dfd10d3](https://github.com/linz/basemaps/commit/dfd10d3a3c3ec008c2538794e45876116bd84359))
* some tests commented out ([#3066](https://github.com/linz/basemaps/issues/3066)) ([9896308](https://github.com/linz/basemaps/commit/98963088aff978639c7721e493c63b5582f3686e))


### Features

* allow configuration of output tile types base of tileset configuration BM-932 ([#3103](https://github.com/linz/basemaps/issues/3103)) ([808e554](https://github.com/linz/basemaps/commit/808e554a43c2a82ba6d5544a88fc6f84f3eac020))
* **config:** load DEMs and create default output piplines ([#3166](https://github.com/linz/basemaps/issues/3166)) ([fa08983](https://github.com/linz/basemaps/commit/fa08983049c999c7010313d6fb37f057025f31b8))
* **lambda-tiler:** randomly sample requests with trace logging ([#3170](https://github.com/linz/basemaps/issues/3170)) ([ced60bc](https://github.com/linz/basemaps/commit/ced60bc694d703da516e524c843b07b01922eb2b))
* **lambda-tiler:** show the first pipeline as the preview instead of a broken image ([#3187](https://github.com/linz/basemaps/issues/3187)) ([3101ace](https://github.com/linz/basemaps/commit/3101aceed618d2f7ef48f3dadd226a58bcadf9d5))
* **landing:** Add Config Debug for screenshot elevation data. ([#3174](https://github.com/linz/basemaps/issues/3174)) ([0ee360d](https://github.com/linz/basemaps/commit/0ee360de5181d60c9358e9a739f20503ed7c0ebd))
* **landing:** Enable elevation preview in the basemaps debug page ([#3161](https://github.com/linz/basemaps/issues/3161)) ([b902599](https://github.com/linz/basemaps/commit/b902599e0a574b71eb698287aeefc2cd5dd853d4))
* move to query parameters for pipeline selection ([#3136](https://github.com/linz/basemaps/issues/3136)) ([32c501c](https://github.com/linz/basemaps/commit/32c501c76301c69639eb412fac80f488f65ad3fb))
* **tiler-sharp:** allow outputs to customise how output is compressed ([#3126](https://github.com/linz/basemaps/issues/3126)) ([f13b8fb](https://github.com/linz/basemaps/commit/f13b8fb2aae7ad224c3fde6cfb4cd8f70d4f1f9e))
* **tiler-sharp:** directly resize/resample DEM inputs rather than RGBA outputs ([#3173](https://github.com/linz/basemaps/issues/3173)) ([b901f83](https://github.com/linz/basemaps/commit/b901f837757d59ddc8e1b8eb3beb87fa96dbc053))
* upgrade to typescript 5 ([#3019](https://github.com/linz/basemaps/issues/3019)) ([53aeebb](https://github.com/linz/basemaps/commit/53aeebbf07f173ac01aab0300d6e430159817c7e))





# [7.0.0](https://github.com/linz/basemaps/compare/v6.46.0...v7.0.0) (2023-11-27)


### Features

* Add proof of concept docs site BM-917 ([#2990](https://github.com/linz/basemaps/issues/2990)) ([cabccc7](https://github.com/linz/basemaps/commit/cabccc730de0c0016e9d102dc8df6acbf1510e00))
* allow reads from linz "-scratch" buckets TDE-906 ([#2982](https://github.com/linz/basemaps/issues/2982)) ([615334f](https://github.com/linz/basemaps/commit/615334f0f26bcda4f7155e4b3b83bc39f39701af))
* **doc:** Improve the individual package documentations. BM-776 ([#2981](https://github.com/linz/basemaps/issues/2981)) ([5a4adcb](https://github.com/linz/basemaps/commit/5a4adcbbff15857a6f4c315d54280d542f785fec))





# [6.46.0](https://github.com/linz/basemaps/compare/v6.45.0...v6.46.0) (2023-10-10)


### Bug Fixes

* **lambda-tiler:** Catch the error code while reading the config file in api. BM-898 ([#2969](https://github.com/linz/basemaps/issues/2969)) ([c2f3132](https://github.com/linz/basemaps/commit/c2f313221cdd20954b0002721d4605659a2b4e12))





# [6.45.0](https://github.com/linz/basemaps/compare/v6.44.0...v6.45.0) (2023-09-18)


### Bug Fixes

* **lambda-tiler:** generate previews from config urls too ([#2937](https://github.com/linz/basemaps/issues/2937)) ([ebe499f](https://github.com/linz/basemaps/commit/ebe499fc81ab31a0f1f45ac0ee7262a9b66431e9))





# [6.44.0](https://github.com/linz/basemaps/compare/v6.43.0...v6.44.0) (2023-09-05)


### Features

* **lambda-tiler:** use the same checker background that the landing does for previews BM-264 ([#2929](https://github.com/linz/basemaps/issues/2929)) ([9318588](https://github.com/linz/basemaps/commit/9318588bd929b6f41d10217138726331fa8115b2))
* add og:image preview to all basemaps links BM-264 ([#2925](https://github.com/linz/basemaps/issues/2925)) ([de00528](https://github.com/linz/basemaps/commit/de005285eac0c2f5e2c83c8eeaa61aafeff8edde))
* **lambda-tiler:** create preview images for og:image BM-264 ([#2921](https://github.com/linz/basemaps/issues/2921)) ([a074cc4](https://github.com/linz/basemaps/commit/a074cc45b40e35d5a593380f067f4932ef9e8da4))
* **lambda-tiler:** try arm based lambdas ([#2910](https://github.com/linz/basemaps/issues/2910)) ([e5bd68d](https://github.com/linz/basemaps/commit/e5bd68df37f487c4cc543c69fbedc66f13c5fdc0))





# [6.43.0](https://github.com/linz/basemaps/compare/v6.42.1...v6.43.0) (2023-08-22)


### Bug Fixes

* **tiler:** allow modification of the rounding bias to help reduce aspect ratio skews ([#2877](https://github.com/linz/basemaps/issues/2877)) ([ec899a7](https://github.com/linz/basemaps/commit/ec899a73e5802dd502dc0b6c4f8956b6156ca860))


### Features

* **cli:** Create standalone imagery config and remove disabled layer. BM-810 ([#2810](https://github.com/linz/basemaps/issues/2810)) ([e956851](https://github.com/linz/basemaps/commit/e956851983ad5f90d24cbb7c50f75824869e0e08))
* add github build id to cli, landing and tiler ([#2874](https://github.com/linz/basemaps/issues/2874)) ([eb8c7b9](https://github.com/linz/basemaps/commit/eb8c7b97822cda117c38d0341a5d6e3506c63c57))





# [6.41.0](https://github.com/linz/basemaps/compare/v6.40.0...v6.41.0) (2023-07-26)


### Bug Fixes

* **config:** allow initializing config from URLs ([#2830](https://github.com/linz/basemaps/issues/2830)) ([0ea552e](https://github.com/linz/basemaps/commit/0ea552ec32ad723f98c96d533f18a8afc51d9657))
* truncate the api key when logging ([#2828](https://github.com/linz/basemaps/issues/2828)) ([3396593](https://github.com/linz/basemaps/commit/33965937fdc6cce4bc50b5ed41616a65c830ec6f))


### Features

* **lambda-tiler:** return 204 no content instead of a empty images ([#2829](https://github.com/linz/basemaps/issues/2829)) ([db3ff1b](https://github.com/linz/basemaps/commit/db3ff1b09f849a26d7287925c7b57d71e1fa6d76))
* upgrade lambdas to nodejs 18 ([#2639](https://github.com/linz/basemaps/issues/2639)) ([17471e1](https://github.com/linz/basemaps/commit/17471e1d56fbe17b695e4a49b1fbe55ece215596))
* **cogify:** retile imagery into COGS aligned to a tile matrix ([#2759](https://github.com/linz/basemaps/issues/2759)) ([ddd99d3](https://github.com/linz/basemaps/commit/ddd99d3548c65ec4ce5b7c608d6bf9360f053635))
* **lambda-tiler:** Include the disabled layers in the attribution with minZoom of 32. ([#2746](https://github.com/linz/basemaps/issues/2746)) ([d87e8dd](https://github.com/linz/basemaps/commit/d87e8dd1a0c24d511fc786078111fadc752bc4ab))
* **lambda-tiler:** Refactoring the wmts Capablity to builder interface. ([#2686](https://github.com/linz/basemaps/issues/2686)) ([4d223b6](https://github.com/linz/basemaps/commit/4d223b6b02675a271d1393ff4c6d0e7f8348084b))
* **landing:** Update the daterange slider to years button. ([#2764](https://github.com/linz/basemaps/issues/2764)) ([ef93543](https://github.com/linz/basemaps/commit/ef935433df6065f4baeb458b3c8a9efec06621fa))


### Reverts

* Revert "feat(lambda-tiler): return 204 no content instead of a empty images (#2829)" (#2836) ([f1ed481](https://github.com/linz/basemaps/commit/f1ed481db08702189f169e745bf0ff7dad697175)), closes [#2829](https://github.com/linz/basemaps/issues/2829) [#2836](https://github.com/linz/basemaps/issues/2836)





# [6.40.0](https://github.com/linz/basemaps/compare/v6.39.0...v6.40.0) (2023-03-16)


### Bug Fixes

* **lambda-tiler:** do not crash server when assets are not found ([#2674](https://github.com/linz/basemaps/issues/2674)) ([77b75da](https://github.com/linz/basemaps/commit/77b75da7541a5ae3e521551d3b8530e2c06518d3))
* **server:** gsd does not actually need to match ([#2694](https://github.com/linz/basemaps/issues/2694)) ([3737628](https://github.com/linz/basemaps/commit/373762875c2615515ce0853ba9dadcd04a2d988f))
* **server:** make --no-config actually load the configuration from tiffs ([#2682](https://github.com/linz/basemaps/issues/2682)) ([019ee50](https://github.com/linz/basemaps/commit/019ee50ee22cda2ce143f9a012d4aaa9ffc0edc9))


### Features

* **config:** Make the config title as not null. ([#2667](https://github.com/linz/basemaps/issues/2667)) ([5e54854](https://github.com/linz/basemaps/commit/5e54854c10327385037122f7b7aada6adf312fae))
* **lambda-tiler:** Move the union out of the calculation loop to improve the atrribution api performance ([#2732](https://github.com/linz/basemaps/issues/2732)) ([dbedf1b](https://github.com/linz/basemaps/commit/dbedf1b1794cc7b7b46f4c114a40f4a73289918a))
* **lambda-tiler:** simple cli to trace the rendering of a tile ([#2678](https://github.com/linz/basemaps/issues/2678)) ([4a28aff](https://github.com/linz/basemaps/commit/4a28affa3737cd492143e485374fa4db6035da64))
* **lambda-tiler:** trace if a filter has been applied to the layers ([#2664](https://github.com/linz/basemaps/issues/2664)) ([b4455e9](https://github.com/linz/basemaps/commit/b4455e9682a4dedcaaefde8e90cb72b6de29b8f6))
* **lambda-tiler:** Update the wmts resource url to include the daterange. ([#2669](https://github.com/linz/basemaps/issues/2669)) ([2068610](https://github.com/linz/basemaps/commit/2068610631f7245e4fa063c3d2a8c12c7f011c0d))
* **server:** change CLI interface to support multiple tiff folders ([#2688](https://github.com/linz/basemaps/issues/2688)) ([7fcd310](https://github.com/linz/basemaps/commit/7fcd310425aaf02bbadab2bb3b89cce5b7462c8f))
* filter layers by date ([#2662](https://github.com/linz/basemaps/issues/2662)) ([745b6b6](https://github.com/linz/basemaps/commit/745b6b6e0ae40c5094647cf602ddf2bdd29a7d5f))





# [6.39.0](https://github.com/linz/basemaps/compare/v6.38.0...v6.39.0) (2023-01-25)


### Bug Fixes

* **lambda-tiler:** only use a overview if one if the source tiffs are present in the bounding box ([#2651](https://github.com/linz/basemaps/issues/2651)) ([bcfdbd1](https://github.com/linz/basemaps/commit/bcfdbd13b8257a26ef605ec636ee14f8e9d46461))


### Features

* **tiler:** Exclude layers from style json. BM-730 ([#2629](https://github.com/linz/basemaps/issues/2629)) ([4683358](https://github.com/linz/basemaps/commit/468335895dc5b5536d780fdf1257df2408ef00ee)), closes [#2630](https://github.com/linz/basemaps/issues/2630)
* **tiler:** Support fonts array to fallback to next font if not fond. ([#2633](https://github.com/linz/basemaps/issues/2633)) ([5d8e0be](https://github.com/linz/basemaps/commit/5d8e0bea0ab0c29c2aa5264c9011a7eb6f51a946))


### Reverts

* Revert "feat(tiler): Support fonts array to fallback to next font if not fond. (#2633) (#2642) ([a678c36](https://github.com/linz/basemaps/commit/a678c36cf9fca326f5ee9e3e713e259f6c53002e)), closes [#2633](https://github.com/linz/basemaps/issues/2633) [#2642](https://github.com/linz/basemaps/issues/2642)





# [6.38.0](https://github.com/linz/basemaps/compare/v6.37.0...v6.38.0) (2022-12-11)


### Features

* **config:** load the min/max zoom levels of a cotar overview from the wmtscapabilties ([#2621](https://github.com/linz/basemaps/issues/2621)) ([3fe70cf](https://github.com/linz/basemaps/commit/3fe70cf4f934a84e303a935bd3f7f8f6fcc41652))





# [6.37.0](https://github.com/linz/basemaps/compare/v6.36.0...v6.37.0) (2022-12-05)


### Bug Fixes

* **cli:** Fix the output for the overview cli as fsa.stream corrupt the file write to aws. ([#2585](https://github.com/linz/basemaps/issues/2585)) ([5875514](https://github.com/linz/basemaps/commit/5875514baeb5bbf3905460aad0dcef9ba0887322))


### Features

* add overview archive to imagery config ([#2545](https://github.com/linz/basemaps/issues/2545)) ([ac463ef](https://github.com/linz/basemaps/commit/ac463efdaf8b6773c21b011a70327b606e4fafcb))
* **cli:** create WMTSCapabilties.xml for the overviews cotar ([#2590](https://github.com/linz/basemaps/issues/2590)) ([51421f6](https://github.com/linz/basemaps/commit/51421f60cc9e5b74581434617fca93d03f3fd993))
* **lambda-tiler:** Allow to load config json from linz-basemaps-staging bucket. ([#2605](https://github.com/linz/basemaps/issues/2605)) ([5cf8133](https://github.com/linz/basemaps/commit/5cf8133e75467e25e2cd7396ec1e56a575bc9113))





# [6.36.0](https://github.com/linz/basemaps/compare/v6.35.0...v6.36.0) (2022-10-18)


### Bug Fixes

* Remove AssetLocation and using cb_lastest to get default assets. BM-693 ([#2527](https://github.com/linz/basemaps/issues/2527)) ([fce8607](https://github.com/linz/basemaps/commit/fce860786fb838a6fcbe65f35ca9ec6f12eeaf97))
* **lambda-tiler:** Fix the font.json api which should get from assests/fonts/fonts.json ([#2526](https://github.com/linz/basemaps/issues/2526)) ([174d95f](https://github.com/linz/basemaps/commit/174d95fff3fb76d14f17c174bfbc52ee199ba7c3))





# [6.35.0](https://github.com/linz/basemaps/compare/v6.34.0...v6.35.0) (2022-09-14)


### Bug Fixes

* **infra:** give lambda-tiler access to config bucket ([#2457](https://github.com/linz/basemaps/issues/2457)) ([788c995](https://github.com/linz/basemaps/commit/788c995256642f89458e2b72c2bddec8ab8fb1b7))
* **lambda-tiler:** allow reading config from memory ([#2443](https://github.com/linz/basemaps/issues/2443)) ([9f98719](https://github.com/linz/basemaps/commit/9f987192f67c04a6bb1e97ab30680ef48a71db0e))
* **lambda-tiler:** assume current year when imagery has no date ([#2462](https://github.com/linz/basemaps/issues/2462)) ([289df66](https://github.com/linz/basemaps/commit/289df66ff78dc07361af56c1bafc663ea1beaf36))
* **lambda-tiler:** ensure wmts and style propagate config location ([#2445](https://github.com/linz/basemaps/issues/2445)) ([d93a34b](https://github.com/linz/basemaps/commit/d93a34b50bce9b49a30baa1fbfd7142332738d23))
* **lambda-tiler:** send 408 timeout response rather than timing out. ([#2460](https://github.com/linz/basemaps/issues/2460)) ([8d31469](https://github.com/linz/basemaps/commit/8d31469829a65739ccbe525031897259d9ae2ae4))
* **landing:** ensure tileMatrix is being passed correctly ([#2454](https://github.com/linz/basemaps/issues/2454)) ([3b66dee](https://github.com/linz/basemaps/commit/3b66dee9700074d578328d434cae9c6f6c20dfff))
* **landing:** force config to always be in base58 ([#2463](https://github.com/linz/basemaps/issues/2463)) ([a2447e9](https://github.com/linz/basemaps/commit/a2447e9228c1fdc2f28af70699261f200a201226))
* **shared:** ensure & is escaped in xml ([#2456](https://github.com/linz/basemaps/issues/2456)) ([665e433](https://github.com/linz/basemaps/commit/665e4335cbf52aeb2292295aba40fa40abf4c1b0))


### Features

* switch to aws role provider from chunkd ([#2473](https://github.com/linz/basemaps/issues/2473)) ([87be0e0](https://github.com/linz/basemaps/commit/87be0e08610f02003cb4ec3f6ced9b2051ee1617))
* **lambda-tiler:** Add tests for the config loader. ([#2446](https://github.com/linz/basemaps/issues/2446)) ([73c5a95](https://github.com/linz/basemaps/commit/73c5a9568b0fc9fc061c0752f9bb2474fb6ef347))
* **lambda-tiler:** Set Default asset location when config.asset is null ([#2450](https://github.com/linz/basemaps/issues/2450)) ([a244879](https://github.com/linz/basemaps/commit/a244879d7249da806bf35b4ad0f325066276e96c))
* **landing:** Load config into debug pages. ([#2486](https://github.com/linz/basemaps/issues/2486)) ([bf6b601](https://github.com/linz/basemaps/commit/bf6b601e46ee4693122dfa23ac18566ebc084aa4))
* allow loading config from ?config ([#2442](https://github.com/linz/basemaps/issues/2442)) ([8f946d8](https://github.com/linz/basemaps/commit/8f946d8ffb155304b80c26aca0faf4c64136390f))
* support styles from raster tile sets ([#2444](https://github.com/linz/basemaps/issues/2444)) ([bcd521f](https://github.com/linz/basemaps/commit/bcd521f3d240f07a41a4b09a2874d49283bcd3de))





# [6.34.0](https://github.com/linz/basemaps/compare/v6.33.0...v6.34.0) (2022-08-17)


### Bug Fixes

* **lambda-tiler:** the min tile matrix zoom number ([#2404](https://github.com/linz/basemaps/issues/2404)) ([58b7d08](https://github.com/linz/basemaps/commit/58b7d087b38b86d126b3bea8c55187415cc7501a))


### Features

* **lambda-tiler:** Assets provider to get assets from any location. ([#2374](https://github.com/linz/basemaps/issues/2374)) ([c145f28](https://github.com/linz/basemaps/commit/c145f283bf5875d5e7b15909cc37811b029303f4))
* **lambda-tiler:** Provide get info api and post tileserver api for arcgis BM-78 ([#2407](https://github.com/linz/basemaps/issues/2407)) ([d9b091b](https://github.com/linz/basemaps/commit/d9b091bf4e6fd2b91804a7b9bbcd388dd8b75ee8))
* **lambda-tiler:** Provide support for Arcgis online vector map. BM-78 ([#2403](https://github.com/linz/basemaps/issues/2403)) ([900a84e](https://github.com/linz/basemaps/commit/900a84e2b0275ae84fe327e9a91493f0aaa5c2e7))
* **lambda-tiler:** Some unit test for the arcgis api. BM-78 ([#2412](https://github.com/linz/basemaps/issues/2412)) ([67aff51](https://github.com/linz/basemaps/commit/67aff5179f8a64d7ca3fb52fed1e5cac93ba3736))





# [6.33.0](https://github.com/linz/basemaps/compare/v6.32.2...v6.33.0) (2022-08-01)


### Bug Fixes

* **lambda-analytics:** do not track invalid api keys BM-642 ([#2392](https://github.com/linz/basemaps/issues/2392)) ([9f84285](https://github.com/linz/basemaps/commit/9f84285ed203bf3443f288b20482cb18d6b13c40))
* **lambda-tiler:** lower cache amount to two 700MB caches ([#2394](https://github.com/linz/basemaps/issues/2394)) ([02bcc42](https://github.com/linz/basemaps/commit/02bcc4240b4301b82699423537ac684d28ba6420))
* **lambda-tiler:** Return 204 non content for empty 404 vector tile. ([#2391](https://github.com/linz/basemaps/issues/2391)) ([0d4373e](https://github.com/linz/basemaps/commit/0d4373e3a7f3c0f0880da52024e932f0dbcc0396))


### Features

* **lambda-tiler:** count number of requests served ([#2387](https://github.com/linz/basemaps/issues/2387)) ([e94b613](https://github.com/linz/basemaps/commit/e94b613c1be0e3782ae2c3395b7eeadb14030145))





## [6.32.2](https://github.com/linz/basemaps/compare/v6.32.1...v6.32.2) (2022-07-28)


### Bug Fixes

* **lambda-tiler:** always include access-control-allow-origin ([#2385](https://github.com/linz/basemaps/issues/2385)) ([1edc2b6](https://github.com/linz/basemaps/commit/1edc2b6ccef295ad9c1b6ed32045f6d19827ba06))
* **lambda-tiler:** increase source cache to approx 1GB ([#2384](https://github.com/linz/basemaps/issues/2384)) ([83236fb](https://github.com/linz/basemaps/commit/83236fb4115f5190cbec1258f845449aa4406a03))





## [6.32.1](https://github.com/linz/basemaps/compare/v6.32.0...v6.32.1) (2022-07-28)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.32.0](https://github.com/linz/basemaps/compare/v6.31.0...v6.32.0) (2022-07-28)


### Bug Fixes

* **lambda-tiler:** CORS is handled by the function url. ([#2376](https://github.com/linz/basemaps/issues/2376)) ([8ad2bf1](https://github.com/linz/basemaps/commit/8ad2bf10f4e9b131c35c33273afd6c2d3460b46c))
* **lambda-tiler:** do not cache responses as they can be modifed ([#2372](https://github.com/linz/basemaps/issues/2372)) ([686e978](https://github.com/linz/basemaps/commit/686e978926261847eeda5fd8d1fafc718adb2b4b))
* **lambda-tiler:** ignore cors for function urls ([#2377](https://github.com/linz/basemaps/issues/2377)) ([96f5d66](https://github.com/linz/basemaps/commit/96f5d669c41a3154e3914955fd5f6d057bc4bf2a))


### Features

* **lambda-tiler:** create unique id for source requests ([#2370](https://github.com/linz/basemaps/issues/2370)) ([59c90a7](https://github.com/linz/basemaps/commit/59c90a7110f2ea8ef76a3f4dcb02b0170ea134df))
* **lambda-tiler:** force more aggressive cache control on most endpoints ([#2371](https://github.com/linz/basemaps/issues/2371)) ([18f9e67](https://github.com/linz/basemaps/commit/18f9e674aa762901d027b67ef14026d86e2442b9))
* **lambda-tiler:** log cache hit percentages ([#2368](https://github.com/linz/basemaps/issues/2368)) ([3f7bf0c](https://github.com/linz/basemaps/commit/3f7bf0c39ba46797b1a271a191fe51fc578abffc))
* **lambda-tiler:** move all routes to route handler ([#2354](https://github.com/linz/basemaps/issues/2354)) ([4896e7c](https://github.com/linz/basemaps/commit/4896e7c47488389845ce22fdf46a8aadf79495a2))





# [6.31.0](https://github.com/linz/basemaps/compare/v6.30.0...v6.31.0) (2022-07-22)


### Bug Fixes

* **lambda-tiler:** correct wgs84 bounding box when layers are large BM-631 ([#2345](https://github.com/linz/basemaps/issues/2345)) ([5d469f9](https://github.com/linz/basemaps/commit/5d469f96f9aee0cfff8200805bb8a69a03c61928))
* **lambda-tiler:** use the imagery title if we have it over the title from the collection.json ([#2340](https://github.com/linz/basemaps/issues/2340)) ([d73c48a](https://github.com/linz/basemaps/commit/d73c48a26328c1bda63b1e9b458f0eba27ffefc9))


### Features

* upgrade proj to 2.8.0 as it has improved transverse mercator projection logic BM-631 ([#2346](https://github.com/linz/basemaps/issues/2346)) ([4b74efb](https://github.com/linz/basemaps/commit/4b74efb07f69ceeaea9351d8e8012bc214c7614c))





# [6.30.0](https://github.com/linz/basemaps/compare/v6.29.0...v6.30.0) (2022-07-20)


### Bug Fixes

* **lambda-tiler:** allow /v1/tiles/WMTSCapabilities.xml and default to using "aerial" ([#2329](https://github.com/linz/basemaps/issues/2329)) ([4615d3a](https://github.com/linz/basemaps/commit/4615d3a776fb6f5b9bed86824b931224469ed278))
* **lambda-tiler:** unescape %20 when looking for fonts ([#2305](https://github.com/linz/basemaps/issues/2305)) ([a64a626](https://github.com/linz/basemaps/commit/a64a626bd345ceb09ddf65031b01aa0910998fa3))
* **shared:** assume vdom output is always utf8 ([#2327](https://github.com/linz/basemaps/issues/2327)) ([f458132](https://github.com/linz/basemaps/commit/f458132d8c0cdf93e1e2ddb9d9d7638fff18c141))


### Features

* **lambda-tiler:** order wmts extra layers by name ([#2332](https://github.com/linz/basemaps/issues/2332)) ([114b366](https://github.com/linz/basemaps/commit/114b366ced1844ab921ce6c8695c51b8bebf0cee))
* **landing:** support ?tileFormat as a alias to format BM-636 ([#2333](https://github.com/linz/basemaps/issues/2333)) ([9b646b0](https://github.com/linz/basemaps/commit/9b646b07f62bc146e1c211bbd743c6d42743a65a))
* use better names for WMTS ([#2314](https://github.com/linz/basemaps/issues/2314)) ([fbbf6c1](https://github.com/linz/basemaps/commit/fbbf6c140afe54b1a0227a15766bcc045a19bab2))
* **cli:** New cli to bundle the assets into cotar file. ([#2311](https://github.com/linz/basemaps/issues/2311)) ([d632301](https://github.com/linz/basemaps/commit/d632301c69240fccc2e6a52851ac0ad1f6cc840a))
* **lambda-tiler:** allow serving assets from a cotar file ([#2310](https://github.com/linz/basemaps/issues/2310)) ([ba43fa5](https://github.com/linz/basemaps/commit/ba43fa5ce93cd92b97f47ea865842aa3b3f61f89))
* **lambda-tiler:** prefer using route handler for managing routes ([#2312](https://github.com/linz/basemaps/issues/2312)) ([3c481dd](https://github.com/linz/basemaps/commit/3c481dd60032f277d38a7cf5bc0ec69a21aefb3b))
* **lambda-tiler:** prefer WebMercatorQuad for tileMatrix name over EPSG:3857 ([#2295](https://github.com/linz/basemaps/issues/2295)) ([a35f239](https://github.com/linz/basemaps/commit/a35f23986d78d18d1204b0993d78faffc434cba3))
* **shared:** update wmts titles to use imagery title and category ([#2285](https://github.com/linz/basemaps/issues/2285)) ([2580636](https://github.com/linz/basemaps/commit/25806362b322e075bb25ce058e6e56d582b84320))





# [6.29.0](https://github.com/linz/basemaps/compare/v6.28.1...v6.29.0) (2022-06-27)


### Bug Fixes

* upgrade sharp to fix the bad webp upscalling behaviour ([#2261](https://github.com/linz/basemaps/issues/2261)) ([68fe14c](https://github.com/linz/basemaps/commit/68fe14c0549a884c0c4ededa40eb2d4bd7098590))
* **lambda-tiler:** serve sprites with correct mime types ([#2259](https://github.com/linz/basemaps/issues/2259)) ([1014e1c](https://github.com/linz/basemaps/commit/1014e1c8a58076278b76646cd0468f7eb5bc2581))


### Features

* **config:** create a hash of config bundles and use bundle created timestamp for records ([#2274](https://github.com/linz/basemaps/issues/2274)) ([bd9c7bb](https://github.com/linz/basemaps/commit/bd9c7bbf3f651417b60ba6ad2ca655f89f1f5cd9))
* **lambda-tiler:** serve assets via /v1/sprites and /v1/fonts ([#2246](https://github.com/linz/basemaps/issues/2246)) ([0e04c63](https://github.com/linz/basemaps/commit/0e04c631363d5b540ae16bfc8c4c7910e1308412))
* **tiler-sharp:** extract regions before rescaling them when overzooming ([#2240](https://github.com/linz/basemaps/issues/2240)) ([fe9b858](https://github.com/linz/basemaps/commit/fe9b8588bbbe1aa8e719f7c8c645eada8c7e2876))





## [6.28.1](https://github.com/linz/basemaps/compare/v6.28.0...v6.28.1) (2022-06-07)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.28.0](https://github.com/linz/basemaps/compare/v6.27.0...v6.28.0) (2022-06-06)


### Bug Fixes

* **lambda-tiler:** remove console.log ([#2224](https://github.com/linz/basemaps/issues/2224)) ([addc742](https://github.com/linz/basemaps/commit/addc74270235fe6348e53391444a5570b02fea3e))
* **tiler:** down grade sharp to 0.29.2 as we are scaling webp past 16k ([#2237](https://github.com/linz/basemaps/issues/2237)) ([53cd5ef](https://github.com/linz/basemaps/commit/53cd5ef420698c2d8528735b5c02b84189c6b7f9))


### Features

* **lambda-tiler:** tiff paths should allow trailing slashes ([#2223](https://github.com/linz/basemaps/issues/2223)) ([4cd4948](https://github.com/linz/basemaps/commit/4cd49487dddc3a70123437d1644ff3e22d9dc12f))
* **server:** bundle basemaps-server cli so its easier to install ([#2218](https://github.com/linz/basemaps/issues/2218)) ([8457b66](https://github.com/linz/basemaps/commit/8457b66be6d0f54decf43b515bb78853cefbc8ed))
* **sprites:** create sprites using sharp ([#2235](https://github.com/linz/basemaps/issues/2235)) ([e7b6a9e](https://github.com/linz/basemaps/commit/e7b6a9e9c95359dc866b40e7a6988837a71d9d96))





# [6.27.0](https://github.com/linz/basemaps/compare/v6.26.0...v6.27.0) (2022-05-29)


### Bug Fixes

* **lambda-tiler:** do not serve mvt in the wrong projection ([#2212](https://github.com/linz/basemaps/issues/2212)) ([a68e588](https://github.com/linz/basemaps/commit/a68e5889f2d0394676dcc41d831d00ede3df115d))


### Features

* **cli:** allow overriding imagery names ([#2169](https://github.com/linz/basemaps/issues/2169)) ([5c3bdd8](https://github.com/linz/basemaps/commit/5c3bdd89b664dd85df2b48d709653b71bdc348f7))
* **cli:** Insert imagery and tileset config after cog creation complete ([#2191](https://github.com/linz/basemaps/issues/2191)) ([3ea5efd](https://github.com/linz/basemaps/commit/3ea5efd049b956f882a05c90471d764efb5d39fd))
* **cli:** make cogs will update the process job status if exists. ([#2180](https://github.com/linz/basemaps/issues/2180)) ([855ce1c](https://github.com/linz/basemaps/commit/855ce1cb1f7b8bff575be342184e5ac387684f09))
* **config:** add configuration parser and bundler ([#2200](https://github.com/linz/basemaps/issues/2200)) ([795e3f2](https://github.com/linz/basemaps/commit/795e3f224ee0b4cd1e66a242d05a1fd5357cae3a))
* **lambda-cog:** New lambda Cog for import api. ([#2207](https://github.com/linz/basemaps/issues/2207)) ([79f4ae7](https://github.com/linz/basemaps/commit/79f4ae70ea3fc16a37dd575b843a0b60a1365df4))
* **lambda-tiler:** Add file number limitation to import api. ([#2203](https://github.com/linz/basemaps/issues/2203)) ([4694e29](https://github.com/linz/basemaps/commit/4694e29a4444810391e72b290ec64f8b8541c369))
* **lambda-tiler:** allow selection of output format for wmts with ?format= ([#2211](https://github.com/linz/basemaps/issues/2211)) ([e32e1ed](https://github.com/linz/basemaps/commit/e32e1ed6f48f5d70c47b9fd81032ebc8662d3a72))
* **lambda-tiler:** Increase limit of total file size. ([#2205](https://github.com/linz/basemaps/issues/2205)) ([5246ea0](https://github.com/linz/basemaps/commit/5246ea0879a4bf6b20770fb633d63afac778d54d))
* **lambda-tiler:** increase the max number of tiffs to load at once to 25 ([#2219](https://github.com/linz/basemaps/issues/2219)) ([d7d30a8](https://github.com/linz/basemaps/commit/d7d30a843201be91933c8627d99988098d783cec))
* **lambda-tiler:** Load MaxImagePixelSize from import api. ([#2206](https://github.com/linz/basemaps/issues/2206)) ([b851934](https://github.com/linz/basemaps/commit/b85193401bc5df2ecb689c3801f62af71696cdf5))
* **server:** use a bundled `@basemaps/landing` to serve static assets ([#2202](https://github.com/linz/basemaps/issues/2202)) ([c60f518](https://github.com/linz/basemaps/commit/c60f518893fe037a03f8bfd489c84d8427481678))





# [6.26.0](https://github.com/linz/basemaps/compare/v6.25.0...v6.26.0) (2022-05-12)


### Bug Fixes

* **lambda-tiler:** Fix the insert of processing job config and actually start job after inserting config. ([#2182](https://github.com/linz/basemaps/issues/2182)) ([65d9c84](https://github.com/linz/basemaps/commit/65d9c841d3cbdde1c9a3753f3ae81fd67c5aef80))
* **lambda-tiler:** remove vector_layers as maplibre uses it as a validator ([#2189](https://github.com/linz/basemaps/issues/2189)) ([457d978](https://github.com/linz/basemaps/commit/457d978527f2c42408562021cef7b48ff9ce1afb))


### Features

* **lambda-tiler:** Remove the job id to use ulid and update HTTP status code. ([#2188](https://github.com/linz/basemaps/issues/2188)) ([7d72f0c](https://github.com/linz/basemaps/commit/7d72f0c94ce4eefe0342b01b1ac2c8c153fc7c10))





# [6.25.0](https://github.com/linz/basemaps/compare/v6.24.2...v6.25.0) (2022-05-11)


### Features

* **config:** serve tilejson 3.0.0 and allow raster imagery ([#2173](https://github.com/linz/basemaps/issues/2173)) ([29f5313](https://github.com/linz/basemaps/commit/29f53131e917fa0b3ce6f280e8f9e09f4fe6e957))
* **lambda-tiler:** Import api for import imagery jobs. ([#2170](https://github.com/linz/basemaps/issues/2170)) ([76b6175](https://github.com/linz/basemaps/commit/76b6175930db2a04f24437c7a05e7a70f160f7cd))





## [6.24.2](https://github.com/linz/basemaps/compare/v6.24.1...v6.24.2) (2022-04-20)


### Bug Fixes

* **lambda-tiler:** expose the name of the imagery set in attribution ([#2153](https://github.com/linz/basemaps/issues/2153)) ([65d22cb](https://github.com/linz/basemaps/commit/65d22cbbf805d704b0179581ac6b66e755d2ef8f))
* **lambda-tiler:** missing tilesets should 404 not 500 ([#2149](https://github.com/linz/basemaps/issues/2149)) ([a3420bc](https://github.com/linz/basemaps/commit/a3420bcc956a7fc16e2b3867100bd5943fa13e73))





## [6.24.1](https://github.com/linz/basemaps/compare/v6.24.0...v6.24.1) (2022-04-07)


### Bug Fixes

* **lambda-tiler:** do not destroy database config when serving style.json ([#2146](https://github.com/linz/basemaps/issues/2146)) ([a625efd](https://github.com/linz/basemaps/commit/a625efd9a5f94522c50925e764c95ddeb57de427))





# [6.24.0](https://github.com/linz/basemaps/compare/v6.23.0...v6.24.0) (2022-04-05)


### Bug Fixes

* **lambda-tiler:** decode utf8 path names ([#2135](https://github.com/linz/basemaps/issues/2135)) ([2f09e33](https://github.com/linz/basemaps/commit/2f09e334e20ad9f4ece51617dd1c90d9b53abd8e))
* **lambda-tiler:** do not error when invalid imagery urls are provided ([#2133](https://github.com/linz/basemaps/issues/2133)) ([8211428](https://github.com/linz/basemaps/commit/8211428825ab63656c40a66a72e42d03add835bb))





# [6.23.0](https://github.com/linz/basemaps/compare/v6.22.1...v6.23.0) (2022-04-04)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [6.22.1](https://github.com/linz/basemaps/compare/v6.22.0...v6.22.1) (2022-03-23)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.22.0](https://github.com/linz/basemaps/compare/v6.21.1...v6.22.0) (2022-03-20)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [6.21.1](https://github.com/linz/basemaps/compare/v6.21.0...v6.21.1) (2022-03-17)


### Bug Fixes

* **lambda-tiler:** bundle the exact version of sharp from the yarn.lock  ([#2114](https://github.com/linz/basemaps/issues/2114)) ([a193e41](https://github.com/linz/basemaps/commit/a193e4172c63349e745e8bfcbb78ac919e52f1dd))
* **lambda-tiler:** scripts should be specific to the module type ([#2115](https://github.com/linz/basemaps/issues/2115)) ([04c6f87](https://github.com/linz/basemaps/commit/04c6f8777ec722f1dc918757dd79043bd88d5e9a))





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-17)


### Bug Fixes

* **config:** fetch all unprocessed keys from dynamo if there are any ([#2101](https://github.com/linz/basemaps/issues/2101)) ([731430e](https://github.com/linz/basemaps/commit/731430e73756f05b2684f5b7ae7bd2852bc0a9b5))


### Features

* **config:** remove imagery year and resoltuion from config as it is not used ([#2097](https://github.com/linz/basemaps/issues/2097)) ([8be7c09](https://github.com/linz/basemaps/commit/8be7c09b9ce64898e5ab54b7fcb74c34405f558e))
* **lambda-tiler:** limit request tracing to 100 requests ([#2095](https://github.com/linz/basemaps/issues/2095)) ([f86fc30](https://github.com/linz/basemaps/commit/f86fc30aefcd2ddbfe2ffe43547338d36c152315))
* **lambda-tiler:** trace all requests to source ([#2093](https://github.com/linz/basemaps/issues/2093)) ([a2ca049](https://github.com/linz/basemaps/commit/a2ca049bd11505882105cb525a3f28f84c10611a))


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2111) ([d07f8ab](https://github.com/linz/basemaps/commit/d07f8ab4037466b060bf7e83960737554ff064b4)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2111](https://github.com/linz/basemaps/issues/2111)
* Revert "release: v6.22.0 (#2108)" (#2110) ([abcd2e4](https://github.com/linz/basemaps/commit/abcd2e4732a6d606eed865f526d6df2e4617aad3)), closes [#2108](https://github.com/linz/basemaps/issues/2108) [#2110](https://github.com/linz/basemaps/issues/2110)
* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.20.0](https://github.com/linz/basemaps/compare/v6.19.0...v6.20.0) (2022-02-01)


### Features

* **lambda-tiler:** allow relative sprites and glyphs ([#2071](https://github.com/linz/basemaps/issues/2071)) ([a283157](https://github.com/linz/basemaps/commit/a283157f6b11fd9f6168edd19e9d5624f52d0325))
* **lambda-tiler:** wip esri vectortileserver interface for vector tiles ([#2041](https://github.com/linz/basemaps/issues/2041)) ([0549d68](https://github.com/linz/basemaps/commit/0549d688ae44c20bd8dce0281988c7ba258fdacb))





# [6.19.0](https://github.com/linz/basemaps/compare/v6.18.1...v6.19.0) (2021-12-20)


### Bug Fixes

* **lambda-tiler:** remove the host check to add api keys for all stylejson sources. ([#2032](https://github.com/linz/basemaps/issues/2032)) ([beab64c](https://github.com/linz/basemaps/commit/beab64c7f747dd5c1be06877b05b1173a95b1537))


### Features

* **lambda-tiler:** compress geojson output to prevent overflowing lambda ([#2034](https://github.com/linz/basemaps/issues/2034)) ([5d48524](https://github.com/linz/basemaps/commit/5d48524c0bf03c40e85cd661fd7f609bbdeed3dd))
* **tiler:** expose some of the metadata geojson via a /v1/imagery endpoint ([#2033](https://github.com/linz/basemaps/issues/2033)) ([b471209](https://github.com/linz/basemaps/commit/b471209a381dfdab1a25be4882e464c8ddea9064))





# [6.18.0](https://github.com/linz/basemaps/compare/v6.17.0...v6.18.0) (2021-12-14)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.17.0](https://github.com/linz/basemaps/compare/v6.16.1...v6.17.0) (2021-12-05)


### Features

* **lambda-tiler:** Stop caching for the stylejson. ([#2011](https://github.com/linz/basemaps/issues/2011)) ([f29ae16](https://github.com/linz/basemaps/commit/f29ae16cd0b858fd9929a8cbcefa1c5113687bc9))
* **landing:** use topographic name not topolike ([#2008](https://github.com/linz/basemaps/issues/2008)) ([a281d87](https://github.com/linz/basemaps/commit/a281d874ae8211447282ad41dd497e96689ceb88))





## [6.16.1](https://github.com/linz/basemaps/compare/v6.16.0...v6.16.1) (2021-11-30)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.16.0](https://github.com/linz/basemaps/compare/v6.15.0...v6.16.0) (2021-11-29)


### Bug Fixes

* **lambda-tiler:** p-limit is a needed dependency ([#1998](https://github.com/linz/basemaps/issues/1998)) ([dfb1b25](https://github.com/linz/basemaps/commit/dfb1b2575e9b40b96ffa4bdcfa8f1496b18ae25e))





# [6.15.0](https://github.com/linz/basemaps/compare/v6.14.2...v6.15.0) (2021-11-28)


### Bug Fixes

* **lambda-tiler:** publish the tiler so `@basemaps/server` can use it ([#1991](https://github.com/linz/basemaps/issues/1991)) ([c1d7477](https://github.com/linz/basemaps/commit/c1d74773a94c643d1a60e84ef8005fc505a88126))





## [6.12.1](https://github.com/linz/basemaps/compare/v6.12.0...v6.12.1) (2021-10-19)


### Bug Fixes

* **lambda-tiler:** cleanup tiff cache everytime a new tiff is initalized ([#1900](https://github.com/linz/basemaps/issues/1900)) ([bfd52af](https://github.com/linz/basemaps/commit/bfd52afc810398a03800893a10313a2eb1a5834a))
* **lambda-tiler:** Replace the encoded braces in stylejson url. ([#1912](https://github.com/linz/basemaps/issues/1912)) ([e51d038](https://github.com/linz/basemaps/commit/e51d0380b21110ff5585804fae14baf92a588352))





# [6.12.0](https://github.com/linz/basemaps/compare/v6.11.0...v6.12.0) (2021-10-05)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.11.0](https://github.com/linz/basemaps/compare/v6.10.1...v6.11.0) (2021-10-03)


### Bug Fixes

* **lambda-tiler:** do not create a new requestId for test tile creation ([#1876](https://github.com/linz/basemaps/issues/1876)) ([f6946da](https://github.com/linz/basemaps/commit/f6946dad47bb91b3c75a89237a917ed925ffc818))
* **lambda-tiler:** limit the tiff memory cache to 256MB of imagery ([#1882](https://github.com/linz/basemaps/issues/1882)) ([2bf0bdc](https://github.com/linz/basemaps/commit/2bf0bdc39c191a7bb7a8e8e2277160a357248386))


### Features

* **server:** add ability to serve a folder full of tiffs ([#1889](https://github.com/linz/basemaps/issues/1889)) ([adefde1](https://github.com/linz/basemaps/commit/adefde176ce03db5c6c978d8b85a11fc7cd15693))
* **server:** use the lambda handler directly ([#1870](https://github.com/linz/basemaps/issues/1870)) ([408ff56](https://github.com/linz/basemaps/commit/408ff5654cc04aae35d05eb5bbc47a51f99ec5b2))





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Bug Fixes

* **lambda-tiler:** clear timeout if request succeeds ([#1874](https://github.com/linz/basemaps/issues/1874)) ([49183ca](https://github.com/linz/basemaps/commit/49183ca6b154d91b11cd493f88164c346430e369))
* **lambda-tiler:** move to NZTM2000Quad for health check endpoint ([#1867](https://github.com/linz/basemaps/issues/1867)) ([d4613f0](https://github.com/linz/basemaps/commit/d4613f04f1081f785831488ea53bc8d8da7aae70))
* bundle esm into commonjs for serving ([#1861](https://github.com/linz/basemaps/issues/1861)) ([ff4490b](https://github.com/linz/basemaps/commit/ff4490b96648ee090055d60154d718c90b9afe97))
* correctly bundle with esm modules ([#1858](https://github.com/linz/basemaps/issues/1858)) ([708a22e](https://github.com/linz/basemaps/commit/708a22ec1006c25cf2c057b75f61cc813e943aac))


### Features

* **lambda-tiler:** track slow requests ([#1871](https://github.com/linz/basemaps/issues/1871)) ([b436e8b](https://github.com/linz/basemaps/commit/b436e8ba77b80b03239cc5c04cd9d7dfb1388f78))
* replace s3fs with chunkd/fs ([#1859](https://github.com/linz/basemaps/issues/1859)) ([9b6f2d3](https://github.com/linz/basemaps/commit/9b6f2d3609c336f96c2ae32246f241cb396e71c8))
* **lambda-tiler:** track hash of apikey ([#1855](https://github.com/linz/basemaps/issues/1855)) ([f8a4bef](https://github.com/linz/basemaps/commit/f8a4bef096095c09f5348af97b3f25a338817e87))
* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.9.0](https://github.com/linz/basemaps/compare/v6.8.0...v6.9.0) (2021-09-09)


### Bug Fixes

* **lambda-tiler:** force wmts to be ServiceTypeVersion 1.0.0 ([#1836](https://github.com/linz/basemaps/issues/1836)) ([8353774](https://github.com/linz/basemaps/commit/835377413417c58e4cca8bb4663aa43cc37043ff))
* **lambda-tiler:** remove console.log ([#1841](https://github.com/linz/basemaps/issues/1841)) ([723dbcc](https://github.com/linz/basemaps/commit/723dbcce8330ed588068fc2904c9476f6bbbd957))


### Features

* **tiler-sharp:** start tracking tile composing performance ([#1838](https://github.com/linz/basemaps/issues/1838)) ([b6cff4d](https://github.com/linz/basemaps/commit/b6cff4d982595f2bdd2dd16362c59500d2d8119e))





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)


### Features

* **lambda-tiler:** remove `@basemaps/lambda` and replace with `@linzjs/lambda` ([#1821](https://github.com/linz/basemaps/issues/1821)) ([cb22b3d](https://github.com/linz/basemaps/commit/cb22b3d2c62b7430839f3e35c18dd96a162fb39a))
* **server:** create a standalone express server ([#1819](https://github.com/linz/basemaps/issues/1819)) ([83488af](https://github.com/linz/basemaps/commit/83488af658a3ed8f3080dd2ea9f120ac3abd2444))





# [6.7.0](https://github.com/linz/basemaps/compare/v6.6.1...v6.7.0) (2021-08-15)


### Bug Fixes

* throw 500 on health failure ([#1795](https://github.com/linz/basemaps/issues/1795)) ([75bd6ae](https://github.com/linz/basemaps/commit/75bd6ae7f6a018acff4d5a27c58680eaa176aaa2))


### Features

* **lambda-tiler:** Support both aerial and vector basemap urls in style json. ([#1811](https://github.com/linz/basemaps/issues/1811)) ([9d30db8](https://github.com/linz/basemaps/commit/9d30db82d13bf84690c463644df664ab4c6735ce))





## [6.6.1](https://github.com/linz/basemaps/compare/v6.6.0...v6.6.1) (2021-07-29)


### Bug Fixes

* correct cache id between NZTMQuad and 3857 ([#1793](https://github.com/linz/basemaps/issues/1793)) ([ace31c7](https://github.com/linz/basemaps/commit/ace31c761fad5471ecd0c0eb85e53f10411bdabb))





# [6.6.0](https://github.com/linz/basemaps/compare/v6.5.0...v6.6.0) (2021-07-29)


### Bug Fixes

* **config:** do not cache tile sets forever as they can be updated ([#1790](https://github.com/linz/basemaps/issues/1790)) ([d0b1c89](https://github.com/linz/basemaps/commit/d0b1c89ff155004b778ddca3003e3d5ea29e7b7f))





# [6.5.0](https://github.com/linz/basemaps/compare/v6.4.0...v6.5.0) (2021-07-25)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.4.0](https://github.com/linz/basemaps/compare/v6.3.0...v6.4.0) (2021-07-13)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.3.0](https://github.com/linz/basemaps/compare/v6.2.0...v6.3.0) (2021-07-07)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [6.2.0](https://github.com/linz/basemaps/compare/v6.1.0...v6.2.0) (2021-06-24)


### Features

* disable edge lambda as its not really used. ([#1692](https://github.com/linz/basemaps/issues/1692)) ([38b02a5](https://github.com/linz/basemaps/commit/38b02a5c5050a076c69836861afc91cc92235a79))





# [6.1.0](https://github.com/linz/basemaps/compare/v6.0.0...v6.1.0) (2021-06-23)


### Bug Fixes

* **lambda-tiler:** bundle farmhash correctly ([#1693](https://github.com/linz/basemaps/issues/1693)) ([7cacf2e](https://github.com/linz/basemaps/commit/7cacf2e34b6bc6fbb25826ccf0b59d0816e25c25))


### Features

* switch to a binary cotar index ([#1691](https://github.com/linz/basemaps/issues/1691)) ([6fa0b3f](https://github.com/linz/basemaps/commit/6fa0b3f223ab251fe94011cbda88ff9aa5b6922f))





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)


### Features

* **lambda-tiler:** switch to ndjson based indexes for cotar ([#1679](https://github.com/linz/basemaps/issues/1679)) ([c6f622b](https://github.com/linz/basemaps/commit/c6f622bf3f2fd583ed95df3c7d10aa4482def83b))
* **s3fs:** refactor how credentials are passed to s3fs ([#1675](https://github.com/linz/basemaps/issues/1675)) ([f07f529](https://github.com/linz/basemaps/commit/f07f529af1657aa5ffe7d9deff92406e908e6fe4))


### BREAKING CHANGES

* **s3fs:** this changes the behaviour for s3fs as paths now need to be registered with credentials

* refactor: remove commented out code





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [5.0.3](https://github.com/linz/basemaps/compare/v5.0.2...v5.0.3) (2021-05-25)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [5.0.2](https://github.com/linz/basemaps/compare/v5.0.1...v5.0.2) (2021-05-19)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [5.0.1](https://github.com/linz/basemaps/compare/v5.0.0...v5.0.1) (2021-05-17)

### Bug Fixes

* **attribution:** all zoom levels are stored as google so convert z to the target tileMatrix  ([#1614](https://github.com/linz/basemaps/issues/1614)) ([28f5c80](https://github.com/linz/basemaps/commit/fcbdefc5c951211956d03e11deef37caedf19aec))





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)


### Bug Fixes

* **attribution:** correct import issue with openlayers  ([#1599](https://github.com/linz/basemaps/issues/1599)) ([1b464f3](https://github.com/linz/basemaps/commit/1b464f381a81448769521543787c060ef9b3efcf))
* **lambda-tiler:** correctly build WMTS for child tile sets ([#1607](https://github.com/linz/basemaps/issues/1607)) ([cc5ef6f](https://github.com/linz/basemaps/commit/cc5ef6f2facbc78cfad88d39785dffdae85122aa))
* **lambda-tiler:** do not duplicate im prefix in attribution ([#1609](https://github.com/linz/basemaps/issues/1609)) ([42f57fb](https://github.com/linz/basemaps/commit/42f57fb7c8f6aa3b5cab9179e1dfb70bd14df73e))
* **lambda-tiler:** flip the y axis for vector map server to get MVT from mbtiles ([#1539](https://github.com/linz/basemaps/issues/1539)) ([66806df](https://github.com/linz/basemaps/commit/66806df400788dc27cd31493466a641a63b5bcae))
* **lambda-tiler:** force vector tiles to be served as protobuf ([#1536](https://github.com/linz/basemaps/issues/1536)) ([2ca83ee](https://github.com/linz/basemaps/commit/2ca83ee2c7906e6e0bf81b203cd611b88aa4ad75))
* **tiler:** all config is stored as google zoom levels so convert this tilez to the closet google z ([#1606](https://github.com/linz/basemaps/issues/1606)) ([7ea2db1](https://github.com/linz/basemaps/commit/7ea2db14f3f75c11ffb2c2044c45519a03cfa0ee))


### Features

* **config:** Tidy up the config and cli to be able to config style json. ([#1555](https://github.com/linz/basemaps/issues/1555)) ([95b4c0e](https://github.com/linz/basemaps/commit/95b4c0ed5a42a5b7c6c7884c9bfe24f97e3677e5))
* **lambda-tiler:** improve caching and init of cotar ([#1542](https://github.com/linz/basemaps/issues/1542)) ([c607a1c](https://github.com/linz/basemaps/commit/c607a1c4eba04cfdcc9b21341ee154dc544678c8))
* **lambda-tiler:** serve vector map style json. ([#1553](https://github.com/linz/basemaps/issues/1553)) ([f9dadcd](https://github.com/linz/basemaps/commit/f9dadcdc2369c1ce30432ed231f5be4b466dc9cd))
* **shared:** Cleanup - Remove TileSet Metatdata Record V1. ([#1541](https://github.com/linz/basemaps/issues/1541)) ([32e79af](https://github.com/linz/basemaps/commit/32e79afe630e9042edc1f936a657b7a31f1392ef))
* support serving of vector tiles ([#1535](https://github.com/linz/basemaps/issues/1535)) ([30083a5](https://github.com/linz/basemaps/commit/30083a57f981c2b2db6c50cad0f8db48be377d19))





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)


### Bug Fixes

* **geo:** use the closest zoom mapping ([#1503](https://github.com/linz/basemaps/issues/1503)) ([5ce730d](https://github.com/linz/basemaps/commit/5ce730d34dd6fed7015f29683b3fc31183b1d3bc))
* **lambda-tiler:** correct mapping of high zoom levels ([#1492](https://github.com/linz/basemaps/issues/1492)) ([7e98e63](https://github.com/linz/basemaps/commit/7e98e6353e1209f64d60ed028bde502847495432))
* **lambda-tiler:** generate a custom attribution for nztm2000quad ([#1498](https://github.com/linz/basemaps/issues/1498)) ([27933fd](https://github.com/linz/basemaps/commit/27933fd2b4d9123c107e476465a87c19e7f29c97))





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)


### Features

* **bathymetry:** generate the bathy tiles based on the output tile matrix set not hard coded ([#1478](https://github.com/linz/basemaps/issues/1478)) ([536c643](https://github.com/linz/basemaps/commit/536c643a216ac1378f53b3cb15c5897a428fb492))
* **lambda-tiler:** support NZTM2000Quad when serving via WMTS ([#1474](https://github.com/linz/basemaps/issues/1474)) ([4f0d9e6](https://github.com/linz/basemaps/commit/4f0d9e602307d83af4f12eda0ce4466df5006e78))
* support custom tile matrix sets ([#1469](https://github.com/linz/basemaps/issues/1469)) ([13a42de](https://github.com/linz/basemaps/commit/13a42de2647d448e1a4130602f759e21e03651bf))





# [4.21.0](https://github.com/linz/basemaps/compare/v4.20.0...v4.21.0) (2021-02-16)


### Bug Fixes

* **lambda-tiler:** only export the tile matrix set once per epsg code ([#1440](https://github.com/linz/basemaps/issues/1440)) ([0ac2fd8](https://github.com/linz/basemaps/commit/0ac2fd8c09120f8137c8102c50070df1885ab872))


### Features

* **lambda-tiler:** show number of bytes served with WMTS requests ([#1439](https://github.com/linz/basemaps/issues/1439)) ([459c88e](https://github.com/linz/basemaps/commit/459c88e1006c95dd4507009c22ed9016759b0398))





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)


### Bug Fixes

* **lambda-tiler:** fix failed health endpoint and add new function to update health test tiles. ([#1430](https://github.com/linz/basemaps/issues/1430)) ([3205155](https://github.com/linz/basemaps/commit/32051551e92fc9acb4a46f12267857bee7635a5b))


### Features

* **attribution:** remove `@basemaps/shared` dependency to make it smaller to install ([#1415](https://github.com/linz/basemaps/issues/1415)) ([5152614](https://github.com/linz/basemaps/commit/51526145256e0b7a514dc1185691d27cead1a0c6))
* **tiler:** support rendering avif tiles ([#1409](https://github.com/linz/basemaps/issues/1409)) ([8474d32](https://github.com/linz/basemaps/commit/8474d327aaab14aad96c1d7793b44b8e8daad946))
* Allow alternative TileMatrixSet definitions ([#1321](https://github.com/linz/basemaps/issues/1321)) ([b7cfa7b](https://github.com/linz/basemaps/commit/b7cfa7b8bf1351d9e57e46c180a1d3cf01c29927))





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)


### Bug Fixes

* **lambda-tiler:** correct s3 permissions when creating tiles ([#1317](https://github.com/linz/basemaps/issues/1317)) ([95d6d1a](https://github.com/linz/basemaps/commit/95d6d1ab71e600f1ad7e3107d765a493c9d18bd4))
* **lambda-tiler:** filter the path for static file correctly. ([#1328](https://github.com/linz/basemaps/issues/1328)) ([e04e3d0](https://github.com/linz/basemaps/commit/e04e3d0baef7bcfe7df2d39a3a09a15515027b39))
* **lambda-tiler:** health endpoint cannot open static files. ([#1323](https://github.com/linz/basemaps/issues/1323)) ([aabc501](https://github.com/linz/basemaps/commit/aabc501f3864f379c733632db04130d64e4e09ea))


### Features

* **lambda-tiler:** add smoke test in health endpoint ([#1308](https://github.com/linz/basemaps/issues/1308)) ([334f5dd](https://github.com/linz/basemaps/commit/334f5dd8f3d1bd67b770cf24cef9cad517e36f37))





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)


### Features

* **cli:** Configure TileSet metedata DB from config file ([#1277](https://github.com/linz/basemaps/issues/1277)) ([b8c76d4](https://github.com/linz/basemaps/commit/b8c76d4d3aac3e49a4a01bfc88c58ab149d62482))





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)


### Bug Fixes

* Remove dashes from CC-BY-4.0 license text ([#1223](https://github.com/linz/basemaps/issues/1223)) ([ae88b81](https://github.com/linz/basemaps/commit/ae88b817f3f82288d3dbb5b0ca8c30302bdae959))


### Features

* **lambda-tiler:** attribution ([#1205](https://github.com/linz/basemaps/issues/1205)) ([69cca66](https://github.com/linz/basemaps/commit/69cca66d901a23f01868ce6fedc8991f01c55de2))
* **linzjs-s3fs:** .list is now a async generator to allow easier iterating of folders ([#1213](https://github.com/linz/basemaps/issues/1213)) ([a42c594](https://github.com/linz/basemaps/commit/a42c594a506914e340eabb2afd97991c2b119a64))





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)


### Bug Fixes

* **linzjs-s3fs:** allow fs.list to list buckets and not need a "key" ([#1178](https://github.com/linz/basemaps/issues/1178)) ([108774f](https://github.com/linz/basemaps/commit/108774f96e37d36f89d1c29b634e1956d2fddf54))





# [4.13.0](https://github.com/linz/basemaps/compare/v4.12.2...v4.13.0) (2020-09-14)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [4.12.2](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.2) (2020-09-10)


### Bug Fixes

* **lambda-tiler:** Remove epsg from wmts layer id ([#1149](https://github.com/linz/basemaps/issues/1149)) ([7bca25f](https://github.com/linz/basemaps/commit/7bca25f0a15632343af825d2e30b08b5d111896e))





## [4.12.1](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.1) (2020-09-10)


### Bug Fixes

* **lambda-tiler:** Remove epsg from wmts layer id ([#1149](https://github.com/linz/basemaps/issues/1149)) ([7bca25f](https://github.com/linz/basemaps/commit/7bca25f0a15632343af825d2e30b08b5d111896e))





# [4.12.0](https://github.com/linz/basemaps/compare/v4.11.2...v4.12.0) (2020-09-06)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [4.11.2](https://github.com/linz/basemaps/compare/v4.11.1...v4.11.2) (2020-09-01)


### Bug Fixes

* correct imagery loading with one imagery tile set ([#1120](https://github.com/linz/basemaps/issues/1120)) ([a992ff0](https://github.com/linz/basemaps/commit/a992ff0a7f74935a10b2e8b49399d9b885b25e57))





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)


### Features

* **lambda:** reduce log volumes ([#1114](https://github.com/linz/basemaps/issues/1114)) ([f99f999](https://github.com/linz/basemaps/commit/f99f999ddfb8651057c2a58c2c67aeffc4c3e2ed))
* allow imagery with the same id in the rendering process twice ([#1104](https://github.com/linz/basemaps/issues/1104)) ([d8cd642](https://github.com/linz/basemaps/commit/d8cd642c6215a5198e15414c14680afacad88faf))





# [4.10.0](https://github.com/linz/basemaps/compare/v4.9.0...v4.10.0) (2020-08-19)


### Bug Fixes

* **lambda-tiler:** Stop health and ping response being cached ([#1066](https://github.com/linz/basemaps/issues/1066)) ([922c617](https://github.com/linz/basemaps/commit/922c617b555672d36bd3d2e4986d3b46ad333731))





# [4.9.0](https://github.com/linz/basemaps/compare/v4.8.0...v4.9.0) (2020-08-17)


### Features

* allow configuration of tile resize kernels ([#1051](https://github.com/linz/basemaps/issues/1051)) ([6b6d3d3](https://github.com/linz/basemaps/commit/6b6d3d32c735de6bf3f41819aaeb571c78f0921c))





# [4.8.0](https://github.com/linz/basemaps/compare/v4.7.1...v4.8.0) (2020-08-12)


### Features

* **lambda-tiler:** allow dumping of single tiles from aws ([#1037](https://github.com/linz/basemaps/issues/1037)) ([85b4783](https://github.com/linz/basemaps/commit/85b4783b332e2c134157ed11029386a3dcbeab0b))
* **lambda-tiler:** set cache for tiles to be public to increase cache hits ([#1035](https://github.com/linz/basemaps/issues/1035)) ([610b10c](https://github.com/linz/basemaps/commit/610b10c7eebb934f463d88654768dd64836f118a))





## [4.7.1](https://github.com/linz/basemaps/compare/v4.7.0...v4.7.1) (2020-08-11)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [4.7.0](https://github.com/linz/basemaps/compare/v4.6.0...v4.7.0) (2020-08-10)


### Bug Fixes

* **lambda-api-tracker:** 404 when projection or zoom are invalid over 500 ([#1017](https://github.com/linz/basemaps/issues/1017)) ([2125394](https://github.com/linz/basemaps/commit/2125394a4f3fdecc234d06598432386bb672a625))





# [4.6.0](https://github.com/linz/basemaps/compare/v4.5.0...v4.6.0) (2020-08-05)


### Features

* **geojson:** Improve GeoJSON compliance ([#1005](https://github.com/linz/basemaps/issues/1005)) ([bf7fd26](https://github.com/linz/basemaps/commit/bf7fd26cf2b08d6417a0c710b821648e9f7c9b9a))





# [4.5.0](https://github.com/linz/basemaps/compare/v4.4.0...v4.5.0) (2020-07-30)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [4.4.0](https://github.com/linz/basemaps/compare/v4.3.0...v4.4.0) (2020-07-28)


### Bug Fixes

* inject git version and hash into all code ([#966](https://github.com/linz/basemaps/issues/966)) ([8b8eaec](https://github.com/linz/basemaps/commit/8b8eaec373286c81b425d485274edd7c588aefea))
* **lambda-api:** track api key usage ([#943](https://github.com/linz/basemaps/issues/943)) ([7c4689c](https://github.com/linz/basemaps/commit/7c4689cd0824ee678260ba5d84b25042aad72363))


### Features

* **lambda-tiler:** Serve WMTSCapabilities for all TileSets ([#953](https://github.com/linz/basemaps/issues/953)) ([49d0e88](https://github.com/linz/basemaps/commit/49d0e881b4726188ea937a9617c98bff5a78e44d))





# [4.3.0](https://github.com/linz/basemaps/compare/v4.2.0...v4.3.0) (2020-07-19)


### Features

* **lambda-tiler:** log out api key used to request the tile ([#939](https://github.com/linz/basemaps/issues/939)) ([1eb9ff0](https://github.com/linz/basemaps/commit/1eb9ff0b90eebcd80e4fa69083d10eb9366623a8))





# [4.2.0](https://github.com/linz/basemaps/compare/v4.1.0...v4.2.0) (2020-07-16)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [4.1.0](https://github.com/linz/basemaps/compare/v4.0.0...v4.1.0) (2020-07-15)


### Bug Fixes

* **wmts:** add style tag to wmtscaps ([#894](https://github.com/linz/basemaps/issues/894)) ([d486c4b](https://github.com/linz/basemaps/commit/d486c4b9105c3c92bf73423f9ec05db37bbbd9ea))





# [4.0.0](https://github.com/linz/basemaps/compare/v3.6.0...v4.0.0) (2020-07-09)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [3.6.0](https://github.com/linz/basemaps/compare/v3.5.0...v3.6.0) (2020-07-08)


### Bug Fixes

* **wmts:** add identifier ([#877](https://github.com/linz/basemaps/issues/877)) ([d2d9f56](https://github.com/linz/basemaps/commit/d2d9f56eb348e1131fa951a59e799cc333fb8a31))





# [3.5.0](https://github.com/linz/basemaps/compare/v3.4.2...v3.5.0) (2020-07-05)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [3.4.1](https://github.com/linz/basemaps/compare/v3.4.0...v3.4.1) (2020-06-30)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [3.4.0](https://github.com/linz/basemaps/compare/v3.3.0...v3.4.0) (2020-06-29)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [3.2.0](https://github.com/linz/basemaps/compare/v3.1.0...v3.2.0) (2020-06-25)


### Bug Fixes

* **lambda-tiler:** 404 when a user requests a tile outside of the tms zoom range ([#812](https://github.com/linz/basemaps/issues/812)) ([c78fff6](https://github.com/linz/basemaps/commit/c78fff6d7738f95339520c2d335ccb9a5329cc82))





# [3.1.0](https://github.com/linz/basemaps/compare/v3.0.0...v3.1.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [3.0.0](https://github.com/linz/basemaps/compare/v2.2.0...v3.0.0) (2020-06-23)


### Features

* **landing:** support nztm tiles ([#779](https://github.com/linz/basemaps/issues/779)) ([5158603](https://github.com/linz/basemaps/commit/51586035aa7a258cadb8b561d91f63e87c049eb2))
* Generate and render COGs using bounding boxes ([#774](https://github.com/linz/basemaps/issues/774)) ([e35bf1f](https://github.com/linz/basemaps/commit/e35bf1f0e20b74a16ff942dc88547afc56454c12))





# [2.2.0](https://github.com/linz/basemaps/compare/v2.1.0...v2.2.0) (2020-06-17)


### Bug Fixes

* do not use full tiff files for generating etags ([#672](https://github.com/linz/basemaps/issues/672)) ([9fa9e73](https://github.com/linz/basemaps/commit/9fa9e73e9c650b5f2be198032d7a055a2c22e101))


### Features

* **cli:** allow rendering of a single cog ([#737](https://github.com/linz/basemaps/issues/737)) ([87ed6f1](https://github.com/linz/basemaps/commit/87ed6f14c55655e61835e2cdbf139e720280462e))
* **lambda-tiler:** Serve local images with set priority ([#755](https://github.com/linz/basemaps/issues/755)) ([6cd8ff2](https://github.com/linz/basemaps/commit/6cd8ff2f2979211e4859a1e2b0f949fcd5718bd2))
* **lambda-tiler:** support rendering tiles where the tile matrix set is not a quad ([#749](https://github.com/linz/basemaps/issues/749)) ([3aa97d2](https://github.com/linz/basemaps/commit/3aa97d28ff96f840de72dc7b7b710ad825bbea9a))
* render tiles using tile matrix sets ([#699](https://github.com/linz/basemaps/issues/699)) ([5b8156a](https://github.com/linz/basemaps/commit/5b8156aac4d23087c399667fba265af8383cd60a))
* **wmts:** support multiple layers and multiple projections ([#689](https://github.com/linz/basemaps/issues/689)) ([a8a5627](https://github.com/linz/basemaps/commit/a8a562705ba4b7b7e0c77ba5d2a7709ed08283ad))
* Allow composite imagery from different COG buckets ([#664](https://github.com/linz/basemaps/issues/664)) ([404a5a3](https://github.com/linz/basemaps/commit/404a5a3ad35ad6da5c8de6e1beebb134dcaec3ff))
* **lambda-shared:** add TileMetadataProvider ([#624](https://github.com/linz/basemaps/issues/624)) ([62c7744](https://github.com/linz/basemaps/commit/62c774403b8a7073cdbc846ca92abce3b986dfaf))





# [2.1.0](https://github.com/linz/basemaps/compare/v2.0.0...v2.1.0) (2020-05-21)


### Bug Fixes

* **lambda-shared:** fix order equal priority images are sorted ([#640](https://github.com/linz/basemaps/issues/640)) ([3022336](https://github.com/linz/basemaps/commit/302233614aec815eb0d85c588d4a0c4be7f5cbc3))


### Features

* better sparse cog handling ([#634](https://github.com/linz/basemaps/issues/634)) ([1b60a87](https://github.com/linz/basemaps/commit/1b60a87f4a3f4751f203e3c927ca34784e5745b2))





# [2.0.0](https://github.com/linz/basemaps/compare/v1.12.0...v2.0.0) (2020-05-18)


### Features

* **geo:** support chatham projection 3793 ([#632](https://github.com/linz/basemaps/issues/632)) ([22d7cb6](https://github.com/linz/basemaps/commit/22d7cb62541e02101ca4cde153f856412f5d5d0d))





# [1.11.0](https://github.com/linz/basemaps/compare/v1.10.0...v1.11.0) (2020-05-14)


### Bug Fixes

* **lambda-tiler:** add missing identifier for WMTS individual set ([#617](https://github.com/linz/basemaps/issues/617)) ([5f79609](https://github.com/linz/basemaps/commit/5f79609c478b9b9cf26006a9a428b05cdc39a7aa))





# [1.10.0](https://github.com/linz/basemaps/compare/v1.9.0...v1.10.0) (2020-05-13)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [1.9.0](https://github.com/linz/basemaps/compare/v1.8.0...v1.9.0) (2020-05-12)


### Features

* **lambda-tiler:** Support tags and imagery sets for WMTSCapabilities.xml ([#599](https://github.com/linz/basemaps/issues/599)) ([9f4c6c2](https://github.com/linz/basemaps/commit/9f4c6c201224bf083ace2edfb2e8b885d741c6c5))





# [1.8.0](https://github.com/linz/basemaps/compare/v1.7.0...v1.8.0) (2020-05-11)


### Features

* support rendering different backgrounds for tiles ([#591](https://github.com/linz/basemaps/issues/591)) ([22f38f5](https://github.com/linz/basemaps/commit/22f38f555a678e6968206351d8fbb62a604da39e))





# [1.7.0](https://github.com/linz/basemaps/compare/v1.6.0...v1.7.0) (2020-05-10)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [1.6.0](https://github.com/linz/basemaps/compare/v1.5.1...v1.6.0) (2020-05-08)


### Bug Fixes

* **serve:** allow any tile set name to be used ([#579](https://github.com/linz/basemaps/issues/579)) ([e3e6a03](https://github.com/linz/basemaps/commit/e3e6a03e66b496ae6f9247dc9cbbb0110f5993c5))





# [1.5.0](https://github.com/linz/basemaps/compare/v1.4.2...v1.5.0) (2020-05-07)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [1.4.2](https://github.com/linz/basemaps/compare/v1.4.1...v1.4.2) (2020-05-06)

**Note:** Version bump only for package @basemaps/lambda-tiler





## [1.4.1](https://github.com/linz/basemaps/compare/v1.4.0...v1.4.1) (2020-05-06)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [1.4.0](https://github.com/linz/basemaps/compare/v1.3.0...v1.4.0) (2020-05-06)

**Note:** Version bump only for package @basemaps/lambda-tiler





# [1.3.0](https://github.com/linz/basemaps/compare/v1.2.0...v1.3.0) (2020-05-05)


### Bug Fixes

* **projection.toUrn:** Don't include EPSG database version ([0c32d1f](https://github.com/linz/basemaps/commit/0c32d1f7461e47c6b8b63819bba419da740459a2))
* **wmts:** change image format order for ArcGIS Pro ([90c4cc8](https://github.com/linz/basemaps/commit/90c4cc8c2bed15e5aa5a36afd1270ee634b53e02))
* **wmts:** set max zoom to 22 ([288078f](https://github.com/linz/basemaps/commit/288078ffc6924d89802e529797a4440cc1023f90))
* imagery maps need to be initialized before use ([ae9b462](https://github.com/linz/basemaps/commit/ae9b462e033726a59a426df93aabfaa4a063471c))


### Features

* **cli:** switch to priority numbers rather than array position ([#555](https://github.com/linz/basemaps/issues/555)) ([5dde7fd](https://github.com/linz/basemaps/commit/5dde7fd50ce1ea0faeb27c25030890a6c2fd6440))
* support tileset history ([#537](https://github.com/linz/basemaps/issues/537)) ([06760d4](https://github.com/linz/basemaps/commit/06760d4f1a6a28d0edc4f40f55cdf9db8e91f93f))
* **vdom:** improve iterating tags and elementChildren ([5c85b37](https://github.com/linz/basemaps/commit/5c85b37f5de871ef0ea9dd08075dfc4dd7f1ace0))
* parse vrt files so we can modify them ([ef985d8](https://github.com/linz/basemaps/commit/ef985d8b018e86a0cc2fd9e873da96cbcda336e5))
* **wmts:** add fields and use URNs ([7e25b85](https://github.com/linz/basemaps/commit/7e25b85224ef28a9591c70dbea7b7a95b1bc48f2))
* **wmts:** increase max zoom level to 25 ([bc97ad3](https://github.com/linz/basemaps/commit/bc97ad38fef6ad15f50835784faa133c7b2dac88))





# [1.2.0](https://github.com/linz/basemaps/compare/v1.1.0...v1.2.0) (2020-03-25)


### Bug Fixes

* **wmts:** don't add api key if blank ([b16d4cd](https://github.com/linz/basemaps/commit/b16d4cd1761b7196b75c151859337a6b27b4aab6))
* **wmts:** fix tile width, CRS and url version and api key ([9f22932](https://github.com/linz/basemaps/commit/9f229327555eaf409d772ecf5f2ff271e766035e))
* **wmts:** respond with 304 if not modified ([42ac052](https://github.com/linz/basemaps/commit/42ac052b21e84bc62df9852725a558eaa38130a6))
* dont allow invalid urls to be passed to the rendering engine. ([90cc0de](https://github.com/linz/basemaps/commit/90cc0de72e0d096416ca01305cc8ff3e4ecaca27))
* lambda functions need a "handler" to be exported to run ([d45b60b](https://github.com/linz/basemaps/commit/d45b60b5171af5e0bfe87657fb5db31cbdcc65c7))
* offset is outside of the bounds. ([a3a786c](https://github.com/linz/basemaps/commit/a3a786c98aa0879d9d17af133c33996a87a830c4))
* update landing page and cli/serve to include aerial/3857 ([a604148](https://github.com/linz/basemaps/commit/a604148365b42417088821eca16487b63e7eaa58))


### Features

* **tile:** serve png, webp and jpeg ([44e9395](https://github.com/linz/basemaps/commit/44e93952dadfc4367f909fb1ac64cc811667d75b))
* **wmts:** set cache-control max-age=0 for WMTSCapabilities.xml ([3e2c008](https://github.com/linz/basemaps/commit/3e2c0080faadf15e31d7646b8b711e4510313600))
* adding suport for png, webp and jpeg tiles. ([8ad61e7](https://github.com/linz/basemaps/commit/8ad61e737a3cd153540abd8811bac680d00afeda))
* generate WMTSCapabilities.xml ([3e5ca52](https://github.com/linz/basemaps/commit/3e5ca52cd1b105c086c665e81cd6f2bc01eaacdb))
* plug in wmts into tracker and lambda servers ([e57681b](https://github.com/linz/basemaps/commit/e57681b3ef42def0dc1a11de23c4e0a6a264d3f5))





# [1.1.0](https://github.com/linz/basemaps/compare/v1.0.0...v1.1.0) (2020-02-20)


### Bug Fixes

* disable broken cogs until we can reprocess them ([43604ad](https://github.com/linz/basemaps/commit/43604ad2799f4ff8f12bf3f261d4c6d87b6853ea))
* limit the maximum zoom level for low resolution imagery ([c6e13a9](https://github.com/linz/basemaps/commit/c6e13a984bb6d6549daf5a5458e28a81039e1e5b))





# [1.0.0](https://github.com/linz/basemaps/compare/v0.3.0...v1.0.0) (2020-02-18)


* refactor!: split packages out in preperation for publishing. ([c6f5cbb](https://github.com/linz/basemaps/commit/c6f5cbb5514659ce446460bc8637e7a00e403a49))


### Bug Fixes

* correct a broken testing url ([5608176](https://github.com/linz/basemaps/commit/56081769498762de4c6c7a2ac0cc194b45264ab4))


### BREAKING CHANGES

* this splits out the lambda/node dependencies from javascript so packages can be published for the browser





# [0.3.0](https://github.com/linz/basemaps/compare/v0.2.0...v0.3.0) (2020-02-11)


### Bug Fixes

* imagery needs a stable sort ([c7ba799](https://github.com/linz/basemaps/commit/c7ba7993e1544f7d120f7612d17b6f427549d716))


### Features

* regional additions ([8d08889](https://github.com/linz/basemaps/commit/8d08889690baf28ec7f62306065a2c21758e4943))





# [0.2.0](https://github.com/linz/basemaps/compare/v0.1.0...v0.2.0) (2020-01-29)


### Bug Fixes

* new bathy imagery which improves the render quality ([a895d40](https://github.com/linz/basemaps/commit/a895d40dd76fa63f7fd034d40523b8db4b90969e))
* wait for the tiffs to load before trying to serve them ([2647c15](https://github.com/linz/basemaps/commit/2647c15b167574d228c00aa957864d114b5b7b26))
* warn when a COG cannot be found ([2677865](https://github.com/linz/basemaps/commit/2677865c0c36b2392bb368b6617bb5ee5c997dae))


### Features

* add dunedin urban 2018 ([9895bd7](https://github.com/linz/basemaps/commit/9895bd7ab35a01a2981e7261893bdf1ba9da2164))
* adding bay of plenty urban 2018/19 ([52a4528](https://github.com/linz/basemaps/commit/52a452800a59ad9cc7c1164873bfa2d58a2df027))
* adding more urban imagery sets ([0b98b4b](https://github.com/linz/basemaps/commit/0b98b4bea853ec1834dbb4c5bcb3c8ad1f140874))
* allow cli tiler to access data from s3 ([c033de3](https://github.com/linz/basemaps/commit/c033de32d09d69db997569ee61bd002f8ae62c82))





# 0.1.0 (2020-01-23)


### Bug Fixes

* bigint logging does not work ([2b3ed43](https://github.com/linz/basemaps/commit/2b3ed4380d4444120755eadfa41defc6c19ce4df))
* build some cogs ([8c1e6d9](https://github.com/linz/basemaps/commit/8c1e6d90ddf33aa852b69fdecebfd42fbb2a7045))
* correct text in response ([940244f](https://github.com/linz/basemaps/commit/940244f8540010ccb496f45b9ea0c1197cf1fef9))
* fixing path loading for s3 cogs ([fa86ed4](https://github.com/linz/basemaps/commit/fa86ed405b5ff1016c604338701c5da4f6f11e5d))
* headers need to be lowercased ([d0adc74](https://github.com/linz/basemaps/commit/d0adc74857380bd25ee429519e53dc728ff9e5b3))
* provide a new stream to pino instead of changing the internal one ([025abed](https://github.com/linz/basemaps/commit/025abed6d62ed3a8870d567702be5a4d074333d1))


### Features

* adding cli to serve xyz a folder of cogs on localhost:5050 ([eeb4d2b](https://github.com/linz/basemaps/commit/eeb4d2b7912d1dc358afbc8f6ade5c40f7c06250))
* adding gisborne_rural_2017-18_0.3m ([4491493](https://github.com/linz/basemaps/commit/449149344966948524b56f367cfd7c2de0cb3b1d))
* adding improved metrics ([2b97eb5](https://github.com/linz/basemaps/commit/2b97eb5efc47dc1ef46c50d073f5df04ff0017de))
* adding ping version and health endpoints ([af0a1dc](https://github.com/linz/basemaps/commit/af0a1dcddb80549971387cdda63f90dd0e64d755))
* basic mosaic support ([cbd8e4c](https://github.com/linz/basemaps/commit/cbd8e4c1cb91974c4bced766d1c5167a3ab6d99a))
* better cogify command ([8f086eb](https://github.com/linz/basemaps/commit/8f086eb18b079d3a0243c421bd82607de24463c0))
* create tests for xyz tile service ([5caf862](https://github.com/linz/basemaps/commit/5caf862a366ec27495f449c7d7595f62d383b56e))
* gebco bathymetry ([7936908](https://github.com/linz/basemaps/commit/7936908b384c564ee2293780b96ccfa5ecef4466))
* generate a ETag from the parameters for caching ([2d6c4be](https://github.com/linz/basemaps/commit/2d6c4be530fe52184664b812445444d0f90b6e79))
* gisborne urban 2018 ([083e46c](https://github.com/linz/basemaps/commit/083e46c328ef12ecd4fe2709412f5b66bf103ff0))
* include git version information in deployments ([5877005](https://github.com/linz/basemaps/commit/5877005b2cb5d4e24eb1cfc9cd108fa332cacaeb))
* include request id in http headers ([a80d3e0](https://github.com/linz/basemaps/commit/a80d3e030bd95c7617e8e1ab10b90fbdb86c1a03))
* increase logging around http method/path ([6282b41](https://github.com/linz/basemaps/commit/6282b410d873ce0b11db520accd88cb5d0eca107))
* increase metric tracking ([9408135](https://github.com/linz/basemaps/commit/94081354e612af1a6b4c4fe3b825df0fe134b493))
* initial tiler to be used inside of the xyz service ([2b6b6e3](https://github.com/linz/basemaps/commit/2b6b6e305bb54324984d00a64db3fdbb1fc73ba5))
* lambda xyz tile server ([f115dfd](https://github.com/linz/basemaps/commit/f115dfd48ee352a8fc90abbfcbea15778f6c0961))
* log out center of xyz tile from cloudfront requests too ([f0ca41e](https://github.com/linz/basemaps/commit/f0ca41eef8acbe82677642eeb3d9664bb467b3c7))
* log out center of xyz tile so that we can plot it on a map easily ([0cc380d](https://github.com/linz/basemaps/commit/0cc380d923ecceee8b50d008de02ef6bd74f15f1))
* new better bg43 COG ([7a88d17](https://github.com/linz/basemaps/commit/7a88d17692114954e7dd92a4872b657450c3712e))
* serve 1x1 pixel png instead of 404 ([4d27d1d](https://github.com/linz/basemaps/commit/4d27d1d3df2222ea48da905b98c4aa463c980ee7))
* serve a webmap when running a local debug server. ([6c2f41c](https://github.com/linz/basemaps/commit/6c2f41c55038401e7cdffc4bcb9242e6f91b7b74))
* simplify loading of required tiff files ([3676e52](https://github.com/linz/basemaps/commit/3676e52a03af44b74adba0218773bcd350427a0d))
* tile multiple datasets ([ae2d841](https://github.com/linz/basemaps/commit/ae2d841d3c81f992a8192d6de5534b49b30453f8))
* upgrade to cogeotiff 0.4.1 ([f161a67](https://github.com/linz/basemaps/commit/f161a67a539eb85eaf79e9af119bac777f0ca95a))
