# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.22.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.22.0) (2022-03-17)


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-16)

**Note:** Version bump only for package @basemaps/landing





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
