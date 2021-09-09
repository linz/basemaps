# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.9.0](https://github.com/linz/basemaps/compare/v6.8.0...v6.9.0) (2021-09-09)


### Bug Fixes

* **s3fs:** profile is optional ([#1845](https://github.com/linz/basemaps/issues/1845)) ([6ac4644](https://github.com/linz/basemaps/commit/6ac464454cbb5bd35adb285d34afdcf500d00738))





# [6.8.0](https://github.com/linz/basemaps/compare/v6.7.0...v6.8.0) (2021-09-01)


### Bug Fixes

* **s3fs:** local file system list should be recursive by default ([#1822](https://github.com/linz/basemaps/issues/1822)) ([9367e3f](https://github.com/linz/basemaps/commit/9367e3f87ed1e5dc3d02d29e31362aac02509fcd))





# [6.7.0](https://github.com/linz/basemaps/compare/v6.6.1...v6.7.0) (2021-08-15)


### Features

* add fromRoleArn to simplify the creation of s3 bound to specific roles. ([#1807](https://github.com/linz/basemaps/issues/1807)) ([0cd9bab](https://github.com/linz/basemaps/commit/0cd9bab54e9f4d581391bbc4fd8b29d1a50c4565))





# [6.5.0](https://github.com/linz/basemaps/compare/v6.4.0...v6.5.0) (2021-07-25)


### Bug Fixes

* **s3fs:** more specific file systems should be matched first ([#1767](https://github.com/linz/basemaps/issues/1767)) ([0c7df8c](https://github.com/linz/basemaps/commit/0c7df8c1732459fdf0ee0e62a33fcca124ae0779))





# [6.4.0](https://github.com/linz/basemaps/compare/v6.3.0...v6.4.0) (2021-07-13)

**Note:** Version bump only for package @linzjs/s3fs





# [6.3.0](https://github.com/linz/basemaps/compare/v6.2.0...v6.3.0) (2021-07-07)


### Features

* **s3fs:** recursively list locally ([#1712](https://github.com/linz/basemaps/issues/1712)) ([2dec7ba](https://github.com/linz/basemaps/commit/2dec7baab02307b5a408e288e59a89ae693e12de))





# [6.1.0](https://github.com/linz/basemaps/compare/v6.0.0...v6.1.0) (2021-06-23)


### Features

* expose fss3 ([#1687](https://github.com/linz/basemaps/issues/1687)) ([5730f3c](https://github.com/linz/basemaps/commit/5730f3cc1f838e797dcef2ab33f1e56e50805023))





# [6.0.0](https://github.com/linz/basemaps/compare/v5.2.0...v6.0.0) (2021-06-21)


### Bug Fixes

* **s3fs:** default to using the local file system ([#1683](https://github.com/linz/basemaps/issues/1683)) ([f9d65bb](https://github.com/linz/basemaps/commit/f9d65bbc2a9a595df6a1b6a062b2ad29db1573c0))


### Features

* **s3fs:** add listDetails(), lists directory with file sizes ([#1674](https://github.com/linz/basemaps/issues/1674)) ([03517f9](https://github.com/linz/basemaps/commit/03517f9c4533b95b636b524bb9144c37ecb0b02b))
* **s3fs:** provide basic file information with "fs.head" ([#1673](https://github.com/linz/basemaps/issues/1673)) ([93d55b6](https://github.com/linz/basemaps/commit/93d55b6558b2982a4dbaee542457da0b221294af))
* **s3fs:** refactor how credentials are passed to s3fs ([#1675](https://github.com/linz/basemaps/issues/1675)) ([f07f529](https://github.com/linz/basemaps/commit/f07f529af1657aa5ffe7d9deff92406e908e6fe4))


### BREAKING CHANGES

* **s3fs:** this changes the behaviour for s3fs as paths now need to be registered with credentials

* refactor: remove commented out code





# [5.0.0](https://github.com/linz/basemaps/compare/v4.24.0...v5.0.0) (2021-05-17)

**Note:** Version bump only for package @linzjs/s3fs





# [4.22.0](https://github.com/linz/basemaps/compare/v4.21.0...v4.22.0) (2021-03-08)

**Note:** Version bump only for package @linzjs/s3fs





# [4.20.0](https://github.com/linz/basemaps/compare/v4.19.0...v4.20.0) (2021-02-15)

**Note:** Version bump only for package @linzjs/s3fs





# [4.19.0](https://github.com/linz/basemaps/compare/v4.18.0...v4.19.0) (2020-11-30)

**Note:** Version bump only for package @linzjs/s3fs





# [4.18.0](https://github.com/linz/basemaps/compare/v4.17.0...v4.18.0) (2020-11-12)

**Note:** Version bump only for package @linzjs/s3fs





# [4.17.0](https://github.com/linz/basemaps/compare/v4.16.0...v4.17.0) (2020-11-03)

**Note:** Version bump only for package @linzjs/s3fs





# [4.16.0](https://github.com/linz/basemaps/compare/v4.15.0...v4.16.0) (2020-10-12)


### Bug Fixes

* **cli:** correct the location to find the source roleArn ([#1256](https://github.com/linz/basemaps/issues/1256)) ([906843d](https://github.com/linz/basemaps/commit/906843d699386ae3b480316ba911467f1d375def))





# [4.15.0](https://github.com/linz/basemaps/compare/v4.14.0...v4.15.0) (2020-09-29)


### Features

* **linzjs-s3fs:** .list is now a async generator to allow easier iterating of folders ([#1213](https://github.com/linz/basemaps/issues/1213)) ([a42c594](https://github.com/linz/basemaps/commit/a42c594a506914e340eabb2afd97991c2b119a64))





# [4.14.0](https://github.com/linz/basemaps/compare/v4.13.0...v4.14.0) (2020-09-17)


### Bug Fixes

* **linzjs-s3fs:** allow fs.list to list buckets and not need a "key" ([#1178](https://github.com/linz/basemaps/issues/1178)) ([108774f](https://github.com/linz/basemaps/commit/108774f96e37d36f89d1c29b634e1956d2fddf54))





# [4.12.0](https://github.com/linz/basemaps/compare/v4.11.2...v4.12.0) (2020-09-06)

**Note:** Version bump only for package @linzjs/s3fs





## [4.11.1](https://github.com/linz/basemaps/compare/v4.11.0...v4.11.1) (2020-08-31)

**Note:** Version bump only for package @linzjs/s3fs





# [4.11.0](https://github.com/linz/basemaps/compare/v4.10.0...v4.11.0) (2020-08-31)

**Note:** Version bump only for package @linzjs/s3fs





# [4.9.0](https://github.com/linz/basemaps/compare/v4.8.0...v4.9.0) (2020-08-17)


### Features

* **s3fs:** expose standard error codes for not found and forbidden ([#1049](https://github.com/linz/basemaps/issues/1049)) ([56831cc](https://github.com/linz/basemaps/commit/56831cc9a0eff805241993a155bc61e0f8f34389))
