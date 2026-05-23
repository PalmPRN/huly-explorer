import { connectRest, createRestTxOperations, getWorkspaceToken } from '@hcengineering/api-client';
import { getHulyConfig } from './config';

/**
 * REST client runner for Huly API Client.
 * Demonstrates both:
 * 1. Standard lightweight read-only connections via connectRest
 * 2. Transactional write operations (create, update, delete) via createRestTxOperations over HTTP.
 */
async function runRestExample() {
  // STEP 1: Load and validate environment configuration.
  const config = getHulyConfig();
  console.log(`Connecting to Huly instance at: ${config.url}`);
  console.log(`Target Workspace: ${config.workspace}`);

  const authOptions = {
    workspace: config.workspace,
    ...(config.auth.token ? { token: config.auth.token } : { email: config.auth.email!, password: config.auth.password! })
  };

  // --- APPROACH 1: Lightweight Read-Only REST Client ---
  console.log('\n--- Approach 1: Lightweight REST Client (Read-Only) ---');
  const restClient = await connectRest(config.url, authOptions);
  console.log('Successfully connected to REST client.');

  let targetSpaceId: string | undefined;

  try {
    // Get account info
    const account = await restClient.getAccount();
    console.log(`Authenticated Account UUID: ${account.uuid}`);

    // Query spaces using standard HTTP client
    const spaces = await restClient.findAll('core:class:Space', {});
    console.log(`Found ${spaces.length} space(s) via REST:`);
    for (const space of spaces) {
      console.log(`- Space Name: ${space.name} (ID: ${space._id})`);
    }

    if (spaces.length > 0) {
      targetSpaceId = spaces[0]._id;
    }
  } catch (error) {
    console.error('Error during read-only REST operations:', error);
  }

  // --- APPROACH 2: Transactional Writes over REST ---
  console.log('\n--- Approach 2: Transactional REST Operations (Writes) ---');
  if (!targetSpaceId) {
    console.warn('Skipping transactional write example: No target space available.');
    return;
  }

  try {
    // STEP 2: Obtain endpoint & token to initialize transactional REST context
    const { endpoint, token, workspaceId } = await getWorkspaceToken(config.url, authOptions);

    // STEP 3: Create TxOperations client wrapping the REST endpoints
    const txClient = await createRestTxOperations(endpoint, workspaceId, token);
    console.log('Transactional REST wrapper initialized.');

    // STEP 4: Create a test Issue over HTTP POST
    console.log('Creating a test issue...');
    const newIssueId = await txClient.createDoc(
      'tracker:class:Issue',
      targetSpaceId,
      {
        title: 'Integration Test Issue (REST)',
        priority: 'Medium',
        status: 'Todo'
      } as any
    );
    console.log(`Successfully created Issue. ID: ${newIssueId}`);

    // STEP 5: Update the test Issue
    console.log('Updating issue title...');
    await txClient.updateDoc(
      'tracker:class:Issue',
      targetSpaceId,
      newIssueId,
      {
        title: 'Integration Test Issue (REST) - Updated Title'
      } as any
    );
    console.log('Issue updated successfully.');

    // STEP 6: Verify the update
    const updatedIssue = await txClient.findOne('tracker:class:Issue', { _id: newIssueId });
    if (updatedIssue) {
      console.log(`Verified Issue Title: ${updatedIssue.title}`);
    }

    // STEP 7: Delete the test Issue (Clean up)
    console.log('Deleting test issue...');
    await txClient.removeDoc('tracker:class:Issue', targetSpaceId, newIssueId);
    console.log('Test Issue deleted successfully.');

  } catch (error) {
    console.error('Error during transactional REST operations:', error);
  }
}

// Run the script
runRestExample().catch((err) => {
  console.error('Unhandled script error:', err);
});
