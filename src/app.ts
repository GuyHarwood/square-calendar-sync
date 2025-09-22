import * as readline from 'readline';
import { AppointmentsService } from './appointments';
import { getSquareConfig } from './config/config';
import { exampleUsage } from './ical/example';

async function appointmentsLookup() {
  try {
    console.log('Starting Square Cal Sync...');

    const config = getSquareConfig();
    const appointmentsService = new AppointmentsService(config);

    const futureAppointments = await appointmentsService.getAllFutureAppointments();

    console.log(`Found ${futureAppointments.length} future appointments`);

    futureAppointments.forEach(appointment => {
      console.log(`- ${appointment.id}: ${appointment.startAt} (${appointment.status})`);
    });

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function testCalendarEntry() {
  try {
    console.log('Testing calendar entry...');
    await exampleUsage();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

async function showMenu(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\nSquare Cal Sync - Select an option:');
    console.log('1. Appointments lookup');
    console.log('2. Test adding a calendar entry and listing it');
    console.log('');

    rl.question('Enter your choice (1 or 2): ', async (answer) => {
      rl.close();

      switch (answer.trim()) {
        case '1':
          await appointmentsLookup();
          break;
        case '2':
          await testCalendarEntry();
          break;
        default:
          console.log('Invalid option. Please run the app again and select 1 or 2.');
          process.exit(1);
      }

      resolve();
    });
  });
}

async function main() {
  await showMenu();
}

if (require.main === module) {
  main();
}

export { main };
