import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from '../src/config';

async function testProjects() {
  const config = getHulyConfig();
  const client = await connectRest(config.url, {
    workspace: config.workspace,
    token: config.auth.token!
  });

  try {
    console.log('Querying tracker:class:Project...');
    const projects = await client.findAll('tracker:class:Project', {});
    console.log(`Found ${projects.length} project(s):`);
    for (const project of projects) {
      console.log(`- Project: "${project.name}" (ID: ${project._id}), keys: ${Object.keys(project).join(', ')}`);
    }

    console.log('\nQuerying tracker:class:Milestone...');
    const milestones = await client.findAll('tracker:class:Milestone', {});
    for (const m of milestones) {
      console.log(`- Milestone: "${m.label}" in Space ID: ${m.space}`);
    }
  } catch (error) {
    console.error('Error during query:', error);
  }
}

testProjects().catch(console.error);
