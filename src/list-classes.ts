import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from './config';

async function listClasses() {
  const config = getHulyConfig();
  const client = await connectRest(config.url, {
    workspace: config.workspace,
    token: config.auth.token!
  });

  try {
    const { hierarchy } = await client.getModel();
    console.log('Classifiers in Huly schema:');
    const classifiers = (hierarchy as any).classifiers;
    if (classifiers) {
      const keys = Array.from(classifiers.keys()) as string[];
      console.log(`Found ${keys.length} classifiers.`);
      // Filter tracker or core classes
      const trackerKeys = keys.filter(k => 
        k.includes('tracker') || 
        k.includes('milestone') || 
        k.includes('space') || 
        k.includes('member') || 
        k.includes('assignee') || 
        k.includes('account') || 
        k.includes('person')
      );
      console.log('Filtered classifiers matching keywords:');
      console.log(JSON.stringify(trackerKeys, null, 2));
    }
  } catch (error) {
    console.error('Error listing classes:', error);
  }
}

listClasses().catch(console.error);
