# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.32.1](https://github.com/linz/basemaps/compare/v6.32.0...v6.32.1) (2022-07-28)

**Note:** Version bump only for package @basemaps/cli





# [6.32.0](https://github.com/linz/basemaps/compare/v6.31.0...v6.32.0) (2022-07-28)


### Bug Fixes

* **cli:** when importing imagery do not use a custom name ([#2369](https://github.com/linz/basemaps/issues/2369)) ([93e6e2a](https://github.com/linz/basemaps/commit/93e6e2a7b57c7d3d9f59a5bd8d28a329f5011b2a))


### Features

* **cli:** Move the default test tile into cli package ([#2367](https://github.com/linz/basemaps/issues/2367)) ([fec8fb4](https://github.com/linz/basemaps/commit/fec8fb4099fc07e202dac18345853fd28f00663b))





# [6.31.0](https://github.com/linz/basemaps/compare/v6.30.0...v6.31.0) (2022-07-22)


### Bug Fixes

* **cli:** do not use built in fetch ([#2341](https://github.com/linz/basemaps/issues/2341)) ([415b877](https://github.com/linz/basemaps/commit/415b877767561bcc2462652e36bead2bc82617ea))


### Features

* upgrade proj to 2.8.0 as it has improved transverse mercator projection logic BM-631 ([#2346](https://github.com/linz/basemaps/issues/2346)) ([4b74efb](https://github.com/linz/basemaps/commit/4b74efb07f69ceeaea9351d8e8012bc214c7614c))
* **cli:** Import config will update the latest ConfigBundle dynamo record. ([#2338](https://github.com/linz/basemaps/issues/2338)) ([25e864c](https://github.com/linz/basemaps/commit/25e864cb767af08bbe1d3df245666c2b6e8ecb44))
* **config:** Insert a config bundle records in dynamodb to refference the config file in s3. ([#2335](https://github.com/linz/basemaps/issues/2335)) ([143eeda](https://github.com/linz/basemaps/commit/143eeda69ab6eb6de70c7aed0247b6333ebb5bdf))
* **config:** use base58 hashes ([#2342](https://github.com/linz/basemaps/issues/2342)) ([8688351](https://github.com/linz/basemaps/commit/8688351834b0e00827024b25709d790d96522cb9))





# [6.30.0](https://github.com/linz/basemaps/compare/v6.29.0...v6.30.0) (2022-07-20)


### Bug Fixes

* **cli:**  serve was sometimes crashing due to parameters being defined too early ([#2321](https://github.com/linz/basemaps/issues/2321)) ([5dc92b7](https://github.com/linz/basemaps/commit/5dc92b75d6ce0df5c342b02ec18fc64263e45635))
* **cli:** ensure diff is printed for changes ([#2328](https://github.com/linz/basemaps/issues/2328)) ([653fdb9](https://github.com/linz/basemaps/commit/653fdb9e98b74c08a2155d10f316c89658ead73e))
* **cli:** when group is negative dont group ([#2283](https://github.com/linz/basemaps/issues/2283)) ([c812bf2](https://github.com/linz/basemaps/commit/c812bf264147425acc7eda9903ea4196b8410c1d))


### Features

* **cli:** Add assets location into bundle json file. ([#2334](https://github.com/linz/basemaps/issues/2334)) ([f90a6be](https://github.com/linz/basemaps/commit/f90a6bea904fc22f7dbe5417be8642b837ba692f))
* **cli:** add bmc serve to create a server from a bundled config ([#2306](https://github.com/linz/basemaps/issues/2306)) ([700c729](https://github.com/linz/basemaps/commit/700c7295ddae15d436bbf1932757c88feb4686ea))
* **cli:** add cli for listing, filtering and grouping files in AWS ([#2281](https://github.com/linz/basemaps/issues/2281)) ([b4dec98](https://github.com/linz/basemaps/commit/b4dec98c3006161972250f7a535423d874b1dd4e))
* **cli:** Add output path for the dump screenshots. ([#2300](https://github.com/linz/basemaps/issues/2300)) ([3358caa](https://github.com/linz/basemaps/commit/3358caa231a45ad5f9166e7ed147a2ef07d4615c))
* **cli:** allow using a local path for role configuration ([#2282](https://github.com/linz/basemaps/issues/2282)) ([e985ea2](https://github.com/linz/basemaps/commit/e985ea26ef70edd2beb5a5d474932a3a3ed1f4b1))
* **cli:** install playwright and basemaps/landing for the screenshot util ([#2286](https://github.com/linz/basemaps/issues/2286)) ([4e6559b](https://github.com/linz/basemaps/commit/4e6559be31da2f2eb578533fc8c88667ea27dca4))
* **cli:** Merge sprites cli into @basemaps/cli and update screenshot cli to support server assets. ([#2275](https://github.com/linz/basemaps/issues/2275)) ([0ee4f83](https://github.com/linz/basemaps/commit/0ee4f83bb26132fe387e66d039181ce2a3eb70d2))
* **cli:** New cli to bundle the assets into cotar file. ([#2311](https://github.com/linz/basemaps/issues/2311)) ([d632301](https://github.com/linz/basemaps/commit/d632301c69240fccc2e6a52851ac0ad1f6cc840a))
* **cli:** update import cli to optional output backup database  ([#2331](https://github.com/linz/basemaps/issues/2331)) ([4ee5603](https://github.com/linz/basemaps/commit/4ee56033446c464eb92101fa8ca866b0abd3a7e1))





# [6.29.0](https://github.com/linz/basemaps/compare/v6.28.1...v6.29.0) (2022-06-27)


### Bug Fixes

* **cli:** ensure cli can run inside of docker ([#2273](https://github.com/linz/basemaps/issues/2273)) ([8184167](https://github.com/linz/basemaps/commit/81841674efba2f86d9a39d01af62fccb1fe6f70f))
* **cli:** ensure errors are thrown ([#2248](https://github.com/linz/basemaps/issues/2248)) ([c0923fe](https://github.com/linz/basemaps/commit/c0923fe137ce36c610c6e13332292d5c7f573c16))
* **cli:** give each internal job a fresh copy of all data ([#2250](https://github.com/linz/basemaps/issues/2250)) ([52d59de](https://github.com/linz/basemaps/commit/52d59def25358e5a0f1fae5506edee6d8b17dbad))
* **cli:** look into batch to get exact list of tiffs being processed ([#2249](https://github.com/linz/basemaps/issues/2249)) ([69b722e](https://github.com/linz/basemaps/commit/69b722ea3190488231baf3b7023ce83e60e432c1))
* **config:** include missing zod dependency ([#2245](https://github.com/linz/basemaps/issues/2245)) ([94914dc](https://github.com/linz/basemaps/commit/94914dc728b60c51d6382c4460a1bd4e233f00c5))


### Features

* **cli:** merge all cli from config-cli package and server package into cli package. ([#2260](https://github.com/linz/basemaps/issues/2260)) ([73afd61](https://github.com/linz/basemaps/commit/73afd610740f69e67504a0610c94a407a6ba4091))
* **config:** create a hash of config bundles and use bundle created timestamp for records ([#2274](https://github.com/linz/basemaps/issues/2274)) ([bd9c7bb](https://github.com/linz/basemaps/commit/bd9c7bbf3f651417b60ba6ad2ca655f89f1f5cd9))





## [6.28.1](https://github.com/linz/basemaps/compare/v6.28.0...v6.28.1) (2022-06-07)

**Note:** Version bump only for package @basemaps/cli





# [6.28.0](https://github.com/linz/basemaps/compare/v6.27.0...v6.28.0) (2022-06-06)


### Features

* **server:** bundle basemaps-server cli so its easier to install ([#2218](https://github.com/linz/basemaps/issues/2218)) ([8457b66](https://github.com/linz/basemaps/commit/8457b66be6d0f54decf43b515bb78853cefbc8ed))





# [6.27.0](https://github.com/linz/basemaps/compare/v6.26.0...v6.27.0) (2022-05-29)


### Bug Fixes

* **cli:** Action Cog get processing Id after read job json. ([#2204](https://github.com/linz/basemaps/issues/2204)) ([e459d2a](https://github.com/linz/basemaps/commit/e459d2a12363ded2a825c4266c79357324d17b97))


### Features

* **cli:** allow overriding imagery names ([#2169](https://github.com/linz/basemaps/issues/2169)) ([5c3bdd8](https://github.com/linz/basemaps/commit/5c3bdd89b664dd85df2b48d709653b71bdc348f7))
* **cli:** Chunk batch job based on the size. ([#2217](https://github.com/linz/basemaps/issues/2217)) ([770430c](https://github.com/linz/basemaps/commit/770430ce388f13f2690fa680e113c4e830df312a))
* **cli:** Insert imagery and tileset config after cog creation complete ([#2191](https://github.com/linz/basemaps/issues/2191)) ([3ea5efd](https://github.com/linz/basemaps/commit/3ea5efd049b956f882a05c90471d764efb5d39fd))
* **cli:** Make a sseperate folder for each tiff for group cogs batch job. ([#2213](https://github.com/linz/basemaps/issues/2213)) ([e2aef5e](https://github.com/linz/basemaps/commit/e2aef5e460e059a7f8f59cc143a606255d7d77e0))
* **cli:** make cogs will update the process job status if exists. ([#2180](https://github.com/linz/basemaps/issues/2180)) ([855ce1c](https://github.com/linz/basemaps/commit/855ce1cb1f7b8bff575be342184e5ac387684f09))
* **cli:** Pass processingId to action job cli for the batch job. ([#2199](https://github.com/linz/basemaps/issues/2199)) ([f962fe2](https://github.com/linz/basemaps/commit/f962fe21859d44fe6ace79aed4611f3343a0d1bd))
* **cli:** Upgrade action cog to be able to group small jobs into a single batch job. ([#2210](https://github.com/linz/basemaps/issues/2210)) ([8a7de91](https://github.com/linz/basemaps/commit/8a7de912a3b633bfac631e61b0480f2839ceb2cc))
* **lambda-cog:** New lambda Cog for import api. ([#2207](https://github.com/linz/basemaps/issues/2207)) ([79f4ae7](https://github.com/linz/basemaps/commit/79f4ae70ea3fc16a37dd575b843a0b60a1365df4))
* **lambda-tiler:** Add file number limitation to import api. ([#2203](https://github.com/linz/basemaps/issues/2203)) ([4694e29](https://github.com/linz/basemaps/commit/4694e29a4444810391e72b290ec64f8b8541c369))
* **lambda-tiler:** Increase limit of total file size. ([#2205](https://github.com/linz/basemaps/issues/2205)) ([5246ea0](https://github.com/linz/basemaps/commit/5246ea0879a4bf6b20770fb633d63afac778d54d))
* **lambda-tiler:** Load MaxImagePixelSize from import api. ([#2206](https://github.com/linz/basemaps/issues/2206)) ([b851934](https://github.com/linz/basemaps/commit/b85193401bc5df2ecb689c3801f62af71696cdf5))





# [6.26.0](https://github.com/linz/basemaps/compare/v6.25.0...v6.26.0) (2022-05-12)

**Note:** Version bump only for package @basemaps/cli





# [6.25.0](https://github.com/linz/basemaps/compare/v6.24.2...v6.25.0) (2022-05-11)

**Note:** Version bump only for package @basemaps/cli





## [6.24.2](https://github.com/linz/basemaps/compare/v6.24.1...v6.24.2) (2022-04-20)

**Note:** Version bump only for package @basemaps/cli





## [6.24.1](https://github.com/linz/basemaps/compare/v6.24.0...v6.24.1) (2022-04-07)

**Note:** Version bump only for package @basemaps/cli





# [6.24.0](https://github.com/linz/basemaps/compare/v6.23.0...v6.24.0) (2022-04-05)


### Bug Fixes

* **cli:** create instance of EPSG code if not already defined ([#2141](https://github.com/linz/basemaps/issues/2141)) ([9e7b508](https://github.com/linz/basemaps/commit/9e7b508a70aa85f80b88a29501a08c249c9617af))





# [6.23.0](https://github.com/linz/basemaps/compare/v6.22.1...v6.23.0) (2022-04-04)


### Features

* **shared:** load projections from the internet when not defined locally ([#2132](https://github.com/linz/basemaps/issues/2132)) ([85ac59f](https://github.com/linz/basemaps/commit/85ac59f771c3233f163a0223459faece46073847))





## [6.22.1](https://github.com/linz/basemaps/compare/v6.22.0...v6.22.1) (2022-03-23)


### Bug Fixes

* **cli:** allow unicode job names ([#2126](https://github.com/linz/basemaps/issues/2126)) ([bab5cef](https://github.com/linz/basemaps/commit/bab5cefdc8365cb52bf687230a078ea599c359ce))





# [6.22.0](https://github.com/linz/basemaps/compare/v6.21.1...v6.22.0) (2022-03-20)


### Features

* **cli:** support multiple invalidations for cloudfront ([#2120](https://github.com/linz/basemaps/issues/2120)) ([764fdeb](https://github.com/linz/basemaps/commit/764fdebaf7624c7761cede3a24c2184105bff9e2))





## [6.21.1](https://github.com/linz/basemaps/compare/v6.21.0...v6.21.1) (2022-03-17)

**Note:** Version bump only for package @basemaps/cli





# [6.21.0](https://github.com/linz/basemaps/compare/v6.20.0...v6.21.0) (2022-03-17)


### Bug Fixes

* **config:** fetch all unprocessed keys from dynamo if there are any ([#2101](https://github.com/linz/basemaps/issues/2101)) ([731430e](https://github.com/linz/basemaps/commit/731430e73756f05b2684f5b7ae7bd2852bc0a9b5))


### Features

* **cli:** remove unused config cli this has been moved into linz/basemaps-config ([#2102](https://github.com/linz/basemaps/issues/2102)) ([b047e11](https://github.com/linz/basemaps/commit/b047e111a9be2b200d5812d2d32fc6df7fdf4c2a))


### Reverts

* Revert "release: v6.21.0 (#2104)" (#2111) ([d07f8ab](https://github.com/linz/basemaps/commit/d07f8ab4037466b060bf7e83960737554ff064b4)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2111](https://github.com/linz/basemaps/issues/2111)
* Revert "release: v6.22.0 (#2108)" (#2110) ([abcd2e4](https://github.com/linz/basemaps/commit/abcd2e4732a6d606eed865f526d6df2e4617aad3)), closes [#2108](https://github.com/linz/basemaps/issues/2108) [#2110](https://github.com/linz/basemaps/issues/2110)
* Revert "release: v6.21.0 (#2104)" (#2107) ([2c7e7f6](https://github.com/linz/basemaps/commit/2c7e7f6686a293995abdeb9604413808f2208bd6)), closes [#2104](https://github.com/linz/basemaps/issues/2104) [#2107](https://github.com/linz/basemaps/issues/2107)





# [6.20.0](https://github.com/linz/basemaps/compare/v6.19.0...v6.20.0) (2022-02-01)


### Bug Fixes

* **cli:** disable reading sidecar files ([#2049](https://github.com/linz/basemaps/issues/2049)) ([d42d03b](https://github.com/linz/basemaps/commit/d42d03b34a1f3d9de895ee3c318112882e5a8972))





# [6.18.0](https://github.com/linz/basemaps/compare/v6.17.0...v6.18.0) (2021-12-14)

**Note:** Version bump only for package @basemaps/cli





# [6.17.0](https://github.com/linz/basemaps/compare/v6.16.1...v6.17.0) (2021-12-05)

**Note:** Version bump only for package @basemaps/cli





## [6.16.1](https://github.com/linz/basemaps/compare/v6.16.0...v6.16.1) (2021-11-30)

**Note:** Version bump only for package @basemaps/cli





# [6.16.0](https://github.com/linz/basemaps/compare/v6.15.0...v6.16.0) (2021-11-29)


### Bug Fixes

* **lambda-tiler:** p-limit is a needed dependency ([#1998](https://github.com/linz/basemaps/issues/1998)) ([dfb1b25](https://github.com/linz/basemaps/commit/dfb1b2575e9b40b96ffa4bdcfa8f1496b18ae25e))





# [6.15.0](https://github.com/linz/basemaps/compare/v6.14.2...v6.15.0) (2021-11-28)


### Bug Fixes

* **cli:** ensure all files from the job.json are created before logging JobComplete ([#1959](https://github.com/linz/basemaps/issues/1959)) ([78fd35a](https://github.com/linz/basemaps/commit/78fd35ad863c424069d79c8668e9e5b3195ccec9))





# [6.14.0](https://github.com/linz/basemaps/compare/v6.13.0...v6.14.0) (2021-10-27)


### Bug Fixes

* **cli:** s3 keys should not start with a "/" ([#1935](https://github.com/linz/basemaps/issues/1935)) ([bc9cc22](https://github.com/linz/basemaps/commit/bc9cc224c0c4da6a85c193c8eb3524108d31c17d))


### Features

* **cli:** compress text documents with gzip before uploading ([#1936](https://github.com/linz/basemaps/issues/1936)) ([7a6e090](https://github.com/linz/basemaps/commit/7a6e090d0cc26372425b664d6788569e39fd5cca))





# [6.13.0](https://github.com/linz/basemaps/compare/v6.12.2...v6.13.0) (2021-10-25)


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





# [6.12.0](https://github.com/linz/basemaps/compare/v6.11.0...v6.12.0) (2021-10-05)

**Note:** Version bump only for package @basemaps/cli





# [6.11.0](https://github.com/linz/basemaps/compare/v6.10.1...v6.11.0) (2021-10-03)


### Bug Fixes

* **cli:** correct path issues with ESM modules being bundled into docker containers ([#1888](https://github.com/linz/basemaps/issues/1888)) ([7c1b2f4](https://github.com/linz/basemaps/commit/7c1b2f4979956a09f63b461463bb43788ce0122c))
* **cli:** work around certificate issues ([#1890](https://github.com/linz/basemaps/issues/1890)) ([5e90775](https://github.com/linz/basemaps/commit/5e907752f0a195d6b6b976bb1bbf56895e6e18f7))


### Features

* **server:** use the lambda handler directly ([#1870](https://github.com/linz/basemaps/issues/1870)) ([408ff56](https://github.com/linz/basemaps/commit/408ff5654cc04aae35d05eb5bbc47a51f99ec5b2))





# [6.10.0](https://github.com/linz/basemaps/compare/v6.9.1...v6.10.0) (2021-09-22)


### Bug Fixes

* correctly bundle with esm modules ([#1858](https://github.com/linz/basemaps/issues/1858)) ([708a22e](https://github.com/linz/basemaps/commit/708a22ec1006c25cf2c057b75f61cc813e943aac))


### Features

* replace s3fs with chunkd/fs ([#1859](https://github.com/linz/basemaps/issues/1859)) ([9b6f2d3](https://github.com/linz/basemaps/commit/9b6f2d3609c336f96c2ae32246f241cb396e71c8))
* switch to esm modules ([#1857](https://github.com/linz/basemaps/issues/1857)) ([75bdff8](https://github.com/linz/basemaps/commit/75bdff8da35104f10f6b6ecf58a2c6006245af6e))





## [6.9.1](https://github.com/linz/basemaps/compare/v6.9.0...v6.9.1) (2021-09-09)

**Note:** Version bump only for package @basemaps/cli





# [6.9.0](https://github.com/linz/basemaps/compare/v6.8.0...v6.9.0) (2021-09-09)

**Note:** Version bump only for package @basemaps/cli





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)


### Features

* **server:** create a standalone express server ([#1819](https://github.com/linz/basemaps/issues/1819)) ([83488af](https://github.com/linz/basemaps/commit/83488af658a3ed8f3080dd2ea9f120ac3abd2444))





# [6.7.0](https://github.com/linz/basemaps/compare/v6.6.1...v6.7.0) (2021-08-15)

**Note:** Version bump only for package @basemaps/cli





# [6.6.0](https://github.com/linz/basemaps/compare/v6.5.0...v6.6.0) (2021-07-29)

**Note:** Version bump only for package @basemaps/cli





# [6.5.0](https://github.com/linz/basemaps/compare/v6.4.0...v6.5.0) (2021-07-25)

**Note:** Version bump only for package @basemaps/cli





# [6.4.0](https://github.com/linz/basemaps/compare/v6.3.0...v6.4.0) (2021-07-13)

**Note:** Version bump only for package @basemaps/cli





# [6.3.0](https://github.com/linz/basemaps/compare/v6.2.0...v6.3.0) (2021-07-07)

**Note:** Version bump only for package @basemaps/cli





# [6.1.0](https://github.com/linz/basemaps/compare/v6.0.0...v6.1.0) (2021-06-23)


### Features

* switch to a binary cotar index ([#1691](https://github.com/linz/basemaps/issues/1691)) ([6fa0b3f](https://github.com/linz/basemaps/commit/6fa0b3f223ab251fe94011cbda88ff9aa5b6922f))





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)


### Features

* **s3fs:** refactor how credentials are passed to s3fs ([#1675](https://github.com/linz/basemaps/issues/1675)) ([f07f529](https://github.com/linz/basemaps/commit/f07f529af1657aa5ffe7d9deff92406e908e6fe4))


### BREAKING CHANGES

* **s3fs:** this changes the behaviour for s3fs as paths now need to be registered with credentials

* refactor: remove commented out code





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)

**Note:** Version bump only for package @basemaps/cli





## [5.0.3](https://github.com/linz/basemaps/compare/v5.0.2...v5.0.3) (2021-05-25)

**Note:** Version bump only for package @basemaps/cli





## [5.0.2](https://github.com/linz/basemaps/compare/v5.0.1...v5.0.2) (2021-05-19)


### Bug Fixes

* **cli:** force gdal version 3.3.0 ([#1623](https://github.com/linz/basemaps/issues/1623)) ([bc2815b](https://github.com/linz/basemaps/commit/bc2815b874fd4077799be4bc501e863ded2a3ef2))





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)


### Features

* **config:** Tidy up the config and cli to be able to config style json. ([#1555](https://github.com/linz/basemaps/issues/1555)) ([95b4c0e](https://github.com/linz/basemaps/commit/95b4c0ed5a42a5b7c6c7884c9bfe24f97e3677e5))
* **shared:** Cleanup - Remove TileSet Metatdata Record V1. ([#1541](https://github.com/linz/basemaps/issues/1541)) ([32e79af](https://github.com/linz/basemaps/commit/32e79afe630e9042edc1f936a657b7a31f1392ef))
* support serving of vector tiles ([#1535](https://github.com/linz/basemaps/issues/1535)) ([30083a5](https://github.com/linz/basemaps/commit/30083a57f981c2b2db6c50cad0f8db48be377d19))





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)

**Note:** Version bump only for package @basemaps/cli





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)


### Bug Fixes

* **geo:** correctly find the closest zoom from a given scale ([#1489](https://github.com/linz/basemaps/issues/1489)) ([c8bbbb0](https://github.com/linz/basemaps/commit/c8bbbb01eb74293b7ccc4ba1443b39b05358ba25))


### Features

* **cli:** allow cusomising the tile matrix to use when building COGs ([#1483](https://github.com/linz/basemaps/issues/1483)) ([97f86de](https://github.com/linz/basemaps/commit/97f86de16e0e0cd309268a5807ff13779553ddae))





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)


### Bug Fixes

* **cli:** detect if differing band counts of imagery is used in a single imagery set ([#1466](https://github.com/linz/basemaps/issues/1466)) ([e546c20](https://github.com/linz/basemaps/commit/e546c2039a6bbcc4d3c89461f12dcc1cca594f26))





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)


### Features

* **attribution:** remove `@basemaps/shared` dependency to make it smaller to install ([#1415](https://github.com/linz/basemaps/issues/1415)) ([5152614](https://github.com/linz/basemaps/commit/51526145256e0b7a514dc1185691d27cead1a0c6))
* **cli:** add a invalidate action to destroy cloudfront cache ([#1402](https://github.com/linz/basemaps/issues/1402)) ([bc93f70](https://github.com/linz/basemaps/commit/bc93f706f756ea66e6e68041511b742d9353457a))
* Allow alternative TileMatrixSet definitions ([#1321](https://github.com/linz/basemaps/issues/1321)) ([b7cfa7b](https://github.com/linz/basemaps/commit/b7cfa7b8bf1351d9e57e46c180a1d3cf01c29927))





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)

**Note:** Version bump only for package @basemaps/cli





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)

**Note:** Version bump only for package @basemaps/cli





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)


### Bug Fixes

* **cli:** allow using new tag ([#1304](https://github.com/linz/basemaps/issues/1304)) ([231fed2](https://github.com/linz/basemaps/commit/231fed2df7c3be0bc2d2c99c3a94353c63c3fde2))


### Features

* **cli:** Configure TileSet metedata DB from config file ([#1277](https://github.com/linz/basemaps/issues/1277)) ([b8c76d4](https://github.com/linz/basemaps/commit/b8c76d4d3aac3e49a4a01bfc88c58ab149d62482))





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)


### Bug Fixes

* **cli:** correct permissions when creating cogs ([#1255](https://github.com/linz/basemaps/issues/1255)) ([2079041](https://github.com/linz/basemaps/commit/20790410bd014d74446879acf29e03889b18e539))
* **cli:** correct the location to find the source roleArn ([#1256](https://github.com/linz/basemaps/issues/1256)) ([906843d](https://github.com/linz/basemaps/commit/906843d699386ae3b480316ba911467f1d375def))





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)


### Bug Fixes

* Remove dashes from CC-BY-4.0 license text ([#1223](https://github.com/linz/basemaps/issues/1223)) ([ae88b81](https://github.com/linz/basemaps/commit/ae88b817f3f82288d3dbb5b0ca8c30302bdae959))
* STAC files should comply to 1.0.0-beta.2 of the specification ([#1176](https://github.com/linz/basemaps/issues/1176)) ([d2fe323](https://github.com/linz/basemaps/commit/d2fe3236cacdbf9ae7118934c8936490faeab64c))


### Features

* **lambda-tiler:** attribution ([#1205](https://github.com/linz/basemaps/issues/1205)) ([69cca66](https://github.com/linz/basemaps/commit/69cca66d901a23f01868ce6fedc8991f01c55de2))
* **linzjs-s3fs:** .list is now a async generator to allow easier iterating of folders ([#1213](https://github.com/linz/basemaps/issues/1213)) ([a42c594](https://github.com/linz/basemaps/commit/a42c594a506914e340eabb2afd97991c2b119a64))





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)


### Bug Fixes

* **linzjs-s3fs:** allow fs.list to list buckets and not need a "key" ([#1178](https://github.com/linz/basemaps/issues/1178)) ([108774f](https://github.com/linz/basemaps/commit/108774f96e37d36f89d1c29b634e1956d2fddf54))





# [4.13.0](https://github.com/linz/basemaps/compare/v4.12.2...v4.13.0) (2020-09-14)

**Note:** Version bump only for package @basemaps/cli





## [4.12.2](https://github.com/linz/basemaps/compare/v4.12.0...v4.12.2) (2020-09-10)

**Note:** Version bump only for package @basemaps/cli





# [4.12.0](https://github.com/linz/basemaps/compare/v4.11.2...v4.12.0) (2020-09-06)


### Features

* **bathymetry:** allow input and output from s3 bucket ([#1122](https://github.com/linz/basemaps/issues/1122)) ([1f00d9a](https://github.com/linz/basemaps/commit/1f00d9aacc6d132c0761a35069ddab15f135ac4c))





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @basemaps/cli





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)


### Features

* allow imagery with the same id in the rendering process twice ([#1104](https://github.com/linz/basemaps/issues/1104)) ([d8cd642](https://github.com/linz/basemaps/commit/d8cd642c6215a5198e15414c14680afacad88faf))
* **shared:** align bathymetry STAC usage with cog creation ([#1092](https://github.com/linz/basemaps/issues/1092)) ([fd9bc27](https://github.com/linz/basemaps/commit/fd9bc27b05d7e772f1856bb0e81268ac2930ef24))





# [4.10.0](https://github.com/linz/basemaps/compare/v4.9.0...v4.10.0) (2020-08-19)


### Bug Fixes

* **cli:** use the same url pattern as WMTS to invalidate cache ([#1065](https://github.com/linz/basemaps/issues/1065)) ([f24a988](https://github.com/linz/basemaps/commit/f24a988f73c1f3ee81f144826e346e31e20f8241)), closes [#1034](https://github.com/linz/basemaps/issues/1034)





# [4.9.0](https://github.com/linz/basemaps/compare/v4.8.0...v4.9.0) (2020-08-17)


### Bug Fixes

* **tiler:** Use nearest smoothing when down sizing ([#1050](https://github.com/linz/basemaps/issues/1050)) ([3a95844](https://github.com/linz/basemaps/commit/3a9584430e373effe44ee1c8879e4f733a7f6c5f))


### Features

* allow configuration of tile resize kernels ([#1051](https://github.com/linz/basemaps/issues/1051)) ([6b6d3d3](https://github.com/linz/basemaps/commit/6b6d3d32c735de6bf3f41819aaeb571c78f0921c))





# [4.8.0](https://github.com/linz/basemaps/compare/v4.7.1...v4.8.0) (2020-08-12)


### Bug Fixes

* **cli:** caller reference needs to be unqiue ([#1047](https://github.com/linz/basemaps/issues/1047)) ([dc145be](https://github.com/linz/basemaps/commit/dc145be0048f0f2d0efe151ba4e59da71f06c459))





## [4.7.1](https://github.com/linz/basemaps/compare/v4.7.0...v4.7.1) (2020-08-11)

**Note:** Version bump only for package @basemaps/cli





# [4.7.0](https://github.com/linz/basemaps/compare/v4.6.0...v4.7.0) (2020-08-10)


### Bug Fixes

* remove unneeded semver check ([#1022](https://github.com/linz/basemaps/issues/1022)) ([59d3034](https://github.com/linz/basemaps/commit/59d3034c546e784b19e4c804769b408803505e1c))





# [4.6.0](https://github.com/linz/basemaps/compare/v4.5.0...v4.6.0) (2020-08-05)


### Features

* **geojson:** Improve GeoJSON compliance ([#1005](https://github.com/linz/basemaps/issues/1005)) ([bf7fd26](https://github.com/linz/basemaps/commit/bf7fd26cf2b08d6417a0c710b821648e9f7c9b9a))





# [4.5.0](https://github.com/linz/basemaps/compare/v4.4.0...v4.5.0) (2020-07-30)


### Bug Fixes

* **cli:** folders must be mounted to allow docker to read the source files ([#995](https://github.com/linz/basemaps/issues/995)) ([8557afa](https://github.com/linz/basemaps/commit/8557afaf96c5153cd174d0af5475f1d2b3fe3f98))


### Features

* **cli:** support giving exact list of files to use ([#986](https://github.com/linz/basemaps/issues/986)) ([63b34ff](https://github.com/linz/basemaps/commit/63b34ff5414989b5d014b6d61f9be304ebd9e1e1))
* **cli:** support guessing of CITM projection from wkt ([#994](https://github.com/linz/basemaps/issues/994)) ([61bb93b](https://github.com/linz/basemaps/commit/61bb93b23e8e02bf3cb7c1e983bbb64c6fcb3044))





# [4.4.0](https://github.com/linz/basemaps/compare/v4.3.0...v4.4.0) (2020-07-28)


### Bug Fixes

* inject git version and hash into all code ([#966](https://github.com/linz/basemaps/issues/966)) ([8b8eaec](https://github.com/linz/basemaps/commit/8b8eaec373286c81b425d485274edd7c588aefea))


### Features

* **lambda-tiler:** Serve WMTSCapabilities for all TileSets ([#953](https://github.com/linz/basemaps/issues/953)) ([49d0e88](https://github.com/linz/basemaps/commit/49d0e881b4726188ea937a9617c98bff5a78e44d))





# [4.3.0](https://github.com/linz/basemaps/compare/v4.2.0...v4.3.0) (2020-07-19)


### Bug Fixes

* **cli:** allow gebco 3857 to be built in 4 COGs ([#940](https://github.com/linz/basemaps/issues/940)) ([dd98b57](https://github.com/linz/basemaps/commit/dd98b57e88744a73122d3ade146c1a57113fb958))





# [4.2.0](https://github.com/linz/basemaps/compare/v4.1.0...v4.2.0) (2020-07-16)


### Bug Fixes

* **cli:** fix creating cutlines with self crossing edges ([#929](https://github.com/linz/basemaps/issues/929)) ([fc4010e](https://github.com/linz/basemaps/commit/fc4010e6c7dd6de1f99d29ae32e3ad8fa580c1b5))


### Features

* **cli:** use CogSource uri property ([#928](https://github.com/linz/basemaps/issues/928)) ([11819bb](https://github.com/linz/basemaps/commit/11819bb3772d56634208018d963b8c276b52617c))





# [4.1.0](https://github.com/linz/basemaps/compare/v4.0.0...v4.1.0) (2020-07-15)


### Bug Fixes

* **cli:** correct error message when failing to read ([#892](https://github.com/linz/basemaps/issues/892)) ([0e9c4c1](https://github.com/linz/basemaps/commit/0e9c4c10a06c5ab205cfc5285048a153e85a0cc9))
* **cli:** Don't add cutline properties to CogJob when not used ([#914](https://github.com/linz/basemaps/issues/914)) ([1f860e9](https://github.com/linz/basemaps/commit/1f860e991f61abcb1cb1b15494bef2886eb04b1d))


### Features

* **cli:** Allow creation of one cog covering entire extent ([#920](https://github.com/linz/basemaps/issues/920)) ([2fd9187](https://github.com/linz/basemaps/commit/2fd918702e5cf25b12e24a3d72e694237e633a78))





# [4.0.0](https://github.com/linz/basemaps/compare/v3.6.0...v4.0.0) (2020-07-09)


### Bug Fixes

* **cli:** improve image quality when fully zoomed in ([#884](https://github.com/linz/basemaps/issues/884)) ([7880d92](https://github.com/linz/basemaps/commit/7880d92b3eb8897f592dd87609e0f557b94ef6bb))


### Features

* improve access to the GDAL cli ([#882](https://github.com/linz/basemaps/issues/882)) ([5eaef38](https://github.com/linz/basemaps/commit/5eaef38ae19ca2b80843112502bdf15df57acab6))


### BREAKING CHANGES

* this changes how to get access to a new gdal instance to Gdal.create()

Co-authored-by: kodiakhq[bot] <49736102+kodiakhq[bot]@users.noreply.github.com>





# [3.6.0](https://github.com/linz/basemaps/compare/v3.5.0...v3.6.0) (2020-07-08)


### Bug Fixes

* **cli:** make clipMultipolygon always remove degenerate edges ([#863](https://github.com/linz/basemaps/issues/863)) ([c3c4cdf](https://github.com/linz/basemaps/commit/c3c4cdf8a8bb87e79569b08272ddb0fb2bfe8f01))





# [3.5.0](https://github.com/linz/basemaps/compare/v3.4.2...v3.5.0) (2020-07-05)


### Bug Fixes

* **cli:** mitigate polygon intersection errors ([#834](https://github.com/linz/basemaps/issues/834)) ([5799137](https://github.com/linz/basemaps/commit/5799137e8fa53816c5a28b7e53ecd9ffbca70bb1))
* **cli:** refactor projection logic to allow chathams to be built ([#854](https://github.com/linz/basemaps/issues/854)) ([f799006](https://github.com/linz/basemaps/commit/f799006ccf1a45ec8aebfe132603a17c031e4825))





## [3.4.2](https://github.com/linz/basemaps/compare/v3.4.1...v3.4.2) (2020-06-30)


### Bug Fixes

* **cli:** don't reduce cutline when building a cog ([#846](https://github.com/linz/basemaps/issues/846)) ([7686a35](https://github.com/linz/basemaps/commit/7686a35a65ffa40c6192d2da3686582846e7bc08))





## [3.4.1](https://github.com/linz/basemaps/compare/v3.4.0...v3.4.1) (2020-06-30)


### Bug Fixes

* **cli:** ensure fatal errors set process exit code to 1 ([#842](https://github.com/linz/basemaps/issues/842)) ([f85c274](https://github.com/linz/basemaps/commit/f85c274c6bca05619312bce4eee59f5030a0d846))





# [3.4.0](https://github.com/linz/basemaps/compare/v3.3.0...v3.4.0) (2020-06-29)


### Bug Fixes

* **cli:** docker index.js in not executable ([#835](https://github.com/linz/basemaps/issues/835)) ([6b705f1](https://github.com/linz/basemaps/commit/6b705f1054476a8bc28692fb83e1894097860039))
* **cli:** show number of commits since last tag ([#836](https://github.com/linz/basemaps/issues/836)) ([a205215](https://github.com/linz/basemaps/commit/a2052156a761eddc7815632212007fa465c4d43d))





# [3.3.0](https://github.com/linz/basemaps/compare/v3.2.0...v3.3.0) (2020-06-28)


### Bug Fixes

* **cli:** always warp the vrt ([#829](https://github.com/linz/basemaps/issues/829)) ([42ded3a](https://github.com/linz/basemaps/commit/42ded3a6f2e9e12fad3481ac4608f6fac5deb90a))





# [3.2.0](https://github.com/linz/basemaps/compare/v3.1.0...v3.2.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/cli





# [3.1.0](https://github.com/linz/basemaps/compare/v3.0.0...v3.1.0) (2020-06-25)

**Note:** Version bump only for package @basemaps/cli





# [3.0.0](https://github.com/linz/basemaps/compare/v2.2.0...v3.0.0) (2020-06-23)


### Features

* Generate and render COGs using bounding boxes ([#774](https://github.com/linz/basemaps/issues/774)) ([e35bf1f](https://github.com/linz/basemaps/commit/e35bf1f0e20b74a16ff942dc88547afc56454c12))
* support split overview/warp resampling ([#777](https://github.com/linz/basemaps/issues/777)) ([952eec0](https://github.com/linz/basemaps/commit/952eec07ae1d4fb41159bb90a5304a63463352ce))





# [2.2.0](https://github.com/linz/basemaps/compare/v2.1.0...v2.2.0) (2020-06-17)


### Bug Fixes

* **cli:** fix regression in calculating image zoom resolution ([#736](https://github.com/linz/basemaps/issues/736)) ([d69c8b4](https://github.com/linz/basemaps/commit/d69c8b48e83e90b5dc0937988415a504faaf25d6))
* **cli:** fix regression quadkey.vrt missing '-allow_projection_difference' ([#770](https://github.com/linz/basemaps/issues/770)) ([2345ed4](https://github.com/linz/basemaps/commit/2345ed4760cfb963e9533024b7d369b8c4bfe8b8))
* **cli:** Take in to accound blend size when creating edge COGs ([#765](https://github.com/linz/basemaps/issues/765)) ([4fc4941](https://github.com/linz/basemaps/commit/4fc4941e7960c93959a563735fb2854236233aec))


### Features

* **cli:** Use tms module to caclulate source projection window ([#724](https://github.com/linz/basemaps/issues/724)) ([d442da5](https://github.com/linz/basemaps/commit/d442da5d6c696277fb3d702e8b56ad4955bb5030))
* Allow composite imagery from different COG buckets ([#664](https://github.com/linz/basemaps/issues/664)) ([404a5a3](https://github.com/linz/basemaps/commit/404a5a3ad35ad6da5c8de6e1beebb134dcaec3ff))
* **lambda-shared:** add TileMetadataProvider ([#624](https://github.com/linz/basemaps/issues/624)) ([62c7744](https://github.com/linz/basemaps/commit/62c774403b8a7073cdbc846ca92abce3b986dfaf))





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


### Features

* **cli:** output the gdal version when running ([#629](https://github.com/linz/basemaps/issues/629)) ([1d75b43](https://github.com/linz/basemaps/commit/1d75b4392034e6481e5e8078c29aa52ee36e46e3))





# [1.11.0](https://github.com/linz/basemaps/compare/v1.10.0...v1.11.0) (2020-05-14)


### Bug Fixes

* **cli:** externalId is not always required ([#618](https://github.com/linz/basemaps/issues/618)) ([2c5d9d0](https://github.com/linz/basemaps/commit/2c5d9d02c28c74693e07baf60874edced132c86d))
* **deps:** configure required deps to be runtime  ([#619](https://github.com/linz/basemaps/issues/619)) ([a6df14d](https://github.com/linz/basemaps/commit/a6df14d90ad599fb02b593bf3a2d1e21e3c4c4e1))


### Features

* **cli:** include git commit and version information in all jobs ([#620](https://github.com/linz/basemaps/issues/620)) ([dae265a](https://github.com/linz/basemaps/commit/dae265aa386d21a3048f4a5128dc9eef481737b4))





# [1.10.0](https://github.com/linz/basemaps/compare/v1.9.0...v1.10.0) (2020-05-13)


### Features

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


### Features

* **cli:** support webp quality setting ([#586](https://github.com/linz/basemaps/issues/586)) ([a456404](https://github.com/linz/basemaps/commit/a456404e2774c7a7adeffd8d114c192b073106b7))





# [1.6.0](https://github.com/linz/basemaps/compare/v1.5.1...v1.6.0) (2020-05-08)


### Features

* **cli:** submit jobs automatically to aws batch with --batch ([#583](https://github.com/linz/basemaps/issues/583)) ([6b35696](https://github.com/linz/basemaps/commit/6b356961a2f7d1497f51f69199aa038e64fbdca9))





# [1.5.0](https://github.com/linz/basemaps/compare/v1.4.2...v1.5.0) (2020-05-07)


### Bug Fixes

* **cli:** do not error when --replace-with is not supplied ([#577](https://github.com/linz/basemaps/issues/577)) ([2c4f5dc](https://github.com/linz/basemaps/commit/2c4f5dc5f46823ce4e6f03420b9ec9fc233505ea))
* **cli:** root quadkey causes issues with dynamodb so never use it ([#576](https://github.com/linz/basemaps/issues/576)) ([4dfa860](https://github.com/linz/basemaps/commit/4dfa86027980231514ae417ce59e94f02e78c3f6))





## [1.4.2](https://github.com/linz/basemaps/compare/v1.4.1...v1.4.2) (2020-05-06)

**Note:** Version bump only for package @basemaps/cog





## [1.4.1](https://github.com/linz/basemaps/compare/v1.4.0...v1.4.1) (2020-05-06)

**Note:** Version bump only for package @basemaps/cog





# [1.4.0](https://github.com/linz/basemaps/compare/v1.3.0...v1.4.0) (2020-05-06)


### Features

* **cog:** GZip cutline.geojson ([#570](https://github.com/linz/basemaps/issues/570)) ([c5e2e5e](https://github.com/linz/basemaps/commit/c5e2e5e03be657f046a877e314ee3a16d28e67af))





# [1.3.0](https://github.com/linz/basemaps/compare/v1.2.0...v1.3.0) (2020-05-05)


### Bug Fixes

* default resampling cubic to bilinear ([#552](https://github.com/linz/basemaps/issues/552)) ([978c789](https://github.com/linz/basemaps/commit/978c789d0bb448d2a0a2c28fcd6b4b1e45235659))
* **cog:** fix extractResolutionFromName for _10m ([c99d9f3](https://github.com/linz/basemaps/commit/c99d9f38ac8f2a951a44726352f15227e83e202c))
* action.batch missing await before storeLocal ([7ce960e](https://github.com/linz/basemaps/commit/7ce960e9767f3c7ed73644ab1dd611448e6fc596))
* allow 0 as GDAL_NODATA value ([1f79fab](https://github.com/linz/basemaps/commit/1f79fabd20a54134cd7d512a52b2a89469490b4c))
* compare only basename of tiff files in source.geojson ([9f1a5b9](https://github.com/linz/basemaps/commit/9f1a5b9c21b05e27ec7f15cf5c9d84e7016fa21f))
* don't default to -1 for nodata as it is not a valid nodata value ([21c4add](https://github.com/linz/basemaps/commit/21c4add21366cb9d154141de06dba864197d18b1))
* guess NZTM based projections from the image's WKT ([c80dbdc](https://github.com/linz/basemaps/commit/c80dbdc05538346a325b248569940795528e6ed5))
* throw a error if the GDAL/nodejs aws profiles mismatch ([d3c2100](https://github.com/linz/basemaps/commit/d3c21003c58ffd35ebf78929de5cf4c49a23805a))
* **cutline:** ignore path when updating vrt ([#504](https://github.com/linz/basemaps/issues/504)) ([714c554](https://github.com/linz/basemaps/commit/714c5540b6d678531a50f480695fe55f84735c41))
* wait for processing to finish before erroring about missing projection ([852d0eb](https://github.com/linz/basemaps/commit/852d0eb11db72b68731e162b1e75b291844173d1))


### Features

* **cli:** add ability to replace imagery with another imagery set ([015aae3](https://github.com/linz/basemaps/commit/015aae3112afb33853117824a347a7d83108963c))
* **cli:** create a tile set for all imagery processed ([#561](https://github.com/linz/basemaps/issues/561)) ([18e099e](https://github.com/linz/basemaps/commit/18e099e8d7ce615509775d35c9189168477b5816))
* **cli:** invalidate cloudfront cache when updating tileset information ([#554](https://github.com/linz/basemaps/issues/554)) ([b61b720](https://github.com/linz/basemaps/commit/b61b72024ef831b343d4e4febe499f3f7e352be4))
* **cli:** resubmit failed jobs if aws batch lists them as failed ([#563](https://github.com/linz/basemaps/issues/563)) ([40f6758](https://github.com/linz/basemaps/commit/40f67583c76823d58496961180cdbf54c9fcba66))
* **cli:** show imagery creation timestamps in logs ([#558](https://github.com/linz/basemaps/issues/558)) ([fb2b6e0](https://github.com/linz/basemaps/commit/fb2b6e0f08ecc05a5e8f6cb9a11ac469c610239d))
* **cli:** switch to priority numbers rather than array position ([#555](https://github.com/linz/basemaps/issues/555)) ([5dde7fd](https://github.com/linz/basemaps/commit/5dde7fd50ce1ea0faeb27c25030890a6c2fd6440))
* **cog:** create finer quadkeys for coverings ([#557](https://github.com/linz/basemaps/issues/557)) ([e47318b](https://github.com/linz/basemaps/commit/e47318bb222b68aaed180fdc2f8ead7f47c72a21))
* **cog:** Make cutline.Optimize produce fewer quadKeys ([dfa05dd](https://github.com/linz/basemaps/commit/dfa05dd87fd489cde3d240aa43c49d5e1c193f94))
* support tileset history ([#537](https://github.com/linz/basemaps/issues/537)) ([06760d4](https://github.com/linz/basemaps/commit/06760d4f1a6a28d0edc4f40f55cdf9db8e91f93f))
* **cog:** Apply cutline when generating COGs ([6ff625f](https://github.com/linz/basemaps/commit/6ff625fc078c32f46087bb06417c104f2b4f748c))
* **cog:** store metadata for imagery ([0b3aa34](https://github.com/linz/basemaps/commit/0b3aa346c7a1d8b7c1ba0a0edb3e28a69d8d7338))
* **cog/proj:** add quadKey utils ([22638d4](https://github.com/linz/basemaps/commit/22638d47fbceb58f03d8eaf26b06ad8f073c9a61))
* **CogJob:** add cutline option ([f8b71fd](https://github.com/linz/basemaps/commit/f8b71fdb00c246a92d920705b49e3505278bc632))
* **geo:** Add containsPoint to quadKey and trie ([a4b902a](https://github.com/linz/basemaps/commit/a4b902a1feeba5e80e813346f6c7d64d52199476))
* adding cli to configure rendering process ([13aae79](https://github.com/linz/basemaps/commit/13aae797b2143af8c08ed4da3c2013eacbbac082))
* allow importing existing imagery into database ([#452](https://github.com/linz/basemaps/issues/452)) ([64ee961](https://github.com/linz/basemaps/commit/64ee9611bc35b767f8edbfbdb638ac2aadb9dd80))





# [1.2.0](https://github.com/linz/basemaps/compare/v1.1.0...v1.2.0) (2020-03-25)


### Bug Fixes

* add resample param to buildWarpVrt ([44e1df1](https://github.com/linz/basemaps/commit/44e1df1b8c662b6c6050215342c092c683cc4d70))
* consolidated resample into cog ([9d69170](https://github.com/linz/basemaps/commit/9d691708d153d12d82c8468b2058728fb562a5a1))
* dockerfile to test resampling ([7e4638b](https://github.com/linz/basemaps/commit/7e4638bdc299267fa70474939db5221bf6def71c))
* modified batch to use updated cog args ([af95524](https://github.com/linz/basemaps/commit/af955243e5886b5b92b2da63a7b49f011add4967))
* offset is outside of the bounds. ([a3a786c](https://github.com/linz/basemaps/commit/a3a786c98aa0879d9d17af133c33996a87a830c4))
* parseint nodata value ([c6d65de](https://github.com/linz/basemaps/commit/c6d65de2ef0f22a9c3b936f43bd36f8f359c7b3b))
* read nodata from tiff ([64d3e9c](https://github.com/linz/basemaps/commit/64d3e9ccff5a0f4e97769bcc69e8b5b313fc31ef))
* remove resample arg from batch ([#364](https://github.com/linz/basemaps/issues/364)) ([6731166](https://github.com/linz/basemaps/commit/67311666f076b00850500da6786a6aec4f903905))
* review requests for naming/efficiency ([cda50c6](https://github.com/linz/basemaps/commit/cda50c63d2cf818fae48954d863190bfb792d56c))
* set resample at job creation ([7ab0335](https://github.com/linz/basemaps/commit/7ab0335d182ad41ebd740e0ae75fca85f4e2dfc3))
* undefined resamples + read str nodata ([e10871d](https://github.com/linz/basemaps/commit/e10871d4dbef846186d3536fb5bc51d5f1b617ac))
* unnegated srcnodata condition ([20e592d](https://github.com/linz/basemaps/commit/20e592d5913b307525435931f9c9a806e2bb063c))
* xxxnodata args added to warp command ([b415431](https://github.com/linz/basemaps/commit/b415431628929e313803a04b3322aa56704e7b52))


### Features

* add resample to batch ([1a45000](https://github.com/linz/basemaps/commit/1a45000b1d1271bf540caee0a53eaa12fda1be3f))
* added variable resampling methods ([07b3c3f](https://github.com/linz/basemaps/commit/07b3c3fe87a7e0d50fae6ab964a8651a7b19df1d))





# [1.1.0](https://github.com/linz/basemaps/compare/v1.0.0...v1.1.0) (2020-02-20)

**Note:** Version bump only for package @basemaps/cog





# [1.0.0](https://github.com/linz/basemaps/compare/v0.3.0...v1.0.0) (2020-02-18)


* refactor!: split packages out in preperation for publishing. ([c6f5cbb](https://github.com/linz/basemaps/commit/c6f5cbb5514659ce446460bc8637e7a00e403a49))


### BREAKING CHANGES

* this splits out the lambda/node dependencies from javascript so packages can be published for the browser





# [0.3.0](https://github.com/linz/basemaps/compare/v0.2.0...v0.3.0) (2020-02-11)


### Bug Fixes

* capture stder and report on in if it exists ([8b60624](https://github.com/linz/basemaps/commit/8b606245e6b30878cc874c1db76e4994e183395e))
* failed to find projections when geoasciiparams are not loaded ([55ece94](https://github.com/linz/basemaps/commit/55ece94260f36785b76469ab988490d5a9f0f502))
* support nzgd_2000 ([205b8fa](https://github.com/linz/basemaps/commit/205b8fa00649dc709645bf7a529e9be794e1d241))
* use the correct path for tiff lookups when resuming jobs ([01b7223](https://github.com/linz/basemaps/commit/01b7223bf3dae654a5efded3da106e8d08f4a5f3))





# [0.2.0](https://github.com/linz/basemaps/compare/v0.1.0...v0.2.0) (2020-01-29)


### Bug Fixes

* actually check if object exists in s3 ([789eb22](https://github.com/linz/basemaps/commit/789eb2280868f754552f147398fa773d8ef98983))
* do not overwrite existing files if they exist ([ea46fed](https://github.com/linz/basemaps/commit/ea46fed8ff2ccc9a9d92869822cefd886ce2c299))
* imagery size is off by one ([1d7047a](https://github.com/linz/basemaps/commit/1d7047a4cb1819bef1c0210b6c13f0362ebe2cc5))


### Features

* allow cli tiler to access data from s3 ([c033de3](https://github.com/linz/basemaps/commit/c033de32d09d69db997569ee61bd002f8ae62c82))
* configure the temp folder using TEMP_FOLDER environment var ([2762014](https://github.com/linz/basemaps/commit/27620144e31e687050225a33fb7a80f785161e54))
* guess projection if WKT is present ([a9c9cd6](https://github.com/linz/basemaps/commit/a9c9cd680b41bed0e2213fe8c0087653861a22ad))
* if output files already exist do not overwrite them. ([ab1b861](https://github.com/linz/basemaps/commit/ab1b8616cfc5fbbae7cd3ee59d308bb4f3c6e036))





# 0.1.0 (2020-01-23)


### Bug Fixes

* build some cogs ([8c1e6d9](https://github.com/linz/basemaps/commit/8c1e6d90ddf33aa852b69fdecebfd42fbb2a7045))
* not everything needs -addalpha ([223256d](https://github.com/linz/basemaps/commit/223256d40b9c5d561aca943faa71ac70c56edce0))
* only warp the vrt to 3857 if really required ([26610d8](https://github.com/linz/basemaps/commit/26610d8b0cd28beaefe57a620385ecec617691cb))
* remove unreachable break ([11e35d3](https://github.com/linz/basemaps/commit/11e35d3410b5913c5b5c94a2e66360e402dc4f75))


### Features

* adding gisborne_rural_2017-18_0.3m ([4491493](https://github.com/linz/basemaps/commit/449149344966948524b56f367cfd7c2de0cb3b1d))
* adding support for dry run of cogify ([9d4dbf2](https://github.com/linz/basemaps/commit/9d4dbf200642f3a9ffb028c6188e6bfbb47a8b9f))
* basic mosaic support ([cbd8e4c](https://github.com/linz/basemaps/commit/cbd8e4c1cb91974c4bced766d1c5167a3ab6d99a))
* better cogify command ([8f086eb](https://github.com/linz/basemaps/commit/8f086eb18b079d3a0243c421bd82607de24463c0))
* bundle cli into single javascript file ([3d77287](https://github.com/linz/basemaps/commit/3d772873841cd9eee32d1e08a9b383fc16fe3a93))
* cache the bounding box creation into .cache to save on a lot of s3 requests ([cbe5e70](https://github.com/linz/basemaps/commit/cbe5e70efc714ef5f551e4516cd3e21e80a79a19))
* convert a tif using a docker based gdal ([9777363](https://github.com/linz/basemaps/commit/977736384987d203c47d5e3b4a9b015dea5ee1ca))
* export a geojson covering if requested ([99b8438](https://github.com/linz/basemaps/commit/99b84389a06dd384dad9479bda2b049a597ac171))
* expose the cogify cli ([fe38aee](https://github.com/linz/basemaps/commit/fe38aeeb15b3fd17b2bc4ea6861a76a12339c927))
* gdal docker build vrts ([54d8714](https://github.com/linz/basemaps/commit/54d8714789c896c624d1f6fd809537f5b96ac60e))
* given a list of tiff files generate a webmercator covering ([9aaf7f2](https://github.com/linz/basemaps/commit/9aaf7f2640a4396d813c48209dd88a159f1b284f))
* load and convert bounds of imagery ([68df2a4](https://github.com/linz/basemaps/commit/68df2a4cbc5ad7d227a573b2db602e9a927d7bb5))
* nzdg2000 support ([fc4a4e2](https://github.com/linz/basemaps/commit/fc4a4e29fa176766ed2376a82541007b07ba46cc))
* prepare for splitting of polygons that span the antimeridian ([e7c3a51](https://github.com/linz/basemaps/commit/e7c3a510303d2ddd252f7f3dd18b2c7ce4a3fe8f))
* pretty print the cli if it is outputing to a tty ([d406059](https://github.com/linz/basemaps/commit/d40605974a8258ab40566e1e2c1ea6c4ba9f2341))
* process cogs using AWS batch ([8602ba8](https://github.com/linz/basemaps/commit/8602ba86db10c52267a71094c9836fc26f03bba5))
* quadkey intersections ([0c41194](https://github.com/linz/basemaps/commit/0c41194b50b0f569f344328f6234accdd891b618))
* simple cli to generate cogs ([f11896e](https://github.com/linz/basemaps/commit/f11896ea751046a2e158600215b77a85455caf97))
* simple container to run cli ([2946a19](https://github.com/linz/basemaps/commit/2946a192d7b87c53c6227b961998be1aae2f3ef9))
* supply aws credentials to gdal if needed ([1f57609](https://github.com/linz/basemaps/commit/1f5760940ac51dac9dbb0e62b601183ace7437a6))
* support 3857 in projections ([816d8f6](https://github.com/linz/basemaps/commit/816d8f6873de969aca9a4a22ce222d5ed49d51a1))
* tile covering for webmercator tiles ([cd982d7](https://github.com/linz/basemaps/commit/cd982d7006c7509a4ae350c83a47dcadb90e6918))
