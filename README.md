# ghydro

Your monorepository tool, Lerna is a great tool but it is focus on one technology `javascript`
While working on complex project, I endup needing monorepo for several technology:

- Docker
- Javascript
- Java
- Go
- Pulumi

Using conventional-commit, we will generate CHANGELOG.md for each of your projects.
`standard-version` and `semantic-release` are great but are not the best feat for monorepo

## Concepts

### projects

A project is a subset of changes inside a repository

It has properties:

- path
- name
- description
- commitFilter
- versionners
- processors
- versionBumper

### commits

This represent a commit in the repository

### tags

### versionners

Their role is to:

- readVersion
- writeVersion
- lockDependencies
- unlockDependencies

## Commands

```
# Generate the changelog for each project since last tag
ghydro changelog
# GitHub workflow
ghydro github workflow
# Add GitHub checks
```

## Basic CI

A project define how it is test/build/deploy and promote.
Each of these steps can generate reports

### steps

test
prepare-release
release
post-release
