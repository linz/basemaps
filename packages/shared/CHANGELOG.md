# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.3.0](https://github.com/linz/basemaps/compare/v0.2.0...v0.3.0) (2020-02-11)

**Note:** Version bump only for package @basemaps/shared





# [0.2.0](https://github.com/linz/basemaps/compare/v0.1.0...v0.2.0) (2020-01-29)


### Bug Fixes

* ask for 8 hours of access to s3 files. ([f1a0910](https://github.com/linz/basemaps/commit/f1a0910a8e120e65f79cd567c652a6f4a0760a97))


### Features

* allow cli tiler to access data from s3 ([c033de3](https://github.com/linz/basemaps/commit/c033de32d09d69db997569ee61bd002f8ae62c82))
* allow configuration of number of hours to assume a role ([f66f4f4](https://github.com/linz/basemaps/commit/f66f4f4f597959ec5d436ec15002ab26fc151a13))
* configure the temp folder using TEMP_FOLDER environment var ([2762014](https://github.com/linz/basemaps/commit/27620144e31e687050225a33fb7a80f785161e54))





# 0.1.0 (2020-01-23)


### Bug Fixes

* 0 is not the root tile "" is ([61d2179](https://github.com/linz/basemaps/commit/61d21796f299954a844aa9617fc102b1e667a584))
* assume responses are application/json unless told otherwise ([87b74d7](https://github.com/linz/basemaps/commit/87b74d7efefe4e8095aa57b5a057b41298ee06be))
* bigint logging does not work ([2b3ed43](https://github.com/linz/basemaps/commit/2b3ed4380d4444120755eadfa41defc6c19ce4df))
* duration must be the last thing calculated ([1766de6](https://github.com/linz/basemaps/commit/1766de689b544aaf913aa9b06c0d69d8fd5e9f33))
* headers need to be lower cased ([a2932a0](https://github.com/linz/basemaps/commit/a2932a07d5ea7b3305154272a9cc33be41d8242d))
* log errors into err so pino will serialize them ([b575de9](https://github.com/linz/basemaps/commit/b575de9f34caaf308960644c3f2013b0b3446e78))
* provide a new stream to pino instead of changing the internal one ([025abed](https://github.com/linz/basemaps/commit/025abed6d62ed3a8870d567702be5a4d074333d1))
* warn if timers are unfinished on exit ([13750d2](https://github.com/linz/basemaps/commit/13750d2c0b9d5a20a4c559cd54d4af093db0eceb))


### Features

* adding aws dynamo db table for api key tracking ([ee1b2a6](https://github.com/linz/basemaps/commit/ee1b2a6f87e8dbfa04baca2047dff632508fb12b))
* adding basic benchmark to track tile render performance ([f1cf534](https://github.com/linz/basemaps/commit/f1cf53465b70ed2a746fa15edc332bf77b0dc182))
* adding cli to serve xyz a folder of cogs on localhost:5050 ([eeb4d2b](https://github.com/linz/basemaps/commit/eeb4d2b7912d1dc358afbc8f6ade5c40f7c06250))
* adding gisborne_rural_2017-18_0.3m ([4491493](https://github.com/linz/basemaps/commit/449149344966948524b56f367cfd7c2de0cb3b1d))
* adding improved metrics ([2b97eb5](https://github.com/linz/basemaps/commit/2b97eb5efc47dc1ef46c50d073f5df04ff0017de))
* adding ping version and health endpoints ([af0a1dc](https://github.com/linz/basemaps/commit/af0a1dcddb80549971387cdda63f90dd0e64d755))
* allow debug logging ([26cca8b](https://github.com/linz/basemaps/commit/26cca8bfa7d69c53c5637467f1448488643cac0c))
* basic mosaic support ([cbd8e4c](https://github.com/linz/basemaps/commit/cbd8e4c1cb91974c4bced766d1c5167a3ab6d99a))
* forward the api key to the rendering service ([2beddab](https://github.com/linz/basemaps/commit/2beddaba1521468c26da3550cf987a3d04f96372))
* gdal docker build vrts ([54d8714](https://github.com/linz/basemaps/commit/54d8714789c896c624d1f6fd809537f5b96ac60e))
* generate a ETag from the parameters for caching ([2d6c4be](https://github.com/linz/basemaps/commit/2d6c4be530fe52184664b812445444d0f90b6e79))
* include api key in meta log ([67b4699](https://github.com/linz/basemaps/commit/67b4699c5d03662b56885bd82c39bb3687701c27))
* include git version information in deployments ([5877005](https://github.com/linz/basemaps/commit/5877005b2cb5d4e24eb1cfc9cd108fa332cacaeb))
* include request id in http headers ([a80d3e0](https://github.com/linz/basemaps/commit/a80d3e030bd95c7617e8e1ab10b90fbdb86c1a03))
* include version information in logs ([da15f8d](https://github.com/linz/basemaps/commit/da15f8d5e14e9d57af133de57db1e1266df4329d))
* initial tiler to be used inside of the xyz service ([2b6b6e3](https://github.com/linz/basemaps/commit/2b6b6e305bb54324984d00a64db3fdbb1fc73ba5))
* lambda xyz tile server ([f115dfd](https://github.com/linz/basemaps/commit/f115dfd48ee352a8fc90abbfcbea15778f6c0961))
* log out center of xyz tile from cloudfront requests too ([f0ca41e](https://github.com/linz/basemaps/commit/f0ca41eef8acbe82677642eeb3d9664bb467b3c7))
* log out center of xyz tile so that we can plot it on a map easily ([0cc380d](https://github.com/linz/basemaps/commit/0cc380d923ecceee8b50d008de02ef6bd74f15f1))
* prepare for splitting of polygons that span the antimeridian ([e7c3a51](https://github.com/linz/basemaps/commit/e7c3a510303d2ddd252f7f3dd18b2c7ce4a3fe8f))
* process cogs using AWS batch ([8602ba8](https://github.com/linz/basemaps/commit/8602ba86db10c52267a71094c9836fc26f03bba5))
* provide a lambda context with logging/error handling included ([72fe409](https://github.com/linz/basemaps/commit/72fe4099f1c8cb8e326fd81635bed4725bc3c7db))
* quadkey intersections ([0c41194](https://github.com/linz/basemaps/commit/0c41194b50b0f569f344328f6234accdd891b618))
* render full tiles and diff output ([ec1caf7](https://github.com/linz/basemaps/commit/ec1caf7b04654fe8154b364981c30f4fc1a15e5a))
* simplify loading of required tiff files ([3676e52](https://github.com/linz/basemaps/commit/3676e52a03af44b74adba0218773bcd350427a0d))
* supply aws credentials to gdal if needed ([1f57609](https://github.com/linz/basemaps/commit/1f5760940ac51dac9dbb0e62b601183ace7437a6))
* support 3857 in projections ([816d8f6](https://github.com/linz/basemaps/commit/816d8f6873de969aca9a4a22ce222d5ed49d51a1))
* validate api keys ([99d17ae](https://github.com/linz/basemaps/commit/99d17ae99f4b400868d207dc2b5a078618067a6f))
* validate function tests ([fe4a41c](https://github.com/linz/basemaps/commit/fe4a41cfe1927a239cca3706c49630a5dfd336cb))
