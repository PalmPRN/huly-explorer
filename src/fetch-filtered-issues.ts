import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from './config';

/**
 * Script to fetch issues filtered by:
 * - Project (Space): "Dev Team " (ID: 69628908fc7dc01cfff7fb4e)
 * - Milestone: "Sprint MAY" (ID: 69f0379895e579c9d8557a60)
 * - Assignee: "FE,Palm" (ID: 695c7f1762e2dc0aeb2ed56d)
 */
async function fetchFilteredIssues() {
  const config = getHulyConfig();
  console.log(`Connecting to Huly REST Client...`);

  try {
    const client = await connectRest(config.url, {
      workspace: config.workspace,
      token: config.auth.token!
    });

    console.log('Successfully authenticated.');
    console.log('Fetching issues matching criteria:');
    console.log('- Space: "Dev Team " (69628908fc7dc01cfff7fb4e)');
    console.log('- Milestone: "Sprint MAY" (69f0379895e579c9d8557a60)');
    console.log('- Assignee: "FE,Palm" (695c7f1762e2dc0aeb2ed56d)\n');

    const query = {
      space: '69628908fc7dc01cfff7fb4e',
      milestone: '69f0379895e579c9d8557a60',
      assignee: '695c7f1762e2dc0aeb2ed56d'
    };

    const issues = await client.findAll('tracker:class:Issue', query);

    console.log(`=== Found ${issues.length} matching issue(s) ===`);

    for (const issue of issues) {
      console.log(`\n- ID: ${issue._id}`);
      console.log(`  Identifier: ${issue.identifier}`);
      console.log(`  Title: ${issue.title}`);
      console.log(`  Priority: ${issue.priority}`);
      console.log(`  Status: ${issue.status}`);
      console.log(`  Is Done: ${issue.isDone}`);
    }

  } catch (error) {
    console.error('Error fetching filtered issues:', error);
  }
}

fetchFilteredIssues().catch((err) => {
  console.error('Unhandled script error:', err);
});
