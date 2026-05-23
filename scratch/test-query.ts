import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from '../src/config';

async function testQuery() {
  const config = getHulyConfig();
  const client = await connectRest(config.url, {
    workspace: config.workspace,
    token: config.auth.token!
  });

  try {
    const query = {
      space: '69628908fc7dc01cfff7fb4e',
      milestone: '69f0379895e579c9d8557a60'
    };
    const issues = await client.findAll('tracker:class:Issue', query);
    console.log(`Successfully fetched ${issues.length} issues without specifying assignee.`);
    for (const issue of issues) {
      console.log(`- ${issue.identifier}: ${issue.title} (Assignee: ${issue.assignee})`);
    }
  } catch (error) {
    console.error('Error querying without assignee:', error);
  }
}

testQuery().catch(console.error);
