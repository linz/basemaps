# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.25.0](https://github.com/linz/basemaps/compare/v6.24.2...v6.25.0) (2022-05-11)


### Bug Fixes

* **landing:** force the vector source layer to be above the raster imager ([#2185](https://github.com/linz/basemaps/issues/2185)) ([31f7708](https://github.com/linz/basemaps/commit/31f7708f8cc5d6180d879248c6677d0b6cf3307a))


### Features

* **config:** Add config job for imagery processing api ([#2162](https://github.com/linz/basemaps/issues/2162)) ([4ad2d37](https://github.com/linz/basemaps/commit/4ad2d370e7b75c45f4d16842e5399682fee475e0))
* **config:** add type guard for if the config object can be written to ([#2183](https://github.com/linz/basemaps/issues/2183)) ([0a00e0e](https://github.com/linz/basemaps/commit/0a00e0efc30ad4df8e5c49899768ad37d6301152))
* **config:** serve tilejson 3.0.0 and allow raster imagery ([#2173](https://github.com/linz/basemaps/issues/2173)) ([29f5313](https://github.com/linz/basemaps/commit/29f53131e917fa0b3ce6f280e8f9e09f4fe6e957))
* **lambda-tiler:** Import api for import imagery jobs. ([#2170](https://github.com/linz/basemaps/issues/2170)) ([76b6175](https://github.com/linz/basemaps/commit/76b6175930db2a04f24437c7a05e7a70f160f7cd))
* **landing:** add aerial basemap to landing debug ([#2174](https://github.com/linz/basemaps/issues/2174)) ([b16b905](https://github.com/linz/basemaps/commit/b16b90541d62c02b9fed0a4f423279668c364c25))
* **landing:** add debug state into URL bar ([#2175](https://github.com/linz/basemaps/issues/2175)) ([da1833a](https://github.com/linz/basemaps/commit/da1833a1d603300ddcbc2405a341a303daebc125))
* **landing:** support geojson reprojection into NZTM with maplibre ([#2178](https://github.com/linz/basemaps/issues/2178)) ([79e8845](https://github.com/linz/basemaps/commit/79e88450d533c5a5bb9cbd99dc968adcb369835d))





## [6.24.2](https://github.com/linz/basemaps/compare/v6.24.1...v6.24.2) (2022-04-20)


### Bug Fixes

* **infra:** use the correct region to find certs ([#2159](https://github.com/linz/basemaps/issues/2159)) ([635d303](https://github.com/linz/basemaps/commit/635d303711d0b117b4b83842fe4c9d6e6d5db06d))
* **lambda-tiler:** expose the name of the imagery set in attribution ([#2153](https://github.com/linz/basemaps/issues/2153)) ([65d22cb](https://github.com/linz/basemaps/commit/65d22cbbf805d704b0179581ac6b66e755d2ef8f))
* **lambda-tiler:** missing tilesets should 404 not 500 ([#2149](https://github.com/linz/basemaps/issues/2149)) ([a3420bc](https://github.com/linz/basemaps/commit/a3420bcc956a7fc16e2b3867100bd5943fa13e73))
* **server:** indexing local tiffs should not crash ([#2152](https://github.com/linz/basemaps/issues/2152)) ([066f39f](https://github.com/linz/basemaps/commit/066f39f42bec2558353c03741ca2226028ac424a))





## [6.24.1](https://github.com/linz/basemaps/compare/v6.24.0...v6.24.1) (2022-04-07)


### Bug Fixes

* **lambda-tiler:** do not destroy database config when serving style.json ([#2146](https://github.com/linz/basemaps/issues/2146)) ([a625efd](https://github.com/linz/basemaps/commit/a625efd9a5f94522c50925e764c95ddeb57de427))
* **shared:** Projection.tyryGet do not throw if no projection is defined ([#2145](https://github.com/linz/basemaps/issues/2145)) ([7592fe5](https://github.com/linz/basemaps/commit/7592fe53c023f341f916520a7014fd00436df245))





# [6.24.0](https://github.com/linz/basemaps/compare/v6.23.0...v6.24.0) (2022-04-05)


### Bug Fixes

* **cli:** create instance of EPSG code if not already defined ([#2141](https://github.com/linz/basemaps/issues/2141)) ([9e7b508](https://github.com/linz/basemaps/commit/9e7b508a70aa85f80b88a29501a08c249c9617af))
* **lambda-tiler:** decode utf8 path names ([#2135](https://github.com/linz/basemaps/issues/2135)) ([2f09e33](https://github.com/linz/basemaps/commit/2f09e334e20ad9f4ece51617dd1c90d9b53abd8e))
* **lambda-tiler:** do not error when invalid imagery urls are provided ([#2133](https://github.com/linz/basemaps/issues/2133)) ([8211428](https://github.com/linz/basemaps/commit/8211428825ab63656c40a66a72e42d03add835bb))
* **landing:** locate button does not work in nztm so disable it ([#2140](https://github.com/linz/basemaps/issues/2140)) ([957b612](https://github.com/linz/basemaps/commit/957b61230c749349eaf8d4a41e226865eb058484))
* **landing:** only show layers that can be viewed in the layer picker ([#2136](https://github.com/linz/basemaps/issues/2136)) ([ac3dade](https://github.com/linz/basemaps/commit/ac3dadef400440f01ae9886c087e1a242193e99e))


### Features

* **landing:** add full screen button ([#2138](https://github.com/linz/basemaps/issues/2138)) ([293a14b](https://github.com/linz/basemaps/commit/293a14b429b7532b193e674c92e59e8f1e88adeb))
* **landing:** add zoom to location button ([#2137](https://github.com/linz/basemaps/issues/2137)) ([4ff217d](https://github.com/linz/basemaps/commit/4ff217de36319e47370b63cde6cc8ff959228332))
* **landing:** move zoom to location to top left ([#2142](https://github.com/linz/basemaps/issues/2142)) ([be4cd38](https://github.com/linz/basemaps/commit/be4cd38911a9bd6acceed03834adec31219f73fe))





# [6.23.0](https://github.com/linz/basemaps/compare/v6.22.1...v6.23.0) (2022-04-04)


### Features

* **shared:** load projections from the internet when not defined locally ([#2132](https://github.com/linz/basemaps/issues/2132)) ([85ac59f](https://github.com/linz/basemaps/commit/85ac59f771c3233f163a0223459faece46073847))





## [6.22.1](https://github.com/linz/basemaps/compare/v6.22.0...v6.22.1) (2022-03-23)


### Bug Fixes

* **cli:** allow unicode job names ([#2126](https://github.com/linz/basemaps/issues/2126)) ([bab5cef](https://github.com/linz/basemaps/commit/bab5cefdc8365cb52bf687230a078ea599c359ce))





# [6.22.0](https://github.com/linz/basemaps/compare/v6.21.1...v6.22.0) (2022-03-20)


### Bug Fixes

* **landing:** correct attribution example ([#2118](https://github.com/linz/basemaps/issues/2118)) ([c6b0a96](https://github.com/linz/basemaps/commit/c6b0a966f13e9523b6542bba7f1f936674fd624a))


### Features

* **cli:** support multiple invalidations for cloudfront ([#2120](https://github.com/linz/basemaps/issues/2120)) ([764fdeb](https://github.com/linz/basemaps/commit/764fdebaf7624c7761cede3a24c2184105bff9e2))
* **server:** support loading config from dynamodb ([#2119](https://github.com/linz/basemaps/issues/2119)) ([e550505](https://github.com/linz/basemaps/commit/e550505193df3cf148313e364c7c0670e16756e2))





## [6.21.1](https://github.com/linz/basemaps/compare/v6.21.0...v6.21.1) (2022-03-17)


### Bug Fixes

* **lambda-tiler:** bundle the exact version of sharp from the yarn.lock  ([#2114](https://github.com/linz/basemaps/issues/2114)) ([a193e41](https://github.com/linz/basemaps/commit/a193e4172c63349e745e8bfcbb78ac919e52f1dd))
* **lambda-tiler:** scripts should be specific to the module type ([#2115](https://github.com/linz/basemaps/issues/2115)) ([04c6f87](https://github.com/linz/basemaps/commit/04c6f8777ec722f1dc918757dd79043bd88d5e9a))





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-17)


### Bug Fixes

* **config:** fetch all unprocessed keys from dynamo if there are any ([#2101](https://github.com/linz/basemaps/issues/2101)) ([731430e](https://github.com/linz/basemaps/commit/731430e73756f05b2684f5b7ae7bd2852bc0a9b5))


### Features

* **cli:** remove unused config cli this has been moved into linz/basemaps-config ([#2102](https://github.com/linz/basemaps/issues/2102)) ([b047e11](https://github.com/linz/basemaps/commit/b047e111a9be2b200d5812d2d32fc6df7fdf4c2a))
* **config:** allow partial fetches from dynamo ([#2100](https://github.com/linz/basemaps/issues/2100)) ([1144d40](https://github.com/linz/basemaps/commit/1144d40482a302b6bca522ce105629209860242d))
* **config:** remove imagery year and resoltuion from config as it is not used ([#2097](https://github.com/linz/basemaps/issues/2097)) ([8be7c09](https://github.com/linz/basemaps/commit/8be7c09b9ce64898e5ab54b7fcb74c34405f558e))
* **lambda-tiler:** limit request tracing to 100 requests ([#2095](https://github.com/linz/basemaps/issues/2095)) ([f86fc30](https://github.com/linz/basemaps/commit/f86fc30aefcd2ddbfe2ffe43547338d36c152315))
* **lambda-tiler:** trace all requests to source ([#2093](https://github.com/linz/basemaps/issues/2093)) ([a2ca049](https://github.com/linz/basemaps/commit/a2ca049bd11505882105cb525a3f28f84c10611a))


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2111) ([d07f8ab](https://github.com/linz/basemaps/commit/d07f8ab4037466b060bf7e83960737554ff064b4)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2111](https://github.com/linz/basemaps/issues/2111)
* Revert "release: v6.22.0 (#2108)" (#2110) ([abcd2e4](https://github.com/linz/basemaps/commit/abcd2e4732a6d606eed865f526d6df2e4617aad3)), closes [#2108](https://github.com/linz/basemaps/issues/2108) [#2110](https://github.com/linz/basemaps/issues/2110)
* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.20.0](https://github.com/linz/basemaps/compare/v6.19.0...v6.20.0) (2022-02-01)


### Bug Fixes

* **cli:** disable reading sidecar files ([#2049](https://github.com/linz/basemaps/issues/2049)) ([d42d03b](https://github.com/linz/basemaps/commit/d42d03b34a1f3d9de895ee3c318112882e5a8972))
* correct testing logic when not enough hours in the year have been processed ([#2048](https://github.com/linz/basemaps/issues/2048)) ([d8dd4c3](https://github.com/linz/basemaps/commit/d8dd4c3dda4821e9595808c8aecc9c6c72241132))


### Features

* **lambda-tiler:** allow relative sprites and glyphs ([#2071](https://github.com/linz/basemaps/issues/2071)) ([a283157](https://github.com/linz/basemaps/commit/a283157f6b11fd9f6168edd19e9d5624f52d0325))
* **lambda-tiler:** wip esri vectortileserver interface for vector tiles ([#2041](https://github.com/linz/basemaps/issues/2041)) ([0549d68](https://github.com/linz/basemaps/commit/0549d688ae44c20bd8dce0281988c7ba258fdacb))
* **landing:** show source id when hovering in the source layer ([#2039](https://github.com/linz/basemaps/issues/2039)) ([865bab9](https://github.com/linz/basemaps/commit/865bab92109d5b5241664af7fc970494dacafeec))





# [6.19.0](https://github.com/linz/basemaps/compare/v6.18.1...v6.19.0) (2021-12-20)


### Bug Fixes

* **lambda-tiler:** remove the host check to add api keys for all stylejson sources. ([#2032](https://github.com/linz/basemaps/issues/2032)) ([beab64c](https://github.com/linz/basemaps/commit/beab64c7f747dd5c1be06877b05b1173a95b1537))
* **landing:** disable osm/topographic for nztm as it doesnt work ([#2031](https://github.com/linz/basemaps/issues/2031)) ([f1eff90](https://github.com/linz/basemaps/commit/f1eff90f4cafeeef9b09e3041b8e144a5b795488))


### Features

* **lambda-tiler:** compress geojson output to prevent overflowing lambda ([#2034](https://github.com/linz/basemaps/issues/2034)) ([5d48524](https://github.com/linz/basemaps/commit/5d48524c0bf03c40e85cd661fd7f609bbdeed3dd))
* **landing:** allow using the topographic vector map as a debug layer ([#2030](https://github.com/linz/basemaps/issues/2030)) ([2d4a05b](https://github.com/linz/basemaps/commit/2d4a05bc8ebfe0041155b9ead93f4235b9c52657))
* **landing:** rendering source imagery bounds ([#2035](https://github.com/linz/basemaps/issues/2035)) ([2e30936](https://github.com/linz/basemaps/commit/2e30936c20fef73831082583120c096f51dc01e4))
* **tiler:** expose some of the metadata geojson via a /v1/imagery endpoint ([#2033](https://github.com/linz/basemaps/issues/2033)) ([b471209](https://github.com/linz/basemaps/commit/b471209a381dfdab1a25be4882e464c8ddea9064))





## [6.18.1](https://github.com/linz/basemaps/compare/v6.18.0...v6.18.1) (2021-12-16)


### Bug Fixes

* **landing:** enable debug page ([#2026](https://github.com/linz/basemaps/issues/2026)) ([b9639c9](https://github.com/linz/basemaps/commit/b9639c91537daa5ec4767e3649ab7aeb00673e1b))
* **landing:** Trigger change event when debug value changes and disable switcher for debug mode. ([#2027](https://github.com/linz/basemaps/issues/2027)) ([aa26041](https://github.com/linz/basemaps/commit/aa26041da186654c86732f97c95708d1eb438622))





# [6.18.0](https://github.com/linz/basemaps/compare/v6.17.0...v6.18.0) (2021-12-14)


### Bug Fixes

* **landing:** correctly track the event name of the layer ([#2018](https://github.com/linz/basemaps/issues/2018)) ([d2b8d62](https://github.com/linz/basemaps/commit/d2b8d62f8e57303dc0d4f13c1ed3fffca97e73d2))
* **landing:** Fix the update bounds for nztm tilematrix when switching layers. ([#2017](https://github.com/linz/basemaps/issues/2017)) ([230ac63](https://github.com/linz/basemaps/commit/230ac630fcd3848f5ddb3a4ee215121658d0ced7))


### Features

* **config:** Add title into imagery config. ([#2021](https://github.com/linz/basemaps/issues/2021)) ([11b3ad1](https://github.com/linz/basemaps/commit/11b3ad1df908c3c7231e53795a1e6c58e6083644))





# [6.17.0](https://github.com/linz/basemaps/compare/v6.16.1...v6.17.0) (2021-12-05)


### Bug Fixes

* **landing:** Fix attribution not update when switching map ([#2013](https://github.com/linz/basemaps/issues/2013)) ([0e69684](https://github.com/linz/basemaps/commit/0e69684b7e4f1df0013db2d95913e64e3c5aa201))


### Features

* **config:** Update the style json config to include attribution. ([#2010](https://github.com/linz/basemaps/issues/2010)) ([0994969](https://github.com/linz/basemaps/commit/0994969657f2b4da8961beba0338b16cf33a338e))
* **lambda-tiler:** Stop caching for the stylejson. ([#2011](https://github.com/linz/basemaps/issues/2011)) ([f29ae16](https://github.com/linz/basemaps/commit/f29ae16cd0b858fd9929a8cbcefa1c5113687bc9))
* **landing:** Add vector attribution in landing page. ([#2012](https://github.com/linz/basemaps/issues/2012)) ([dad03fd](https://github.com/linz/basemaps/commit/dad03fd57a1cd384f278e2a0a047108162e7fe0f))
* **landing:** ignore geographx from the attribution list ([#2009](https://github.com/linz/basemaps/issues/2009)) ([3530e46](https://github.com/linz/basemaps/commit/3530e468ef0fbae22130f841eeec77a5892e08b8))
* **landing:** Round location transform to 8 decimals ([#2014](https://github.com/linz/basemaps/issues/2014)) ([73f6be3](https://github.com/linz/basemaps/commit/73f6be3d36edad7dcaa175ad4c853ea5579d8047))
* **landing:** use topographic name not topolike ([#2008](https://github.com/linz/basemaps/issues/2008)) ([a281d87](https://github.com/linz/basemaps/commit/a281d874ae8211447282ad41dd497e96689ceb88))





## [6.16.1](https://github.com/linz/basemaps/compare/v6.16.0...v6.16.1) (2021-11-30)


### Performance Improvements

* **tiler-sharp:** cache empty images as they are requested a lot ([#2002](https://github.com/linz/basemaps/issues/2002)) ([00bab89](https://github.com/linz/basemaps/commit/00bab89017ef45bdc7f771f0558b0ee30a8b11aa))
* **tiler-sharp:** if the output tile is the exact same as the input tiff tile serve the tiff tile directly ([#2001](https://github.com/linz/basemaps/issues/2001)) ([95c3612](https://github.com/linz/basemaps/commit/95c36128cf3f619a3ace7fc6524ba49523999eba))





# [6.16.0](https://github.com/linz/basemaps/compare/v6.15.0...v6.16.0) (2021-11-29)


### Bug Fixes

* **lambda-tiler:** p-limit is a needed dependency ([#1998](https://github.com/linz/basemaps/issues/1998)) ([dfb1b25](https://github.com/linz/basemaps/commit/dfb1b2575e9b40b96ffa4bdcfa8f1496b18ae25e))


### Features

* **landing:** upgrade to lui v10 ([#1990](https://github.com/linz/basemaps/issues/1990)) ([c7866b6](https://github.com/linz/basemaps/commit/c7866b6e44293f09365f47afb8d0e88212458210))





# [6.15.0](https://github.com/linz/basemaps/compare/v6.14.2...v6.15.0) (2021-11-28)


### Bug Fixes

* **cli:** ensure all files from the job.json are created before logging JobComplete ([#1959](https://github.com/linz/basemaps/issues/1959)) ([78fd35a](https://github.com/linz/basemaps/commit/78fd35ad863c424069d79c8668e9e5b3195ccec9))
* **docker:** container should only build and not test ([#1986](https://github.com/linz/basemaps/issues/1986)) ([c6c6cfc](https://github.com/linz/basemaps/commit/c6c6cfce206b9abb8f362cbf60c4c69a3708d05e))
* **infrastructure:** revert aws-cdk to 1.111 until ALB target bug is fixed ([#1962](https://github.com/linz/basemaps/issues/1962)) ([c73c292](https://github.com/linz/basemaps/commit/c73c2928075edefeac14e486d5951205c3f51424))
* **lambda-tiler:** publish the tiler so `@basemaps/server` can use it ([#1991](https://github.com/linz/basemaps/issues/1991)) ([c1d7477](https://github.com/linz/basemaps/commit/c1d74773a94c643d1a60e84ef8005fc505a88126))
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
* **scripts:** minify the bundle in production ([#1977](https://github.com/linz/basemaps/issues/1977)) ([6ade21c](https://github.com/linz/basemaps/commit/6ade21cbd32a243868f9f5353f2223a5fd0bd429))





## [6.14.2](https://github.com/linz/basemaps/compare/v6.14.1...v6.14.2) (2021-11-09)


### Bug Fixes

* **infrastructure:** correct cors for s3 requests ([#1954](https://github.com/linz/basemaps/issues/1954)) ([8a33710](https://github.com/linz/basemaps/commit/8a337108768f32a51067b0e1f9f8c394759470e5))


### Performance Improvements

* lower the lambda size as the timeout bug has been fixed ([#1943](https://github.com/linz/basemaps/issues/1943)) ([d6d951b](https://github.com/linz/basemaps/commit/d6d951bacca5cd6bac6ee68ae2aca2c4209fc37b))





## [6.14.1](https://github.com/linz/basemaps/compare/v6.14.0...v6.14.1) (2021-10-27)


### Bug Fixes

* **infra:** allow cross origin requests to the static s3 bucket ([#1939](https://github.com/linz/basemaps/issues/1939)) ([68573a0](https://github.com/linz/basemaps/commit/68573a0775f37d8133cbb512470e14bc949c1f26))





# [6.14.0](https://github.com/linz/basemaps/compare/v6.13.0...v6.14.0) (2021-10-27)


### Bug Fixes

* **cli:** s3 keys should not start with a "/" ([#1935](https://github.com/linz/basemaps/issues/1935)) ([bc9cc22](https://github.com/linz/basemaps/commit/bc9cc224c0c4da6a85c193c8eb3524108d31c17d))


### Features

* **cli:** compress text documents with gzip before uploading ([#1936](https://github.com/linz/basemaps/issues/1936)) ([7a6e090](https://github.com/linz/basemaps/commit/7a6e090d0cc26372425b664d6788569e39fd5cca))





# [6.13.0](https://github.com/linz/basemaps/compare/v6.12.2...v6.13.0) (2021-10-25)


### Bug Fixes

* **scripts:** correct linting issue on version bump ([#1924](https://github.com/linz/basemaps/issues/1924)) ([0bf6e38](https://github.com/linz/basemaps/commit/0bf6e381b73a1c1d5eda6ef068e56994e58c93bc))


### Features

* **cli:** expose uploading static files ([#1925](https://github.com/linz/basemaps/issues/1925)) ([ce85cd9](https://github.com/linz/basemaps/commit/ce85cd9bfe9802046e9cbbfbf8ae663c427dd1a1))
* **cli:** fs.rmdir is deprecated use fs.rm ([#1927](https://github.com/linz/basemaps/issues/1927)) ([8f9a953](https://github.com/linz/basemaps/commit/8f9a9539751fca8f840f51cb18b071fb6495f726))
* **cli:** log when all tiffs in a job have been uploaded ([#1928](https://github.com/linz/basemaps/issues/1928)) ([5e935ab](https://github.com/linz/basemaps/commit/5e935abf8f9d936f24a3120fc7c0e848ce137015))





## [6.12.2](https://github.com/linz/basemaps/compare/v6.12.1...v6.12.2) (2021-10-19)


### Bug Fixes

* **cli:** session duration is in seconds not hours ([#1922](https://github.com/linz/basemaps/issues/1922)) ([bedcfac](https://github.com/linz/basemaps/commit/bedcfac3980f68377d2bfb85326dd93793dfa185))





## [6.12.1](https://github.com/linz/basemaps/compare/v6.12.0...v6.12.1) (2021-10-19)


### Bug Fixes

* **cli:** assume a role for 8 hours by default ([#1918](https://github.com/linz/basemaps/issues/1918)) ([4b69292](https://github.com/linz/basemaps/commit/4b69292b058d61f060d90a4c8b89fa6f87861ddf))
* **lambda-tiler:** cleanup tiff cache everytime a new tiff is initalized ([#1900](https://github.com/linz/basemaps/issues/1900)) ([bfd52af](https://github.com/linz/basemaps/commit/bfd52afc810398a03800893a10313a2eb1a5834a))
* **lambda-tiler:** Replace the encoded braces in stylejson url. ([#1912](https://github.com/linz/basemaps/issues/1912)) ([e51d038](https://github.com/linz/basemaps/commit/e51d0380b21110ff5585804fae14baf92a588352))





# [6.12.0](https://github.com/linz/basemaps/compare/v6.11.0...v6.12.0) (2021-10-05)


### Bug Fixes

* **server:** use default of local file system for unknown paths ([#1895](https://github.com/linz/basemaps/issues/1895)) ([1d89456](https://github.com/linz/basemaps/commit/1d894561965a6afd1144dd4580e9ec4cf914ce2c))


### Features

* **infrastructure:** increase performance of lambda function ([#1896](https://github.com/linz/basemaps/issues/1896)) ([af59300](https://github.com/linz/basemaps/commit/af59300798fa34119350fa856391cf0eac2ef374))





# [6.11.0](https://github.com/linz/basemaps/compare/v6.10.1...v6.11.0) (2021-10-03)


### Bug Fixes

* **cli:** correct path issues with ESM modules being bundled into docker containers ([#1888](https://github.com/linz/basemaps/issues/1888)) ([7c1b2f4](https://github.com/linz/basemaps/commit/7c1b2f4979956a09f63b461463bb43788ce0122c))
* **cli:** work around certificate issues ([#1890](https://github.com/linz/basemaps/issues/1890)) ([5e90775](https://github.com/linz/basemaps/commit/5e907752f0a195d6b6b976bb1bbf56895e6e18f7))
* **lambda-tiler:** do not create a new requestId for test tile creation ([#1876](https://github.com/linz/basemaps/issues/1876)) ([f6946da](https://github.com/linz/basemaps/commit/f6946dad47bb91b3c75a89237a917ed925ffc818))
* **lambda-tiler:** limit the tiff memory cache to 256MB of imagery ([#1882](https://github.com/linz/basemaps/issues/1882)) ([2bf0bdc](https://github.com/linz/basemaps/commit/2bf0bdc39c191a7bb7a8e8e2277160a357248386))
* **metrics:** allow duplicate timers if the old timer has finished ([#1880](https://github.com/linz/basemaps/issues/1880)) ([a384580](https://github.com/linz/basemaps/commit/a384580ba82cebdd653280277f67dc1895890769))


### Features

* **server:** add ability to serve a folder full of tiffs ([#1889](https://github.com/linz/basemaps/issues/1889)) ([adefde1](https://github.com/linz/basemaps/commit/adefde176ce03db5c6c978d8b85a11fc7cd15693))
* **server:** use the lambda handler directly ([#1870](https://github.com/linz/basemaps/issues/1870)) ([408ff56](https://github.com/linz/basemaps/commit/408ff5654cc04aae35d05eb5bbc47a51f99ec5b2))





## [6.10.1](https://github.com/linz/basemaps/compare/v6.10.0...v6.10.1) (2021-09-22)


### Bug Fixes

* **infra:** remove trailing "." as it causes resolution failure ([#1878](https://github.com/linz/basemaps/issues/1878)) ([0f9e105](https://github.com/linz/basemaps/commit/0f9e105d306d6b8c525e847cb23a6fa9ca84d1f9))





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Bug Fixes

* **lambda-tiler:** clear timeout if request succeeds ([#1874](https://github.com/linz/basemaps/issues/1874)) ([49183ca](https://github.com/linz/basemaps/commit/49183ca6b154d91b11cd493f88164c346430e369))
* **lambda-tiler:** move to NZTM2000Quad for health check endpoint ([#1867](https://github.com/linz/basemaps/issues/1867)) ([d4613f0](https://github.com/linz/basemaps/commit/d4613f04f1081f785831488ea53bc8d8da7aae70))
* bundle esm into commonjs for serving ([#1861](https://github.com/linz/basemaps/issues/1861)) ([ff4490b](https://github.com/linz/basemaps/commit/ff4490b96648ee090055d60154d718c90b9afe97))
* correctly bundle with esm modules ([#1858](https://github.com/linz/basemaps/issues/1858)) ([708a22e](https://github.com/linz/basemaps/commit/708a22ec1006c25cf2c057b75f61cc813e943aac))


### Features

* **lambda-tiler:** track slow requests ([#1871](https://github.com/linz/basemaps/issues/1871)) ([b436e8b](https://github.com/linz/basemaps/commit/b436e8ba77b80b03239cc5c04cd9d7dfb1388f78))
* **landing:** support linkedin/twitter cards ([#1864](https://github.com/linz/basemaps/issues/1864)) ([91e3837](https://github.com/linz/basemaps/commit/91e3837fc99f49adcd2da719b2e82504e9dee42a))
* replace s3fs with chunkd/fs ([#1859](https://github.com/linz/basemaps/issues/1859)) ([9b6f2d3](https://github.com/linz/basemaps/commit/9b6f2d3609c336f96c2ae32246f241cb396e71c8))
* **lambda-tiler:** track hash of apikey ([#1855](https://github.com/linz/basemaps/issues/1855)) ([f8a4bef](https://github.com/linz/basemaps/commit/f8a4bef096095c09f5348af97b3f25a338817e87))
* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/core





# [6.9.0](https://github.com/linz/basemaps/compare/v6.8.0...v6.9.0) (2021-09-09)


### Bug Fixes

* **lambda-tiler:** force wmts to be ServiceTypeVersion 1.0.0 ([#1836](https://github.com/linz/basemaps/issues/1836)) ([8353774](https://github.com/linz/basemaps/commit/835377413417c58e4cca8bb4663aa43cc37043ff))
* **lambda-tiler:** remove console.log ([#1841](https://github.com/linz/basemaps/issues/1841)) ([723dbcc](https://github.com/linz/basemaps/commit/723dbcce8330ed588068fc2904c9476f6bbbd957))
* **s3fs:** profile is optional ([#1845](https://github.com/linz/basemaps/issues/1845)) ([6ac4644](https://github.com/linz/basemaps/commit/6ac464454cbb5bd35adb285d34afdcf500d00738))


### Features

* **tiler-sharp:** start tracking tile composing performance ([#1838](https://github.com/linz/basemaps/issues/1838)) ([b6cff4d](https://github.com/linz/basemaps/commit/b6cff4d982595f2bdd2dd16362c59500d2d8119e))





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)


### Bug Fixes

* **lambda-analytics:** track jpg requests too ([#1830](https://github.com/linz/basemaps/issues/1830)) ([5acab18](https://github.com/linz/basemaps/commit/5acab183408aa27c86bb253e2246bfb15278026c))
* **proj:** wrap lat lon bounds into the world bounds ([#1828](https://github.com/linz/basemaps/issues/1828)) ([617faf8](https://github.com/linz/basemaps/commit/617faf85d2252746de649c1bf5c41b16dfe085ba))
* **s3fs:** local file system list should be recursive by default ([#1822](https://github.com/linz/basemaps/issues/1822)) ([9367e3f](https://github.com/linz/basemaps/commit/9367e3f87ed1e5dc3d02d29e31362aac02509fcd))


### Features

* **config:** enable configuration to be stored in memory rather than dynamodb ([#1817](https://github.com/linz/basemaps/issues/1817)) ([eb56f26](https://github.com/linz/basemaps/commit/eb56f2633c99c5372710ae12fc128a9e7fa7ed7d))
* **config:** enable swapping of configuration providers dynamically ([#1818](https://github.com/linz/basemaps/issues/1818)) ([e548ae5](https://github.com/linz/basemaps/commit/e548ae5219c7a5c6d5c6ed80c9f41c9637c3b554))
* **lambda-tiler:** remove `@basemaps/lambda` and replace with `@linzjs/lambda` ([#1821](https://github.com/linz/basemaps/issues/1821)) ([cb22b3d](https://github.com/linz/basemaps/commit/cb22b3d2c62b7430839f3e35c18dd96a162fb39a))
* **landing:** support prefixed imagery links starts with im_ ([#1815](https://github.com/linz/basemaps/issues/1815)) ([7fadece](https://github.com/linz/basemaps/commit/7fadecef7a6153b0bd973167f816108584aaf99a))
* **server:** create a standalone express server ([#1819](https://github.com/linz/basemaps/issues/1819)) ([83488af](https://github.com/linz/basemaps/commit/83488af658a3ed8f3080dd2ea9f120ac3abd2444))





# [6.7.0](https://github.com/linz/basemaps/compare/v6.6.1...v6.7.0) (2021-08-15)


### Bug Fixes

* throw 500 on health failure ([#1795](https://github.com/linz/basemaps/issues/1795)) ([75bd6ae](https://github.com/linz/basemaps/commit/75bd6ae7f6a018acff4d5a27c58680eaa176aaa2))


### Features

* **lambda-tiler:** Support both aerial and vector basemap urls in style json. ([#1811](https://github.com/linz/basemaps/issues/1811)) ([9d30db8](https://github.com/linz/basemaps/commit/9d30db82d13bf84690c463644df664ab4c6735ce))
* add fromRoleArn to simplify the creation of s3 bound to specific roles. ([#1807](https://github.com/linz/basemaps/issues/1807)) ([0cd9bab](https://github.com/linz/basemaps/commit/0cd9bab54e9f4d581391bbc4fd8b29d1a50c4565))





## [6.6.1](https://github.com/linz/basemaps/compare/v6.6.0...v6.6.1) (2021-07-29)


### Bug Fixes

* correct cache id between NZTMQuad and 3857 ([#1793](https://github.com/linz/basemaps/issues/1793)) ([ace31c7](https://github.com/linz/basemaps/commit/ace31c761fad5471ecd0c0eb85e53f10411bdabb))





# [6.6.0](https://github.com/linz/basemaps/compare/v6.5.0...v6.6.0) (2021-07-29)


### Bug Fixes

* **config:** do not cache tile sets forever as they can be updated ([#1790](https://github.com/linz/basemaps/issues/1790)) ([d0b1c89](https://github.com/linz/basemaps/commit/d0b1c89ff155004b778ddca3003e3d5ea29e7b7f))


### Features

* **infra:** move lambda into the same VPC as the ALB ([#1789](https://github.com/linz/basemaps/issues/1789)) ([0baa1ec](https://github.com/linz/basemaps/commit/0baa1ec651a52128b4d00139eac312b3a4503205))





# [6.5.0](https://github.com/linz/basemaps/compare/v6.4.0...v6.5.0) (2021-07-25)


### Bug Fixes

* **s3fs:** more specific file systems should be matched first ([#1767](https://github.com/linz/basemaps/issues/1767)) ([0c7df8c](https://github.com/linz/basemaps/commit/0c7df8c1732459fdf0ee0e62a33fcca124ae0779))


### Features

* **landing:** add debug viewer with ?debug=true ([#1778](https://github.com/linz/basemaps/issues/1778)) ([96434ba](https://github.com/linz/basemaps/commit/96434babb95a0dcf206c6183fa66079f546bad58))





# [6.4.0](https://github.com/linz/basemaps/compare/v6.3.0...v6.4.0) (2021-07-13)


### Bug Fixes

* **landing:** import maplibre styles from the npm package ([#1754](https://github.com/linz/basemaps/issues/1754)) ([9bf151b](https://github.com/linz/basemaps/commit/9bf151bb54b6c4a5f6e3015588ac8dcd21d7d75c))


### Features

* **infra:** remove logging stack as that is now handled internally ([#1731](https://github.com/linz/basemaps/issues/1731)) ([e670099](https://github.com/linz/basemaps/commit/e6700993a057477c828a07befc75ba76e6903993))





# [6.3.0](https://github.com/linz/basemaps/compare/v6.2.0...v6.3.0) (2021-07-07)


### Bug Fixes

* **landing:** fix broken image urls ([#1722](https://github.com/linz/basemaps/issues/1722)) ([b9bafb4](https://github.com/linz/basemaps/commit/b9bafb44e8d4cd7d3015ce9f6702c63cbb650dca))
* **landing:** overflow attribution text with ... on mobile ([#1717](https://github.com/linz/basemaps/issues/1717)) ([46c0f43](https://github.com/linz/basemaps/commit/46c0f43c5d1fc5facd9a981626eebbdfb350c810))
* **landing:** unsquish landing page view on mobile devices  ([#1716](https://github.com/linz/basemaps/issues/1716)) ([038f78d](https://github.com/linz/basemaps/commit/038f78d500b719bda0b3c125378694666a0f52cb))
* **landing:** Update map to resize while loading to fix mobile map size. ([#1706](https://github.com/linz/basemaps/issues/1706)) ([d019992](https://github.com/linz/basemaps/commit/d0199926fa06be47497aa31645414ab22e14fe23))
* **landing:** Zoom level plus 1 for attributions because mapbox rendering tile in 512px. ([#1725](https://github.com/linz/basemaps/issues/1725)) ([ed9f5b6](https://github.com/linz/basemaps/commit/ed9f5b6acffd0aef164c4311fc84b3b06d18fefb))


### Features

* **infra:** remove logging stack as that is now handled internally ([#1701](https://github.com/linz/basemaps/issues/1701)) ([ffcbf35](https://github.com/linz/basemaps/commit/ffcbf35188cc3cda610839035cae3eb80ecfb36a))
* **landing:** Add navigation control to the map. ([#1724](https://github.com/linz/basemaps/issues/1724)) ([1676c7a](https://github.com/linz/basemaps/commit/1676c7a4483afa5b6defd4193955cb13f1815185))
* **landing:** default to nztm2000quad for landing page ([#1726](https://github.com/linz/basemaps/issues/1726)) ([366aa2b](https://github.com/linz/basemaps/commit/366aa2b1c8d1a15861eb4e7d75bfc112f083312f))
* **landing:** include version/changelog in landing page ([#1718](https://github.com/linz/basemaps/issues/1718)) ([998310d](https://github.com/linz/basemaps/commit/998310dd15e10b989ad4823f02faa1dd1e9e13ae))
* **landing:** Update the landing page to use maplibre ([#1689](https://github.com/linz/basemaps/issues/1689)) ([3da52d1](https://github.com/linz/basemaps/commit/3da52d1b3bd581a216017bbec0d490207e612132))
* **s3fs:** recursively list locally ([#1712](https://github.com/linz/basemaps/issues/1712)) ([2dec7ba](https://github.com/linz/basemaps/commit/2dec7baab02307b5a408e288e59a89ae693e12de))


### Reverts

* logging stack changes as its not ready yet. ([#1729](https://github.com/linz/basemaps/issues/1729)) ([4eaea4d](https://github.com/linz/basemaps/commit/4eaea4d2162787522f4ab421ba28368a23650844)), closes [#1701](https://github.com/linz/basemaps/issues/1701)





# [6.2.0](https://github.com/linz/basemaps/compare/v6.1.0...v6.2.0) (2021-06-24)


### Features

* **lambda:** provide basic timing information to client ([#1697](https://github.com/linz/basemaps/issues/1697)) ([3735292](https://github.com/linz/basemaps/commit/3735292d85b779be5b78250ad0c2676262e3c08b))
* disable edge lambda as its not really used. ([#1692](https://github.com/linz/basemaps/issues/1692)) ([38b02a5](https://github.com/linz/basemaps/commit/38b02a5c5050a076c69836861afc91cc92235a79))





# [6.1.0](https://github.com/linz/basemaps/compare/v6.0.0...v6.1.0) (2021-06-23)


### Bug Fixes

* **lambda-tiler:** bundle farmhash correctly ([#1693](https://github.com/linz/basemaps/issues/1693)) ([7cacf2e](https://github.com/linz/basemaps/commit/7cacf2e34b6bc6fbb25826ccf0b59d0816e25c25))


### Features

* expose fss3 ([#1687](https://github.com/linz/basemaps/issues/1687)) ([5730f3c](https://github.com/linz/basemaps/commit/5730f3cc1f838e797dcef2ab33f1e56e50805023))
* switch to a binary cotar index ([#1691](https://github.com/linz/basemaps/issues/1691)) ([6fa0b3f](https://github.com/linz/basemaps/commit/6fa0b3f223ab251fe94011cbda88ff9aa5b6922f))





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)


### Bug Fixes

* default to basemaps.linz.govt.nz rather than tiles.basemaps.linz.govt.nz ([#1684](https://github.com/linz/basemaps/issues/1684)) ([95afdbf](https://github.com/linz/basemaps/commit/95afdbf7125edebf557ceace3e8e9f76d0317e1b))
* **s3fs:** default to using the local file system ([#1683](https://github.com/linz/basemaps/issues/1683)) ([f9d65bb](https://github.com/linz/basemaps/commit/f9d65bbc2a9a595df6a1b6a062b2ad29db1573c0))


### Features

* **lambda:** include the requestId and correlationId in fatal errors ([#1668](https://github.com/linz/basemaps/issues/1668)) ([a957584](https://github.com/linz/basemaps/commit/a9575843697f4d054d563deb1789e65b79e1a84d))
* **lambda-analytics:** include stats for pbf tiles ([#1676](https://github.com/linz/basemaps/issues/1676)) ([30fc6c7](https://github.com/linz/basemaps/commit/30fc6c7d14be387903bfa44aab7585e21790e85a))
* **lambda-tiler:** switch to ndjson based indexes for cotar ([#1679](https://github.com/linz/basemaps/issues/1679)) ([c6f622b](https://github.com/linz/basemaps/commit/c6f622bf3f2fd583ed95df3c7d10aa4482def83b))
* **landing:** Add opacity and slide compare Maplibre examples ([#1671](https://github.com/linz/basemaps/issues/1671)) ([2bf3b8a](https://github.com/linz/basemaps/commit/2bf3b8a46f44453edb6f48eb29f60402152c4203))
* **s3fs:** add listDetails(), lists directory with file sizes ([#1674](https://github.com/linz/basemaps/issues/1674)) ([03517f9](https://github.com/linz/basemaps/commit/03517f9c4533b95b636b524bb9144c37ecb0b02b))
* **s3fs:** provide basic file information with "fs.head" ([#1673](https://github.com/linz/basemaps/issues/1673)) ([93d55b6](https://github.com/linz/basemaps/commit/93d55b6558b2982a4dbaee542457da0b221294af))
* **s3fs:** refactor how credentials are passed to s3fs ([#1675](https://github.com/linz/basemaps/issues/1675)) ([f07f529](https://github.com/linz/basemaps/commit/f07f529af1657aa5ffe7d9deff92406e908e6fe4))


### BREAKING CHANGES

* **s3fs:** this changes the behaviour for s3fs as paths now need to be registered with credentials

* refactor: remove commented out code





# [5.2.0](https://github.com/linz/basemaps/compare/v5.1.0...v5.2.0) (2021-06-10)


### Features

* **infra:** add support for vector tile sources ([#1663](https://github.com/linz/basemaps/issues/1663)) ([8ab7687](https://github.com/linz/basemaps/commit/8ab7687f5b6cea262d224cf73ef606a95a7a3939))
* **landing:** Add example page for Maplibre vector map. ([#1664](https://github.com/linz/basemaps/issues/1664)) ([8f7463b](https://github.com/linz/basemaps/commit/8f7463bf8dbf908c2d1d896ad7c0fd340b23ae4f))





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)


### Bug Fixes

* **build:** Audit failure to add glob-parent >= 5.1.2 resolution ([#1659](https://github.com/linz/basemaps/issues/1659)) ([eba5f6c](https://github.com/linz/basemaps/commit/eba5f6c3b35a1cbd8872d77fecc2cdfaeaa810d4))
* **build:** Audit failure to add trim-newlines >=3.0.1 <4.0.0 || >=4.0.1 resolution ([#1660](https://github.com/linz/basemaps/issues/1660)) ([38d1b44](https://github.com/linz/basemaps/commit/38d1b44ca97174df8a4c07e557149056905aeaf8))


### Features

* **landing:** Update the UI NZTM button to return WMTS with NZTM2000Quad TileMatrix ([#1650](https://github.com/linz/basemaps/issues/1650)) ([0237ff9](https://github.com/linz/basemaps/commit/0237ff9f7147577f1bab5b069e87e468c3dff4a3))





## [5.0.3](https://github.com/linz/basemaps/compare/v5.0.2...v5.0.3) (2021-05-25)


### Bug Fixes

* **shared:** Revert the aws role credential session back to 8 hour. ([#1631](https://github.com/linz/basemaps/issues/1631)) ([14e4314](https://github.com/linz/basemaps/commit/14e4314af0689b4f49db76895d6e0e3fdd4c8612))





## [5.0.2](https://github.com/linz/basemaps/compare/v5.0.1...v5.0.2) (2021-05-19)


### Bug Fixes

* **cli:** force gdal version 3.3.0 ([#1623](https://github.com/linz/basemaps/issues/1623)) ([bc2815b](https://github.com/linz/basemaps/commit/bc2815b874fd4077799be4bc501e863ded2a3ef2))
* **shared:** avoid instance of as it breaks when multiple copies of basemaps are init ([#1620](https://github.com/linz/basemaps/issues/1620)) ([53f7d23](https://github.com/linz/basemaps/commit/53f7d23f68a0fee3a355eee409a32ebdf10b7216))





## [5.0.1](https://github.com/linz/basemaps/compare/v5.0.0...v5.0.1) (2021-05-17)

**Note:** Version bump only for package @basemaps/core





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)


### Bug Fixes

* **attribution:** correct import issue with openlayers  ([#1599](https://github.com/linz/basemaps/issues/1599)) ([1b464f3](https://github.com/linz/basemaps/commit/1b464f381a81448769521543787c060ef9b3efcf))
* **attribution:** disable lat/lng bounds checking until bad bounds are fixed. ([#1612](https://github.com/linz/basemaps/issues/1612)) ([3c53edd](https://github.com/linz/basemaps/commit/3c53edd02d7343c7970f283809c1fdcfa835ddbd))
* **config:** do not duplicate prefix ([#1608](https://github.com/linz/basemaps/issues/1608)) ([a871051](https://github.com/linz/basemaps/commit/a87105151d5bb73dbf1594bf18b3de34b6e42383))
* **lambda-tiler:** correctly build WMTS for child tile sets ([#1607](https://github.com/linz/basemaps/issues/1607)) ([cc5ef6f](https://github.com/linz/basemaps/commit/cc5ef6f2facbc78cfad88d39785dffdae85122aa))
* **lambda-tiler:** do not duplicate im prefix in attribution ([#1609](https://github.com/linz/basemaps/issues/1609)) ([42f57fb](https://github.com/linz/basemaps/commit/42f57fb7c8f6aa3b5cab9179e1dfb70bd14df73e))
* **lambda-tiler:** flip the y axis for vector map server to get MVT from mbtiles ([#1539](https://github.com/linz/basemaps/issues/1539)) ([66806df](https://github.com/linz/basemaps/commit/66806df400788dc27cd31493466a641a63b5bcae))
* **lambda-tiler:** force vector tiles to be served as protobuf ([#1536](https://github.com/linz/basemaps/issues/1536)) ([2ca83ee](https://github.com/linz/basemaps/commit/2ca83ee2c7906e6e0bf81b203cd611b88aa4ad75))
* **landing:** only load attribution once ([#1610](https://github.com/linz/basemaps/issues/1610)) ([57926fc](https://github.com/linz/basemaps/commit/57926fcb14440c884cd72547a5356191fd51683d))
* **shared:** use a default of one hour for chainable credentials ([#1576](https://github.com/linz/basemaps/issues/1576)) ([33c996d](https://github.com/linz/basemaps/commit/33c996d98bbc6f3b74847b5384e7a560efba0fc7))
* **tiler:** all config is stored as google zoom levels so convert this tilez to the closet google z ([#1606](https://github.com/linz/basemaps/issues/1606)) ([7ea2db1](https://github.com/linz/basemaps/commit/7ea2db14f3f75c11ffb2c2044c45519a03cfa0ee))


### Features

* **config:** Tidy up the config and cli to be able to config style json. ([#1555](https://github.com/linz/basemaps/issues/1555)) ([95b4c0e](https://github.com/linz/basemaps/commit/95b4c0ed5a42a5b7c6c7884c9bfe24f97e3677e5))
* **lambda-tiler:** improve caching and init of cotar ([#1542](https://github.com/linz/basemaps/issues/1542)) ([c607a1c](https://github.com/linz/basemaps/commit/c607a1c4eba04cfdcc9b21341ee154dc544678c8))
* **lambda-tiler:** serve vector map style json. ([#1553](https://github.com/linz/basemaps/issues/1553)) ([f9dadcd](https://github.com/linz/basemaps/commit/f9dadcdc2369c1ce30432ed231f5be4b466dc9cd))
* **shared:** Cleanup - Remove TileSet Metatdata Record V1. ([#1541](https://github.com/linz/basemaps/issues/1541)) ([32e79af](https://github.com/linz/basemaps/commit/32e79afe630e9042edc1f936a657b7a31f1392ef))
* support serving of vector tiles ([#1535](https://github.com/linz/basemaps/issues/1535)) ([30083a5](https://github.com/linz/basemaps/commit/30083a57f981c2b2db6c50cad0f8db48be377d19))





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)


### Features

* **geo:** allow finding tile matrix using epsg codes ([#1514](https://github.com/linz/basemaps/issues/1514)) ([c866e38](https://github.com/linz/basemaps/commit/c866e38191580c2705f70a51772d3956753c6269))





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)


### Bug Fixes

* **attribution:** openlayers uses fractional zoom rounding to decide imagery requests ([#1508](https://github.com/linz/basemaps/issues/1508)) ([cf7b2a2](https://github.com/linz/basemaps/commit/cf7b2a24c6cef169a396094722704b4519536b0f))
* **geo:** correctly find the closest zoom from a given scale ([#1489](https://github.com/linz/basemaps/issues/1489)) ([c8bbbb0](https://github.com/linz/basemaps/commit/c8bbbb01eb74293b7ccc4ba1443b39b05358ba25))
* **geo:** use the closest zoom mapping ([#1503](https://github.com/linz/basemaps/issues/1503)) ([5ce730d](https://github.com/linz/basemaps/commit/5ce730d34dd6fed7015f29683b3fc31183b1d3bc))
* **lambda-tiler:** correct mapping of high zoom levels ([#1492](https://github.com/linz/basemaps/issues/1492)) ([7e98e63](https://github.com/linz/basemaps/commit/7e98e6353e1209f64d60ed028bde502847495432))
* **lambda-tiler:** generate a custom attribution for nztm2000quad ([#1498](https://github.com/linz/basemaps/issues/1498)) ([27933fd](https://github.com/linz/basemaps/commit/27933fd2b4d9123c107e476465a87c19e7f29c97))
* **landing:** correctly set the projection for the copy link buttons ([#1496](https://github.com/linz/basemaps/issues/1496)) ([16e94e6](https://github.com/linz/basemaps/commit/16e94e6956df883e8a73e964e663a7de5bbbefe3))


### Features

* **cli:** allow cusomising the tile matrix to use when building COGs ([#1483](https://github.com/linz/basemaps/issues/1483)) ([97f86de](https://github.com/linz/basemaps/commit/97f86de16e0e0cd309268a5807ff13779553ddae))
* **landing:** support nztm2000quad with ?p=nztm2000quad ([#1493](https://github.com/linz/basemaps/issues/1493)) ([cada7e0](https://github.com/linz/basemaps/commit/cada7e01e3deccd2446c745f4e610e8493495476))





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)


### Bug Fixes

* **bathymetry:** actually use the supplied tile matrix rather than defaulting to GoogleTms ([#1477](https://github.com/linz/basemaps/issues/1477)) ([4e1e461](https://github.com/linz/basemaps/commit/4e1e4618ca37d02a80a17538afcc40a16272c9cb))
* **cli:** detect if differing band counts of imagery is used in a single imagery set ([#1466](https://github.com/linz/basemaps/issues/1466)) ([e546c20](https://github.com/linz/basemaps/commit/e546c2039a6bbcc4d3c89461f12dcc1cca594f26))
* **landing:** correct the WMTS url for arcgis users ([#1454](https://github.com/linz/basemaps/issues/1454)) ([cf42808](https://github.com/linz/basemaps/commit/cf42808a49839f8b70de4290823f4b7f7ecabcf7))


### Features

* **bathymetry:** generate the bathy tiles based on the output tile matrix set not hard coded ([#1478](https://github.com/linz/basemaps/issues/1478)) ([536c643](https://github.com/linz/basemaps/commit/536c643a216ac1378f53b3cb15c5897a428fb492))
* **bathymetry:** support other tile matrix sets for rendering bathymetry ([#1475](https://github.com/linz/basemaps/issues/1475)) ([e2c09db](https://github.com/linz/basemaps/commit/e2c09db49b86dc3f90464af44cdad123d68d9a4c))
* **geo:** add support for NZTM2000Quad tile matrix set ([#1470](https://github.com/linz/basemaps/issues/1470)) ([b0d8cde](https://github.com/linz/basemaps/commit/b0d8cded0777e2ab024b27455f6a58d5860fe9ad))
* **lambda-tiler:** support NZTM2000Quad when serving via WMTS ([#1474](https://github.com/linz/basemaps/issues/1474)) ([4f0d9e6](https://github.com/linz/basemaps/commit/4f0d9e602307d83af4f12eda0ce4466df5006e78))
* support custom tile matrix sets ([#1469](https://github.com/linz/basemaps/issues/1469)) ([13a42de](https://github.com/linz/basemaps/commit/13a42de2647d448e1a4130602f759e21e03651bf))





# [4.21.0](https://github.com/linz/basemaps/compare/v4.20.0...v4.21.0) (2021-02-16)


### Bug Fixes

* **lambda-tiler:** only export the tile matrix set once per epsg code ([#1440](https://github.com/linz/basemaps/issues/1440)) ([0ac2fd8](https://github.com/linz/basemaps/commit/0ac2fd8c09120f8137c8102c50070df1885ab872))


### Features

* **lambda:** log the lambda request id at the end of every request ([#1438](https://github.com/linz/basemaps/issues/1438)) ([9bc2535](https://github.com/linz/basemaps/commit/9bc2535fdde6ff18b67879f5970f02a800bc5c3b))
* **lambda-tiler:** show number of bytes served with WMTS requests ([#1439](https://github.com/linz/basemaps/issues/1439)) ([459c88e](https://github.com/linz/basemaps/commit/459c88e1006c95dd4507009c22ed9016759b0398))





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)


### Bug Fixes

* **infra:** update tile lambda duration to avoid timeout when generating attribution. ([#1428](https://github.com/linz/basemaps/issues/1428)) ([3eb0775](https://github.com/linz/basemaps/commit/3eb0775ab55096ccf2ca4b0c5ce2bc342c8c5e9b))
* **lambda-tiler:** fix failed health endpoint and add new function to update health test tiles. ([#1430](https://github.com/linz/basemaps/issues/1430)) ([3205155](https://github.com/linz/basemaps/commit/32051551e92fc9acb4a46f12267857bee7635a5b))
* **landing:** correct broken wmts/xyz links in side bar ([#1414](https://github.com/linz/basemaps/issues/1414)) ([bb85d40](https://github.com/linz/basemaps/commit/bb85d40509e086d3990dc928e1518bca9ce691e7))
* **landing:** fix broken button styling ([#1410](https://github.com/linz/basemaps/issues/1410)) ([98b5f3b](https://github.com/linz/basemaps/commit/98b5f3b3147c06f6ad72afe730d3ecd3df77c37e))
* **shared:** remove dependency on @types/sax and @types/pino ([#1406](https://github.com/linz/basemaps/issues/1406)) ([79ffca6](https://github.com/linz/basemaps/commit/79ffca66353c3e9c3a68dabe14c4e6690e4453d8))


### Features

* **attribution:** remove `@basemaps/shared` dependency to make it smaller to install ([#1415](https://github.com/linz/basemaps/issues/1415)) ([5152614](https://github.com/linz/basemaps/commit/51526145256e0b7a514dc1185691d27cead1a0c6))
* **cli:** add a invalidate action to destroy cloudfront cache ([#1402](https://github.com/linz/basemaps/issues/1402)) ([bc93f70](https://github.com/linz/basemaps/commit/bc93f706f756ea66e6e68041511b742d9353457a))
* **docker-command:** utility to work with docker or local command execution ([#1424](https://github.com/linz/basemaps/issues/1424)) ([d791b56](https://github.com/linz/basemaps/commit/d791b56909336271986b01028908b5969dce82ed))
* **tiler:** support rendering avif tiles ([#1409](https://github.com/linz/basemaps/issues/1409)) ([8474d32](https://github.com/linz/basemaps/commit/8474d327aaab14aad96c1d7793b44b8e8daad946))
* Allow alternative TileMatrixSet definitions ([#1321](https://github.com/linz/basemaps/issues/1321)) ([b7cfa7b](https://github.com/linz/basemaps/commit/b7cfa7b8bf1351d9e57e46c180a1d3cf01c29927))





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)


### Features

* **shared:** Add iterator into TileMetadataTileSet. ([#1351](https://github.com/linz/basemaps/issues/1351)) ([2cb9bde](https://github.com/linz/basemaps/commit/2cb9bde3ad248bcaab41347184046164b1c0bf77))





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)


### Bug Fixes

* **deploy:** Missing GOOGLE_ANALYTICS ([#1331](https://github.com/linz/basemaps/issues/1331)) ([fd249eb](https://github.com/linz/basemaps/commit/fd249ebbeefffd0b63433f02329c70f056d49686))
* **lambda-tiler:** correct s3 permissions when creating tiles ([#1317](https://github.com/linz/basemaps/issues/1317)) ([95d6d1a](https://github.com/linz/basemaps/commit/95d6d1ab71e600f1ad7e3107d765a493c9d18bd4))
* **lambda-tiler:** filter the path for static file correctly. ([#1328](https://github.com/linz/basemaps/issues/1328)) ([e04e3d0](https://github.com/linz/basemaps/commit/e04e3d0baef7bcfe7df2d39a3a09a15515027b39))
* **lambda-tiler:** health endpoint cannot open static files. ([#1323](https://github.com/linz/basemaps/issues/1323)) ([aabc501](https://github.com/linz/basemaps/commit/aabc501f3864f379c733632db04130d64e4e09ea))


### Features

* **infra:** actually check the health of the lambda before deploying ([#1327](https://github.com/linz/basemaps/issues/1327)) ([a51bd93](https://github.com/linz/basemaps/commit/a51bd9305c90c7efbc7f5dbe56cf2cc08484d004))
* **lambda-tiler:** add smoke test in health endpoint ([#1308](https://github.com/linz/basemaps/issues/1308)) ([334f5dd](https://github.com/linz/basemaps/commit/334f5dd8f3d1bd67b770cf24cef9cad517e36f37))





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)


### Bug Fixes

* **cli:** allow using new tag ([#1304](https://github.com/linz/basemaps/issues/1304)) ([231fed2](https://github.com/linz/basemaps/commit/231fed2df7c3be0bc2d2c99c3a94353c63c3fde2))
* **deps:** allow yargs to be upgraded to newer versions ([#1289](https://github.com/linz/basemaps/issues/1289)) ([43ad85e](https://github.com/linz/basemaps/commit/43ad85e8434ee691dfba9e445f30c1861ba722e3))
* **deps:** correct the import of yargs so that shim$1.Parser.looksLikeNumber is a function ([#1287](https://github.com/linz/basemaps/issues/1287)) ([6bee984](https://github.com/linz/basemaps/commit/6bee984d2fb0eb2f583e1a5f28dc1eee8b9f92f2))
* **test:** correct projection of testing data ([#1282](https://github.com/linz/basemaps/issues/1282)) ([c9321a6](https://github.com/linz/basemaps/commit/c9321a6c4a874d934a8bd61a9432d1ce616b94df))


### Features

* **attribution:** create attribution package ([#1261](https://github.com/linz/basemaps/issues/1261)) ([638ab10](https://github.com/linz/basemaps/commit/638ab1090d980cb3b661a2d8a572e02927b45556))
* **cli:** Configure TileSet metedata DB from config file ([#1277](https://github.com/linz/basemaps/issues/1277)) ([b8c76d4](https://github.com/linz/basemaps/commit/b8c76d4d3aac3e49a4a01bfc88c58ab149d62482))





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)


### Bug Fixes

* **cli:** correct permissions when creating cogs ([#1255](https://github.com/linz/basemaps/issues/1255)) ([2079041](https://github.com/linz/basemaps/commit/20790410bd014d74446879acf29e03889b18e539))
* **cli:** correct the location to find the source roleArn ([#1256](https://github.com/linz/basemaps/issues/1256)) ([906843d](https://github.com/linz/basemaps/commit/906843d699386ae3b480316ba911467f1d375def))


### Features

* Update browser examples ([#1219](https://github.com/linz/basemaps/issues/1219)) ([0fe7d7e](https://github.com/linz/basemaps/commit/0fe7d7e5f1a5b153aa27045ae9a86f0b26318636))
* **landing:** be clear about 90 day API key ([#1240](https://github.com/linz/basemaps/issues/1240)) ([4d0f08c](https://github.com/linz/basemaps/commit/4d0f08c674c47693ca8f42d7960e1fef0d483e80))





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)


### Bug Fixes

* Remove dashes from CC-BY-4.0 license text ([#1223](https://github.com/linz/basemaps/issues/1223)) ([ae88b81](https://github.com/linz/basemaps/commit/ae88b817f3f82288d3dbb5b0ca8c30302bdae959))
* **lambda-analytics:** [@id](https://github.com/id) is reserved for the logging system ([#1207](https://github.com/linz/basemaps/issues/1207)) ([14a2f71](https://github.com/linz/basemaps/commit/14a2f716f39118258dff0290845a46de364cee84))
* **lambda-tiler:** regression in invalid url parsing causing 500 Error ([#1212](https://github.com/linz/basemaps/issues/1212)) ([400126c](https://github.com/linz/basemaps/commit/400126c9451819eaebfb7d51d95c4d8298361c0c))
* STAC files should comply to 1.0.0-beta.2 of the specification ([#1176](https://github.com/linz/basemaps/issues/1176)) ([d2fe323](https://github.com/linz/basemaps/commit/d2fe3236cacdbf9ae7118934c8936490faeab64c))


### Features

* **lambda-analytics:** allow analytics to be reprocessed by removing  the cached data ([#1195](https://github.com/linz/basemaps/issues/1195)) ([65752b9](https://github.com/linz/basemaps/commit/65752b99b99d84e6690ebcce26171a15c87a9ef5))
* **lambda-tiler:** attribution ([#1205](https://github.com/linz/basemaps/issues/1205)) ([69cca66](https://github.com/linz/basemaps/commit/69cca66d901a23f01868ce6fedc8991f01c55de2))
* **landing:** generate new api key for users every 30 days ([#1206](https://github.com/linz/basemaps/issues/1206)) ([3a47c7c](https://github.com/linz/basemaps/commit/3a47c7c366c5794b0049fae1aaa67b4c917cdf95))
* **linzjs-s3fs:** .list is now a async generator to allow easier iterating of folders ([#1213](https://github.com/linz/basemaps/issues/1213)) ([a42c594](https://github.com/linz/basemaps/commit/a42c594a506914e340eabb2afd97991c2b119a64))





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)


### Bug Fixes

* **linzjs-s3fs:** allow fs.list to list buckets and not need a "key" ([#1178](https://github.com/linz/basemaps/issues/1178)) ([108774f](https://github.com/linz/basemaps/commit/108774f96e37d36f89d1c29b634e1956d2fddf54))


### Features

* **infra:** check the health of the tiler every 30 seconds ([#1164](https://github.com/linz/basemaps/issues/1164)) ([b87dd18](https://github.com/linz/basemaps/commit/b87dd18b580208c63084f7975540679ef8adecaf))
* **lambda-analytics:** generate rolledup analyitics from cloudwatchedge logs ([#1180](https://github.com/linz/basemaps/issues/1180)) ([20fd5b1](https://github.com/linz/basemaps/commit/20fd5b1983b16fc1fcb1b731152da36430fedc63))
* **lambda-analytics:** include referer information in the rollup stats ([#1186](https://github.com/linz/basemaps/issues/1186)) ([e75ab1a](https://github.com/linz/basemaps/commit/e75ab1acd5e4dc89f05a52df833bb3563502f324))
* **lambda-analytics:** process upto 7 days worth of logs in one invcocation ([#1187](https://github.com/linz/basemaps/issues/1187)) ([199678f](https://github.com/linz/basemaps/commit/199678fad413b4098c08c3268a0fb13283c0bfe1))





# [4.13.0](https://github.com/linz/basemaps/compare/v4.12.2...v4.13.0) (2020-09-14)


### Features

* **lambda-api-tracker:** remove www. from referer tracking ([#1162](https://github.com/linz/basemaps/issues/1162)) ([7cdd392](https://github.com/linz/basemaps/commit/7cdd39214f45101719373983c873ab0e61ea0d14))





## [4.12.2](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.2) (2020-09-10)


### Bug Fixes

* **lambda-tiler:** Remove epsg from wmts layer id ([#1149](https://github.com/linz/basemaps/issues/1149)) ([7bca25f](https://github.com/linz/basemaps/commit/7bca25f0a15632343af825d2e30b08b5d111896e))





## [4.12.1](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.1) (2020-09-10)


### Bug Fixes

* **lambda-tiler:** Remove epsg from wmts layer id ([#1149](https://github.com/linz/basemaps/issues/1149)) ([7bca25f](https://github.com/linz/basemaps/commit/7bca25f0a15632343af825d2e30b08b5d111896e))





# [4.12.0](https://github.com/linz/basemaps/compare/v4.11.2...v4.12.0) (2020-09-06)


### Bug Fixes

* **landing:** Don't use auto for svg height ([#1134](https://github.com/linz/basemaps/issues/1134)) ([0e5c551](https://github.com/linz/basemaps/commit/0e5c551999baf4d9973c14ddbbe563381bc2bd7f))


### Features

* **bathymetry:** allow input and output from s3 bucket ([#1122](https://github.com/linz/basemaps/issues/1122)) ([1f00d9a](https://github.com/linz/basemaps/commit/1f00d9aacc6d132c0761a35069ddab15f135ac4c))
* **infra:** drop out lambda start/end/report logs from being shipped to elasticsearch ([#1115](https://github.com/linz/basemaps/issues/1115)) ([b902487](https://github.com/linz/basemaps/commit/b9024876a78706d4e21a90f8c96f26f79a5af36c))





## [4.11.2](https://github.com/linz/basemaps/compare/v4.11.1...v4.11.2) (2020-09-01)


### Bug Fixes

* correct imagery loading with one imagery tile set ([#1120](https://github.com/linz/basemaps/issues/1120)) ([a992ff0](https://github.com/linz/basemaps/commit/a992ff0a7f74935a10b2e8b49399d9b885b25e57))





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @basemaps/core





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)


### Bug Fixes

* **landing:** correct import path for lui ([#1108](https://github.com/linz/basemaps/issues/1108)) ([1fb887c](https://github.com/linz/basemaps/commit/1fb887c7aedee1ba158e37dfbb0bddf48b8092a1))


### Features

* **lambda:** reduce log volumes ([#1114](https://github.com/linz/basemaps/issues/1114)) ([f99f999](https://github.com/linz/basemaps/commit/f99f999ddfb8651057c2a58c2c67aeffc4c3e2ed))
* allow imagery with the same id in the rendering process twice ([#1104](https://github.com/linz/basemaps/issues/1104)) ([d8cd642](https://github.com/linz/basemaps/commit/d8cd642c6215a5198e15414c14680afacad88faf))
* **shared:** align bathymetry STAC usage with cog creation ([#1092](https://github.com/linz/basemaps/issues/1092)) ([fd9bc27](https://github.com/linz/basemaps/commit/fd9bc27b05d7e772f1856bb0e81268ac2930ef24))
* upgrade to node 12.x ([#1079](https://github.com/linz/basemaps/issues/1079)) ([053cc2f](https://github.com/linz/basemaps/commit/053cc2f28087b41cbf7c715fd200357d41b8e2da))





# [4.10.0](https://github.com/linz/basemaps/compare/v4.9.0...v4.10.0) (2020-08-19)


### Bug Fixes

* **cli:** use the same url pattern as WMTS to invalidate cache ([#1065](https://github.com/linz/basemaps/issues/1065)) ([f24a988](https://github.com/linz/basemaps/commit/f24a988f73c1f3ee81f144826e346e31e20f8241)), closes [#1034](https://github.com/linz/basemaps/issues/1034)
* **lambda:** do not cache 500 exceptions ([#1074](https://github.com/linz/basemaps/issues/1074)) ([8c7e223](https://github.com/linz/basemaps/commit/8c7e2235abd20ac0c646530ede3d9dca6718fab8))
* **lambda-api-tracker:** disable api database query ([#1075](https://github.com/linz/basemaps/issues/1075)) ([cb4aec5](https://github.com/linz/basemaps/commit/cb4aec5103ee8b92122863379ac6b177ebfcd2e8))
* **lambda-tiler:** Stop health and ping response being cached ([#1066](https://github.com/linz/basemaps/issues/1066)) ([922c617](https://github.com/linz/basemaps/commit/922c617b555672d36bd3d2e4986d3b46ad333731))
* **shared:** Don't error if tile ext missing ([#1072](https://github.com/linz/basemaps/issues/1072)) ([8ed9e8d](https://github.com/linz/basemaps/commit/8ed9e8d1173cd01c55a7f2380f48617dc02f28b4))


### Features

* **lambda:** trace cloudfront request and trace id's ([#1067](https://github.com/linz/basemaps/issues/1067)) ([4ca23a1](https://github.com/linz/basemaps/commit/4ca23a127c3b9857fbe9f844a4764914db2ec133))
* **landing:** support urls with z14 or 14z ([#1076](https://github.com/linz/basemaps/issues/1076)) ([e485610](https://github.com/linz/basemaps/commit/e48561072fe346621ed8f41279f42510db87627b))





# [4.9.0](https://github.com/linz/basemaps/compare/v4.8.0...v4.9.0) (2020-08-17)


### Bug Fixes

* **infra:** fix broken log shipper path ([#1058](https://github.com/linz/basemaps/issues/1058)) ([633c0f8](https://github.com/linz/basemaps/commit/633c0f8e544a6f05231a3c5b4a61b904b5493386))
* **tiler:** Use nearest smoothing when down sizing ([#1050](https://github.com/linz/basemaps/issues/1050)) ([3a95844](https://github.com/linz/basemaps/commit/3a9584430e373effe44ee1c8879e4f733a7f6c5f))


### Features

* allow configuration of tile resize kernels ([#1051](https://github.com/linz/basemaps/issues/1051)) ([6b6d3d3](https://github.com/linz/basemaps/commit/6b6d3d32c735de6bf3f41819aaeb571c78f0921c))
* **s3fs:** expose standard error codes for not found and forbidden ([#1049](https://github.com/linz/basemaps/issues/1049)) ([56831cc](https://github.com/linz/basemaps/commit/56831cc9a0eff805241993a155bc61e0f8f34389))





# [4.8.0](https://github.com/linz/basemaps/compare/v4.7.1...v4.8.0) (2020-08-12)


### Bug Fixes

* **cli:** caller reference needs to be unqiue ([#1047](https://github.com/linz/basemaps/issues/1047)) ([dc145be](https://github.com/linz/basemaps/commit/dc145be0048f0f2d0efe151ba4e59da71f06c459))
* **landing:** apply cache control for uploaded assets ([#1046](https://github.com/linz/basemaps/issues/1046)) ([0b4c232](https://github.com/linz/basemaps/commit/0b4c2326277eda6fe9cf7b65555eb4857dc9b609))


### Features

* **lambda-tiler:** allow dumping of single tiles from aws ([#1037](https://github.com/linz/basemaps/issues/1037)) ([85b4783](https://github.com/linz/basemaps/commit/85b4783b332e2c134157ed11029386a3dcbeab0b))
* **lambda-tiler:** set cache for tiles to be public to increase cache hits ([#1035](https://github.com/linz/basemaps/issues/1035)) ([610b10c](https://github.com/linz/basemaps/commit/610b10c7eebb934f463d88654768dd64836f118a))
* **landing:** use the same url pattern as WMTS ([#1034](https://github.com/linz/basemaps/issues/1034)) ([dadb4ae](https://github.com/linz/basemaps/commit/dadb4aeb54978d0b5141ff103fb8580ce24b0e41))
* **metrics:** support browsers without bigint support ([#1044](https://github.com/linz/basemaps/issues/1044)) ([5c6f243](https://github.com/linz/basemaps/commit/5c6f243253ebc6b7c13fa3cce660d58c4f5a5432))





## [4.7.1](https://github.com/linz/basemaps/compare/v4.7.0...v4.7.1) (2020-08-11)


### Bug Fixes

* **tiler:** Ensure rendered tiles does not exceed bounds ([#1036](https://github.com/linz/basemaps/issues/1036)) ([87d5493](https://github.com/linz/basemaps/commit/87d549320b41556e3b2cc13f2b202ee9a72d722a))





# [4.7.0](https://github.com/linz/basemaps/compare/v4.6.0...v4.7.0) (2020-08-10)


### Bug Fixes

* **build:** Don't inner quote define strings ([#1026](https://github.com/linz/basemaps/issues/1026)) ([17758ed](https://github.com/linz/basemaps/commit/17758ed682a9a4fbb228faa942fcffaade4f0c7f))
* remove unneeded semver check ([#1022](https://github.com/linz/basemaps/issues/1022)) ([59d3034](https://github.com/linz/basemaps/commit/59d3034c546e784b19e4c804769b408803505e1c))
* **lambda-api-tracker:** 404 when projection or zoom are invalid over 500 ([#1017](https://github.com/linz/basemaps/issues/1017)) ([2125394](https://github.com/linz/basemaps/commit/2125394a4f3fdecc234d06598432386bb672a625))


### Features

* **geo:** Add an optional bias when rounding bounds ([#1033](https://github.com/linz/basemaps/issues/1033)) ([c381733](https://github.com/linz/basemaps/commit/c3817332ab89d213bc87f0988f06b6331dc4c572))
* **infra:** give dev readonly access to production COGs ([#1016](https://github.com/linz/basemaps/issues/1016)) ([5772a70](https://github.com/linz/basemaps/commit/5772a70e1f9dd58dac7c9d5e1f251ac8e138448b))
* **infra:** support point in time recovery of dynamodb databases ([#1015](https://github.com/linz/basemaps/issues/1015)) ([a488cb7](https://github.com/linz/basemaps/commit/a488cb73bc7d5e4b22aced85ee29f3b2f1d0bc0a))
* **lambda:** tag all report logs as "report" ([#1025](https://github.com/linz/basemaps/issues/1025)) ([c1ebbae](https://github.com/linz/basemaps/commit/c1ebbae3a397d35f8254dcbc9e0fa8883be6d730))





# [4.6.0](https://github.com/linz/basemaps/compare/v4.5.0...v4.6.0) (2020-08-05)


### Features

* **geojson:** Improve GeoJSON compliance ([#1005](https://github.com/linz/basemaps/issues/1005)) ([bf7fd26](https://github.com/linz/basemaps/commit/bf7fd26cf2b08d6417a0c710b821648e9f7c9b9a))
* **lambda-api-tracker:** improve logging for aggregration ([#1010](https://github.com/linz/basemaps/issues/1010)) ([ebf7a64](https://github.com/linz/basemaps/commit/ebf7a6418c7657df6dd569c43b83407086b60e97))





# [4.5.0](https://github.com/linz/basemaps/compare/v4.4.0...v4.5.0) (2020-07-30)


### Bug Fixes

* **cli:** correctly detect if a tiff file list is passed in ([#993](https://github.com/linz/basemaps/issues/993)) ([9147c8e](https://github.com/linz/basemaps/commit/9147c8e8a6264dab285d6ab4a646f09d9a2d7718))
* **cli:** folders must be mounted to allow docker to read the source files ([#995](https://github.com/linz/basemaps/issues/995)) ([8557afa](https://github.com/linz/basemaps/commit/8557afaf96c5153cd174d0af5475f1d2b3fe3f98))


### Features

* **cli:** support giving exact list of files to use ([#986](https://github.com/linz/basemaps/issues/986)) ([63b34ff](https://github.com/linz/basemaps/commit/63b34ff5414989b5d014b6d61f9be304ebd9e1e1))
* **cli:** support guessing of CITM projection from wkt ([#994](https://github.com/linz/basemaps/issues/994)) ([61bb93b](https://github.com/linz/basemaps/commit/61bb93b23e8e02bf3cb7c1e983bbb64c6fcb3044))
* **doc:** added examples used for snippets ([#912](https://github.com/linz/basemaps/issues/912)) ([3726f9e](https://github.com/linz/basemaps/commit/3726f9e3220f6426836e62ac5eeb3ced7e01b6d0))





# [4.4.0](https://github.com/linz/basemaps/compare/v4.3.0...v4.4.0) (2020-07-28)


### Bug Fixes

* inject git version and hash into all code ([#966](https://github.com/linz/basemaps/issues/966)) ([8b8eaec](https://github.com/linz/basemaps/commit/8b8eaec373286c81b425d485274edd7c588aefea))
* **lambda-api:** track api key usage ([#943](https://github.com/linz/basemaps/issues/943)) ([7c4689c](https://github.com/linz/basemaps/commit/7c4689cd0824ee678260ba5d84b25042aad72363))


### Features

* **lambda-api:** validate that the api key looks like a api key ([#954](https://github.com/linz/basemaps/issues/954)) ([badca1e](https://github.com/linz/basemaps/commit/badca1e904097a9275e6dbac576c010fccbfa345))
* **lambda-tiler:** Serve WMTSCapabilities for all TileSets ([#953](https://github.com/linz/basemaps/issues/953)) ([49d0e88](https://github.com/linz/basemaps/commit/49d0e881b4726188ea937a9617c98bff5a78e44d))





# [4.3.0](https://github.com/linz/basemaps/compare/v4.2.0...v4.3.0) (2020-07-19)


### Bug Fixes

* **bathymetry:** allow bathy command to be run outside of git repo ([#930](https://github.com/linz/basemaps/issues/930)) ([a9a0e3d](https://github.com/linz/basemaps/commit/a9a0e3d4a98853d59cfa936357d1e435be6cfbf3))
* **bathymetry:** output stac files into the same place as the tiffs ([#931](https://github.com/linz/basemaps/issues/931)) ([b67f907](https://github.com/linz/basemaps/commit/b67f90758a74b3ff2749a7801c83b03f51633226))
* **cli:** allow gebco 3857 to be built in 4 COGs ([#940](https://github.com/linz/basemaps/issues/940)) ([dd98b57](https://github.com/linz/basemaps/commit/dd98b57e88744a73122d3ade146c1a57113fb958))


### Features

* **lambda-tiler:** log out api key used to request the tile ([#939](https://github.com/linz/basemaps/issues/939)) ([1eb9ff0](https://github.com/linz/basemaps/commit/1eb9ff0b90eebcd80e4fa69083d10eb9366623a8))





# [4.2.0](https://github.com/linz/basemaps/compare/v4.1.0...v4.2.0) (2020-07-16)


### Bug Fixes

* **cli:** fix creating cutlines with self crossing edges ([#929](https://github.com/linz/basemaps/issues/929)) ([fc4010e](https://github.com/linz/basemaps/commit/fc4010e6c7dd6de1f99d29ae32e3ad8fa580c1b5))
* **shared:** handle bounds crossing antimeridian ([#925](https://github.com/linz/basemaps/issues/925)) ([b4c049b](https://github.com/linz/basemaps/commit/b4c049bd816908214b145593f914054b84a9415e))


### Features

* **cli:** use CogSource uri property ([#928](https://github.com/linz/basemaps/issues/928)) ([11819bb](https://github.com/linz/basemaps/commit/11819bb3772d56634208018d963b8c276b52617c))





# [4.1.0](https://github.com/linz/basemaps/compare/v4.0.0...v4.1.0) (2020-07-15)


### Bug Fixes

* **cli:** correct error message when failing to read ([#892](https://github.com/linz/basemaps/issues/892)) ([0e9c4c1](https://github.com/linz/basemaps/commit/0e9c4c10a06c5ab205cfc5285048a153e85a0cc9))
* **cli:** Don't add cutline properties to CogJob when not used ([#914](https://github.com/linz/basemaps/issues/914)) ([1f860e9](https://github.com/linz/basemaps/commit/1f860e991f61abcb1cb1b15494bef2886eb04b1d))
* **landing:** dont require clicking on the map for keyboard events ([#897](https://github.com/linz/basemaps/issues/897)) ([785f715](https://github.com/linz/basemaps/commit/785f71595d8a85998bfb0f90944627d27d0f8ee7))
* **landing:** google analytic events were not being sent ([#891](https://github.com/linz/basemaps/issues/891)) ([d67538a](https://github.com/linz/basemaps/commit/d67538a7834afdf99883276036ca16fbad7d03af))
* **tiler:** try to minimize the error when rounding boundaries ([#913](https://github.com/linz/basemaps/issues/913)) ([e94b49d](https://github.com/linz/basemaps/commit/e94b49d7f818d31f2ee62ebd854c3b633b17a372))
* **wmts:** add style tag to wmtscaps ([#894](https://github.com/linz/basemaps/issues/894)) ([d486c4b](https://github.com/linz/basemaps/commit/d486c4b9105c3c92bf73423f9ec05db37bbbd9ea))


### Features

* **bathymetry:** create a process to convert gebco into hillshaded rasters ([#921](https://github.com/linz/basemaps/issues/921)) ([2cde6a9](https://github.com/linz/basemaps/commit/2cde6a9eb381452b3c5a6d855d42daf29148eca0))
* **cli:** Allow creation of one cog covering entire extent ([#920](https://github.com/linz/basemaps/issues/920)) ([2fd9187](https://github.com/linz/basemaps/commit/2fd918702e5cf25b12e24a3d72e694237e633a78))
* **landing:** allow changing map position via url ([#900](https://github.com/linz/basemaps/issues/900)) ([8c26913](https://github.com/linz/basemaps/commit/8c26913fc3cb7fd0f3e633e41dc1d3eb81e77b24))
* **landing:** allow map to be controlled by keyboard events ([#893](https://github.com/linz/basemaps/issues/893)) ([7d6acc7](https://github.com/linz/basemaps/commit/7d6acc7127ec6052999e6c50c7cae68bc512405e))
* **landing:** improve accessiblity hide offscreen elements from tab ([#895](https://github.com/linz/basemaps/issues/895)) ([cd2d512](https://github.com/linz/basemaps/commit/cd2d512f6065f15c1424370f8f0c52ad28e9ec87))
* **landing:** increase max zoom for nztm2000 to 18 ([#899](https://github.com/linz/basemaps/issues/899)) ([7e3c433](https://github.com/linz/basemaps/commit/7e3c43349b16ef641d26b6aab193d2cdb7a79783))





# [4.0.0](https://github.com/linz/basemaps/compare/v3.6.0...v4.0.0) (2020-07-09)


### Bug Fixes

* **cli:** improve image quality when fully zoomed in ([#884](https://github.com/linz/basemaps/issues/884)) ([7880d92](https://github.com/linz/basemaps/commit/7880d92b3eb8897f592dd87609e0f557b94ef6bb))
* **landing:** Fix typos in side menu ([#883](https://github.com/linz/basemaps/issues/883)) ([b380757](https://github.com/linz/basemaps/commit/b380757fb306d9cfd987a7f3255ebd37fbe23d39))


### Features

* improve access to the GDAL cli ([#882](https://github.com/linz/basemaps/issues/882)) ([5eaef38](https://github.com/linz/basemaps/commit/5eaef38ae19ca2b80843112502bdf15df57acab6))


### BREAKING CHANGES

* this changes how to get access to a new gdal instance to Gdal.create()

Co-authored-by: kodiakhq[bot] <49736102+kodiakhq[bot]@users.noreply.github.com>





# [3.6.0](https://github.com/linz/basemaps/compare/v3.5.0...v3.6.0) (2020-07-08)


### Bug Fixes

* **cli:** make clipMultipolygon always remove degenerate edges ([#863](https://github.com/linz/basemaps/issues/863)) ([c3c4cdf](https://github.com/linz/basemaps/commit/c3c4cdf8a8bb87e79569b08272ddb0fb2bfe8f01))
* **lambda:** Set Cors header on GET requests ([#865](https://github.com/linz/basemaps/issues/865)) ([c3e3c4c](https://github.com/linz/basemaps/commit/c3e3c4c331458a2d3ea5570a84e2ae961c19fd7f))
* **wmts:** add identifier ([#877](https://github.com/linz/basemaps/issues/877)) ([d2d9f56](https://github.com/linz/basemaps/commit/d2d9f56eb348e1131fa951a59e799cc333fb8a31))


### Features

* **landing:** Add content to contact us mailto: link ([#879](https://github.com/linz/basemaps/issues/879)) ([579ac92](https://github.com/linz/basemaps/commit/579ac92e2f39c70a8d67c2d01613f91e7b194774))
* **landing:** limit nztm to its extent ([#878](https://github.com/linz/basemaps/issues/878)) ([7470679](https://github.com/linz/basemaps/commit/747067955b0d52343498c81c2c20b29516046a75))





# [3.5.0](https://github.com/linz/basemaps/compare/v3.4.2...v3.5.0) (2020-07-05)


### Bug Fixes

* **cli:** mitigate polygon intersection errors ([#834](https://github.com/linz/basemaps/issues/834)) ([5799137](https://github.com/linz/basemaps/commit/5799137e8fa53816c5a28b7e53ecd9ffbca70bb1))
* **cli:** refactor projection logic to allow chathams to be built ([#854](https://github.com/linz/basemaps/issues/854)) ([f799006](https://github.com/linz/basemaps/commit/f799006ccf1a45ec8aebfe132603a17c031e4825))
* **landing:** allow firefox to render webps if it supports it ([#858](https://github.com/linz/basemaps/issues/858)) ([ba3013b](https://github.com/linz/basemaps/commit/ba3013b06509cb96e0cd468ac9d1510e9933f52f))


### Features

* **landing:** report tile loading stats ([#853](https://github.com/linz/basemaps/issues/853)) ([7e11d4a](https://github.com/linz/basemaps/commit/7e11d4a7304cbc9533ade2af2ad977cf0df1fe0f))





## [3.4.2](https://github.com/linz/basemaps/compare/v3.4.1...v3.4.2) (2020-06-30)


### Bug Fixes

* **cli:** don't reduce cutline when building a cog ([#846](https://github.com/linz/basemaps/issues/846)) ([7686a35](https://github.com/linz/basemaps/commit/7686a35a65ffa40c6192d2da3686582846e7bc08))





## [3.4.1](https://github.com/linz/basemaps/compare/v3.4.0...v3.4.1) (2020-06-30)


### Bug Fixes

* **cli:** ensure fatal errors set process exit code to 1 ([#842](https://github.com/linz/basemaps/issues/842)) ([f85c274](https://github.com/linz/basemaps/commit/f85c274c6bca05619312bce4eee59f5030a0d846))
* **landing:** use correct attribution url ([#840](https://github.com/linz/basemaps/issues/840)) ([86f8ef2](https://github.com/linz/basemaps/commit/86f8ef239703286a18437364020b5a86ce9084af))





# [3.4.0](https://github.com/linz/basemaps/compare/v3.3.0...v3.4.0) (2020-06-29)


### Bug Fixes

* **cli:** docker index.js in not executable ([#835](https://github.com/linz/basemaps/issues/835)) ([6b705f1](https://github.com/linz/basemaps/commit/6b705f1054476a8bc28692fb83e1894097860039))
* **cli:** show number of commits since last tag ([#836](https://github.com/linz/basemaps/issues/836)) ([a205215](https://github.com/linz/basemaps/commit/a2052156a761eddc7815632212007fa465c4d43d))


### Features

* **landing:** styles for mobile devices ([#839](https://github.com/linz/basemaps/issues/839)) ([53c6eb0](https://github.com/linz/basemaps/commit/53c6eb0d4d6cca13dc813fb683d8e4d598746647))





# [3.3.0](https://github.com/linz/basemaps/compare/v3.2.0...v3.3.0) (2020-06-28)


### Bug Fixes

* **cli:** always warp the vrt ([#829](https://github.com/linz/basemaps/issues/829)) ([42ded3a](https://github.com/linz/basemaps/commit/42ded3a6f2e9e12fad3481ac4608f6fac5deb90a))


### Features

* **landing:** add button to copy api urls ([#827](https://github.com/linz/basemaps/issues/827)) ([321334f](https://github.com/linz/basemaps/commit/321334fe0966906b1c2826c21bc7b9a45ff3e4cd))
* **landing:** api key generation and menu information  ([#813](https://github.com/linz/basemaps/issues/813)) ([0c32d72](https://github.com/linz/basemaps/commit/0c32d727fb63c20a5c0dda3dde31309b7042a48b))
* **landing:** dont show a NZTM xyz url as it does not make sense ([#828](https://github.com/linz/basemaps/issues/828)) ([deec860](https://github.com/linz/basemaps/commit/deec860babc3cbc16c145acf41c6b1220ae54ab3))
* **landing:** switch to new linz branded footer ([#826](https://github.com/linz/basemaps/issues/826)) ([f841047](https://github.com/linz/basemaps/commit/f8410473ab75e59a509e3c157c54a86695f1971a))





# [3.2.0](https://github.com/linz/basemaps/compare/v3.1.0...v3.2.0) (2020-06-25)


### Bug Fixes

* **lambda-tiler:** 404 when a user requests a tile outside of the tms zoom range ([#812](https://github.com/linz/basemaps/issues/812)) ([c78fff6](https://github.com/linz/basemaps/commit/c78fff6d7738f95339520c2d335ccb9a5329cc82))
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
* Generate and render COGs using bounding boxes ([#774](https://github.com/linz/basemaps/issues/774)) ([e35bf1f](https://github.com/linz/basemaps/commit/e35bf1f0e20b74a16ff942dc88547afc56454c12))
* increase maxvCpus for batch from 512 to 3000 ([#787](https://github.com/linz/basemaps/issues/787)) ([dd55e36](https://github.com/linz/basemaps/commit/dd55e36eebbfd34120e597cb2c3ee24aee2b2cf0))
* support split overview/warp resampling ([#777](https://github.com/linz/basemaps/issues/777)) ([952eec0](https://github.com/linz/basemaps/commit/952eec07ae1d4fb41159bb90a5304a63463352ce))





# [2.2.0](https://github.com/linz/basemaps/compare/v2.1.0...v2.2.0) (2020-06-17)


### Bug Fixes

* **cli:** fix regression in calculating image zoom resolution ([#736](https://github.com/linz/basemaps/issues/736)) ([d69c8b4](https://github.com/linz/basemaps/commit/d69c8b48e83e90b5dc0937988415a504faaf25d6))
* **cli:** fix regression quadkey.vrt missing '-allow_projection_difference' ([#770](https://github.com/linz/basemaps/issues/770)) ([2345ed4](https://github.com/linz/basemaps/commit/2345ed4760cfb963e9533024b7d369b8c4bfe8b8))
* **cli:** Take in to accound blend size when creating edge COGs ([#765](https://github.com/linz/basemaps/issues/765)) ([4fc4941](https://github.com/linz/basemaps/commit/4fc4941e7960c93959a563735fb2854236233aec))
* do not use full tiff files for generating etags ([#672](https://github.com/linz/basemaps/issues/672)) ([9fa9e73](https://github.com/linz/basemaps/commit/9fa9e73e9c650b5f2be198032d7a055a2c22e101))


### Features

* **cli:** allow rendering of a single cog ([#737](https://github.com/linz/basemaps/issues/737)) ([87ed6f1](https://github.com/linz/basemaps/commit/87ed6f14c55655e61835e2cdbf139e720280462e))
* **cli:** Use tms module to caclulate source projection window ([#724](https://github.com/linz/basemaps/issues/724)) ([d442da5](https://github.com/linz/basemaps/commit/d442da5d6c696277fb3d702e8b56ad4955bb5030))
* **geo:** adding support for tile matrix sets ([#686](https://github.com/linz/basemaps/issues/686)) ([3acc6d1](https://github.com/linz/basemaps/commit/3acc6d1caf50d363d5cac001ceb7b6f7c584ab6c))
* **geo:** convert quadkey to/from tile index ([#688](https://github.com/linz/basemaps/issues/688)) ([adac225](https://github.com/linz/basemaps/commit/adac2252b8084fe7a91e32c79e1b2326435a0a45))
* **geo:** find the closest psuedo quadkeys for a given tile ([#748](https://github.com/linz/basemaps/issues/748)) ([a7d8fde](https://github.com/linz/basemaps/commit/a7d8fdefa305143c17d36fd51f344faef9322d04))
* **geo:** generate a quadkey mapper for tile sets that are not quite square ([#745](https://github.com/linz/basemaps/issues/745)) ([246b169](https://github.com/linz/basemaps/commit/246b1694d9855428bea517a018deb4c0ef25048b))
* **lambda-shared:** add TileMetadataProvider ([#624](https://github.com/linz/basemaps/issues/624)) ([62c7744](https://github.com/linz/basemaps/commit/62c774403b8a7073cdbc846ca92abce3b986dfaf))
* **lambda-tiler:** Serve local images with set priority ([#755](https://github.com/linz/basemaps/issues/755)) ([6cd8ff2](https://github.com/linz/basemaps/commit/6cd8ff2f2979211e4859a1e2b0f949fcd5718bd2))
* **lambda-tiler:** support rendering tiles where the tile matrix set is not a quad ([#749](https://github.com/linz/basemaps/issues/749)) ([3aa97d2](https://github.com/linz/basemaps/commit/3aa97d28ff96f840de72dc7b7b710ad825bbea9a))
* **landing:** track with google analytics if $GOOGLE_ANALYTICS is set during deployment ([#764](https://github.com/linz/basemaps/issues/764)) ([afc7b8e](https://github.com/linz/basemaps/commit/afc7b8eb6337f3b15b32765bdc1186fc35d88ff4))
* render tiles using tile matrix sets ([#699](https://github.com/linz/basemaps/issues/699)) ([5b8156a](https://github.com/linz/basemaps/commit/5b8156aac4d23087c399667fba265af8383cd60a))
* **wmts:** support multiple layers and multiple projections ([#689](https://github.com/linz/basemaps/issues/689)) ([a8a5627](https://github.com/linz/basemaps/commit/a8a562705ba4b7b7e0c77ba5d2a7709ed08283ad))
* Allow composite imagery from different COG buckets ([#664](https://github.com/linz/basemaps/issues/664)) ([404a5a3](https://github.com/linz/basemaps/commit/404a5a3ad35ad6da5c8de6e1beebb134dcaec3ff))
* **landing:** rotate background colors when clicking the debug button ([#663](https://github.com/linz/basemaps/issues/663)) ([18e7c33](https://github.com/linz/basemaps/commit/18e7c339b9da8e48a2b759c3eab199dafcf69a89))





# [2.1.0](https://github.com/linz/basemaps/compare/v2.0.0...v2.1.0) (2020-05-21)


### Bug Fixes

* **cli:** gdal progress dots are not on every gdal command ([#651](https://github.com/linz/basemaps/issues/651)) ([b5e4838](https://github.com/linz/basemaps/commit/b5e4838c5cbcd1bb34cb32c754c5b55133938a31))
* **lambda-shared:** fix order equal priority images are sorted ([#640](https://github.com/linz/basemaps/issues/640)) ([3022336](https://github.com/linz/basemaps/commit/302233614aec815eb0d85c588d4a0c4be7f5cbc3))


### Features

* **cli:** output sparse cogs by default ([#643](https://github.com/linz/basemaps/issues/643)) ([da1ea32](https://github.com/linz/basemaps/commit/da1ea32ac5f5beae5dafaeedae74a5cf41008240))
* better sparse cog handling ([#634](https://github.com/linz/basemaps/issues/634)) ([1b60a87](https://github.com/linz/basemaps/commit/1b60a87f4a3f4751f203e3c927ca34784e5745b2))





# [2.0.0](https://github.com/linz/basemaps/compare/v1.12.0...v2.0.0) (2020-05-18)


### Features

* **geo:** support chatham projection 3793 ([#632](https://github.com/linz/basemaps/issues/632)) ([22d7cb6](https://github.com/linz/basemaps/commit/22d7cb62541e02101ca4cde153f856412f5d5d0d))





# [1.12.0](https://github.com/linz/basemaps/compare/v1.11.0...v1.12.0) (2020-05-15)


### Bug Fixes

* string comparing v1.1.0 to 1.1.0 does not work ([#628](https://github.com/linz/basemaps/issues/628)) ([04041ca](https://github.com/linz/basemaps/commit/04041cad227993afa2881069a7ed81d5c9afc227))
* **cli:** git hash cannot be fetched inside the docker cli ([#622](https://github.com/linz/basemaps/issues/622)) ([f53956d](https://github.com/linz/basemaps/commit/f53956de5f3be5b66b24d8ddf4794c4055558c6c))
* **cli:** jobs are not backwards compatabile yet ([#626](https://github.com/linz/basemaps/issues/626)) ([d10b587](https://github.com/linz/basemaps/commit/d10b587af28d4008f0669ec329dc3448481452df))
* **infra:** docker enviroment needs to be name/value pairs ([#623](https://github.com/linz/basemaps/issues/623)) ([b4c2a44](https://github.com/linz/basemaps/commit/b4c2a44927e4bbdcfab9bda08460747f78e6b54b))


### Features

* **cli:** output the gdal version when running ([#629](https://github.com/linz/basemaps/issues/629)) ([1d75b43](https://github.com/linz/basemaps/commit/1d75b4392034e6481e5e8078c29aa52ee36e46e3))





# [1.11.0](https://github.com/linz/basemaps/compare/v1.10.0...v1.11.0) (2020-05-14)


### Bug Fixes

* **cli:** externalId is not always required ([#618](https://github.com/linz/basemaps/issues/618)) ([2c5d9d0](https://github.com/linz/basemaps/commit/2c5d9d02c28c74693e07baf60874edced132c86d))
* **deps:** configure required deps to be runtime  ([#619](https://github.com/linz/basemaps/issues/619)) ([a6df14d](https://github.com/linz/basemaps/commit/a6df14d90ad599fb02b593bf3a2d1e21e3c4c4e1))
* **lambda-tiler:** add missing identifier for WMTS individual set ([#617](https://github.com/linz/basemaps/issues/617)) ([5f79609](https://github.com/linz/basemaps/commit/5f79609c478b9b9cf26006a9a428b05cdc39a7aa))


### Features

* **cli:** include git commit and version information in all jobs ([#620](https://github.com/linz/basemaps/issues/620)) ([dae265a](https://github.com/linz/basemaps/commit/dae265aa386d21a3048f4a5128dc9eef481737b4))





# [1.10.0](https://github.com/linz/basemaps/compare/v1.9.0...v1.10.0) (2020-05-13)


### Bug Fixes

* correct path to cli ([#609](https://github.com/linz/basemaps/issues/609)) ([4195a46](https://github.com/linz/basemaps/commit/4195a468c482252b21799af73831eaa75164b12f))


### Features

* add a checkerboard background to the landing page ([#608](https://github.com/linz/basemaps/issues/608)) ([5b921a7](https://github.com/linz/basemaps/commit/5b921a716ea013a4755cd53f6ffa8e5351a477b0))
* expose creation of CogJob ([#607](https://github.com/linz/basemaps/issues/607)) ([082dbfa](https://github.com/linz/basemaps/commit/082dbfacb894025deaed0ff443ca7277b9fb2e7d))
* improve cutline traceability ([#610](https://github.com/linz/basemaps/issues/610)) ([8e33f8d](https://github.com/linz/basemaps/commit/8e33f8d453dfa5d900fc11791867bc3d491cad23))





# [1.9.0](https://github.com/linz/basemaps/compare/v1.8.0...v1.9.0) (2020-05-12)


### Features

* **cog:** Allow supply of source projection ([#603](https://github.com/linz/basemaps/issues/603)) ([90006c7](https://github.com/linz/basemaps/commit/90006c756f45cb7641165b00d85675bd5859624b))
* **lambda-tiler:** Support tags and imagery sets for WMTSCapabilities.xml ([#599](https://github.com/linz/basemaps/issues/599)) ([9f4c6c2](https://github.com/linz/basemaps/commit/9f4c6c201224bf083ace2edfb2e8b885d741c6c5))





# [1.8.0](https://github.com/linz/basemaps/compare/v1.7.0...v1.8.0) (2020-05-11)


### Bug Fixes

* **cog:** add padding to projwin' ([#594](https://github.com/linz/basemaps/issues/594)) ([72a324a](https://github.com/linz/basemaps/commit/72a324a97ff470e436c3d5360954b9338ff36e59))


### Features

* support rendering different backgrounds for tiles ([#591](https://github.com/linz/basemaps/issues/591)) ([22f38f5](https://github.com/linz/basemaps/commit/22f38f555a678e6968206351d8fbb62a604da39e))





# [1.7.0](https://github.com/linz/basemaps/compare/v1.6.0...v1.7.0) (2020-05-10)


### Bug Fixes

* **cli:** role assumptions must have role names shorter than 64 chars ([#585](https://github.com/linz/basemaps/issues/585)) ([d889cb7](https://github.com/linz/basemaps/commit/d889cb7666685a8c3a4c7a0816c92fe62626e2e4))


### Features

* **cli:** support webp quality setting ([#586](https://github.com/linz/basemaps/issues/586)) ([a456404](https://github.com/linz/basemaps/commit/a456404e2774c7a7adeffd8d114c192b073106b7))





# [1.6.0](https://github.com/linz/basemaps/compare/v1.5.1...v1.6.0) (2020-05-08)


### Bug Fixes

* **serve:** allow any tile set name to be used ([#579](https://github.com/linz/basemaps/issues/579)) ([e3e6a03](https://github.com/linz/basemaps/commit/e3e6a03e66b496ae6f9247dc9cbbb0110f5993c5))
* **tiler:** position non square COGs correctly ([#580](https://github.com/linz/basemaps/issues/580)) ([3eb267a](https://github.com/linz/basemaps/commit/3eb267a1cfceefcdc9fa9872183a71d8da5818f7))


### Features

* **cli:** submit jobs automatically to aws batch with --batch ([#583](https://github.com/linz/basemaps/issues/583)) ([6b35696](https://github.com/linz/basemaps/commit/6b356961a2f7d1497f51f69199aa038e64fbdca9))





## [1.5.1](https://github.com/linz/basemaps/compare/v1.5.0...v1.5.1) (2020-05-07)


### Bug Fixes

* **cli:** aws assume role needs to be able to assume any role provided via the cli ([#578](https://github.com/linz/basemaps/issues/578)) ([d432c89](https://github.com/linz/basemaps/commit/d432c891280bbf312d6a547c4ccb3a766eca3670))





# [1.5.0](https://github.com/linz/basemaps/compare/v1.4.2...v1.5.0) (2020-05-07)


### Bug Fixes

* **cli:** do not error when --replace-with is not supplied ([#577](https://github.com/linz/basemaps/issues/577)) ([2c4f5dc](https://github.com/linz/basemaps/commit/2c4f5dc5f46823ce4e6f03420b9ec9fc233505ea))
* **cli:** root quadkey causes issues with dynamodb so never use it ([#576](https://github.com/linz/basemaps/issues/576)) ([4dfa860](https://github.com/linz/basemaps/commit/4dfa86027980231514ae417ce59e94f02e78c3f6))


### Features

* **landing:** support different imagery sets other than aerial with ?i=:imageId ([#575](https://github.com/linz/basemaps/issues/575)) ([f1b730e](https://github.com/linz/basemaps/commit/f1b730ea8fd61bd907e54be20abe18cd1146e3a9))





## [1.4.2](https://github.com/linz/basemaps/compare/v1.4.1...v1.4.2) (2020-05-06)

**Note:** Version bump only for package @basemaps/core





## [1.4.1](https://github.com/linz/basemaps/compare/v1.4.0...v1.4.1) (2020-05-06)

**Note:** Version bump only for package @basemaps/core





# [1.4.0](https://github.com/linz/basemaps/compare/v1.3.0...v1.4.0) (2020-05-06)


### Features

* **cog:** GZip cutline.geojson ([#570](https://github.com/linz/basemaps/issues/570)) ([c5e2e5e](https://github.com/linz/basemaps/commit/c5e2e5e03be657f046a877e314ee3a16d28e67af))





# [1.3.0](https://github.com/linz/basemaps/compare/v1.2.0...v1.3.0) (2020-05-05)


### Bug Fixes

* default resampling cubic to bilinear ([#552](https://github.com/linz/basemaps/issues/552)) ([978c789](https://github.com/linz/basemaps/commit/978c789d0bb448d2a0a2c28fcd6b4b1e45235659))
* **cog:** fix extractResolutionFromName for _10m ([c99d9f3](https://github.com/linz/basemaps/commit/c99d9f38ac8f2a951a44726352f15227e83e202c))
* **geo:** fix QuadKeyTrie.mergeQuadKeys size adjustments ([b3de521](https://github.com/linz/basemaps/commit/b3de52147e1be29c6654ce4c38e62733e283711d))
* action.batch missing await before storeLocal ([7ce960e](https://github.com/linz/basemaps/commit/7ce960e9767f3c7ed73644ab1dd611448e6fc596))
* allow 0 as GDAL_NODATA value ([1f79fab](https://github.com/linz/basemaps/commit/1f79fabd20a54134cd7d512a52b2a89469490b4c))
* allow cogify command access to tile metadata table ([9843670](https://github.com/linz/basemaps/commit/984367042bd384332213719e13086fde0dcfaeb7))
* compare only basename of tiff files in source.geojson ([9f1a5b9](https://github.com/linz/basemaps/commit/9f1a5b9c21b05e27ec7f15cf5c9d84e7016fa21f))
* guess NZTM based projections from the image's WKT ([c80dbdc](https://github.com/linz/basemaps/commit/c80dbdc05538346a325b248569940795528e6ed5))
* throw a error if the GDAL/nodejs aws profiles mismatch ([d3c2100](https://github.com/linz/basemaps/commit/d3c21003c58ffd35ebf78929de5cf4c49a23805a))
* **cutline:** ignore path when updating vrt ([#504](https://github.com/linz/basemaps/issues/504)) ([714c554](https://github.com/linz/basemaps/commit/714c5540b6d678531a50f480695fe55f84735c41))
* don't default to -1 for nodata as it is not a valid nodata value ([21c4add](https://github.com/linz/basemaps/commit/21c4add21366cb9d154141de06dba864197d18b1))
* imagery maps need to be initialized before use ([ae9b462](https://github.com/linz/basemaps/commit/ae9b462e033726a59a426df93aabfaa4a063471c))
* wait for processing to finish before erroring about missing projection ([852d0eb](https://github.com/linz/basemaps/commit/852d0eb11db72b68731e162b1e75b291844173d1))
* **projection.toUrn:** Don't include EPSG database version ([0c32d1f](https://github.com/linz/basemaps/commit/0c32d1f7461e47c6b8b63819bba419da740459a2))
* **wmts:** change image format order for ArcGIS Pro ([90c4cc8](https://github.com/linz/basemaps/commit/90c4cc8c2bed15e5aa5a36afd1270ee634b53e02))
* **wmts:** set max zoom to 22 ([288078f](https://github.com/linz/basemaps/commit/288078ffc6924d89802e529797a4440cc1023f90))


### Features

* **cli:** add ability to replace imagery with another imagery set ([015aae3](https://github.com/linz/basemaps/commit/015aae3112afb33853117824a347a7d83108963c))
* **cli:** create a tile set for all imagery processed ([#561](https://github.com/linz/basemaps/issues/561)) ([18e099e](https://github.com/linz/basemaps/commit/18e099e8d7ce615509775d35c9189168477b5816))
* **cli:** invalidate cloudfront cache when updating tileset information ([#554](https://github.com/linz/basemaps/issues/554)) ([b61b720](https://github.com/linz/basemaps/commit/b61b72024ef831b343d4e4febe499f3f7e352be4))
* **cli:** resubmit failed jobs if aws batch lists them as failed ([#563](https://github.com/linz/basemaps/issues/563)) ([40f6758](https://github.com/linz/basemaps/commit/40f67583c76823d58496961180cdbf54c9fcba66))
* **cli:** show imagery creation timestamps in logs ([#558](https://github.com/linz/basemaps/issues/558)) ([fb2b6e0](https://github.com/linz/basemaps/commit/fb2b6e0f08ecc05a5e8f6cb9a11ac469c610239d))
* **cli:** switch to priority numbers rather than array position ([#555](https://github.com/linz/basemaps/issues/555)) ([5dde7fd](https://github.com/linz/basemaps/commit/5dde7fd50ce1ea0faeb27c25030890a6c2fd6440))
* **cog:** Apply cutline when generating COGs ([6ff625f](https://github.com/linz/basemaps/commit/6ff625fc078c32f46087bb06417c104f2b4f748c))
* **cog:** create finer quadkeys for coverings ([#557](https://github.com/linz/basemaps/issues/557)) ([e47318b](https://github.com/linz/basemaps/commit/e47318bb222b68aaed180fdc2f8ead7f47c72a21))
* **cog:** Make cutline.Optimize produce fewer quadKeys ([dfa05dd](https://github.com/linz/basemaps/commit/dfa05dd87fd489cde3d240aa43c49d5e1c193f94))
* support tileset history ([#537](https://github.com/linz/basemaps/issues/537)) ([06760d4](https://github.com/linz/basemaps/commit/06760d4f1a6a28d0edc4f40f55cdf9db8e91f93f))
* **cog:** store metadata for imagery ([0b3aa34](https://github.com/linz/basemaps/commit/0b3aa346c7a1d8b7c1ba0a0edb3e28a69d8d7338))
* **cog/proj:** add quadKey utils ([22638d4](https://github.com/linz/basemaps/commit/22638d47fbceb58f03d8eaf26b06ad8f073c9a61))
* **CogJob:** add cutline option ([f8b71fd](https://github.com/linz/basemaps/commit/f8b71fdb00c246a92d920705b49e3505278bc632))
* **geo:** Add containsPoint to quadKey and trie ([a4b902a](https://github.com/linz/basemaps/commit/a4b902a1feeba5e80e813346f6c7d64d52199476))
* **geo/bounds:** add bbox utils and scaleFromCenter ([4ac7880](https://github.com/linz/basemaps/commit/4ac7880fe194a198185a7ac34ddc9e243109c290))
* **projection:** parse urn strings too ([8d7109c](https://github.com/linz/basemaps/commit/8d7109c655032e2e9dc74c278b5e46ef34ca92b3))
* **quadkey:** add compareKeys ([1b5de70](https://github.com/linz/basemaps/commit/1b5de70069aab65f40ddd8e772c2203aec02ab33))
* **quadkey.trie:** add iterator ([34a7d18](https://github.com/linz/basemaps/commit/34a7d1821ae7e97c2cd780b0ee39d49df676ca69))
* adding cli to configure rendering process ([13aae79](https://github.com/linz/basemaps/commit/13aae797b2143af8c08ed4da3c2013eacbbac082))
* allow importing existing imagery into database ([#452](https://github.com/linz/basemaps/issues/452)) ([64ee961](https://github.com/linz/basemaps/commit/64ee9611bc35b767f8edbfbdb638ac2aadb9dd80))
* quadkey trie for faster intersection checks for large quadkey sets ([1de1c72](https://github.com/linz/basemaps/commit/1de1c72791038bfcbbdd32b021227417057dcd56))
* **vdom:** add textContent attribute ([374c3dd](https://github.com/linz/basemaps/commit/374c3ddad1e55dddd7f178693be9d993ce816fa8))
* **vdom:** improve iterating tags and elementChildren ([5c85b37](https://github.com/linz/basemaps/commit/5c85b37f5de871ef0ea9dd08075dfc4dd7f1ace0))
* adding more utility functions for quad keys ([5ff83a1](https://github.com/linz/basemaps/commit/5ff83a1f3494fb73ae3ece154e60ee9b773d7746))
* make fetchImagery work with > 100 keys ([827c3a6](https://github.com/linz/basemaps/commit/827c3a68d07356a34dc5cda29a4dd4741a5afa9d))
* parse vrt files so we can modify them ([ef985d8](https://github.com/linz/basemaps/commit/ef985d8b018e86a0cc2fd9e873da96cbcda336e5))
* **wmts:** add fields and use URNs ([7e25b85](https://github.com/linz/basemaps/commit/7e25b85224ef28a9591c70dbea7b7a95b1bc48f2))
* **wmts:** increase max zoom level to 25 ([bc97ad3](https://github.com/linz/basemaps/commit/bc97ad38fef6ad15f50835784faa133c7b2dac88))


### Performance Improvements

* **metadata:** avoid extra loop when fetching images ([5e0688f](https://github.com/linz/basemaps/commit/5e0688fc08c1cc9a7ee8566e68f588b83fe1a660))





# [1.2.0](https://github.com/linz/basemaps/compare/v1.1.0...v1.2.0) (2020-03-25)


### Bug Fixes

* **api-tracker:** remove logging request ([51b0c7d](https://github.com/linz/basemaps/commit/51b0c7d8d7b5b6b2ca20f224cd45befe454cc7b3))
* **wmts:** don't add api key if blank ([b16d4cd](https://github.com/linz/basemaps/commit/b16d4cd1761b7196b75c151859337a6b27b4aab6))
* **wmts:** fix tile width, CRS and url version and api key ([9f22932](https://github.com/linz/basemaps/commit/9f229327555eaf409d772ecf5f2ff271e766035e))
* **wmts:** respond with 304 if not modified ([42ac052](https://github.com/linz/basemaps/commit/42ac052b21e84bc62df9852725a558eaa38130a6))
* add resample param to buildWarpVrt ([44e1df1](https://github.com/linz/basemaps/commit/44e1df1b8c662b6c6050215342c092c683cc4d70))
* add yarn lock ([c8526b4](https://github.com/linz/basemaps/commit/c8526b43c4dc5bf1ce7c9c705a460859883653f4))
* consolidated resample into cog ([9d69170](https://github.com/linz/basemaps/commit/9d691708d153d12d82c8468b2058728fb562a5a1))
* dockerfile to test resampling ([7e4638b](https://github.com/linz/basemaps/commit/7e4638bdc299267fa70474939db5221bf6def71c))
* dont allow invalid urls to be passed to the rendering engine. ([90cc0de](https://github.com/linz/basemaps/commit/90cc0de72e0d096416ca01305cc8ff3e4ecaca27))
* lambda functions need a "handler" to be exported to run ([d45b60b](https://github.com/linz/basemaps/commit/d45b60b5171af5e0bfe87657fb5db31cbdcc65c7))
* modified batch to use updated cog args ([af95524](https://github.com/linz/basemaps/commit/af955243e5886b5b92b2da63a7b49f011add4967))
* offset is outside of the bounds. ([a3a786c](https://github.com/linz/basemaps/commit/a3a786c98aa0879d9d17af133c33996a87a830c4))
* parseint nodata value ([c6d65de](https://github.com/linz/basemaps/commit/c6d65de2ef0f22a9c3b936f43bd36f8f359c7b3b))
* read nodata from tiff ([64d3e9c](https://github.com/linz/basemaps/commit/64d3e9ccff5a0f4e97769bcc69e8b5b313fc31ef))
* regressions in api-tracker server ([339142e](https://github.com/linz/basemaps/commit/339142e0df704033603e5749026d371c6ee40854))
* remove resample arg from batch ([#364](https://github.com/linz/basemaps/issues/364)) ([6731166](https://github.com/linz/basemaps/commit/67311666f076b00850500da6786a6aec4f903905))
* removed unused ga step ([64355f0](https://github.com/linz/basemaps/commit/64355f08935c7cbb4e6f52a51b5ba043ec581182))
* review requests for naming/efficiency ([cda50c6](https://github.com/linz/basemaps/commit/cda50c63d2cf818fae48954d863190bfb792d56c))
* set resample at job creation ([7ab0335](https://github.com/linz/basemaps/commit/7ab0335d182ad41ebd740e0ae75fca85f4e2dfc3))
* undefined resamples + read str nodata ([e10871d](https://github.com/linz/basemaps/commit/e10871d4dbef846186d3536fb5bc51d5f1b617ac))
* unnegated srcnodata condition ([20e592d](https://github.com/linz/basemaps/commit/20e592d5913b307525435931f9c9a806e2bb063c))
* update landing page and cli/serve to include aerial/3857 ([a604148](https://github.com/linz/basemaps/commit/a604148365b42417088821eca16487b63e7eaa58))
* xxxnodata args added to warp command ([b415431](https://github.com/linz/basemaps/commit/b415431628929e313803a04b3322aa56704e7b52))


### Features

* **tile:** serve png, webp and jpeg ([44e9395](https://github.com/linz/basemaps/commit/44e93952dadfc4367f909fb1ac64cc811667d75b))
* **wmts:** set cache-control max-age=0 for WMTSCapabilities.xml ([3e2c008](https://github.com/linz/basemaps/commit/3e2c0080faadf15e31d7646b8b711e4510313600))
* add resample to batch ([1a45000](https://github.com/linz/basemaps/commit/1a45000b1d1271bf540caee0a53eaa12fda1be3f))
* added variable resampling methods ([07b3c3f](https://github.com/linz/basemaps/commit/07b3c3fe87a7e0d50fae6ab964a8651a7b19df1d))
* adding suport for png, webp and jpeg tiles. ([8ad61e7](https://github.com/linz/basemaps/commit/8ad61e737a3cd153540abd8811bac680d00afeda))
* generate WMTSCapabilities.xml ([3e5ca52](https://github.com/linz/basemaps/commit/3e5ca52cd1b105c086c665e81cd6f2bc01eaacdb))
* improve vdom usability ([649b173](https://github.com/linz/basemaps/commit/649b173a2ab47d5a91c1596f5428e7b23ef2621c))
* plug in wmts into tracker and lambda servers ([e57681b](https://github.com/linz/basemaps/commit/e57681b3ef42def0dc1a11de23c4e0a6a264d3f5))
* simple virtual dom creator ([2d191d9](https://github.com/linz/basemaps/commit/2d191d917efd27ce24d934e5103eff82ed2a853e))





# [1.1.0](https://github.com/linz/basemaps/compare/v1.0.0...v1.1.0) (2020-02-20)


### Bug Fixes

* disable broken cogs until we can reprocess them ([43604ad](https://github.com/linz/basemaps/commit/43604ad2799f4ff8f12bf3f261d4c6d87b6853ea))
* limit the maximum zoom level for low resolution imagery ([c6e13a9](https://github.com/linz/basemaps/commit/c6e13a984bb6d6549daf5a5458e28a81039e1e5b))


### Features

* add npm publish action ([3abbc37](https://github.com/linz/basemaps/commit/3abbc37a13a9243ef2a91bc7205c47d0a751f0f6))
* cli script to create api keys ([1ce5e75](https://github.com/linz/basemaps/commit/1ce5e7505f88dd1c9feb5c59af147ae685c92c11))





# [1.0.0](https://github.com/linz/basemaps/compare/v0.3.0...v1.0.0) (2020-02-18)


### Features

* quick basemap landing page ([473a542](https://github.com/linz/basemaps/commit/473a542e25d5aa933cfcadf7342d66ea43b82bac))


* refactor!: split packages out in preperation for publishing. ([c6f5cbb](https://github.com/linz/basemaps/commit/c6f5cbb5514659ce446460bc8637e7a00e403a49))


### Bug Fixes

* correct a broken testing url ([5608176](https://github.com/linz/basemaps/commit/56081769498762de4c6c7a2ac0cc194b45264ab4))


### BREAKING CHANGES

* this splits out the lambda/node dependencies from javascript so packages can be published for the browser





# [0.3.0](https://github.com/linz/basemaps/compare/v0.2.0...v0.3.0) (2020-02-11)


### Bug Fixes

* capture stder and report on in if it exists ([8b60624](https://github.com/linz/basemaps/commit/8b606245e6b30878cc874c1db76e4994e183395e))
* failed to find projections when geoasciiparams are not loaded ([55ece94](https://github.com/linz/basemaps/commit/55ece94260f36785b76469ab988490d5a9f0f502))
* imagery needs a stable sort ([c7ba799](https://github.com/linz/basemaps/commit/c7ba7993e1544f7d120f7612d17b6f427549d716))
* support nzgd_2000 ([205b8fa](https://github.com/linz/basemaps/commit/205b8fa00649dc709645bf7a529e9be794e1d241))
* use the correct path for tiff lookups when resuming jobs ([01b7223](https://github.com/linz/basemaps/commit/01b7223bf3dae654a5efded3da106e8d08f4a5f3))


### Features

* regional additions ([8d08889](https://github.com/linz/basemaps/commit/8d08889690baf28ec7f62306065a2c21758e4943))





# [0.2.0](https://github.com/linz/basemaps/compare/v0.1.0...v0.2.0) (2020-01-29)


### Bug Fixes

* actually check if object exists in s3 ([789eb22](https://github.com/linz/basemaps/commit/789eb2280868f754552f147398fa773d8ef98983))
* allow more processing power to be applied to tasks ([b201683](https://github.com/linz/basemaps/commit/b201683f16be7a08bca2676d85cca018f9643d7b))
* allow more space for temporary tiff files. ([f0f8a28](https://github.com/linz/basemaps/commit/f0f8a285bdd140ec6c23df6121a51f9fec0a58bc))
* allow more than one c5 instance to process COGs ([2ff8844](https://github.com/linz/basemaps/commit/2ff884401836916a50c2f9d7500aefd28507ed08))
* ask for 8 hours of access to s3 files. ([f1a0910](https://github.com/linz/basemaps/commit/f1a0910a8e120e65f79cd567c652a6f4a0760a97))
* do not overwrite existing files if they exist ([ea46fed](https://github.com/linz/basemaps/commit/ea46fed8ff2ccc9a9d92869822cefd886ce2c299))
* imagery size is off by one ([1d7047a](https://github.com/linz/basemaps/commit/1d7047a4cb1819bef1c0210b6c13f0362ebe2cc5))
* new bathy imagery which improves the render quality ([a895d40](https://github.com/linz/basemaps/commit/a895d40dd76fa63f7fd034d40523b8db4b90969e))
* running too many containers on the same machine runs it out of disk ([f344997](https://github.com/linz/basemaps/commit/f344997f2a27216eaf307413e31fcfdc3ca58a1a))
* supply a launch template to force the batch hosts to have larger local disk ([affaf88](https://github.com/linz/basemaps/commit/affaf88dcd9887187b58635203e51fc507612482))
* wait for the tiffs to load before trying to serve them ([2647c15](https://github.com/linz/basemaps/commit/2647c15b167574d228c00aa957864d114b5b7b26))
* warn when a COG cannot be found ([2677865](https://github.com/linz/basemaps/commit/2677865c0c36b2392bb368b6617bb5ee5c997dae))


### Features

* add dunedin urban 2018 ([9895bd7](https://github.com/linz/basemaps/commit/9895bd7ab35a01a2981e7261893bdf1ba9da2164))
* adding bay of plenty urban 2018/19 ([52a4528](https://github.com/linz/basemaps/commit/52a452800a59ad9cc7c1164873bfa2d58a2df027))
* adding more urban imagery sets ([0b98b4b](https://github.com/linz/basemaps/commit/0b98b4bea853ec1834dbb4c5bcb3c8ad1f140874))
* allow cli tiler to access data from s3 ([c033de3](https://github.com/linz/basemaps/commit/c033de32d09d69db997569ee61bd002f8ae62c82))
* allow configuration of number of hours to assume a role ([f66f4f4](https://github.com/linz/basemaps/commit/f66f4f4f597959ec5d436ec15002ab26fc151a13))
* configure the temp folder using TEMP_FOLDER environment var ([2762014](https://github.com/linz/basemaps/commit/27620144e31e687050225a33fb7a80f785161e54))
* guess projection if WKT is present ([a9c9cd6](https://github.com/linz/basemaps/commit/a9c9cd680b41bed0e2213fe8c0087653861a22ad))
* if output files already exist do not overwrite them. ([ab1b861](https://github.com/linz/basemaps/commit/ab1b8616cfc5fbbae7cd3ee59d308bb4f3c6e036))





# 0.1.0 (2020-01-23)


### Bug Fixes

* 0 is not the root tile "" is ([61d2179](https://github.com/linz/basemaps/commit/61d21796f299954a844aa9617fc102b1e667a584))
* add tiffName to log output ([0b4e1a8](https://github.com/linz/basemaps/commit/0b4e1a8abe8336d82492f858565418a2abc6f127))
* alb lambda's do not need specific versions ([1f26114](https://github.com/linz/basemaps/commit/1f26114b35a53d29387a1598c1ef5072a6b59bee))
* allow fetching vpc information ([b5b122e](https://github.com/linz/basemaps/commit/b5b122e64cd3e14ceb3f86d53db799c613ba6951))
* assume responses are application/json unless told otherwise ([87b74d7](https://github.com/linz/basemaps/commit/87b74d7efefe4e8095aa57b5a057b41298ee06be))
* bigint logging does not work ([2b3ed43](https://github.com/linz/basemaps/commit/2b3ed4380d4444120755eadfa41defc6c19ce4df))
* broken env var ([3f267a0](https://github.com/linz/basemaps/commit/3f267a023bdf328d6fd72e2269703f4bbaf46a9b))
* build some cogs ([8c1e6d9](https://github.com/linz/basemaps/commit/8c1e6d90ddf33aa852b69fdecebfd42fbb2a7045))
* correct text in response ([940244f](https://github.com/linz/basemaps/commit/940244f8540010ccb496f45b9ea0c1197cf1fef9))
* duration must be the last thing calculated ([1766de6](https://github.com/linz/basemaps/commit/1766de689b544aaf913aa9b06c0d69d8fd5e9f33))
* eslint security alert ([b8937a0](https://github.com/linz/basemaps/commit/b8937a058999cfe7377c1e5f17a311b645dc0204))
* fixing path loading for s3 cogs ([fa86ed4](https://github.com/linz/basemaps/commit/fa86ed405b5ff1016c604338701c5da4f6f11e5d))
* force https-proxy-agent 3.0.0 ([722d597](https://github.com/linz/basemaps/commit/722d59754b4f36552f6e879a9bf4cd1cf862fc67))
* headers need to be lower cased ([a2932a0](https://github.com/linz/basemaps/commit/a2932a07d5ea7b3305154272a9cc33be41d8242d))
* headers need to be lowercased ([d0adc74](https://github.com/linz/basemaps/commit/d0adc74857380bd25ee429519e53dc728ff9e5b3))
* lock aws-cdk to 1.15 till they fix their issue. ([99b99f4](https://github.com/linz/basemaps/commit/99b99f42f38503a528a942871405a9bf54098790))
* log errors into err so pino will serialize them ([b575de9](https://github.com/linz/basemaps/commit/b575de9f34caaf308960644c3f2013b0b3446e78))
* not everything needs -addalpha ([223256d](https://github.com/linz/basemaps/commit/223256d40b9c5d561aca943faa71ac70c56edce0))
* only test original files ([0be67b5](https://github.com/linz/basemaps/commit/0be67b51c8239f23a106fd3eceb7e7254a9e2a3e))
* only warp the vrt to 3857 if really required ([26610d8](https://github.com/linz/basemaps/commit/26610d8b0cd28beaefe57a620385ecec617691cb))
* provide a new stream to pino instead of changing the internal one ([025abed](https://github.com/linz/basemaps/commit/025abed6d62ed3a8870d567702be5a4d074333d1))
* remove unreachable break ([11e35d3](https://github.com/linz/basemaps/commit/11e35d3410b5913c5b5c94a2e66360e402dc4f75))
* use the built cdk code ([0ddfccd](https://github.com/linz/basemaps/commit/0ddfccd6504bb4b167e9565edf4bcda3570431c8))
* warn if timers are unfinished on exit ([13750d2](https://github.com/linz/basemaps/commit/13750d2c0b9d5a20a4c559cd54d4af093db0eceb))


### Features

* adding aws cdk for deployment management ([df2a7be](https://github.com/linz/basemaps/commit/df2a7be665c85c9e14c64c57e79c963bbcf3c615))
* adding aws dynamo db table for api key tracking ([ee1b2a6](https://github.com/linz/basemaps/commit/ee1b2a6f87e8dbfa04baca2047dff632508fb12b))
* adding basic benchmark to track tile render performance ([f1cf534](https://github.com/linz/basemaps/commit/f1cf53465b70ed2a746fa15edc332bf77b0dc182))
* adding cli to serve xyz a folder of cogs on localhost:5050 ([eeb4d2b](https://github.com/linz/basemaps/commit/eeb4d2b7912d1dc358afbc8f6ade5c40f7c06250))
* adding gisborne_rural_2017-18_0.3m ([4491493](https://github.com/linz/basemaps/commit/449149344966948524b56f367cfd7c2de0cb3b1d))
* adding improved metrics ([2b97eb5](https://github.com/linz/basemaps/commit/2b97eb5efc47dc1ef46c50d073f5df04ff0017de))
* adding mosiac json interface ([0531ebb](https://github.com/linz/basemaps/commit/0531ebbbcfc419853ae1e51956642ef65270effe))
* adding ping version and health endpoints ([af0a1dc](https://github.com/linz/basemaps/commit/af0a1dcddb80549971387cdda63f90dd0e64d755))
* adding ssl listener for alb ([2c97c5c](https://github.com/linz/basemaps/commit/2c97c5c7ae3bd513ebf3b40a0c30907d538aa996))
* adding support for dry run of cogify ([9d4dbf2](https://github.com/linz/basemaps/commit/9d4dbf200642f3a9ffb028c6188e6bfbb47a8b9f))
* allow debug logging ([26cca8b](https://github.com/linz/basemaps/commit/26cca8bfa7d69c53c5637467f1448488643cac0c))
* basic mosaic support ([cbd8e4c](https://github.com/linz/basemaps/commit/cbd8e4c1cb91974c4bced766d1c5167a3ab6d99a))
* better cogify command ([8f086eb](https://github.com/linz/basemaps/commit/8f086eb18b079d3a0243c421bd82607de24463c0))
* bundle cli into single javascript file ([3d77287](https://github.com/linz/basemaps/commit/3d772873841cd9eee32d1e08a9b383fc16fe3a93))
* cache the bounding box creation into .cache to save on a lot of s3 requests ([cbe5e70](https://github.com/linz/basemaps/commit/cbe5e70efc714ef5f551e4516cd3e21e80a79a19))
* color test tiles black to see flaws ([9c635be](https://github.com/linz/basemaps/commit/9c635be6e67e18fa974ca8d30909387c86415d5e))
* convert a tif using a docker based gdal ([9777363](https://github.com/linz/basemaps/commit/977736384987d203c47d5e3b4a9b015dea5ee1ca))
* create tests for xyz tile service ([5caf862](https://github.com/linz/basemaps/commit/5caf862a366ec27495f449c7d7595f62d383b56e))
* expand tile creation to 4096 sized tiles ([e1ce06d](https://github.com/linz/basemaps/commit/e1ce06da97f2ee10c8d345b84bae37d8efdb8285))
* export a geojson covering if requested ([99b8438](https://github.com/linz/basemaps/commit/99b84389a06dd384dad9479bda2b049a597ac171))
* expose the cogify cli ([fe38aee](https://github.com/linz/basemaps/commit/fe38aeeb15b3fd17b2bc4ea6861a76a12339c927))
* forward the api key to the rendering service ([2beddab](https://github.com/linz/basemaps/commit/2beddaba1521468c26da3550cf987a3d04f96372))
* gdal docker build vrts ([54d8714](https://github.com/linz/basemaps/commit/54d8714789c896c624d1f6fd809537f5b96ac60e))
* gebco bathymetry ([7936908](https://github.com/linz/basemaps/commit/7936908b384c564ee2293780b96ccfa5ecef4466))
* generate a ETag from the parameters for caching ([2d6c4be](https://github.com/linz/basemaps/commit/2d6c4be530fe52184664b812445444d0f90b6e79))
* gisborne urban 2018 ([083e46c](https://github.com/linz/basemaps/commit/083e46c328ef12ecd4fe2709412f5b66bf103ff0))
* given a list of tiff files generate a webmercator covering ([9aaf7f2](https://github.com/linz/basemaps/commit/9aaf7f2640a4396d813c48209dd88a159f1b284f))
* if image diffs occur write out the diff image ([d4307c2](https://github.com/linz/basemaps/commit/d4307c27efc3e914bffe1a1db63229a2ce9b3585))
* include api key in meta log ([67b4699](https://github.com/linz/basemaps/commit/67b4699c5d03662b56885bd82c39bb3687701c27))
* include git version information in deployments ([5877005](https://github.com/linz/basemaps/commit/5877005b2cb5d4e24eb1cfc9cd108fa332cacaeb))
* include request id in http headers ([a80d3e0](https://github.com/linz/basemaps/commit/a80d3e030bd95c7617e8e1ab10b90fbdb86c1a03))
* include version information in logs ([da15f8d](https://github.com/linz/basemaps/commit/da15f8d5e14e9d57af133de57db1e1266df4329d))
* increase logging around http method/path ([6282b41](https://github.com/linz/basemaps/commit/6282b410d873ce0b11db520accd88cb5d0eca107))
* increase metric tracking ([9408135](https://github.com/linz/basemaps/commit/94081354e612af1a6b4c4fe3b825df0fe134b493))
* initial tiler to be used inside of the xyz service ([2b6b6e3](https://github.com/linz/basemaps/commit/2b6b6e305bb54324984d00a64db3fdbb1fc73ba5))
* lambda xyz tile server ([f115dfd](https://github.com/linz/basemaps/commit/f115dfd48ee352a8fc90abbfcbea15778f6c0961))
* load and convert bounds of imagery ([68df2a4](https://github.com/linz/basemaps/commit/68df2a4cbc5ad7d227a573b2db602e9a927d7bb5))
* log out center of xyz tile from cloudfront requests too ([f0ca41e](https://github.com/linz/basemaps/commit/f0ca41eef8acbe82677642eeb3d9664bb467b3c7))
* log out center of xyz tile so that we can plot it on a map easily ([0cc380d](https://github.com/linz/basemaps/commit/0cc380d923ecceee8b50d008de02ef6bd74f15f1))
* new better bg43 COG ([7a88d17](https://github.com/linz/basemaps/commit/7a88d17692114954e7dd92a4872b657450c3712e))
* nzdg2000 support ([fc4a4e2](https://github.com/linz/basemaps/commit/fc4a4e29fa176766ed2376a82541007b07ba46cc))
* prepare for splitting of polygons that span the antimeridian ([e7c3a51](https://github.com/linz/basemaps/commit/e7c3a510303d2ddd252f7f3dd18b2c7ce4a3fe8f))
* pretty print the cli if it is outputing to a tty ([d406059](https://github.com/linz/basemaps/commit/d40605974a8258ab40566e1e2c1ea6c4ba9f2341))
* process cogs using AWS batch ([8602ba8](https://github.com/linz/basemaps/commit/8602ba86db10c52267a71094c9836fc26f03bba5))
* provide a lambda context with logging/error handling included ([72fe409](https://github.com/linz/basemaps/commit/72fe4099f1c8cb8e326fd81635bed4725bc3c7db))
* quadkey intersections ([0c41194](https://github.com/linz/basemaps/commit/0c41194b50b0f569f344328f6234accdd891b618))
* render full tiles and diff output ([ec1caf7](https://github.com/linz/basemaps/commit/ec1caf7b04654fe8154b364981c30f4fc1a15e5a))
* serve 1x1 pixel png instead of 404 ([4d27d1d](https://github.com/linz/basemaps/commit/4d27d1d3df2222ea48da905b98c4aa463c980ee7))
* serve a webmap when running a local debug server. ([6c2f41c](https://github.com/linz/basemaps/commit/6c2f41c55038401e7cdffc4bcb9242e6f91b7b74))
* simple cli to generate cogs ([f11896e](https://github.com/linz/basemaps/commit/f11896ea751046a2e158600215b77a85455caf97))
* simple container to run cli ([2946a19](https://github.com/linz/basemaps/commit/2946a192d7b87c53c6227b961998be1aae2f3ef9))
* simplify loading of required tiff files ([3676e52](https://github.com/linz/basemaps/commit/3676e52a03af44b74adba0218773bcd350427a0d))
* supply aws credentials to gdal if needed ([1f57609](https://github.com/linz/basemaps/commit/1f5760940ac51dac9dbb0e62b601183ace7437a6))
* support 3857 in projections ([816d8f6](https://github.com/linz/basemaps/commit/816d8f6873de969aca9a4a22ce222d5ed49d51a1))
* switch tests to using a webmercator aligned test tiff ([56a88f0](https://github.com/linz/basemaps/commit/56a88f046775136f126fcaf6be58e0bb8edde41d))
* tile covering for webmercator tiles ([cd982d7](https://github.com/linz/basemaps/commit/cd982d7006c7509a4ae350c83a47dcadb90e6918))
* tile multiple datasets ([ae2d841](https://github.com/linz/basemaps/commit/ae2d841d3c81f992a8192d6de5534b49b30453f8))
* upgrade to cogeotiff 0.4.1 ([f161a67](https://github.com/linz/basemaps/commit/f161a67a539eb85eaf79e9af119bac777f0ca95a))
* validate api keys ([99d17ae](https://github.com/linz/basemaps/commit/99d17ae99f4b400868d207dc2b5a078618067a6f))
* validate function tests ([fe4a41c](https://github.com/linz/basemaps/commit/fe4a41cfe1927a239cca3706c49630a5dfd336cb))
