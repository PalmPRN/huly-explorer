import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from './config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to fetch issues filtered by:
 * - Project (Space): "Dev Team " (ID: 69628908fc7dc01cfff7fb4e)
 * - Milestone: "Sprint MAY" (ID: 69f0379895e579c9d8557a60)
 * - Assignee: "FE,Palm" (ID: 695c7f1762e2dc0aeb2ed56d)
 *
 * Resolves standard fields and new custom dates (startDate/endDate) to CSV format.
 */
async function exportToCSV() {
  const config = getHulyConfig();
  console.log('Connecting to Huly REST Client...');

  try {
    const client = await connectRest(config.url, {
      workspace: config.workspace,
      token: config.auth.token!
    });

    console.log('Fetching workspace metadata to map IDs...');

    // Fetch all statuses
    const statuses = await client.findAll('tracker:class:IssueStatus', {});
    const statusMap = new Map<string, string>();
    for (const status of statuses) {
      statusMap.set(status._id, status.name || status.label || 'Unknown');
    }

    // Fetch all members / persons
    const people = await client.findAll('contact:class:Person', {});
    const peopleMap = new Map<string, string>();
    for (const person of people) {
      peopleMap.set(person._id, person.name || person.displayName || `${person.firstName || ''} ${person.lastName || ''}`.trim());
    }

    // Fetch Milestones
    const milestones = await client.findAll('tracker:class:Milestone', {});
    const milestoneMap = new Map<string, string>();
    for (const m of milestones) {
      milestoneMap.set(m._id, m.name || m.label || 'Unknown');
    }

    // Fetch Spaces
    const spaces = await client.findAll('core:class:Space', {});
    const spaceMap = new Map<string, string>();
    for (const s of spaces) {
      spaceMap.set(s._id, s.name || 'Unknown');
    }

    console.log('Fetching filtered issues...');
    const query = {
      space: '69628908fc7dc01cfff7fb4e',
      milestone: '69f0379895e579c9d8557a60',
      assignee: '695c7f1762e2dc0aeb2ed56d'
    };

    const issues = await client.findAll('tracker:class:Issue', query);
    console.log(`Retrieved ${issues.length} issue(s). Formatting CSV...`);

    // Build CSV Headers
    const csvHeaders = [
      'Identifier',
      'Title',
      'Priority',
      'Status',
      'Assignee',
      'Milestone',
      'Project Space',
      'Is Done',
      'Estimation (Hours)',
      'Remaining (Hours)',
      'Reported (Hours)',
      'Created Date',
      'Modified Date',
      'Start Date',
      'End Date',
      'Huly Link'
    ];

    const csvRows = issues.map(issue => {
      const resolvedStatus = statusMap.get(issue.status) || issue.status || 'Unknown';
      const resolvedAssignee = peopleMap.get(issue.assignee) || issue.assignee || 'Unassigned';
      const resolvedMilestone = milestoneMap.get(issue.milestone) || issue.milestone || 'None';
      const resolvedSpace = spaceMap.get(issue.space) || 'Dev Team';
      
      const createdDate = issue.createdOn ? new Date(issue.createdOn).toISOString() : '';
      const modifiedDate = issue.modifiedOn ? new Date(issue.modifiedOn).toISOString() : '';
      
      // Resolve custom date fields: Start Date & End Date
      const startDate = issue.custom6a02f6ea53726adb2f266836 
        ? new Date(issue.custom6a02f6ea53726adb2f266836).toISOString() 
        : '';
      const endDate = issue.custom6a1124fba3f809a2ee63da08 
        ? new Date(issue.custom6a1124fba3f809a2ee63da08).toISOString() 
        : '';
      
      const hulyLink = `${config.url}/workbench/${config.workspace}/tracker/issue/${issue.identifier || issue._id}`;

      // Helper to escape double quotes and wrap in quotes
      const cleanField = (val: any) => {
        if (val === null || val === undefined) return '';
        let str = String(val).trim();
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          str = `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      return [
        cleanField(issue.identifier),
        cleanField(issue.title),
        cleanField(issue.priority),
        cleanField(resolvedStatus),
        cleanField(resolvedAssignee),
        cleanField(resolvedMilestone),
        cleanField(resolvedSpace),
        cleanField(issue.isDone),
        cleanField(issue.estimation),
        cleanField(issue.remainingTime),
        cleanField(issue.reportedTime),
        cleanField(createdDate),
        cleanField(modifiedDate),
        cleanField(startDate),
        cleanField(endDate),
        cleanField(hulyLink)
      ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    // Write to File
    const outputPath = path.join(process.cwd(), 'dev_team_sprint_may_issues.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`\nCSV Export Completed Successfully!`);
    console.log(`File saved to: ${outputPath}`);
    console.log(`\nCSV Content Preview (First 3 rows):`);
    console.log('--------------------------------------------------');
    console.log([csvHeaders.join(','), ...csvRows.slice(0, 3)].join('\n'));
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('Error during CSV export:', error);
  }
}

exportToCSV().catch((err) => {
  console.error('Unhandled script error:', err);
});
