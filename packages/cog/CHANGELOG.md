# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
