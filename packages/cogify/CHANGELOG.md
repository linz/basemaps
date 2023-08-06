# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.41.0](https://github.com/linz/basemaps/compare/v6.40.0...v6.41.0) (2023-07-26)


### Bug Fixes

* **cogify:** cogify create should create from stac item json ([#2785](https://github.com/linz/basemaps/issues/2785)) ([637df77](https://github.com/linz/basemaps/commit/637df7736e78d38e19b62dfe29f7e4ad09e4205a))
* **cogify:** correct ordering of lat lon ([#2846](https://github.com/linz/basemaps/issues/2846)) ([b6afd57](https://github.com/linz/basemaps/commit/b6afd57cb63ca0ca7827674fe0c98504a90394b4)), closes [/github.com/linz/basemaps/blob/master/packages/landing/src/url.ts#L53](https://github.com//github.com/linz/basemaps/blob/master/packages/landing/src/url.ts/issues/L53)
* **cogify:** include collection and parent links in item.json ([#2778](https://github.com/linz/basemaps/issues/2778)) ([e79e440](https://github.com/linz/basemaps/commit/e79e44011f3fc9179b5d00f4302eca6761342f50))
* **cogify:** support blocksize being customized ([#2842](https://github.com/linz/basemaps/issues/2842)) ([9b859c8](https://github.com/linz/basemaps/commit/9b859c862b516dd0d58bb80db0ff2c04966b4957))
* **cogify:** use a URL in the cogify STAC documents ([#2843](https://github.com/linz/basemaps/issues/2843)) ([eb3f0fe](https://github.com/linz/basemaps/commit/eb3f0fe41b5a02ea71c2ea63e1a0057cc6d502d2))
* **cogify:** use datetime to be consistent with STAC ([#2832](https://github.com/linz/basemaps/issues/2832)) ([87a7e37](https://github.com/linz/basemaps/commit/87a7e3745b3a478b211a891f457a19a149a9066d))
* **config:** allow initializing config from URLs ([#2830](https://github.com/linz/basemaps/issues/2830)) ([0ea552e](https://github.com/linz/basemaps/commit/0ea552ec32ad723f98c96d533f18a8afc51d9657))


### Features

* add --from-file option to cogify create command ([#2851](https://github.com/linz/basemaps/issues/2851)) ([3fab3c7](https://github.com/linz/basemaps/commit/3fab3c7b703358b893f76f7058374c32d37bdd2a))
* **cogify:** add --preset lerc_0.01 to create a 1cm error lerc cog ([#2841](https://github.com/linz/basemaps/issues/2841)) ([c7e3605](https://github.com/linz/basemaps/commit/c7e3605ab01c19c2ec576a7347965d0af0bc8f8a))
* **cogify:** improve cogify ([#2800](https://github.com/linz/basemaps/issues/2800)) ([cb16a44](https://github.com/linz/basemaps/commit/cb16a44aa44aa10ed69d1ab188a0539756f9ee72))
* **cogify:** retile imagery into COGS aligned to a tile matrix ([#2759](https://github.com/linz/basemaps/issues/2759)) ([ddd99d3](https://github.com/linz/basemaps/commit/ddd99d3548c65ec4ce5b7c608d6bf9360f053635))
