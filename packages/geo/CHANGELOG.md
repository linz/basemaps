# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.26.0](https://github.com/linz/basemaps/compare/v6.25.0...v6.26.0) (2022-05-12)


### Bug Fixes

* **lambda-tiler:** remove vector_layers as maplibre uses it as a validator ([#2189](https://github.com/linz/basemaps/issues/2189)) ([457d978](https://github.com/linz/basemaps/commit/457d978527f2c42408562021cef7b48ff9ce1afb))





# [6.25.0](https://github.com/linz/basemaps/compare/v6.24.2...v6.25.0) (2022-05-11)


### Features

* **config:** serve tilejson 3.0.0 and allow raster imagery ([#2173](https://github.com/linz/basemaps/issues/2173)) ([29f5313](https://github.com/linz/basemaps/commit/29f53131e917fa0b3ce6f280e8f9e09f4fe6e957))





## [6.24.2](https://github.com/linz/basemaps/compare/v6.24.1...v6.24.2) (2022-04-20)


### Bug Fixes

* **lambda-tiler:** expose the name of the imagery set in attribution ([#2153](https://github.com/linz/basemaps/issues/2153)) ([65d22cb](https://github.com/linz/basemaps/commit/65d22cbbf805d704b0179581ac6b66e755d2ef8f))





## [6.21.1](https://github.com/linz/basemaps/compare/v6.21.0...v6.21.1) (2022-03-17)

**Note:** Version bump only for package @basemaps/geo





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-17)


### Features

* **config:** remove imagery year and resoltuion from config as it is not used ([#2097](https://github.com/linz/basemaps/issues/2097)) ([8be7c09](https://github.com/linz/basemaps/commit/8be7c09b9ce64898e5ab54b7fcb74c34405f558e))


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2111) ([d07f8ab](https://github.com/linz/basemaps/commit/d07f8ab4037466b060bf7e83960737554ff064b4)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2111](https://github.com/linz/basemaps/issues/2111)
* Revert "release: v6.22.0 (#2108)" (#2110) ([abcd2e4](https://github.com/linz/basemaps/commit/abcd2e4732a6d606eed865f526d6df2e4617aad3)), closes [#2108](https://github.com/linz/basemaps/issues/2108) [#2110](https://github.com/linz/basemaps/issues/2110)
* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Features

* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/geo





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)


### Features

* **lambda-tiler:** remove `@basemaps/lambda` and replace with `@linzjs/lambda` ([#1821](https://github.com/linz/basemaps/issues/1821)) ([cb22b3d](https://github.com/linz/basemaps/commit/cb22b3d2c62b7430839f3e35c18dd96a162fb39a))





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)

**Note:** Version bump only for package @basemaps/geo





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)

**Note:** Version bump only for package @basemaps/geo





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)

**Note:** Version bump only for package @basemaps/geo





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)


### Features

* **geo:** allow finding tile matrix using epsg codes ([#1514](https://github.com/linz/basemaps/issues/1514)) ([c866e38](https://github.com/linz/basemaps/commit/c866e38191580c2705f70a51772d3956753c6269))





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)


### Bug Fixes

* **geo:** correctly find the closest zoom from a given scale ([#1489](https://github.com/linz/basemaps/issues/1489)) ([c8bbbb0](https://github.com/linz/basemaps/commit/c8bbbb01eb74293b7ccc4ba1443b39b05358ba25))
* **geo:** use the closest zoom mapping ([#1503](https://github.com/linz/basemaps/issues/1503)) ([5ce730d](https://github.com/linz/basemaps/commit/5ce730d34dd6fed7015f29683b3fc31183b1d3bc))


### Features

* **landing:** support nztm2000quad with ?p=nztm2000quad ([#1493](https://github.com/linz/basemaps/issues/1493)) ([cada7e0](https://github.com/linz/basemaps/commit/cada7e01e3deccd2446c745f4e610e8493495476))





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)


### Features

* **bathymetry:** generate the bathy tiles based on the output tile matrix set not hard coded ([#1478](https://github.com/linz/basemaps/issues/1478)) ([536c643](https://github.com/linz/basemaps/commit/536c643a216ac1378f53b3cb15c5897a428fb492))
* **geo:** add support for NZTM2000Quad tile matrix set ([#1470](https://github.com/linz/basemaps/issues/1470)) ([b0d8cde](https://github.com/linz/basemaps/commit/b0d8cded0777e2ab024b27455f6a58d5860fe9ad))
* support custom tile matrix sets ([#1469](https://github.com/linz/basemaps/issues/1469)) ([13a42de](https://github.com/linz/basemaps/commit/13a42de2647d448e1a4130602f759e21e03651bf))





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)


### Features

* **attribution:** remove `@basemaps/shared` dependency to make it smaller to install ([#1415](https://github.com/linz/basemaps/issues/1415)) ([5152614](https://github.com/linz/basemaps/commit/51526145256e0b7a514dc1185691d27cead1a0c6))
* Allow alternative TileMatrixSet definitions ([#1321](https://github.com/linz/basemaps/issues/1321)) ([b7cfa7b](https://github.com/linz/basemaps/commit/b7cfa7b8bf1351d9e57e46c180a1d3cf01c29927))





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)

**Note:** Version bump only for package @basemaps/geo





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)

**Note:** Version bump only for package @basemaps/geo





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)

**Note:** Version bump only for package @basemaps/geo





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)

**Note:** Version bump only for package @basemaps/geo





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)


### Features

* **lambda-tiler:** attribution ([#1205](https://github.com/linz/basemaps/issues/1205)) ([69cca66](https://github.com/linz/basemaps/commit/69cca66d901a23f01868ce6fedc8991f01c55de2))





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @basemaps/geo





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)

**Note:** Version bump only for package @basemaps/geo





# [4.8.0](https://github.com/linz/basemaps/compare/v4.7.1...v4.8.0) (2020-08-12)

**Note:** Version bump only for package @basemaps/geo





# [4.7.0](https://github.com/linz/basemaps/compare/v4.6.0...v4.7.0) (2020-08-10)


### Features

* **geo:** Add an optional bias when rounding bounds ([#1033](https://github.com/linz/basemaps/issues/1033)) ([c381733](https://github.com/linz/basemaps/commit/c3817332ab89d213bc87f0988f06b6331dc4c572))





# [4.6.0](https://github.com/linz/basemaps/compare/v4.5.0...v4.6.0) (2020-08-05)


### Features

* **geojson:** Improve GeoJSON compliance ([#1005](https://github.com/linz/basemaps/issues/1005)) ([bf7fd26](https://github.com/linz/basemaps/commit/bf7fd26cf2b08d6417a0c710b821648e9f7c9b9a))





# [4.4.0](https://github.com/linz/basemaps/compare/v4.3.0...v4.4.0) (2020-07-28)


### Features

* **lambda-tiler:** Serve WMTSCapabilities for all TileSets ([#953](https://github.com/linz/basemaps/issues/953)) ([49d0e88](https://github.com/linz/basemaps/commit/49d0e881b4726188ea937a9617c98bff5a78e44d))





# [4.1.0](https://github.com/linz/basemaps/compare/v4.0.0...v4.1.0) (2020-07-15)


### Bug Fixes

* **tiler:** try to minimize the error when rounding boundaries ([#913](https://github.com/linz/basemaps/issues/913)) ([e94b49d](https://github.com/linz/basemaps/commit/e94b49d7f818d31f2ee62ebd854c3b633b17a372))


### Features

* **cli:** Allow creation of one cog covering entire extent ([#920](https://github.com/linz/basemaps/issues/920)) ([2fd9187](https://github.com/linz/basemaps/commit/2fd918702e5cf25b12e24a3d72e694237e633a78))





# [4.0.0](https://github.com/linz/basemaps/compare/v3.6.0...v4.0.0) (2020-07-09)

**Note:** Version bump only for package @basemaps/geo





# [3.5.0](https://github.com/linz/basemaps/compare/v3.4.2...v3.5.0) (2020-07-05)


### Bug Fixes

* **cli:** mitigate polygon intersection errors ([#834](https://github.com/linz/basemaps/issues/834)) ([5799137](https://github.com/linz/basemaps/commit/5799137e8fa53816c5a28b7e53ecd9ffbca70bb1))





# [3.2.0](https://github.com/linz/basemaps/compare/v3.1.0...v3.2.0) (2020-06-25)


### Bug Fixes

* **lambda-tiler:** 404 when a user requests a tile outside of the tms zoom range ([#812](https://github.com/linz/basemaps/issues/812)) ([c78fff6](https://github.com/linz/basemaps/commit/c78fff6d7738f95339520c2d335ccb9a5329cc82))





# [3.1.0](https://github.com/linz/basemaps/compare/v3.0.0...v3.1.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/geo





# [3.0.0](https://github.com/linz/basemaps/compare/v2.2.0...v3.0.0) (2020-06-23)


### Features

* Generate and render COGs using bounding boxes ([#774](https://github.com/linz/basemaps/issues/774)) ([e35bf1f](https://github.com/linz/basemaps/commit/e35bf1f0e20b74a16ff942dc88547afc56454c12))





# [2.2.0](https://github.com/linz/basemaps/compare/v2.1.0...v2.2.0) (2020-06-17)


### Features

* **cli:** Use tms module to caclulate source projection window ([#724](https://github.com/linz/basemaps/issues/724)) ([d442da5](https://github.com/linz/basemaps/commit/d442da5d6c696277fb3d702e8b56ad4955bb5030))
* **geo:** adding support for tile matrix sets ([#686](https://github.com/linz/basemaps/issues/686)) ([3acc6d1](https://github.com/linz/basemaps/commit/3acc6d1caf50d363d5cac001ceb7b6f7c584ab6c))
* **geo:** convert quadkey to/from tile index ([#688](https://github.com/linz/basemaps/issues/688)) ([adac225](https://github.com/linz/basemaps/commit/adac2252b8084fe7a91e32c79e1b2326435a0a45))
* **geo:** find the closest psuedo quadkeys for a given tile ([#748](https://github.com/linz/basemaps/issues/748)) ([a7d8fde](https://github.com/linz/basemaps/commit/a7d8fdefa305143c17d36fd51f344faef9322d04))
* **geo:** generate a quadkey mapper for tile sets that are not quite square ([#745](https://github.com/linz/basemaps/issues/745)) ([246b169](https://github.com/linz/basemaps/commit/246b1694d9855428bea517a018deb4c0ef25048b))
* **lambda-tiler:** support rendering tiles where the tile matrix set is not a quad ([#749](https://github.com/linz/basemaps/issues/749)) ([3aa97d2](https://github.com/linz/basemaps/commit/3aa97d28ff96f840de72dc7b7b710ad825bbea9a))
* render tiles using tile matrix sets ([#699](https://github.com/linz/basemaps/issues/699)) ([5b8156a](https://github.com/linz/basemaps/commit/5b8156aac4d23087c399667fba265af8383cd60a))
* **wmts:** support multiple layers and multiple projections ([#689](https://github.com/linz/basemaps/issues/689)) ([a8a5627](https://github.com/linz/basemaps/commit/a8a562705ba4b7b7e0c77ba5d2a7709ed08283ad))





# [2.0.0](https://github.com/linz/basemaps/compare/v1.12.0...v2.0.0) (2020-05-18)


### Features

* **geo:** support chatham projection 3793 ([#632](https://github.com/linz/basemaps/issues/632)) ([22d7cb6](https://github.com/linz/basemaps/commit/22d7cb62541e02101ca4cde153f856412f5d5d0d))





## [1.4.2](https://github.com/linz/basemaps/compare/v1.4.1...v1.4.2) (2020-05-06)

**Note:** Version bump only for package @basemaps/geo





## [1.4.1](https://github.com/linz/basemaps/compare/v1.4.0...v1.4.1) (2020-05-06)

**Note:** Version bump only for package @basemaps/geo





# [1.3.0](https://github.com/linz/basemaps/compare/v1.2.0...v1.3.0) (2020-05-05)


### Bug Fixes

* **geo:** fix QuadKeyTrie.mergeQuadKeys size adjustments ([b3de521](https://github.com/linz/basemaps/commit/b3de52147e1be29c6654ce4c38e62733e283711d))
* **projection.toUrn:** Don't include EPSG database version ([0c32d1f](https://github.com/linz/basemaps/commit/0c32d1f7461e47c6b8b63819bba419da740459a2))


### Features

* support tileset history ([#537](https://github.com/linz/basemaps/issues/537)) ([06760d4](https://github.com/linz/basemaps/commit/06760d4f1a6a28d0edc4f40f55cdf9db8e91f93f))
* **geo:** Add containsPoint to quadKey and trie ([a4b902a](https://github.com/linz/basemaps/commit/a4b902a1feeba5e80e813346f6c7d64d52199476))
* **quadkey:** add compareKeys ([1b5de70](https://github.com/linz/basemaps/commit/1b5de70069aab65f40ddd8e772c2203aec02ab33))
* **quadkey.trie:** add iterator ([34a7d18](https://github.com/linz/basemaps/commit/34a7d1821ae7e97c2cd780b0ee39d49df676ca69))
* quadkey trie for faster intersection checks for large quadkey sets ([1de1c72](https://github.com/linz/basemaps/commit/1de1c72791038bfcbbdd32b021227417057dcd56))
* **geo/bounds:** add bbox utils and scaleFromCenter ([4ac7880](https://github.com/linz/basemaps/commit/4ac7880fe194a198185a7ac34ddc9e243109c290))
* **projection:** parse urn strings too ([8d7109c](https://github.com/linz/basemaps/commit/8d7109c655032e2e9dc74c278b5e46ef34ca92b3))
* adding more utility functions for quad keys ([5ff83a1](https://github.com/linz/basemaps/commit/5ff83a1f3494fb73ae3ece154e60ee9b773d7746))
* **wmts:** add fields and use URNs ([7e25b85](https://github.com/linz/basemaps/commit/7e25b85224ef28a9591c70dbea7b7a95b1bc48f2))





# [1.2.0](https://github.com/linz/basemaps/compare/v1.1.0...v1.2.0) (2020-03-25)

**Note:** Version bump only for package @basemaps/geo





# [1.0.0](https://github.com/linz/basemaps/compare/v0.3.0...v1.0.0) (2020-02-18)


* refactor!: split packages out in preperation for publishing. ([c6f5cbb](https://github.com/linz/basemaps/commit/c6f5cbb5514659ce446460bc8637e7a00e403a49))


### BREAKING CHANGES

* this splits out the lambda/node dependencies from javascript so packages can be published for the browser
