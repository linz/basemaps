# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/linz/basemaps/compare/v0.2.0...v0.3.0) (2020-02-11)

**Note:** Version bump only for package @basemaps/tiler





# [0.2.0](https://github.com/linz/basemaps/compare/v0.1.0...v0.2.0) (2020-01-29)

**Note:** Version bump only for package @basemaps/tiler





# 0.1.0 (2020-01-23)


### Bug Fixes

* add tiffName to log output ([0b4e1a8](https://github.com/linz/basemaps/commit/0b4e1a8abe8336d82492f858565418a2abc6f127))
* bigint logging does not work ([2b3ed43](https://github.com/linz/basemaps/commit/2b3ed4380d4444120755eadfa41defc6c19ce4df))
* provide a new stream to pino instead of changing the internal one ([025abed](https://github.com/linz/basemaps/commit/025abed6d62ed3a8870d567702be5a4d074333d1))
* warn if timers are unfinished on exit ([13750d2](https://github.com/linz/basemaps/commit/13750d2c0b9d5a20a4c559cd54d4af093db0eceb))


### Features

* adding basic benchmark to track tile render performance ([f1cf534](https://github.com/linz/basemaps/commit/f1cf53465b70ed2a746fa15edc332bf77b0dc182))
* adding cli to serve xyz a folder of cogs on localhost:5050 ([eeb4d2b](https://github.com/linz/basemaps/commit/eeb4d2b7912d1dc358afbc8f6ade5c40f7c06250))
* adding improved metrics ([2b97eb5](https://github.com/linz/basemaps/commit/2b97eb5efc47dc1ef46c50d073f5df04ff0017de))
* adding mosiac json interface ([0531ebb](https://github.com/linz/basemaps/commit/0531ebbbcfc419853ae1e51956642ef65270effe))
* color test tiles black to see flaws ([9c635be](https://github.com/linz/basemaps/commit/9c635be6e67e18fa974ca8d30909387c86415d5e))
* expand tile creation to 4096 sized tiles ([e1ce06d](https://github.com/linz/basemaps/commit/e1ce06da97f2ee10c8d345b84bae37d8efdb8285))
* gdal docker build vrts ([54d8714](https://github.com/linz/basemaps/commit/54d8714789c896c624d1f6fd809537f5b96ac60e))
* generate a ETag from the parameters for caching ([2d6c4be](https://github.com/linz/basemaps/commit/2d6c4be530fe52184664b812445444d0f90b6e79))
* if image diffs occur write out the diff image ([d4307c2](https://github.com/linz/basemaps/commit/d4307c27efc3e914bffe1a1db63229a2ce9b3585))
* initial tiler to be used inside of the xyz service ([2b6b6e3](https://github.com/linz/basemaps/commit/2b6b6e305bb54324984d00a64db3fdbb1fc73ba5))
* log out center of xyz tile so that we can plot it on a map easily ([0cc380d](https://github.com/linz/basemaps/commit/0cc380d923ecceee8b50d008de02ef6bd74f15f1))
* render full tiles and diff output ([ec1caf7](https://github.com/linz/basemaps/commit/ec1caf7b04654fe8154b364981c30f4fc1a15e5a))
* switch tests to using a webmercator aligned test tiff ([56a88f0](https://github.com/linz/basemaps/commit/56a88f046775136f126fcaf6be58e0bb8edde41d))
* upgrade to cogeotiff 0.4.1 ([f161a67](https://github.com/linz/basemaps/commit/f161a67a539eb85eaf79e9af119bac777f0ca95a))
