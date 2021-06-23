# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.1.0](https://github.com/linz/basemaps/compare/v6.0.0...v6.1.0) (2021-06-23)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)


### Features

* **lambda-analytics:** include stats for pbf tiles ([#1676](https://github.com/linz/basemaps/issues/1676)) ([30fc6c7](https://github.com/linz/basemaps/commit/30fc6c7d14be387903bfa44aab7585e21790e85a))
* **s3fs:** refactor how credentials are passed to s3fs ([#1675](https://github.com/linz/basemaps/issues/1675)) ([f07f529](https://github.com/linz/basemaps/commit/f07f529af1657aa5ffe7d9deff92406e908e6fe4))


### BREAKING CHANGES

* **s3fs:** this changes the behaviour for s3fs as paths now need to be registered with credentials

* refactor: remove commented out code





# [5.1.0](https://github.com/linz/basemaps/compare/v5.0.3...v5.1.0) (2021-06-07)

**Note:** Version bump only for package @basemaps/lambda-analytics





## [5.0.3](https://github.com/linz/basemaps/compare/v5.0.2...v5.0.3) (2021-05-25)

**Note:** Version bump only for package @basemaps/lambda-analytics





## [5.0.2](https://github.com/linz/basemaps/compare/v5.0.1...v5.0.2) (2021-05-19)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.24.0](https://github.com/linz/basemaps/compare/v4.23.0...v4.24.0) (2021-03-21)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.23.0](https://github.com/linz/basemaps/compare/v4.22.0...v4.23.0) (2021-03-18)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)

**Note:** Version bump only for package @basemaps/lambda-analytics





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)


### Bug Fixes

* **lambda-analytics:** [@id](https://github.com/id) is reserved for the logging system ([#1207](https://github.com/linz/basemaps/issues/1207)) ([14a2f71](https://github.com/linz/basemaps/commit/14a2f716f39118258dff0290845a46de364cee84))


### Features

* **lambda-analytics:** allow analytics to be reprocessed by removing  the cached data ([#1195](https://github.com/linz/basemaps/issues/1195)) ([65752b9](https://github.com/linz/basemaps/commit/65752b99b99d84e6690ebcce26171a15c87a9ef5))
* **linzjs-s3fs:** .list is now a async generator to allow easier iterating of folders ([#1213](https://github.com/linz/basemaps/issues/1213)) ([a42c594](https://github.com/linz/basemaps/commit/a42c594a506914e340eabb2afd97991c2b119a64))





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)


### Features

* **lambda-analytics:** generate rolledup analyitics from cloudwatchedge logs ([#1180](https://github.com/linz/basemaps/issues/1180)) ([20fd5b1](https://github.com/linz/basemaps/commit/20fd5b1983b16fc1fcb1b731152da36430fedc63))
* **lambda-analytics:** include referer information in the rollup stats ([#1186](https://github.com/linz/basemaps/issues/1186)) ([e75ab1a](https://github.com/linz/basemaps/commit/e75ab1acd5e4dc89f05a52df833bb3563502f324))
* **lambda-analytics:** process upto 7 days worth of logs in one invcocation ([#1187](https://github.com/linz/basemaps/issues/1187)) ([199678f](https://github.com/linz/basemaps/commit/199678fad413b4098c08c3268a0fb13283c0bfe1))
