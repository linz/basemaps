# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
