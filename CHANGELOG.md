# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
