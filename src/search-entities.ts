import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from './config';

async function searchEntities() {
  const config = getHulyConfig();
  const client = await connectRest(config.url, {
    workspace: config.workspace,
    token: config.auth.token!
  });

  try {
    // 1. Search for space "DEV TEAM"
    const spaces = await client.findAll('core:class:Space', {});
    const devTeamSpace = spaces.find(s => s.name?.toUpperCase().includes('DEV TEAM'));
    console.log('DEV TEAM Space Match:');
    if (devTeamSpace) {
      console.log(`Found: "${devTeamSpace.name}" (ID: ${devTeamSpace._id})`);
    }

    // 2. Search for milestone "Sprint MAY"
    const milestones = await client.findAll('tracker:class:Milestone', {});
    console.log('\nAll Milestones:');
    for (const m of milestones) {
      console.log(`- ID: ${m._id}, label: "${m.label}", targetDate: "${m.targetDate}"`);
    }

    const sprintMayMilestone = milestones.find(m => 
      m.label?.toUpperCase().includes('MAY')
    );
    console.log('\nMilestone Match (containing "MAY"):');
    if (sprintMayMilestone) {
      console.log(`Found: "${sprintMayMilestone.label}" (ID: ${sprintMayMilestone._id})`);
    }

    // 3. Search for person "FE,Palm"
    const people = await client.findAll('contact:class:Person', {});
    const palm = people.find(p => p.name?.toUpperCase().includes('PALM') || p.firstName?.toUpperCase().includes('PALM') || p.lastName?.toUpperCase().includes('PALM'));
    console.log('\nPerson Match (containing "Palm"):');
    if (palm) {
      console.log(`Found: "${palm.name || palm.displayName || (palm.firstName + ' ' + palm.lastName)}" (ID: ${palm._id})`);
    }

  } catch (error) {
    console.error('Error during search:', error);
  }
}

searchEntities().catch(console.error);
