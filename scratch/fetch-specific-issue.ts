import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from '../src/config';

async function fetchSpecificIssue() {
  const config = getHulyConfig();
  console.log(`Connecting to Huly REST Client...`);

  try {
    const client = await connectRest(config.url, {
      workspace: config.workspace,
      token: config.auth.token!
    });

    console.log('Querying for specific issue ID: 696f077bba9213afd73450d4...');
    const issue = await client.findOne('tracker:class:Issue', { _id: '696f077bba9213afd73450d4' });

    if (issue) {
      console.log('\n=== Fetch Successful ===');
      console.log(JSON.stringify(issue, null, 2));
    } else {
      console.log('\nCould not find the issue with ID: 696f077bba9213afd73450d4');
    }
  } catch (error) {
    console.error('Error fetching specific issue:', error);
  }
}

fetchSpecificIssue().catch(console.error);
