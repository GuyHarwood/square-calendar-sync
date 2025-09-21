# Square Cal Sync

## Summary
Synchronises a squareup.com appointment calendar with an Apple iCal calendar, on a schedule.

## Requirements

When executed it will access the squareup.com API and read all future appointments and synchronise these with an apple calendar.  Each apple calendar entry will need to carry some kind of identifier from squareup.com so that each time it syncs, it understands which bookings have been modified since the last sync.  To help manage this state locally it should have a sqlite database, if necessary.  Each sync process will have its own UUID value, and when the sync process is complete it will output a log file of all actions that took place.  The log file will be named by the current date and time and the UUID.  

## Project structure

The project will use feature folders for all code.  A feature folder will contain the unit tests and service implementation in the same folder.
There will be an app.ts in the root of the app.

## Tech Stack
- Node.Js v22
- Typescript
  - Prettier for code formatting
  - Jest for unit tests
- SQLite (for local data & cache)
-  

## Prerequisites
- Node JS v22
- Square Developer Account with API access
- Apple ID 

