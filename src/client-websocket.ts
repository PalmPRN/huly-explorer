import { connect } from '@hcengineering/api-client';
import { getHulyConfig } from './config';

/**
 * WebSocket client runner for Huly API Client.
 * Demonstrates step-by-step connection, querying, and document lifecycle operations.
 */
async function runWebSocketExample() {
  // STEP 1: Load and validate local environment settings.
  // Throws detailed error if workspace or authentication details are missing.
  const config = getHulyConfig();
  console.log(`Connecting to Huly instance at: ${config.url}`);
  console.log(`Target Workspace: ${config.workspace}`);

  // STEP 2: Establish connection.
  // Options specify either authentication token or email/password.
  const connectionOptions = {
    workspace: config.workspace,
    ...(config.auth.token ? { token: config.auth.token } : { email: config.auth.email!, password: config.auth.password! })
  };

  const client = await connect(config.url, connectionOptions);
  console.log('Successfully connected to Huly WebSocket endpoint.');

  try {
    // STEP 3: Retrieve available spaces (projects/teamspaces).
    // In Huly, all trackers, document drives, etc. live within a Space.
    console.log('\n--- Fetching Spaces ---');
    const spacesResult = await client.findAll('core:class:Space', {});
    console.log(`Found ${spacesResult.length} space(s) in this workspace.`);

    for (const space of spacesResult) {
      console.log(`- Space Name: ${space.name} (ID: ${space._id})`);
    }

    const targetSpace = spacesResult[0];
    if (!targetSpace) {
      console.warn('WARNING: No spaces found in this workspace. Please create a space in Huly UI first to run full CRUD operations.');
      return;
    }

    console.log(`Using target space "${targetSpace.name}" for CRUD operations.`);

    // STEP 4: Create a new Issue.
    // We use the Huly Issue class 'tracker:class:Issue' and save it inside our target space.
    console.log('\n--- Creating an Issue ---');
    const newIssueAttributes = {
      title: 'Integration Test Issue (WebSockets)',
      priority: 'High',
      // Note: Workflow states depend on the space configuration, e.g., 'Backlog', 'Todo', 'Done'
      status: 'Todo'
    };

    const newIssueId = await client.createDoc(
      'tracker:class:Issue',
      targetSpace._id,
      newIssueAttributes as any
    );
    console.log(`Successfully created Issue. ID: ${newIssueId}`);

    // STEP 5: Read the newly created Issue.
    // Query by unique ID to verify document state.
    console.log('\n--- Fetching Created Issue ---');
    const issue = await client.findOne('tracker:class:Issue', { _id: newIssueId });
    if (issue) {
      console.log(`Retrieved Issue:`);
      console.log(`- Title: ${issue.title}`);
      console.log(`- Priority: ${issue.priority}`);
      console.log(`- Status: ${issue.status}`);
    } else {
      console.error('Failed to retrieve the created issue.');
    }

    // STEP 6: Update the Issue.
    // Change issue title or other properties.
    console.log('\n--- Updating Issue ---');
    await client.updateDoc(
      'tracker:class:Issue',
      targetSpace._id,
      newIssueId,
      { title: 'Integration Test Issue (WebSockets) - Updated Title' } as any
    );
    console.log('Issue updated successfully.');

    // STEP 7: Verify updates.
    const updatedIssue = await client.findOne('tracker:class:Issue', { _id: newIssueId });
    if (updatedIssue) {
      console.log(`Updated Issue Title: ${updatedIssue.title}`);
    }

    // STEP 8: Clean up.
    // Delete the test document.
    console.log('\n--- Deleting Test Issue ---');
    await client.removeDoc('tracker:class:Issue', targetSpace._id, newIssueId);
    console.log(`Test Issue ${newIssueId} deleted successfully.`);

  } catch (error) {
    console.error('Error during WebSocket execution:', error);
  } finally {
    // STEP 9: Clean up connection resource.
    // Always close the WebSocket client to release resource/process handles.
    console.log('\nClosing WebSocket client connection.');
    await client.close();
  }
}

// Run the script
runWebSocketExample().catch((err) => {
  console.error('Unhandled script error:', err);
});
