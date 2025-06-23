# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [8.4.0](https://github.com/linz/basemaps/compare/v8.3.0...v8.4.0) (2025-06-23)

**Note:** Version bump only for package @basemaps/smoke





# [8.0.0](https://github.com/linz/basemaps/compare/v7.17.0...v8.0.0) (2025-05-11)

**Note:** Version bump only for package @basemaps/smoke





# [7.5.0](https://github.com/linz/basemaps/compare/v7.4.0...v7.5.0) (2024-07-01)

**Note:** Version bump only for package @basemaps/smoke





# [7.4.0](https://github.com/linz/basemaps/compare/v7.3.0...v7.4.0) (2024-06-13)


### Bug Fixes

* **smoke:** Smoke test is missing ulid dependency to running inside the container. ([#3255](https://github.com/linz/basemaps/issues/3255)) ([f14d0ba](https://github.com/linz/basemaps/commit/f14d0bab2e523bbfbb5739691144f8d5e34e6632))





# [7.3.0](https://github.com/linz/basemaps/compare/v7.2.0...v7.3.0) (2024-05-02)


### Bug Fixes

* **lambda-tiler:** ensure wmts limits extent to the bounding box of the tile matrix extent BM-1012 ([#3235](https://github.com/linz/basemaps/issues/3235)) ([b8d56cd](https://github.com/linz/basemaps/commit/b8d56cdbbf2cb08f1ef96bc6de82ce94563da945))


### Features

* **cli:** expose the smoke checker in the CLI container so linz/basemaps-config can use it BM-1010 ([#3229](https://github.com/linz/basemaps/issues/3229)) ([3d504b3](https://github.com/linz/basemaps/commit/3d504b324ce2636c969b6afd5b850597fb275644))





# [7.2.0](https://github.com/linz/basemaps/compare/v7.1.1...v7.2.0) (2024-04-08)


### Bug Fixes

* **lambda-tiler:** content type for jpg should be image/jpeg ([#3208](https://github.com/linz/basemaps/issues/3208)) ([26efdd5](https://github.com/linz/basemaps/commit/26efdd5732033235742a3148c63e4beff0a51cc8))





## [7.1.1](https://github.com/linz/basemaps/compare/v7.1.0...v7.1.1) (2024-03-25)


### Bug Fixes

* **lambda-tiler:** allow .jpg for jpeg images ([#3206](https://github.com/linz/basemaps/issues/3206)) ([a23a63a](https://github.com/linz/basemaps/commit/a23a63a417a39e6c873c8d4d9c6206d9c845e57b))





# [7.1.0](https://github.com/linz/basemaps/compare/v7.0.0...v7.1.0) (2024-03-25)


### Features

* **smoke:** add check for preview generation ([#3201](https://github.com/linz/basemaps/issues/3201)) ([d902522](https://github.com/linz/basemaps/commit/d902522dc250e13e2791abd0963b3396c9763449))
* **smoke:** add tests to validate tiles are served BM-975 ([#3139](https://github.com/linz/basemaps/issues/3139)) ([448e60f](https://github.com/linz/basemaps/commit/448e60fccb5a75f60baf309f9b939d6e33881da8))
* **smoke:** basic wmts validation ([#3146](https://github.com/linz/basemaps/issues/3146)) ([48d0744](https://github.com/linz/basemaps/commit/48d07441aff7962a04dd025f130ebeb43b2b26fe))
* **smoke:** smoke test preview index.html generation ([#3183](https://github.com/linz/basemaps/issues/3183)) ([b9ef334](https://github.com/linz/basemaps/commit/b9ef3344b24e5987cb62fb8f20a24e1c9fd64311))
* upgrade to typescript 5 ([#3019](https://github.com/linz/basemaps/issues/3019)) ([53aeebb](https://github.com/linz/basemaps/commit/53aeebbf07f173ac01aab0300d6e430159817c7e))





# [7.0.0](https://github.com/linz/basemaps/compare/v6.46.0...v7.0.0) (2023-11-27)


### Features

* Add proof of concept docs site BM-917 ([#2990](https://github.com/linz/basemaps/issues/2990)) ([cabccc7](https://github.com/linz/basemaps/commit/cabccc730de0c0016e9d102dc8df6acbf1510e00))
* **doc:** Improve the individual package documentations. BM-776 ([#2981](https://github.com/linz/basemaps/issues/2981)) ([5a4adcb](https://github.com/linz/basemaps/commit/5a4adcbbff15857a6f4c315d54280d542f785fec))





# [6.46.0](https://github.com/linz/basemaps/compare/v6.45.0...v6.46.0) (2023-10-10)

**Note:** Version bump only for package @basemaps/smoke





# [6.45.0](https://github.com/linz/basemaps/compare/v6.44.0...v6.45.0) (2023-09-18)

**Note:** Version bump only for package @basemaps/smoke





# [6.44.0](https://github.com/linz/basemaps/compare/v6.43.0...v6.44.0) (2023-09-05)

**Note:** Version bump only for package @basemaps/smoke





# [6.43.0](https://github.com/linz/basemaps/compare/v6.42.1...v6.43.0) (2023-08-22)

**Note:** Version bump only for package @basemaps/smoke





# [6.41.0](https://github.com/linz/basemaps/compare/v6.40.0...v6.41.0) (2023-07-26)


### Features

* **smoke:** simple smoke tests after deploy ([#2802](https://github.com/linz/basemaps/issues/2802)) ([c33dda4](https://github.com/linz/basemaps/commit/c33dda437830243161b3895042dd1e023713bb55))
