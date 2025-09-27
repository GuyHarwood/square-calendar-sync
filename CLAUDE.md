# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Square Cal Sync is a Node.js/TypeScript application that synchronizes Square appointment calendars with Apple iCal calendars on a schedule. The project is currently in early development stages.

## Architecture & Structure

- **Feature-based organization**: All code uses feature folders containing both implementation and unit tests
- **Main entry point**: `app.ts` in the root directory (when created)
- **Database**: SQLite for local data storage and caching
- **Sync tracking**: Each sync process has a UUID and generates timestamped log files
- **State management**: Apple calendar entries carry Square identifiers for sync state tracking

## Technology Stack

- **Runtime**: Node.js v22
- **Language**: TypeScript
- **Testing**: Jest for unit tests
- **Formatting**: Prettier for code formatting
- **Database**: SQLite for local data and cache
- **APIs**: Square API for appointment data, Apple Calendar for synchronization

## Environment Configuration

The project uses environment variables for Square API configuration:
- `SQUARE_ACCESS_TOKEN`: Square API access token
- `SQUARE_APPLICATION_ID`: Square application identifier
- `SQUARE_LOCATION_ID`: Square location identifier
- `SQUARE_ENVIRONMENT`: API environment (production/sandbox)

Copy `.env.example` to `.env` and configure with your Square API credentials.

## Development Status

This is a greenfield project. The codebase currently contains only documentation and configuration templates. When implementing:

1. Start with `app.ts` as the main entry point
2. Create feature folders containing both implementation and tests
3. Implement Square API integration for appointment fetching
4. Build Apple Calendar synchronization functionality
5. Add SQLite database for state management
6. Implement UUID-based sync tracking and logging

## Prerequisites

- Node.js v22
- Square Developer Account with API access
- Apple ID for calendar access

[TODO list](./TODO.md)
