# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [7.1.0](https://github.com/linz/basemaps/compare/v7.0.0...v7.1.0) (2024-03-25)


### Bug Fixes

* **cli:** Fix the missing format for vector config with Basemaps v7. ([#3149](https://github.com/linz/basemaps/issues/3149)) ([26b9dd8](https://github.com/linz/basemaps/commit/26b9dd8e7cbb870a63a167adf0affa2ebf170224))
* **cli:** Update the chunkd verison for the fix, and allow trailing slash uri ([#3140](https://github.com/linz/basemaps/issues/3140)) ([a0b3d9e](https://github.com/linz/basemaps/commit/a0b3d9e5cb464c4d2bfcada1d0a27c06c2809893))
* **cogify:** remove tiff caching while creating tile covering ([#3076](https://github.com/linz/basemaps/issues/3076)) ([31ac4bc](https://github.com/linz/basemaps/commit/31ac4bc4b30f6dfde745a9515d2a6ec7b7156767))
* **config-loader:** close tiffs rather than letting the gc close them ([#3117](https://github.com/linz/basemaps/issues/3117)) ([479c3dd](https://github.com/linz/basemaps/commit/479c3dda7e4383c4022d8de12af7d478d9085d51))
* **config-loader:** do not assumed nontiled tiffs are empty ([#3063](https://github.com/linz/basemaps/issues/3063)) ([dfd994b](https://github.com/linz/basemaps/commit/dfd994bc08b0452a8e8ff924f38617382ed788d2))
* some tests commented out ([#3066](https://github.com/linz/basemaps/issues/3066)) ([9896308](https://github.com/linz/basemaps/commit/98963088aff978639c7721e493c63b5582f3686e))


### Features

* **config-loader:** cache imagery configs to speed up loading times ([#3167](https://github.com/linz/basemaps/issues/3167)) ([21b3ed7](https://github.com/linz/basemaps/commit/21b3ed7b0e8e61a222520ba0601b75314b18f178))
* **config-loader:** support loading tiffs not in meters ([#3064](https://github.com/linz/basemaps/issues/3064)) ([ab1b602](https://github.com/linz/basemaps/commit/ab1b602b09109a8b58d85dc72633383afa9e136e))
* **config:** extract band and no data information from tiffs BM-932 ([#3109](https://github.com/linz/basemaps/issues/3109)) ([2a824a6](https://github.com/linz/basemaps/commit/2a824a6b91c7511833e69fee78e1e9c5935dfad7))
* **config:** load DEMs and create default output piplines ([#3166](https://github.com/linz/basemaps/issues/3166)) ([fa08983](https://github.com/linz/basemaps/commit/fa08983049c999c7010313d6fb37f057025f31b8))
* **config:** use shorter band names for band information ([#3162](https://github.com/linz/basemaps/issues/3162)) ([8ef8760](https://github.com/linz/basemaps/commit/8ef8760bef33314bd12dcb7095e8b419407a2c63))
* **config:** use the same config loader for server and cli ([#3163](https://github.com/linz/basemaps/issues/3163)) ([72cb963](https://github.com/linz/basemaps/commit/72cb963c66ed1e392fc165946b5286d60095807b))
* move to query parameters for pipeline selection ([#3136](https://github.com/linz/basemaps/issues/3136)) ([32c501c](https://github.com/linz/basemaps/commit/32c501c76301c69639eb412fac80f488f65ad3fb))
* **tiler-sharp:** allow outputs to customise how output is compressed ([#3126](https://github.com/linz/basemaps/issues/3126)) ([f13b8fb](https://github.com/linz/basemaps/commit/f13b8fb2aae7ad224c3fde6cfb4cd8f70d4f1f9e))
