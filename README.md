# Appoint

[![Build and run tests](https://github.com/GuyHarwood/square-calendar-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/GuyHarwood/square-calendar-sync/actions/workflows/ci.yml)

## Summary

Synchronises a squareup.com appointment calendar with an Apple iCal calendar via the square API.

## Requirements

When executed it will access the squareup.com API, read future appointments (up to a maximum of 31 days ahead, a limitation by square) and synchronise these with an apple calendar. Each apple calendar entry is populated with a square appointment identifier for easy synchronisation of modified entries.

## Tech Stack

- Typescript
  - Prettier for code formatting
  - Jest for unit tests

## Prerequisites

- Node JS (v22 LTS)
- Square Developer Account with API access
- Apple ID

## Installation & setup

Install all the things (examples below use yarn)

`yarn install`

Create and populate your env file

`cp .example.env .env`

run the unit tests...

`yarn test`

run the integration tests...

`yarn test:integration`

run the app...

`yarn start`
