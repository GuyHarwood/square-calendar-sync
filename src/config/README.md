# Config

Make a copy of the example env file, and populate with your config.

`cp .example.env .env`

## Square API Configuration
```bash
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_square_application_id
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENVIRONMENT=production
```

## Apple Calendar Configuration
```bash
APPLE_CALDAV_SERVER=https://caldav.icloud.com
APPLE_USERNAME=your_apple_id
APPLE_APP_PASSWORD=your_app_specific_password
APPLE_CALENDAR_NAME='your_apple_calendar_name'

# Requirements

- **AppleID** the email address of the apple account that owns the calendar
- **App Specific Password** a generated app specific password to manage the calendar

