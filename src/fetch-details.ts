import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from './config';

async function fetchDetails() {
  const config = getHulyConfig();
  const client = await connectRest(config.url, {
    workspace: config.workspace,
    token: config.auth.token!
  });

  try {
    // 1. Find Spaces (Projects)
    console.log('\n=== Fetching all Spaces ===');
    const spaces = await client.findAll('core:class:Space', {});
    for (const space of spaces) {
      console.log(`- Space: "${space.name}" (ID: ${space._id})`);
    }

    // 2. Find Milestones
    console.log('\n=== Fetching all Milestones ===');
    const milestones = await client.findAll('tracker:class:Milestone', {});
    for (const milestone of milestones) {
      console.log(`- Milestone: "${milestone.name}" (ID: ${milestone._id})`);
    }

    // 3. Search for workspace members / users / collaborators
    // Let's query core:class:Collaborator
    console.log('\n=== Fetching all Collaborators ===');
    try {
      const collaborators = await client.findAll('core:class:Collaborator', {});
      for (const coll of collaborators) {
        console.log(`- Collaborator: "${coll.name}" (ID: ${coll._id})`);
      }
    } catch (e) {
      console.log('Error querying core:class:Collaborator:', e);
    }

    // Let's query contact:class:WorkspaceMemberStatus
    console.log('\n=== Fetching Workspace Members ===');
    try {
      const members = await client.findAll('contact:class:WorkspaceMemberStatus', {});
      for (const member of members) {
        console.log(`- Member: ID=${member._id}, user=${member.user}, person=${member.person}`);
      }
    } catch (e) {
      console.log('Error querying contact:class:WorkspaceMemberStatus:', e);
    }

    // Let's try finding the class of account or person by searching the schema
    const { hierarchy } = await client.getModel();
    const classifiers = Array.from((hierarchy as any).classifiers.keys()) as string[];
    const personClasses = classifiers.filter(c => c.includes('person') || c.includes('account') || c.includes('user') || c.includes('collaborator'));
    console.log('\n=== Person-related classes in schema ===');
    console.log(JSON.stringify(personClasses, null, 2));

    // If there is core:class:Person or contact:class:Person etc., let's try querying them!
    const potentialClasses = ['core:class:Person', 'contact:class:Person', 'core:class:Account', 'contact:class:Account'];
    for (const cls of potentialClasses) {
      if (classifiers.includes(cls)) {
        console.log(`\n=== Querying ${cls} ===`);
        try {
          const results = await client.findAll(cls, {});
          for (const res of results) {
            console.log(`- ${cls}: "${res.name || res.displayName || res.firstName || res._id}" (ID: ${res._id})`);
          }
        } catch (e) {
          console.log(`Error querying ${cls}:`, e);
        }
      }
    }

  } catch (error) {
    console.error('Error fetching details:', error);
  }
}

fetchDetails().catch(console.error);
