# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2](https://github.com/dungle-scrubs/engram/compare/engram-v0.1.1...engram-v0.1.2) (2026-02-24)


### Fixed

* **backup:** checkpoint WAL and handle corrupt manifests ([04eeca6](https://github.com/dungle-scrubs/engram/commit/04eeca655346c042711aae97697cfe60eff912f6))
* **cli:** add error handling and read version from package.json ([b859d16](https://github.com/dungle-scrubs/engram/commit/b859d167527def85d83b5ed3c5aed7cac4a03e07))
* **db:** add foreign key constraints ([09e286e](https://github.com/dungle-scrubs/engram/commit/09e286e2129b6b5ac59bbd02ee3b327bc28e23a1))
* **scorecard:** validate date input format ([94e7dfc](https://github.com/dungle-scrubs/engram/commit/94e7dfc03af9554c547f5fe905d80153f5eb37d7))


### Changed

* **db:** index results.created_at_ms for scorecard queries ([b3b07fe](https://github.com/dungle-scrubs/engram/commit/b3b07fed711fa2ae90e30067293d75193776169a))


### Documentation

* note key-order sensitivity in hashDatasetPayload ([8316169](https://github.com/dungle-scrubs/engram/commit/83161699b44e8dc27aff5d2d863ad2a454dd7203))


### Maintenance

* add CLI contract and schema sync tests ([dee8af1](https://github.com/dungle-scrubs/engram/commit/dee8af157624356728e1e4ecae02c04a9d27b27f))
* add engram branding assets ([b1a8cd7](https://github.com/dungle-scrubs/engram/commit/b1a8cd7eab4f68e20407e3214a0bf2556320d802))
* add test step to quality workflow ([74598cd](https://github.com/dungle-scrubs/engram/commit/74598cd01a3faf66184858be71ec7c53d29f5ae7))
* **branding:** add engram app logo ([30def5e](https://github.com/dungle-scrubs/engram/commit/30def5ef4bcdb33df23f4072937a98820854174f))
* **branding:** add github social preview image ([3f954f7](https://github.com/dungle-scrubs/engram/commit/3f954f7fdbecb0bf05de2e58951969c0598328a6))
* prepare for public release ([33a76d8](https://github.com/dungle-scrubs/engram/commit/33a76d8ae429377612f466217d54c491f7ba791d))

## [0.1.1](https://github.com/dungle-scrubs/engram/compare/engram-v0.1.0...engram-v0.1.1) (2026-02-22)


### Fixed

* clear esbuild audit advisory ([903c579](https://github.com/dungle-scrubs/engram/commit/903c57926e03d8451ab9572e1ad8724f627f556f))
* override esbuild to clear security advisory ([bee1bc7](https://github.com/dungle-scrubs/engram/commit/bee1bc79ddd6b80926227457360bd42b0f0a7ed7))


### Maintenance

* add core unit and integration coverage ([3c0732a](https://github.com/dungle-scrubs/engram/commit/3c0732a04b7e7816e04539cb1c6c7782315716ee))
* add coverage and pre-commit quality gates ([7678708](https://github.com/dungle-scrubs/engram/commit/7678708fbacb2a39d3dae3c3a2acceed563b0771))
* add husky pre-commit quality gates ([84fb160](https://github.com/dungle-scrubs/engram/commit/84fb1609739285557d2dde3b1b68f3785d37b87c))
* initialize repo with release scaffolding ([f660dea](https://github.com/dungle-scrubs/engram/commit/f660dea4c0eb6269293e9b8f055b0b105131128b))

## [0.1.0] - 2026-02-22

### Added

- Initial Bun + TypeScript CLI scaffold
- SQLite schema initialization and storage path resolution
- Daily scorecard aggregation, backup snapshots, and backup verification
