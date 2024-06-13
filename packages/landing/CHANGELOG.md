# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [7.4.0](https://github.com/linz/basemaps/compare/v7.3.0...v7.4.0) (2024-06-13)


### Features

* add elevation control to landing page BM-993 ([#3278](https://github.com/linz/basemaps/issues/3278)) ([9d9cd27](https://github.com/linz/basemaps/commit/9d9cd27784f4656adfae3ecb848628c36bec5d91))
* **landing:** add elevation terrain-rgb to layer drop down BM-993 ([#3281](https://github.com/linz/basemaps/issues/3281)) ([8820217](https://github.com/linz/basemaps/commit/8820217e60baa17b39391385f3871e763042012a))
* **landing:** allow more tilting so users can see more of the horizon BM-993 ([#3283](https://github.com/linz/basemaps/issues/3283)) ([e0d9bb2](https://github.com/linz/basemaps/commit/e0d9bb2070ca151a6b7aca4c9c7f76bf93b93782))





# [7.3.0](https://github.com/linz/basemaps/compare/v7.2.0...v7.3.0) (2024-05-02)


### Bug Fixes

* **landing:** ensure the layer dropdown always showing for all outputs. BM-1001 ([#3241](https://github.com/linz/basemaps/issues/3241)) ([766f92b](https://github.com/linz/basemaps/commit/766f92bdfaf73747de0b64b36990f06aa57b2ff0))
* **landing:** Fix the set the tileset id same as style when only style parameter been set. ([#3249](https://github.com/linz/basemaps/issues/3249)) ([af643d6](https://github.com/linz/basemaps/commit/af643d6b4f00b609328b5fb93fd7a8e6286a1430))


### Features

* **landing:** Add off for the dem/dsm layer dropdown in debug page. BM-1019 ([#3240](https://github.com/linz/basemaps/issues/3240)) ([0f81ac3](https://github.com/linz/basemaps/commit/0f81ac36bc1abeb78daa8604a4db639ac655d6a4))





# [7.2.0](https://github.com/linz/basemaps/compare/v7.1.1...v7.2.0) (2024-04-08)


### Bug Fixes

* **landing:** Fix the ensure scalecontrol for the NZTM2000quad projection. BM-1004 ([#3219](https://github.com/linz/basemaps/issues/3219)) ([d1d92e2](https://github.com/linz/basemaps/commit/d1d92e27149009bb4c39c737315457bd80a4ea4a))





## [7.1.1](https://github.com/linz/basemaps/compare/v7.1.0...v7.1.1) (2024-03-25)

**Note:** Version bump only for package @basemaps/landing





# [7.1.0](https://github.com/linz/basemaps/compare/v7.0.0...v7.1.0) (2024-03-25)


### Bug Fixes

* **docs:** Ignore the .DS_Store file generated from swagger mkdocs plug in. ([#3025](https://github.com/linz/basemaps/issues/3025)) ([d3b1e6a](https://github.com/linz/basemaps/commit/d3b1e6a85df29f1a2075a96815c8404d4e827e4a))
* **landing:** disable scale control for NZTM as it is wrong BM-394 ([#3101](https://github.com/linz/basemaps/issues/3101)) ([b9ffb46](https://github.com/linz/basemaps/commit/b9ffb46dec56e148452e19c2f6eda211f85b2126))
* **landing:** do not remove and re-add the same layers ([#3198](https://github.com/linz/basemaps/issues/3198)) ([488307c](https://github.com/linz/basemaps/commit/488307c240f650756d7b1147eeff9fb5e1173a0a))
* **landing:** reduce bounds for nztm BM-394 ([#3054](https://github.com/linz/basemaps/issues/3054)) ([ab1b232](https://github.com/linz/basemaps/commit/ab1b232011daea057471689cc9ac5cde61bdc1c6))
* **landing:** use urls to upload files ([#3057](https://github.com/linz/basemaps/issues/3057)) ([bad67e4](https://github.com/linz/basemaps/commit/bad67e423ccf4a3cc8028447b7ad2c081d9ff13a))


### Features

* **landing:** Add Config Debug for screenshot elevation data. ([#3174](https://github.com/linz/basemaps/issues/3174)) ([0ee360d](https://github.com/linz/basemaps/commit/0ee360de5181d60c9358e9a739f20503ed7c0ebd))
* **landing:** add dropdown to configure a hillshade BM-991 ([#3202](https://github.com/linz/basemaps/issues/3202)) ([d8e7459](https://github.com/linz/basemaps/commit/d8e7459f15fdc2eca5fa921f15188c1066aafa1b))
* **landing:** add example of maplibre elevation with terrain-rgb ([#3137](https://github.com/linz/basemaps/issues/3137)) ([2c15510](https://github.com/linz/basemaps/commit/2c15510e42f8e418342270defa7db3578f5ed442))
* **landing:** Enable elevation preview in the basemaps debug page ([#3161](https://github.com/linz/basemaps/issues/3161)) ([b902599](https://github.com/linz/basemaps/commit/b902599e0a574b71eb698287aeefc2cd5dd853d4))
* **landing:** exaggerate the terrain when viewing in NZTM BM-983 ([#3199](https://github.com/linz/basemaps/issues/3199)) ([b65a695](https://github.com/linz/basemaps/commit/b65a695879d7a11e11ee4d327faca28c7863d05f))
* **landing:** upgrade lui ([#3033](https://github.com/linz/basemaps/issues/3033)) ([47919bb](https://github.com/linz/basemaps/commit/47919bb224d7e3a49c40be0d1999ad768e343958))
* **landing:** upgrade maplibre and include scale ([#3031](https://github.com/linz/basemaps/issues/3031)) ([fa3e663](https://github.com/linz/basemaps/commit/fa3e6632fe67ab67015aa375395ef74775753ee3))
* move to query parameters for pipeline selection ([#3136](https://github.com/linz/basemaps/issues/3136)) ([32c501c](https://github.com/linz/basemaps/commit/32c501c76301c69639eb412fac80f488f65ad3fb))
* upgrade to typescript 5 ([#3019](https://github.com/linz/basemaps/issues/3019)) ([53aeebb](https://github.com/linz/basemaps/commit/53aeebbf07f173ac01aab0300d6e430159817c7e))





# [7.0.0](https://github.com/linz/basemaps/compare/v6.46.0...v7.0.0) (2023-11-27)


### Bug Fixes

* head can throw "NotFound" ([#2992](https://github.com/linz/basemaps/issues/2992)) ([5d63672](https://github.com/linz/basemaps/commit/5d63672b41ead80eda95ec4baa7a445fbf69d272))
* only invalidate top level directories ([#2993](https://github.com/linz/basemaps/issues/2993)) ([c36ab5d](https://github.com/linz/basemaps/commit/c36ab5d5b88f746bbec77b4b12ba4755774347ad))
* reduce the number of cloudfront invalidations ([#2991](https://github.com/linz/basemaps/issues/2991)) ([786e4e9](https://github.com/linz/basemaps/commit/786e4e9e3ece1410cb77983baa3a887e198d69b2))


### Features

* Add proof of concept docs site BM-917 ([#2990](https://github.com/linz/basemaps/issues/2990)) ([cabccc7](https://github.com/linz/basemaps/commit/cabccc730de0c0016e9d102dc8df6acbf1510e00))
* **doc:** Improve the individual package documentations. BM-776 ([#2981](https://github.com/linz/basemaps/issues/2981)) ([5a4adcb](https://github.com/linz/basemaps/commit/5a4adcbbff15857a6f4c315d54280d542f785fec))





# [6.46.0](https://github.com/linz/basemaps/compare/v6.45.0...v6.46.0) (2023-10-10)


### Bug Fixes

* **landing:** correct broken tileset name ([#2974](https://github.com/linz/basemaps/issues/2974)) ([3c92d3f](https://github.com/linz/basemaps/commit/3c92d3f1ff8b546ce240f0f401ebce2c727cc222))


### Features

* **landing:** hard code scanned aerial imagery layers BM-892 ([#2970](https://github.com/linz/basemaps/issues/2970)) ([62697c3](https://github.com/linz/basemaps/commit/62697c3a1e344a4de0a236bf48042ae138db5620))
* **landing:** track when the map switcher is clicked ([#2971](https://github.com/linz/basemaps/issues/2971)) ([fa5d77d](https://github.com/linz/basemaps/commit/fa5d77d4dc2b3efccb43859489fdcb25c95a053c))





# [6.45.0](https://github.com/linz/basemaps/compare/v6.44.0...v6.45.0) (2023-09-18)

**Note:** Version bump only for package @basemaps/landing





# [6.44.0](https://github.com/linz/basemaps/compare/v6.43.0...v6.44.0) (2023-09-05)


### Features

* add og:image preview to all basemaps links BM-264 ([#2925](https://github.com/linz/basemaps/issues/2925)) ([de00528](https://github.com/linz/basemaps/commit/de005285eac0c2f5e2c83c8eeaa61aafeff8edde))
* **landing:** increase visual prominence of category in layer dropdown ([#2917](https://github.com/linz/basemaps/issues/2917)) ([f158f57](https://github.com/linz/basemaps/commit/f158f571c6a3725b4b5283a9f23dcf844ebe037b)), closes [#999999](https://github.com/linz/basemaps/issues/999999) [#00425](https://github.com/linz/basemaps/issues/00425)
* **landing:** Order the categories in the layer dropdown BM-880 ([#2916](https://github.com/linz/basemaps/issues/2916)) ([7f70bd0](https://github.com/linz/basemaps/commit/7f70bd0098ee6b85d761203e46106bf3a9883adf))





# [6.43.0](https://github.com/linz/basemaps/compare/v6.42.1...v6.43.0) (2023-08-22)


### Features

* **landing:** Ignore layers in the layer drop down selector. ([#2886](https://github.com/linz/basemaps/issues/2886)) ([98633cb](https://github.com/linz/basemaps/commit/98633cb304cc4cd3a993aff8ca379e871f04f054))
* **landing:** Update the layer selector to use all imagery tileset. BM-807 ([#2809](https://github.com/linz/basemaps/issues/2809)) ([10eb750](https://github.com/linz/basemaps/commit/10eb750b32dccb4a5f5496862bebb7cb51ca8ee9))
* add github build id to cli, landing and tiler ([#2874](https://github.com/linz/basemaps/issues/2874)) ([eb8c7b9](https://github.com/linz/basemaps/commit/eb8c7b97822cda117c38d0341a5d6e3506c63c57))





# [6.41.0](https://github.com/linz/basemaps/compare/v6.40.0...v6.41.0) (2023-07-26)


### Bug Fixes

* ensure layer loads when dateBefore set early, then moved back late ([#2701](https://github.com/linz/basemaps/issues/2701)) ([1b34d9a](https://github.com/linz/basemaps/commit/1b34d9ab2d51ba298398d036aef62a151ca05af6))


### Features

* **landing:** show number of COGs in current imagery ([#2772](https://github.com/linz/basemaps/issues/2772)) ([78a019a](https://github.com/linz/basemaps/commit/78a019a1eb8c0c9e028601e7597b1e730674f401))
* **landing:** toggle to show map tile boundaries ([#2758](https://github.com/linz/basemaps/issues/2758)) ([d7f0b50](https://github.com/linz/basemaps/commit/d7f0b5001bd2fe06c7a0dfaa82c35d194ac8ac30))
* **landing:** update and load date range from window URL ([#2691](https://github.com/linz/basemaps/issues/2691)) ([ac1e02d](https://github.com/linz/basemaps/commit/ac1e02d9c8a61aa58b66c36b2df87f46e9f3f2ae))
* **landing:** Update the daterange slider to years button. ([#2764](https://github.com/linz/basemaps/issues/2764)) ([ef93543](https://github.com/linz/basemaps/commit/ef935433df6065f4baeb458b3c8a9efec06621fa))





# [6.40.0](https://github.com/linz/basemaps/compare/v6.39.0...v6.40.0) (2023-03-16)


### Bug Fixes

* **landing:** Stop set state in the render which lead to infinite loop ([#2706](https://github.com/linz/basemaps/issues/2706)) ([a7530b0](https://github.com/linz/basemaps/commit/a7530b0bd6b634a4d613f29b4174cc0f7b313b77))
* pass config id to tile url ([#2683](https://github.com/linz/basemaps/issues/2683)) ([271e6c4](https://github.com/linz/basemaps/commit/271e6c40ee56f67054af7d093b03be7a810e3b96))


### Features

* **landing:** Disable the date range slider as default and use debug.date to show it. ([#2737](https://github.com/linz/basemaps/issues/2737)) ([60c0bbf](https://github.com/linz/basemaps/commit/60c0bbfe9956a94a6f04153b285bcc9dcdc79b01))
* use transition property for fades, add fade when removing layer ([#2702](https://github.com/linz/basemaps/issues/2702)) ([0bee2df](https://github.com/linz/basemaps/commit/0bee2df6f9f9d9b56982e04b24350a6ef91fbd68))
* **landing:** Change structure of WindowUrl.toTileUrl to receive args object ([#2703](https://github.com/linz/basemaps/issues/2703)) ([d725fd3](https://github.com/linz/basemaps/commit/d725fd3677e14a3d58d1dd13eb67a83f6a5e934d))
* add proof of concept date range slider ([#2681](https://github.com/linz/basemaps/issues/2681)) ([e9bdad5](https://github.com/linz/basemaps/commit/e9bdad545a28b230d81f54090b15fe230a4a5d04))
* **landing:** add copyright link ([#2672](https://github.com/linz/basemaps/issues/2672)) ([ad87344](https://github.com/linz/basemaps/commit/ad87344b247ea6214bc3223fbace65ec5d5c9bd2))





# [6.39.0](https://github.com/linz/basemaps/compare/v6.38.0...v6.39.0) (2023-01-25)


### Features

* **landing:** Hidden overflow title in the debug page. ([#2625](https://github.com/linz/basemaps/issues/2625)) ([cd3a192](https://github.com/linz/basemaps/commit/cd3a192b019bc822ba4127f5304092949ef54615))





# [6.38.0](https://github.com/linz/basemaps/compare/v6.37.0...v6.38.0) (2022-12-11)


### Features

* **landing:** Add title for the debug page. ([#2620](https://github.com/linz/basemaps/issues/2620)) ([6b8c3ab](https://github.com/linz/basemaps/commit/6b8c3ab121d5a7ae5ac5906952537ff26d0eb44b))





# [6.37.0](https://github.com/linz/basemaps/compare/v6.36.0...v6.37.0) (2022-12-05)


### Bug Fixes

* **landing:** do not install bundled deps when installing landing ([#2581](https://github.com/linz/basemaps/issues/2581)) ([acd6def](https://github.com/linz/basemaps/commit/acd6defd139828c21dd4ca91dda8c4da90ff1ffc))





# [6.36.0](https://github.com/linz/basemaps/compare/v6.35.0...v6.36.0) (2022-10-18)


### Bug Fixes

* **landing:** cache requests to source/covering data ([#2532](https://github.com/linz/basemaps/issues/2532)) ([f780c3a](https://github.com/linz/basemaps/commit/f780c3a10251671f97e8a87da5e585e7bdba9167))
* **landing:** dont show "undefined" as a cog name ([#2530](https://github.com/linz/basemaps/issues/2530)) ([a83c998](https://github.com/linz/basemaps/commit/a83c9987c5fb0a3005e15ee3e980c6ca152ebb56))
* **landing:** Udate contact button to lui primary style as the lui tertiary style changed. ([#2546](https://github.com/linz/basemaps/issues/2546)) ([7ef8e9d](https://github.com/linz/basemaps/commit/7ef8e9ddc2a60d61c2b89dd3b71e6d1d2f3cba9b))


### Features

* searchable layer dropdown ([#2543](https://github.com/linz/basemaps/issues/2543)) ([e331835](https://github.com/linz/basemaps/commit/e331835ad5f79680d04385b7c2babcd90790ac8f))
* **landing:** add link to WMTS on debug page ([#2531](https://github.com/linz/basemaps/issues/2531)) ([f061b71](https://github.com/linz/basemaps/commit/f061b71f664080e100591a2fd689745d4d104490))
* **landing:** Add the zoomToExtent checkbox for layer selector #BM-666 ([#2525](https://github.com/linz/basemaps/issues/2525)) ([cf23c3a](https://github.com/linz/basemaps/commit/cf23c3a66d13f5b0739c73320984996eb65eb1f9)), closes [#BM-666](https://github.com/linz/basemaps/issues/BM-666)
* **landing:** improve the geojson download when clicking the "source" button ([#2529](https://github.com/linz/basemaps/issues/2529)) ([ac5771c](https://github.com/linz/basemaps/commit/ac5771c6c1b3541066a0f8cc989089dc2aa7aee8))
* **landing:** show a toast message when things are copied ([#2533](https://github.com/linz/basemaps/issues/2533)) ([1d74fda](https://github.com/linz/basemaps/commit/1d74fdaea185b8d86c88356e077e24974c72f2ba))





# [6.35.0](https://github.com/linz/basemaps/compare/v6.34.0...v6.35.0) (2022-09-14)


### Bug Fixes

* **landing:** base url should include config ([#2452](https://github.com/linz/basemaps/issues/2452)) ([3414d90](https://github.com/linz/basemaps/commit/3414d9074fc27223c99957029f5ab862d551aa13))
* **landing:** ensure tileMatrix is being passed correctly ([#2454](https://github.com/linz/basemaps/issues/2454)) ([3b66dee](https://github.com/linz/basemaps/commit/3b66dee9700074d578328d434cae9c6f6c20dfff))
* **landing:** ensure url is loaded before render ([#2449](https://github.com/linz/basemaps/issues/2449)) ([73518a7](https://github.com/linz/basemaps/commit/73518a7e9c5cab823f8e70f7d0a964a119ec25cc))
* **landing:** force config to always be in base58 ([#2463](https://github.com/linz/basemaps/issues/2463)) ([a2447e9](https://github.com/linz/basemaps/commit/a2447e9228c1fdc2f28af70699261f200a201226))


### Features

* **cli:** move screenshot tool into linz/basemaps-screenshot ([#2429](https://github.com/linz/basemaps/issues/2429)) ([27463d3](https://github.com/linz/basemaps/commit/27463d35b424669d6f2e945184a0b15ca3067801))
* **cli:** New cli to create cog map sheet from a give fgb file and config. ([#2472](https://github.com/linz/basemaps/issues/2472)) ([6cf2563](https://github.com/linz/basemaps/commit/6cf25638e2ae4fe365aa78ab77cd0d319c02d7a0))
* **landing:** always use latest config for the aerial layer ([#2464](https://github.com/linz/basemaps/issues/2464)) ([4f0a1fb](https://github.com/linz/basemaps/commit/4f0a1fbc41b30609ee9e4eb1582f6b5cd68aedfd))
* **landing:** Disable the debug.cog checkbox when loading config outside basemaps. ([#2494](https://github.com/linz/basemaps/issues/2494)) ([37ce12b](https://github.com/linz/basemaps/commit/37ce12b1503f1e4ec6f73c3a0622948d220a9056))
* **landing:** Load config into debug pages. ([#2486](https://github.com/linz/basemaps/issues/2486)) ([bf6b601](https://github.com/linz/basemaps/commit/bf6b601e46ee4693122dfa23ac18566ebc084aa4))
* support styles from raster tile sets ([#2444](https://github.com/linz/basemaps/issues/2444)) ([bcd521f](https://github.com/linz/basemaps/commit/bcd521f3d240f07a41a4b09a2874d49283bcd3de))





# [6.34.0](https://github.com/linz/basemaps/compare/v6.33.0...v6.34.0) (2022-08-17)

**Note:** Version bump only for package @basemaps/landing





# [6.33.0](https://github.com/linz/basemaps/compare/v6.32.2...v6.33.0) (2022-08-01)

**Note:** Version bump only for package @basemaps/landing





## [6.32.2](https://github.com/linz/basemaps/compare/v6.32.1...v6.32.2) (2022-07-28)

**Note:** Version bump only for package @basemaps/landing





## [6.32.1](https://github.com/linz/basemaps/compare/v6.32.0...v6.32.1) (2022-07-28)

**Note:** Version bump only for package @basemaps/landing





# [6.32.0](https://github.com/linz/basemaps/compare/v6.31.0...v6.32.0) (2022-07-28)

**Note:** Version bump only for package @basemaps/landing





# [6.31.0](https://github.com/linz/basemaps/compare/v6.30.0...v6.31.0) (2022-07-22)


### Bug Fixes

* **landing:** ignore all layers with " dem " in the title ([#2350](https://github.com/linz/basemaps/issues/2350)) ([a90e179](https://github.com/linz/basemaps/commit/a90e179754b950ab319181789830b7bcdd8e8713))
* **landing:** remove full screen button in debug mode as it obsures text BM-635 ([#2344](https://github.com/linz/basemaps/issues/2344)) ([052f45c](https://github.com/linz/basemaps/commit/052f45c3625704aeada3bd3d7bba2550c99268d5))


### Features

* upgrade proj to 2.8.0 as it has improved transverse mercator projection logic BM-631 ([#2346](https://github.com/linz/basemaps/issues/2346)) ([4b74efb](https://github.com/linz/basemaps/commit/4b74efb07f69ceeaea9351d8e8012bc214c7614c))





# [6.30.0](https://github.com/linz/basemaps/compare/v6.29.0...v6.30.0) (2022-07-20)


### Bug Fixes

* **lambda-tiler:** allow /v1/tiles/WMTSCapabilities.xml and default to using "aerial" ([#2329](https://github.com/linz/basemaps/issues/2329)) ([4615d3a](https://github.com/linz/basemaps/commit/4615d3a776fb6f5b9bed86824b931224469ed278))
* **landing:** disable vector tiles in nztm ([#2319](https://github.com/linz/basemaps/issues/2319)) ([6c6acd5](https://github.com/linz/basemaps/commit/6c6acd5747af853577269f853b4109f02a61e05f))
* **landing:** do not duplicate the basemap layers in the layer selector ([#2330](https://github.com/linz/basemaps/issues/2330)) ([c1e73f4](https://github.com/linz/basemaps/commit/c1e73f431503d26affb96648925328e93bb9ba5a))
* **landing:** lookup epsg code for layers from the tile matrix id ([#2302](https://github.com/linz/basemaps/issues/2302)) ([bd36eba](https://github.com/linz/basemaps/commit/bd36eba474966c52cf9a7bf14d5da39a26e06fdb))
* **landing:** Remove the check for layer switcher ([#2294](https://github.com/linz/basemaps/issues/2294)) ([43cd22b](https://github.com/linz/basemaps/commit/43cd22b5f82969fda540945c638a149a833072db))
* **landing:** wait for map to be actually loaded before adding a "#map-loaded" div ([#2298](https://github.com/linz/basemaps/issues/2298)) ([1b18400](https://github.com/linz/basemaps/commit/1b18400924c50f2096e16d20f4434cf82fee5e26))


### Features

* **lambda-tiler:** prefer WebMercatorQuad for tileMatrix name over EPSG:3857 ([#2295](https://github.com/linz/basemaps/issues/2295)) ([a35f239](https://github.com/linz/basemaps/commit/a35f23986d78d18d1204b0993d78faffc434cba3))
* **shared:** update wmts titles to use imagery title and category ([#2285](https://github.com/linz/basemaps/issues/2285)) ([2580636](https://github.com/linz/basemaps/commit/25806362b322e075bb25ce058e6e56d582b84320))





# [6.29.0](https://github.com/linz/basemaps/compare/v6.28.1...v6.29.0) (2022-06-27)


### Bug Fixes

* **cli:** ensure cli can run inside of docker ([#2273](https://github.com/linz/basemaps/issues/2273)) ([8184167](https://github.com/linz/basemaps/commit/81841674efba2f86d9a39d01af62fccb1fe6f70f))
* **landing:** ensure the bundled assets are exported ([#2244](https://github.com/linz/basemaps/issues/2244)) ([863c374](https://github.com/linz/basemaps/commit/863c37435dabdb26b0540b071004160c882b6011))





## [6.28.1](https://github.com/linz/basemaps/compare/v6.28.0...v6.28.1) (2022-06-07)

**Note:** Version bump only for package @basemaps/landing





# [6.28.0](https://github.com/linz/basemaps/compare/v6.27.0...v6.28.0) (2022-06-06)

**Note:** Version bump only for package @basemaps/landing





# [6.27.0](https://github.com/linz/basemaps/compare/v6.26.0...v6.27.0) (2022-05-29)


### Bug Fixes

* **landing:** remove the version information from the screenshot view ([#2198](https://github.com/linz/basemaps/issues/2198)) ([b982061](https://github.com/linz/basemaps/commit/b98206131c193a9ea3e70d97148b14943839ace0))


### Features

* **landing:** remove debug overlays to make it easier to screenshot ([#2193](https://github.com/linz/basemaps/issues/2193)) ([81dd275](https://github.com/linz/basemaps/commit/81dd2757690ccc21d3d6898108e1c23daf682458))
* **server:** use a bundled `@basemaps/landing` to serve static assets ([#2202](https://github.com/linz/basemaps/issues/2202)) ([c60f518](https://github.com/linz/basemaps/commit/c60f518893fe037a03f8bfd489c84d8427481678))





# [6.26.0](https://github.com/linz/basemaps/compare/v6.25.0...v6.26.0) (2022-05-12)

**Note:** Version bump only for package @basemaps/landing





# [6.25.0](https://github.com/linz/basemaps/compare/v6.24.2...v6.25.0) (2022-05-11)


### Bug Fixes

* **landing:** force the vector source layer to be above the raster imager ([#2185](https://github.com/linz/basemaps/issues/2185)) ([31f7708](https://github.com/linz/basemaps/commit/31f7708f8cc5d6180d879248c6677d0b6cf3307a))


### Features

* **landing:** add aerial basemap to landing debug ([#2174](https://github.com/linz/basemaps/issues/2174)) ([b16b905](https://github.com/linz/basemaps/commit/b16b90541d62c02b9fed0a4f423279668c364c25))
* **landing:** add debug state into URL bar ([#2175](https://github.com/linz/basemaps/issues/2175)) ([da1833a](https://github.com/linz/basemaps/commit/da1833a1d603300ddcbc2405a341a303daebc125))
* **landing:** support geojson reprojection into NZTM with maplibre ([#2178](https://github.com/linz/basemaps/issues/2178)) ([79e8845](https://github.com/linz/basemaps/commit/79e88450d533c5a5bb9cbd99dc968adcb369835d))





## [6.24.2](https://github.com/linz/basemaps/compare/v6.24.1...v6.24.2) (2022-04-20)

**Note:** Version bump only for package @basemaps/landing





## [6.24.1](https://github.com/linz/basemaps/compare/v6.24.0...v6.24.1) (2022-04-07)

**Note:** Version bump only for package @basemaps/landing





# [6.24.0](https://github.com/linz/basemaps/compare/v6.23.0...v6.24.0) (2022-04-05)


### Bug Fixes

* **landing:** locate button does not work in nztm so disable it ([#2140](https://github.com/linz/basemaps/issues/2140)) ([957b612](https://github.com/linz/basemaps/commit/957b61230c749349eaf8d4a41e226865eb058484))
* **landing:** only show layers that can be viewed in the layer picker ([#2136](https://github.com/linz/basemaps/issues/2136)) ([ac3dade](https://github.com/linz/basemaps/commit/ac3dadef400440f01ae9886c087e1a242193e99e))


### Features

* **landing:** add full screen button ([#2138](https://github.com/linz/basemaps/issues/2138)) ([293a14b](https://github.com/linz/basemaps/commit/293a14b429b7532b193e674c92e59e8f1e88adeb))
* **landing:** add zoom to location button ([#2137](https://github.com/linz/basemaps/issues/2137)) ([4ff217d](https://github.com/linz/basemaps/commit/4ff217de36319e47370b63cde6cc8ff959228332))
* **landing:** move zoom to location to top left ([#2142](https://github.com/linz/basemaps/issues/2142)) ([be4cd38](https://github.com/linz/basemaps/commit/be4cd38911a9bd6acceed03834adec31219f73fe))





# [6.23.0](https://github.com/linz/basemaps/compare/v6.22.1...v6.23.0) (2022-04-04)

**Note:** Version bump only for package @basemaps/landing





## [6.22.1](https://github.com/linz/basemaps/compare/v6.22.0...v6.22.1) (2022-03-23)

**Note:** Version bump only for package @basemaps/landing





# [6.22.0](https://github.com/linz/basemaps/compare/v6.21.1...v6.22.0) (2022-03-20)


### Bug Fixes

* **landing:** correct attribution example ([#2118](https://github.com/linz/basemaps/issues/2118)) ([c6b0a96](https://github.com/linz/basemaps/commit/c6b0a966f13e9523b6542bba7f1f936674fd624a))





## [6.21.1](https://github.com/linz/basemaps/compare/v6.21.0...v6.21.1) (2022-03-17)

**Note:** Version bump only for package @basemaps/landing





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-17)


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2111) ([d07f8ab](https://github.com/linz/basemaps/commit/d07f8ab4037466b060bf7e83960737554ff064b4)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2111](https://github.com/linz/basemaps/issues/2111)
* Revert "release: v6.22.0 (#2108)" (#2110) ([abcd2e4](https://github.com/linz/basemaps/commit/abcd2e4732a6d606eed865f526d6df2e4617aad3)), closes [#2108](https://github.com/linz/basemaps/issues/2108) [#2110](https://github.com/linz/basemaps/issues/2110)
* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.20.0](https://github.com/linz/basemaps/compare/v6.19.0...v6.20.0) (2022-02-01)


### Features

* **landing:** show source id when hovering in the source layer ([#2039](https://github.com/linz/basemaps/issues/2039)) ([865bab9](https://github.com/linz/basemaps/commit/865bab92109d5b5241664af7fc970494dacafeec))





# [6.19.0](https://github.com/linz/basemaps/compare/v6.18.1...v6.19.0) (2021-12-20)


### Bug Fixes

* **landing:** disable osm/topographic for nztm as it doesnt work ([#2031](https://github.com/linz/basemaps/issues/2031)) ([f1eff90](https://github.com/linz/basemaps/commit/f1eff90f4cafeeef9b09e3041b8e144a5b795488))


### Features

* **landing:** allow using the topographic vector map as a debug layer ([#2030](https://github.com/linz/basemaps/issues/2030)) ([2d4a05b](https://github.com/linz/basemaps/commit/2d4a05bc8ebfe0041155b9ead93f4235b9c52657))
* **landing:** rendering source imagery bounds ([#2035](https://github.com/linz/basemaps/issues/2035)) ([2e30936](https://github.com/linz/basemaps/commit/2e30936c20fef73831082583120c096f51dc01e4))





## [6.18.1](https://github.com/linz/basemaps/compare/v6.18.0...v6.18.1) (2021-12-16)


### Bug Fixes

* **landing:** enable debug page ([#2026](https://github.com/linz/basemaps/issues/2026)) ([b9639c9](https://github.com/linz/basemaps/commit/b9639c91537daa5ec4767e3649ab7aeb00673e1b))
* **landing:** Trigger change event when debug value changes and disable switcher for debug mode. ([#2027](https://github.com/linz/basemaps/issues/2027)) ([aa26041](https://github.com/linz/basemaps/commit/aa26041da186654c86732f97c95708d1eb438622))





# [6.18.0](https://github.com/linz/basemaps/compare/v6.17.0...v6.18.0) (2021-12-14)


### Bug Fixes

* **landing:** correctly track the event name of the layer ([#2018](https://github.com/linz/basemaps/issues/2018)) ([d2b8d62](https://github.com/linz/basemaps/commit/d2b8d62f8e57303dc0d4f13c1ed3fffca97e73d2))
* **landing:** Fix the update bounds for nztm tilematrix when switching layers. ([#2017](https://github.com/linz/basemaps/issues/2017)) ([230ac63](https://github.com/linz/basemaps/commit/230ac630fcd3848f5ddb3a4ee215121658d0ced7))





# [6.17.0](https://github.com/linz/basemaps/compare/v6.16.1...v6.17.0) (2021-12-05)


### Bug Fixes

* **landing:** Fix attribution not update when switching map ([#2013](https://github.com/linz/basemaps/issues/2013)) ([0e69684](https://github.com/linz/basemaps/commit/0e69684b7e4f1df0013db2d95913e64e3c5aa201))


### Features

* **landing:** Add vector attribution in landing page. ([#2012](https://github.com/linz/basemaps/issues/2012)) ([dad03fd](https://github.com/linz/basemaps/commit/dad03fd57a1cd384f278e2a0a047108162e7fe0f))
* **landing:** ignore geographx from the attribution list ([#2009](https://github.com/linz/basemaps/issues/2009)) ([3530e46](https://github.com/linz/basemaps/commit/3530e468ef0fbae22130f841eeec77a5892e08b8))
* **landing:** Round location transform to 8 decimals ([#2014](https://github.com/linz/basemaps/issues/2014)) ([73f6be3](https://github.com/linz/basemaps/commit/73f6be3d36edad7dcaa175ad4c853ea5579d8047))
* **landing:** use topographic name not topolike ([#2008](https://github.com/linz/basemaps/issues/2008)) ([a281d87](https://github.com/linz/basemaps/commit/a281d874ae8211447282ad41dd497e96689ceb88))





## [6.16.1](https://github.com/linz/basemaps/compare/v6.16.0...v6.16.1) (2021-11-30)

**Note:** Version bump only for package @basemaps/landing





# [6.16.0](https://github.com/linz/basemaps/compare/v6.15.0...v6.16.0) (2021-11-29)


### Features

* **landing:** upgrade to lui v10 ([#1990](https://github.com/linz/basemaps/issues/1990)) ([c7866b6](https://github.com/linz/basemaps/commit/c7866b6e44293f09365f47afb8d0e88212458210))





# [6.15.0](https://github.com/linz/basemaps/compare/v6.14.2...v6.15.0) (2021-11-28)


### Bug Fixes

* **landing:** copy links should not be editable ([#1980](https://github.com/linz/basemaps/issues/1980)) ([f668e6e](https://github.com/linz/basemaps/commit/f668e6e47b4015516b8209624ccb372906fb788a))
* **landing:** Fix the loading map by url coordinates for nztm ([#1992](https://github.com/linz/basemaps/issues/1992)) ([315ff34](https://github.com/linz/basemaps/commit/315ff341eb55b53c766883110fcce6d888ece5be))
* **landing:** limit the WMTS links to those which are valid for the layer ([#1982](https://github.com/linz/basemaps/issues/1982)) ([9afe6a0](https://github.com/linz/basemaps/commit/9afe6a0d598749273037db3e3c5c1bd5691ef6cf))
* **landing:** load the correct layer on first load ([#1984](https://github.com/linz/basemaps/issues/1984)) ([9231890](https://github.com/linz/basemaps/commit/92318902b58ed1e847591915f61e52321e75c42b))
* **landing:** use better keys for event tracking ([#1981](https://github.com/linz/basemaps/issues/1981)) ([90d1619](https://github.com/linz/basemaps/commit/90d1619c3faefcf128050d9a8515ad1fd457f48f))


### Features

* **landing:** add split-io to turn features on and off ([#1967](https://github.com/linz/basemaps/issues/1967)) ([8fa51dd](https://github.com/linz/basemaps/commit/8fa51dd30938c1a5909a3531967f2047911af218))
* **landing:** combine vector and raster bastemaps categories ([#1988](https://github.com/linz/basemaps/issues/1988)) ([def9c98](https://github.com/linz/basemaps/commit/def9c985121e5c062ee73515e128a5004e54b057))
* **landing:** make the layer switcher button similar to navigation button ([#1989](https://github.com/linz/basemaps/issues/1989)) ([f436612](https://github.com/linz/basemaps/commit/f4366128488aef04c2466cb2915e48741ea6ecc2))
* **landing:** show pbf XYZ url for vector tiles ([#1983](https://github.com/linz/basemaps/issues/1983)) ([7b1a9b9](https://github.com/linz/basemaps/commit/7b1a9b9ac13f85c7da48463c1ea23af9b19c383f))
* **landing:** simple layer switcher dropdown ([#1971](https://github.com/linz/basemaps/issues/1971)) ([3ff191e](https://github.com/linz/basemaps/commit/3ff191e380f519de6f19cbf624bbd56ef9483703))
* **landing:** sort layers by name ([#1978](https://github.com/linz/basemaps/issues/1978)) ([2154cf9](https://github.com/linz/basemaps/commit/2154cf945b4de914a5caeaa116f12bc48e99fe82))
* **landing:** support attribution for individual layers ([#1979](https://github.com/linz/basemaps/issues/1979)) ([b6822aa](https://github.com/linz/basemaps/commit/b6822aa850287fc242f7c300e0126f0e7d6f8953))
* **landing:** support layer switcher button ([#1987](https://github.com/linz/basemaps/issues/1987)) ([67056d6](https://github.com/linz/basemaps/commit/67056d6a4c143fe92fc3e1181bcb185a5d359da2))
* **landing:** switch to vdom based rendering ([#1976](https://github.com/linz/basemaps/issues/1976)) ([1b4575c](https://github.com/linz/basemaps/commit/1b4575cf7a9e5ffc3a001664de9319af89234728))





## [6.14.2](https://github.com/linz/basemaps/compare/v6.14.1...v6.14.2) (2021-11-09)

**Note:** Version bump only for package @basemaps/landing





## [6.14.1](https://github.com/linz/basemaps/compare/v6.14.0...v6.14.1) (2021-10-27)

**Note:** Version bump only for package @basemaps/landing





# [6.13.0](https://github.com/linz/basemaps/compare/v6.12.2...v6.13.0) (2021-10-25)


### Features

* **cli:** expose uploading static files ([#1925](https://github.com/linz/basemaps/issues/1925)) ([ce85cd9](https://github.com/linz/basemaps/commit/ce85cd9bfe9802046e9cbbfbf8ae663c427dd1a1))





## [6.12.1](https://github.com/linz/basemaps/compare/v6.12.0...v6.12.1) (2021-10-19)

**Note:** Version bump only for package @basemaps/landing





# [6.12.0](https://github.com/linz/basemaps/compare/v6.11.0...v6.12.0) (2021-10-05)

**Note:** Version bump only for package @basemaps/landing





# [6.11.0](https://github.com/linz/basemaps/compare/v6.10.1...v6.11.0) (2021-10-03)

**Note:** Version bump only for package @basemaps/landing





## [6.10.1](https://github.com/linz/basemaps/compare/v6.10.0...v6.10.1) (2021-09-22)

**Note:** Version bump only for package @basemaps/landing





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Features

* **landing:** support linkedin/twitter cards ([#1864](https://github.com/linz/basemaps/issues/1864)) ([91e3837](https://github.com/linz/basemaps/commit/91e3837fc99f49adcd2da719b2e82504e9dee42a))
* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/landing





# [6.9.0](https://github.com/linz/basemaps/compare/v6.8.0...v6.9.0) (2021-09-09)

**Note:** Version bump only for package @basemaps/landing





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)


### Features

* **landing:** support prefixed imagery links starts with im_ ([#1815](https://github.com/linz/basemaps/issues/1815)) ([7fadece](https://github.com/linz/basemaps/commit/7fadecef7a6153b0bd973167f816108584aaf99a))





# [6.7.0](https://github.com/linz/basemaps/compare/v6.6.1...v6.7.0) (2021-08-15)

**Note:** Version bump only for package @basemaps/landing





## [6.6.1](https://github.com/linz/basemaps/compare/v6.6.0...v6.6.1) (2021-07-29)

**Note:** Version bump only for package @basemaps/landing





# [6.6.0](https://github.com/linz/basemaps/compare/v6.5.0...v6.6.0) (2021-07-29)

**Note:** Version bump only for package @basemaps/landing





# [6.5.0](https://github.com/linz/basemaps/compare/v6.4.0...v6.5.0) (2021-07-25)


### Bug Fixes

* **s3fs:** more specific file systems should be matched first ([#1767](https://github.com/linz/basemaps/issues/1767)) ([0c7df8c](https://github.com/linz/basemaps/commit/0c7df8c1732459fdf0ee0e62a33fcca124ae0779))


### Features

* **landing:** add debug viewer with ?debug=true ([#1778](https://github.com/linz/basemaps/issues/1778)) ([96434ba](https://github.com/linz/basemaps/commit/96434babb95a0dcf206c6183fa66079f546bad58))





# [6.4.0](https://github.com/linz/basemaps/compare/v6.3.0...v6.4.0) (2021-07-13)


### Bug Fixes

* **landing:** import maplibre styles from the npm package ([#1754](https://github.com/linz/basemaps/issues/1754)) ([9bf151b](https://github.com/linz/basemaps/commit/9bf151bb54b6c4a5f6e3015588ac8dcd21d7d75c))





# [6.3.0](https://github.com/linz/basemaps/compare/v6.2.0...v6.3.0) (2021-07-07)


### Bug Fixes

* **landing:** fix broken image urls ([#1722](https://github.com/linz/basemaps/issues/1722)) ([b9bafb4](https://github.com/linz/basemaps/commit/b9bafb44e8d4cd7d3015ce9f6702c63cbb650dca))
* **landing:** overflow attribution text with ... on mobile ([#1717](https://github.com/linz/basemaps/issues/1717)) ([46c0f43](https://github.com/linz/basemaps/commit/46c0f43c5d1fc5facd9a981626eebbdfb350c810))
* **landing:** unsquish landing page view on mobile devices  ([#1716](https://github.com/linz/basemaps/issues/1716)) ([038f78d](https://github.com/linz/basemaps/commit/038f78d500b719bda0b3c125378694666a0f52cb))
* **landing:** Update map to resize while loading to fix mobile map size. ([#1706](https://github.com/linz/basemaps/issues/1706)) ([d019992](https://github.com/linz/basemaps/commit/d0199926fa06be47497aa31645414ab22e14fe23))
* **landing:** Zoom level plus 1 for attributions because mapbox rendering tile in 512px. ([#1725](https://github.com/linz/basemaps/issues/1725)) ([ed9f5b6](https://github.com/linz/basemaps/commit/ed9f5b6acffd0aef164c4311fc84b3b06d18fefb))


### Features

* **landing:** Add navigation control to the map. ([#1724](https://github.com/linz/basemaps/issues/1724)) ([1676c7a](https://github.com/linz/basemaps/commit/1676c7a4483afa5b6defd4193955cb13f1815185))
* **landing:** default to nztm2000quad for landing page ([#1726](https://github.com/linz/basemaps/issues/1726)) ([366aa2b](https://github.com/linz/basemaps/commit/366aa2b1c8d1a15861eb4e7d75bfc112f083312f))
* **landing:** include version/changelog in landing page ([#1718](https://github.com/linz/basemaps/issues/1718)) ([998310d](https://github.com/linz/basemaps/commit/998310dd15e10b989ad4823f02faa1dd1e9e13ae))
* **landing:** Update the landing page to use maplibre ([#1689](https://github.com/linz/basemaps/issues/1689)) ([3da52d1](https://github.com/linz/basemaps/commit/3da52d1b3bd581a216017bbec0d490207e612132))





# [6.2.0](https://github.com/linz/basemaps/compare/v6.1.0...v6.2.0) (2021-06-24)

**Note:** Version bump only for package @basemaps/landing





# [6.1.0](https://github.com/linz/basemaps/compare/v6.0.0...v6.1.0) (2021-06-23)

**Note:** Version bump only for package @basemaps/landing





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)


### Bug Fixes

* default to basemaps.linz.govt.nz rather than tiles.basemaps.linz.govt.nz ([#1684](https://github.com/linz/basemaps/issues/1684)) ([95afdbf](https://github.com/linz/basemaps/commit/95afdbf7125edebf557ceace3e8e9f76d0317e1b))


### Features

* **landing:** Add opacity and slide compare Maplibre examples ([#1671](https://github.com/linz/basemaps/issues/1671)) ([2bf3b8a](https://github.com/linz/basemaps/commit/2bf3b8a46f44453edb6f48eb29f60402152c4203))





# [5.2.0](https://github.com/linz/basemaps/compare/v5.1.0...v5.2.0) (2021-06-10)


### Features

* **landing:** Add example page for Maplibre vector map. ([#1664](https://github.com/linz/basemaps/issues/1664)) ([8f7463b](https://github.com/linz/basemaps/commit/8f7463bf8dbf908c2d1d896ad7c0fd340b23ae4f))





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)


### Features

* **landing:** Update the UI NZTM button to return WMTS with NZTM2000Quad TileMatrix ([#1650](https://github.com/linz/basemaps/issues/1650)) ([0237ff9](https://github.com/linz/basemaps/commit/0237ff9f7147577f1bab5b069e87e468c3dff4a3))





## [5.0.3](https://github.com/linz/basemaps/compare/v5.0.2...v5.0.3) (2021-05-25)

**Note:** Version bump only for package @basemaps/landing





## [5.0.2](https://github.com/linz/basemaps/compare/v5.0.1...v5.0.2) (2021-05-19)

**Note:** Version bump only for package @basemaps/landing





## [5.0.1](https://github.com/linz/basemaps/compare/v5.0.0...v5.0.1) (2021-05-17)

**Note:** Version bump only for package @basemaps/landing





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)


### Bug Fixes

* **attribution:** correct import issue with openlayers  ([#1599](https://github.com/linz/basemaps/issues/1599)) ([1b464f3](https://github.com/linz/basemaps/commit/1b464f381a81448769521543787c060ef9b3efcf))
* **landing:** only load attribution once ([#1610](https://github.com/linz/basemaps/issues/1610)) ([57926fc](https://github.com/linz/basemaps/commit/57926fcb14440c884cd72547a5356191fd51683d))





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)

**Note:** Version bump only for package @basemaps/landing





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)


### Bug Fixes

* **landing:** correctly set the projection for the copy link buttons ([#1496](https://github.com/linz/basemaps/issues/1496)) ([16e94e6](https://github.com/linz/basemaps/commit/16e94e6956df883e8a73e964e663a7de5bbbefe3))


### Features

* **landing:** support nztm2000quad with ?p=nztm2000quad ([#1493](https://github.com/linz/basemaps/issues/1493)) ([cada7e0](https://github.com/linz/basemaps/commit/cada7e01e3deccd2446c745f4e610e8493495476))





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)


### Bug Fixes

* **landing:** correct the WMTS url for arcgis users ([#1454](https://github.com/linz/basemaps/issues/1454)) ([cf42808](https://github.com/linz/basemaps/commit/cf42808a49839f8b70de4290823f4b7f7ecabcf7))





# [4.21.0](https://github.com/linz/basemaps/compare/v4.20.0...v4.21.0) (2021-02-16)

**Note:** Version bump only for package @basemaps/landing





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)


### Bug Fixes

* **landing:** correct broken wmts/xyz links in side bar ([#1414](https://github.com/linz/basemaps/issues/1414)) ([bb85d40](https://github.com/linz/basemaps/commit/bb85d40509e086d3990dc928e1518bca9ce691e7))
* **landing:** fix broken button styling ([#1410](https://github.com/linz/basemaps/issues/1410)) ([98b5f3b](https://github.com/linz/basemaps/commit/98b5f3b3147c06f6ad72afe730d3ecd3df77c37e))


### Features

* **attribution:** remove `@basemaps/shared` dependency to make it smaller to install ([#1415](https://github.com/linz/basemaps/issues/1415)) ([5152614](https://github.com/linz/basemaps/commit/51526145256e0b7a514dc1185691d27cead1a0c6))
* **tiler:** support rendering avif tiles ([#1409](https://github.com/linz/basemaps/issues/1409)) ([8474d32](https://github.com/linz/basemaps/commit/8474d327aaab14aad96c1d7793b44b8e8daad946))
* Allow alternative TileMatrixSet definitions ([#1321](https://github.com/linz/basemaps/issues/1321)) ([b7cfa7b](https://github.com/linz/basemaps/commit/b7cfa7b8bf1351d9e57e46c180a1d3cf01c29927))





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)

**Note:** Version bump only for package @basemaps/landing





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)


### Features

* **lambda-tiler:** add smoke test in health endpoint ([#1308](https://github.com/linz/basemaps/issues/1308)) ([334f5dd](https://github.com/linz/basemaps/commit/334f5dd8f3d1bd67b770cf24cef9cad517e36f37))





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)


### Features

* **attribution:** create attribution package ([#1261](https://github.com/linz/basemaps/issues/1261)) ([638ab10](https://github.com/linz/basemaps/commit/638ab1090d980cb3b661a2d8a572e02927b45556))





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)


### Features

* Update browser examples ([#1219](https://github.com/linz/basemaps/issues/1219)) ([0fe7d7e](https://github.com/linz/basemaps/commit/0fe7d7e5f1a5b153aa27045ae9a86f0b26318636))
* **landing:** be clear about 90 day API key ([#1240](https://github.com/linz/basemaps/issues/1240)) ([4d0f08c](https://github.com/linz/basemaps/commit/4d0f08c674c47693ca8f42d7960e1fef0d483e80))





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)


### Bug Fixes

* STAC files should comply to 1.0.0-beta.2 of the specification ([#1176](https://github.com/linz/basemaps/issues/1176)) ([d2fe323](https://github.com/linz/basemaps/commit/d2fe3236cacdbf9ae7118934c8936490faeab64c))


### Features

* **lambda-tiler:** attribution ([#1205](https://github.com/linz/basemaps/issues/1205)) ([69cca66](https://github.com/linz/basemaps/commit/69cca66d901a23f01868ce6fedc8991f01c55de2))
* **landing:** generate new api key for users every 30 days ([#1206](https://github.com/linz/basemaps/issues/1206)) ([3a47c7c](https://github.com/linz/basemaps/commit/3a47c7c366c5794b0049fae1aaa67b4c917cdf95))





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)

**Note:** Version bump only for package @basemaps/landing





# [4.13.0](https://github.com/linz/basemaps/compare/v4.12.2...v4.13.0) (2020-09-14)

**Note:** Version bump only for package @basemaps/landing





## [4.12.2](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.2) (2020-09-10)

**Note:** Version bump only for package @basemaps/landing





## [4.12.1](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.1) (2020-09-10)

**Note:** Version bump only for package @basemaps/landing





# [4.12.0](https://github.com/linz/basemaps/compare/v4.11.2...v4.12.0) (2020-09-06)


### Bug Fixes

* **landing:** Don't use auto for svg height ([#1134](https://github.com/linz/basemaps/issues/1134)) ([0e5c551](https://github.com/linz/basemaps/commit/0e5c551999baf4d9973c14ddbbe563381bc2bd7f))





## [4.11.2](https://github.com/linz/basemaps/compare/v4.11.1...v4.11.2) (2020-09-01)

**Note:** Version bump only for package @basemaps/landing





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @basemaps/landing





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)


### Bug Fixes

* **landing:** correct import path for lui ([#1108](https://github.com/linz/basemaps/issues/1108)) ([1fb887c](https://github.com/linz/basemaps/commit/1fb887c7aedee1ba158e37dfbb0bddf48b8092a1))





# [4.10.0](https://github.com/linz/basemaps/compare/v4.9.0...v4.10.0) (2020-08-19)


### Features

* **landing:** support urls with z14 or 14z ([#1076](https://github.com/linz/basemaps/issues/1076)) ([e485610](https://github.com/linz/basemaps/commit/e48561072fe346621ed8f41279f42510db87627b))





# [4.9.0](https://github.com/linz/basemaps/compare/v4.8.0...v4.9.0) (2020-08-17)

**Note:** Version bump only for package @basemaps/landing





# [4.8.0](https://github.com/linz/basemaps/compare/v4.7.1...v4.8.0) (2020-08-12)


### Bug Fixes

* **landing:** apply cache control for uploaded assets ([#1046](https://github.com/linz/basemaps/issues/1046)) ([0b4c232](https://github.com/linz/basemaps/commit/0b4c2326277eda6fe9cf7b65555eb4857dc9b609))


### Features

* **lambda-tiler:** set cache for tiles to be public to increase cache hits ([#1035](https://github.com/linz/basemaps/issues/1035)) ([610b10c](https://github.com/linz/basemaps/commit/610b10c7eebb934f463d88654768dd64836f118a))
* **landing:** use the same url pattern as WMTS ([#1034](https://github.com/linz/basemaps/issues/1034)) ([dadb4ae](https://github.com/linz/basemaps/commit/dadb4aeb54978d0b5141ff103fb8580ce24b0e41))





## [4.7.1](https://github.com/linz/basemaps/compare/v4.7.0...v4.7.1) (2020-08-11)

**Note:** Version bump only for package @basemaps/landing





# [4.7.0](https://github.com/linz/basemaps/compare/v4.6.0...v4.7.0) (2020-08-10)

**Note:** Version bump only for package @basemaps/landing





# [4.6.0](https://github.com/linz/basemaps/compare/v4.5.0...v4.6.0) (2020-08-05)

**Note:** Version bump only for package @basemaps/landing





# [4.5.0](https://github.com/linz/basemaps/compare/v4.4.0...v4.5.0) (2020-07-30)

**Note:** Version bump only for package @basemaps/landing





# [4.4.0](https://github.com/linz/basemaps/compare/v4.3.0...v4.4.0) (2020-07-28)


### Bug Fixes

* inject git version and hash into all code ([#966](https://github.com/linz/basemaps/issues/966)) ([8b8eaec](https://github.com/linz/basemaps/commit/8b8eaec373286c81b425d485274edd7c588aefea))





# [4.3.0](https://github.com/linz/basemaps/compare/v4.2.0...v4.3.0) (2020-07-19)

**Note:** Version bump only for package @basemaps/landing





# [4.2.0](https://github.com/linz/basemaps/compare/v4.1.0...v4.2.0) (2020-07-16)

**Note:** Version bump only for package @basemaps/landing





# [4.1.0](https://github.com/linz/basemaps/compare/v4.0.0...v4.1.0) (2020-07-15)


### Bug Fixes

* **landing:** dont require clicking on the map for keyboard events ([#897](https://github.com/linz/basemaps/issues/897)) ([785f715](https://github.com/linz/basemaps/commit/785f71595d8a85998bfb0f90944627d27d0f8ee7))
* **landing:** google analytic events were not being sent ([#891](https://github.com/linz/basemaps/issues/891)) ([d67538a](https://github.com/linz/basemaps/commit/d67538a7834afdf99883276036ca16fbad7d03af))


### Features

* **cli:** Allow creation of one cog covering entire extent ([#920](https://github.com/linz/basemaps/issues/920)) ([2fd9187](https://github.com/linz/basemaps/commit/2fd918702e5cf25b12e24a3d72e694237e633a78))
* **landing:** allow changing map position via url ([#900](https://github.com/linz/basemaps/issues/900)) ([8c26913](https://github.com/linz/basemaps/commit/8c26913fc3cb7fd0f3e633e41dc1d3eb81e77b24))
* **landing:** allow map to be controlled by keyboard events ([#893](https://github.com/linz/basemaps/issues/893)) ([7d6acc7](https://github.com/linz/basemaps/commit/7d6acc7127ec6052999e6c50c7cae68bc512405e))
* **landing:** improve accessiblity hide offscreen elements from tab ([#895](https://github.com/linz/basemaps/issues/895)) ([cd2d512](https://github.com/linz/basemaps/commit/cd2d512f6065f15c1424370f8f0c52ad28e9ec87))
* **landing:** increase max zoom for nztm2000 to 18 ([#899](https://github.com/linz/basemaps/issues/899)) ([7e3c433](https://github.com/linz/basemaps/commit/7e3c43349b16ef641d26b6aab193d2cdb7a79783))





# [4.0.0](https://github.com/linz/basemaps/compare/v3.6.0...v4.0.0) (2020-07-09)


### Bug Fixes

* **landing:** Fix typos in side menu ([#883](https://github.com/linz/basemaps/issues/883)) ([b380757](https://github.com/linz/basemaps/commit/b380757fb306d9cfd987a7f3255ebd37fbe23d39))





# [3.6.0](https://github.com/linz/basemaps/compare/v3.5.0...v3.6.0) (2020-07-08)


### Features

* **landing:** Add content to contact us mailto: link ([#879](https://github.com/linz/basemaps/issues/879)) ([579ac92](https://github.com/linz/basemaps/commit/579ac92e2f39c70a8d67c2d01613f91e7b194774))
* **landing:** limit nztm to its extent ([#878](https://github.com/linz/basemaps/issues/878)) ([7470679](https://github.com/linz/basemaps/commit/747067955b0d52343498c81c2c20b29516046a75))





# [3.5.0](https://github.com/linz/basemaps/compare/v3.4.2...v3.5.0) (2020-07-05)


### Bug Fixes

* **landing:** allow firefox to render webps if it supports it ([#858](https://github.com/linz/basemaps/issues/858)) ([ba3013b](https://github.com/linz/basemaps/commit/ba3013b06509cb96e0cd468ac9d1510e9933f52f))


### Features

* **landing:** report tile loading stats ([#853](https://github.com/linz/basemaps/issues/853)) ([7e11d4a](https://github.com/linz/basemaps/commit/7e11d4a7304cbc9533ade2af2ad977cf0df1fe0f))





## [3.4.1](https://github.com/linz/basemaps/compare/v3.4.0...v3.4.1) (2020-06-30)


### Bug Fixes

* **landing:** use correct attribution url ([#840](https://github.com/linz/basemaps/issues/840)) ([86f8ef2](https://github.com/linz/basemaps/commit/86f8ef239703286a18437364020b5a86ce9084af))





# [3.4.0](https://github.com/linz/basemaps/compare/v3.3.0...v3.4.0) (2020-06-29)


### Features

* **landing:** styles for mobile devices ([#839](https://github.com/linz/basemaps/issues/839)) ([53c6eb0](https://github.com/linz/basemaps/commit/53c6eb0d4d6cca13dc813fb683d8e4d598746647))





# [3.3.0](https://github.com/linz/basemaps/compare/v3.2.0...v3.3.0) (2020-06-28)


### Features

* **landing:** add button to copy api urls ([#827](https://github.com/linz/basemaps/issues/827)) ([321334f](https://github.com/linz/basemaps/commit/321334fe0966906b1c2826c21bc7b9a45ff3e4cd))
* **landing:** api key generation and menu information  ([#813](https://github.com/linz/basemaps/issues/813)) ([0c32d72](https://github.com/linz/basemaps/commit/0c32d727fb63c20a5c0dda3dde31309b7042a48b))
* **landing:** dont show a NZTM xyz url as it does not make sense ([#828](https://github.com/linz/basemaps/issues/828)) ([deec860](https://github.com/linz/basemaps/commit/deec860babc3cbc16c145acf41c6b1220ae54ab3))
* **landing:** switch to new linz branded footer ([#826](https://github.com/linz/basemaps/issues/826)) ([f841047](https://github.com/linz/basemaps/commit/f8410473ab75e59a509e3c157c54a86695f1971a))





# [3.2.0](https://github.com/linz/basemaps/compare/v3.1.0...v3.2.0) (2020-06-25)


### Bug Fixes

* **landing:** adjust styles to give more space to the map ([#811](https://github.com/linz/basemaps/issues/811)) ([31ce315](https://github.com/linz/basemaps/commit/31ce31580dad8236a49a501d6fba67c75439c7c5))


### Features

* **landing:** use webp only if the browser supports it ([#814](https://github.com/linz/basemaps/issues/814)) ([c3d76b9](https://github.com/linz/basemaps/commit/c3d76b96bdd693c98499147d0d7f07e065156592))





# [3.1.0](https://github.com/linz/basemaps/compare/v3.0.0...v3.1.0) (2020-06-25)


### Bug Fixes

* **landing:** create unique js and css file names ([#803](https://github.com/linz/basemaps/issues/803)) ([08118dc](https://github.com/linz/basemaps/commit/08118dcd7e0ae374b29c896c4060f4980a4f31e0))


### Features

* **landing:** adding debug information to map when ?debug=true ([#809](https://github.com/linz/basemaps/issues/809)) ([0e526ce](https://github.com/linz/basemaps/commit/0e526ce3de7c20c102b8ea1755c301c90f7bc13e))
* **landing:** apply linz branding to the basemap ([#802](https://github.com/linz/basemaps/issues/802)) ([b44a873](https://github.com/linz/basemaps/commit/b44a873013baefeb2690da70175a58903f70f6ca))
* **landing:** track mouse position in debug mode ([#810](https://github.com/linz/basemaps/issues/810)) ([49307bc](https://github.com/linz/basemaps/commit/49307bc180adbc29cdbeb0456b9203928b57f267))





# [3.0.0](https://github.com/linz/basemaps/compare/v2.2.0...v3.0.0) (2020-06-23)


### Features

* **landing:** support nztm tiles ([#779](https://github.com/linz/basemaps/issues/779)) ([5158603](https://github.com/linz/basemaps/commit/51586035aa7a258cadb8b561d91f63e87c049eb2))





# [2.2.0](https://github.com/linz/basemaps/compare/v2.1.0...v2.2.0) (2020-06-17)


### Features

* **landing:** track with google analytics if $GOOGLE_ANALYTICS is set during deployment ([#764](https://github.com/linz/basemaps/issues/764)) ([afc7b8e](https://github.com/linz/basemaps/commit/afc7b8eb6337f3b15b32765bdc1186fc35d88ff4))
* render tiles using tile matrix sets ([#699](https://github.com/linz/basemaps/issues/699)) ([5b8156a](https://github.com/linz/basemaps/commit/5b8156aac4d23087c399667fba265af8383cd60a))
* **landing:** rotate background colors when clicking the debug button ([#663](https://github.com/linz/basemaps/issues/663)) ([18e7c33](https://github.com/linz/basemaps/commit/18e7c339b9da8e48a2b759c3eab199dafcf69a89))





# [2.1.0](https://github.com/linz/basemaps/compare/v2.0.0...v2.1.0) (2020-05-21)

**Note:** Version bump only for package @basemaps/landing





# [2.0.0](https://github.com/linz/basemaps/compare/v1.12.0...v2.0.0) (2020-05-18)

**Note:** Version bump only for package @basemaps/landing





# [1.12.0](https://github.com/linz/basemaps/compare/v1.11.0...v1.12.0) (2020-05-15)

**Note:** Version bump only for package @basemaps/landing





# [1.11.0](https://github.com/linz/basemaps/compare/v1.10.0...v1.11.0) (2020-05-14)

**Note:** Version bump only for package @basemaps/landing





# [1.10.0](https://github.com/linz/basemaps/compare/v1.9.0...v1.10.0) (2020-05-13)


### Features

* add a checkerboard background to the landing page ([#608](https://github.com/linz/basemaps/issues/608)) ([5b921a7](https://github.com/linz/basemaps/commit/5b921a716ea013a4755cd53f6ffa8e5351a477b0))





# [1.9.0](https://github.com/linz/basemaps/compare/v1.8.0...v1.9.0) (2020-05-12)

**Note:** Version bump only for package @basemaps/landing





# [1.8.0](https://github.com/linz/basemaps/compare/v1.7.0...v1.8.0) (2020-05-11)

**Note:** Version bump only for package @basemaps/landing





# [1.7.0](https://github.com/linz/basemaps/compare/v1.6.0...v1.7.0) (2020-05-10)

**Note:** Version bump only for package @basemaps/landing





# [1.6.0](https://github.com/linz/basemaps/compare/v1.5.1...v1.6.0) (2020-05-08)

**Note:** Version bump only for package @basemaps/landing





## [1.5.1](https://github.com/linz/basemaps/compare/v1.5.0...v1.5.1) (2020-05-07)

**Note:** Version bump only for package @basemaps/landing





# [1.5.0](https://github.com/linz/basemaps/compare/v1.4.2...v1.5.0) (2020-05-07)


### Features

* **landing:** support different imagery sets other than aerial with ?i=:imageId ([#575](https://github.com/linz/basemaps/issues/575)) ([f1b730e](https://github.com/linz/basemaps/commit/f1b730ea8fd61bd907e54be20abe18cd1146e3a9))





## [1.4.2](https://github.com/linz/basemaps/compare/v1.4.1...v1.4.2) (2020-05-06)

**Note:** Version bump only for package @basemaps/landing





## [1.4.1](https://github.com/linz/basemaps/compare/v1.4.0...v1.4.1) (2020-05-06)

**Note:** Version bump only for package @basemaps/landing





# [1.4.0](https://github.com/linz/basemaps/compare/v1.3.0...v1.4.0) (2020-05-06)

**Note:** Version bump only for package @basemaps/landing





# [1.3.0](https://github.com/linz/basemaps/compare/v1.2.0...v1.3.0) (2020-05-05)


### Features

* support tileset history ([#537](https://github.com/linz/basemaps/issues/537)) ([06760d4](https://github.com/linz/basemaps/commit/06760d4f1a6a28d0edc4f40f55cdf9db8e91f93f))





# [1.2.0](https://github.com/linz/basemaps/compare/v1.1.0...v1.2.0) (2020-03-25)


### Bug Fixes

* update landing page and cli/serve to include aerial/3857 ([a604148](https://github.com/linz/basemaps/commit/a604148365b42417088821eca16487b63e7eaa58))





# [1.0.0](https://github.com/linz/basemaps/compare/v0.3.0...v1.0.0) (2020-02-18)


### Features

* quick basemap landing page ([473a542](https://github.com/linz/basemaps/commit/473a542e25d5aa933cfcadf7342d66ea43b82bac))
