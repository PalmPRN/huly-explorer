import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from './config';

/**
 * Script to test fetching 1 issue task using the provided API token.
 */
async function fetchOneIssue() {
  const config = getHulyConfig();
  console.log(`Connecting to Huly REST Client at: ${config.url}`);
  console.log(`Workspace: ${config.workspace}`);

  try {
    const client = await connectRest(config.url, {
      workspace: config.workspace,
      token: config.auth.token!
    });

    console.log('Successfully authenticated. Querying for 1 issue task...');

    // Fetch 1 issue task of class 'tracker:class:Issue'
    const issue = await client.findOne('tracker:class:Issue', {});

    if (issue) {
      console.log('\n--- Issue Found ---');
      console.log(`ID: ${issue._id}`);
      console.log(`Title: ${issue.title}`);
      console.log(`Priority: ${issue.priority}`);
      console.log(`Status: ${issue.status}`);
      console.log('Full document structure:');
      console.log(JSON.stringify(issue, null, 2));
    } else {
      console.log('\nNo issues found in this workspace.');
    }
  } catch (error) {
    console.error('Error fetching issue:', error);
  }
}

fetchOneIssue().catch((err) => {
  console.error('Unhandled script error:', err);
});
