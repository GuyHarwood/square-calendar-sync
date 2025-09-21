import { AppointmentsService } from './appointments';
import { getSquareConfig } from './config/environment';

async function main() {
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

if (require.main === module) {
  main();
}

export { main };