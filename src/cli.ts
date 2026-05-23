import { connectRest } from '@hcengineering/api-client';
import { getHulyConfig } from './config';
import prompts from 'prompts';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Explicitly load .env variables relative to the project root directory where cli.ts resides
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Handle graceful exit on Ctrl+C
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\nExiting Huly Terminal Dashboard. Goodbye!'));
  process.exit(0);
});

/**
 * Helper to translate priority numbers to human-readable labels.
 */
function translatePriority(priority: any): string {
  const p = String(priority ?? '').toLowerCase().trim();
  if (p === '1' || p === 'urgent') return 'Urgent';
  if (p === '2' || p === 'high') return 'High';
  if (p === '3' || p === 'medium') return 'Medium';
  if (p === '4' || p === 'low') return 'Low';
  return 'Low';
}

/**
 * Saves successfully validated credentials back into the .env file.
 */
function saveToEnv(url: string, workspace: string, token?: string, email?: string, password?: string) {
  let content = `HULY_URL=${url}\nHULY_WORKSPACE=${workspace}\n`;
  if (token) {
    content += `HULY_TOKEN=${token}\n`;
  } else if (email && password) {
    content += `HULY_EMAIL=${email}\nHULY_PASSWORD=${password}\n`;
  }
  try {
    fs.writeFileSync(path.join(__dirname, '..', '.env'), content, 'utf8');
  } catch (err: any) {
    console.log(chalk.red(`⚠️  Warning: Could not save credentials to .env file: ${err.message}`));
  }
}

/**
 * Validates current config or prompts the user interactively until a connection is established.
 */
async function resolveAndValidateConfig(): Promise<{ client: any; config: any }> {
  let url = process.env.HULY_URL || 'https://huly.app';
  let workspace = process.env.HULY_WORKSPACE || '';
  let token = process.env.HULY_TOKEN || '';
  let email = process.env.HULY_EMAIL || '';
  let password = process.env.HULY_PASSWORD || '';

  let client = null;
  let isConnected = false;

  // STEP 1: Attempt to connect with existing .env variables if they are present
  const hasInitialConfig = workspace && (token || (email && password));

  if (hasInitialConfig) {
    const checkSpinner = ora({
      text: chalk.dim(`Testing connection to Huly at ${url}...`),
      color: 'cyan'
    }).start();

    try {
      client = await connectRest(url, {
        workspace,
        token: token || undefined,
        email: email || undefined,
        password: password || undefined
      });
      checkSpinner.succeed(chalk.green('Connected successfully using existing .env config.'));
      return { client, config: { url, workspace, auth: { token, email, password } } };
    } catch (err: any) {
      checkSpinner.fail(chalk.red(`Connection test failed: ${err.message}`));
      console.log(chalk.yellow('\nPlease provide valid Huly credentials below to connect.\n'));
    }
  } else {
    console.log(chalk.yellow('⚠️  Huly configuration is missing or incomplete in your .env file.'));
    console.log(chalk.cyan('Let\'s set up your Huly integration credentials.\n'));
  }

  // STEP 2: Prompt and retry loop until connection is validated
  while (!isConnected) {
    // Prompt for base URL and Workspace ID
    const basicInfo = await prompts([
      {
        type: 'text',
        name: 'url',
        message: 'Enter Huly Instance URL:',
        initial: url || 'https://huly.app'
      },
      {
        type: 'text',
        name: 'workspace',
        message: 'Enter Huly Workspace ID:',
        initial: workspace,
        validate: val => val.trim().length > 0 ? true : 'Workspace ID is required'
      }
    ]);

    if (basicInfo.url === undefined || basicInfo.workspace === undefined) {
      console.log(chalk.yellow('\nSetup cancelled. Exiting.'));
      process.exit(0);
    }

    url = basicInfo.url.trim();
    workspace = basicInfo.workspace.trim();

    // Select auth type
    const authType = await prompts({
      type: 'select',
      name: 'type',
      message: 'Select Authentication Method:',
      choices: [
        { title: 'Personal Access Token (Recommended)', value: 'token' },
        { title: 'Email & Password Credentials', value: 'credentials' }
      ]
    });

    if (authType.type === undefined) {
      console.log(chalk.yellow('\nSetup cancelled. Exiting.'));
      process.exit(0);
    }

    let currentToken = '';
    let currentEmail = '';
    let currentPassword = '';

    if (authType.type === 'token') {
      const tokenPrompt = await prompts({
        type: 'password',
        name: 'token',
        message: 'Enter Huly Personal Access Token:',
        initial: token,
        validate: val => val.trim().length > 0 ? true : 'Token is required'
      });
      if (tokenPrompt.token === undefined) {
        console.log(chalk.yellow('\nSetup cancelled. Exiting.'));
        process.exit(0);
      }
      currentToken = tokenPrompt.token.trim();
    } else {
      const credsPrompt = await prompts([
        {
          type: 'text',
          name: 'email',
          message: 'Enter Email Address:',
          initial: email,
          validate: val => val.trim().length > 0 ? true : 'Email is required'
        },
        {
          type: 'password',
          name: 'password',
          message: 'Enter Password:',
          initial: password,
          validate: val => val.trim().length > 0 ? true : 'Password is required'
        }
      ]);
      if (credsPrompt.email === undefined || credsPrompt.password === undefined) {
        console.log(chalk.yellow('\nSetup cancelled. Exiting.'));
        process.exit(0);
      }
      currentEmail = credsPrompt.email.trim();
      currentPassword = credsPrompt.password.trim();
    }

    // Ping check connection with supplied credentials
    const testSpinner = ora({
      text: chalk.dim('Pinging Huly instance with credentials...'),
      color: 'cyan'
    }).start();

    try {
      client = await connectRest(url, {
        workspace,
        token: currentToken || undefined,
        email: currentEmail || undefined,
        password: currentPassword || undefined
      });
      testSpinner.succeed(chalk.green('Authentication and connection successful!'));
      isConnected = true;

      // Update environment variables
      token = currentToken;
      email = currentEmail;
      password = currentPassword;
      process.env.HULY_URL = url;
      process.env.HULY_WORKSPACE = workspace;
      if (token) {
        process.env.HULY_TOKEN = token;
        delete process.env.HULY_EMAIL;
        delete process.env.HULY_PASSWORD;
      } else {
        process.env.HULY_EMAIL = email;
        process.env.HULY_PASSWORD = password;
        delete process.env.HULY_TOKEN;
      }

      // Save configuration to .env file for future runs
      saveToEnv(url, workspace, token, email, password);
      console.log(chalk.green('✓ Credentials successfully saved to .env file.\n'));
      await new Promise(r => setTimeout(r, 800));

      return { client, config: { url, workspace, auth: { token, email, password } } };
    } catch (err: any) {
      testSpinner.fail(chalk.red(`Failed to connect: ${err.message}`));
      
      const retryPrompt = await prompts({
        type: 'confirm',
        name: 'retry',
        message: 'Could not connect. Would you like to enter credentials again?',
        initial: true
      });

      if (retryPrompt.retry === undefined || !retryPrompt.retry) {
        console.log(chalk.cyan('\nSetup aborted. Goodbye!'));
        process.exit(0);
      }
    }
  }

  throw new Error('Unexpected state in config resolution.');
}

async function main() {
  console.clear();
  console.log(chalk.bold.cyan('====================================================='));
  console.log(chalk.bold.cyan('             HULY INTERACTIVE TERMINAL CLI           '));
  console.log(chalk.bold.cyan('====================================================='));

  // STEP 1: Load config with interactive prompts and connection ping validation
  const { client, config } = await resolveAndValidateConfig();

  // STEP 2: Fetch workspace metadata
  const spinner = ora({
    text: chalk.dim('Connection established. Fetching workspace metadata...'),
    color: 'cyan'
  }).start();

  let projects: any[] = [];
  let people: any[] = [];
  let milestones: any[] = [];
  const statusMap = new Map<string, string>();

  try {
    // Fetch projects (only tracker projects), members, milestones, and statuses
    projects = await client.findAll('tracker:class:Project', {});
    people = await client.findAll('contact:class:Person', {});
    milestones = await client.findAll('tracker:class:Milestone', {});
    const statuses = await client.findAll('tracker:class:IssueStatus', {});
    
    for (const status of statuses) {
      statusMap.set(status._id, status.name || status.label || 'Unknown');
    }
    
    spinner.succeed(chalk.green('Successfully authenticated and loaded workspace metadata.'));
    await new Promise(r => setTimeout(r, 800));
  } catch (err: any) {
    spinner.fail(chalk.red(`Failed to load workspace metadata: ${err.message}`));
    process.exit(1);
  }

  // Loop State Variables for filters
  let selectedProject: any = 'ANY';
  let selectedAssigneeId: any = 'ANY';
  let selectedMilestoneId: any = 'ANY';

  // Main UI Loop
  while (true) {
    console.clear();
    console.log(chalk.bold.cyan('====================================================='));
    console.log(chalk.bold.cyan('             HULY INTERACTIVE TERMINAL CLI           '));
    console.log(chalk.bold.cyan('====================================================='));

    // Print active filters state
    const projectName = selectedProject && selectedProject !== 'ANY' ? selectedProject.name : chalk.yellow('(Any Project)');
    
    let assigneeName = chalk.yellow('(Any Assignee)');
    if (selectedAssigneeId === 'tracker:ids:Unassigned') {
      assigneeName = chalk.yellow('(Unassigned)');
    } else if (selectedAssigneeId && selectedAssigneeId !== 'ANY') {
      const match = people.find(p => p._id === selectedAssigneeId);
      assigneeName = match ? (match.name || match.displayName) : selectedAssigneeId;
    }
    
    let milestoneName = chalk.yellow('(Any Milestone)');
    if (selectedMilestoneId === 'tracker:ids:NoMilestone') {
      milestoneName = chalk.yellow('(No Milestone)');
    } else if (selectedMilestoneId && selectedMilestoneId !== 'ANY') {
      const match = milestones.find(m => m._id === selectedMilestoneId);
      milestoneName = match ? (match.label || match.name) : selectedMilestoneId;
    }

    console.log(chalk.bold('Active Filters:'));
    console.log(`- Project:       ${chalk.cyan(projectName)}`);
    console.log(`- Assignee:      ${chalk.cyan(assigneeName)}`);
    console.log(`- Milestone:     ${chalk.cyan(milestoneName)}`);
    console.log(chalk.bold.cyan('-----------------------------------------------------'));

    const menuResponse = await prompts({
      type: 'select',
      name: 'action',
      message: 'Choose an action:',
      choices: [
        { title: '🔍 Query & Preview Issues', value: 'query' },
        { title: '📁 Select Project', value: 'change_project' },
        { title: '👤 Select Assignee', value: 'change_assignee' },
        { title: '📅 Select Milestone', value: 'change_milestone' },
        { title: '🔄 Reset All Filters', value: 'reset' },
        { title: '❌ Exit', value: 'exit' }
      ]
    });

    // Check for cancel / exit
    if (menuResponse.action === undefined || menuResponse.action === 'exit') {
      console.log(chalk.cyan('\nThank you for using Huly Terminal Dashboard. Goodbye!'));
      break;
    }

    // ACTION: Reset
    if (menuResponse.action === 'reset') {
      selectedProject = 'ANY';
      selectedAssigneeId = 'ANY';
      selectedMilestoneId = 'ANY';
      console.log(chalk.green('\n✓ All filters reset to defaults.'));
      await new Promise(r => setTimeout(r, 1000));
      continue;
    }

    // ACTION: Select Project
    if (menuResponse.action === 'change_project') {
      console.log(chalk.cyan('\n📁 Select Tracker Project'));
      const projectChoices = [
        { title: chalk.yellow('(Any Project)'), value: 'ANY' },
        ...projects.map(p => ({
          title: p.name,
          description: `Key: ${p.identifier || 'None'} | ID: ${p._id}`,
          value: p
        }))
      ];

      const projectResponse = await prompts({
        type: 'autocomplete',
        name: 'project',
        message: 'Select project (type to search):',
        choices: projectChoices,
        suggest: (input, choices) => 
          Promise.resolve(choices.filter(c => c.title.toLowerCase().includes(input.toLowerCase())))
      });

      if (projectResponse.project !== undefined) {
        selectedProject = projectResponse.project;
        
        // Reset milestone if it doesn't belong to the newly selected project space
        if (selectedProject !== 'ANY' && selectedMilestoneId !== 'ANY' && selectedMilestoneId !== 'tracker:ids:NoMilestone') {
          const match = milestones.find(m => m._id === selectedMilestoneId);
          if (match && match.space !== selectedProject._id) {
            selectedMilestoneId = 'ANY';
            console.log(chalk.yellow('\nℹ Milestone reset because it does not belong to the selected project.'));
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
      continue;
    }

    // ACTION: Select Assignee
    if (menuResponse.action === 'change_assignee') {
      console.log(chalk.cyan('\n👤 Select Assignee'));
      const assigneeChoices = [
        { title: chalk.yellow('(Any Assignee)'), value: 'ANY' },
        { title: chalk.yellow('(Unassigned)'), value: 'tracker:ids:Unassigned' },
        ...people.map(p => {
          const displayName = p.name || p.displayName || `${p.firstName || ''} ${p.lastName || ''}`.trim();
          return {
            title: displayName,
            description: `ID: ${p._id}`,
            value: p._id
          };
        })
      ];

      const assigneeResponse = await prompts({
        type: 'autocomplete',
        name: 'assignee',
        message: 'Select assignee (type to search):',
        choices: assigneeChoices,
        suggest: (input, choices) =>
          Promise.resolve(choices.filter(c => c.title.toLowerCase().includes(input.toLowerCase())))
      });

      if (assigneeResponse.assignee !== undefined) {
        selectedAssigneeId = assigneeResponse.assignee;
      }
      continue;
    }

    // ACTION: Select Milestone
    if (menuResponse.action === 'change_milestone') {
      console.log(chalk.cyan('\n📅 Select Milestone'));
      
      // Filter milestones to show only those belonging to the selected project
      const filteredMilestones = milestones.filter(m => 
        selectedProject === 'ANY' || !selectedProject || m.space === selectedProject._id
      );

      const milestoneChoices = [
        { title: chalk.yellow('(Any Milestone)'), value: 'ANY' },
        { title: chalk.yellow('(No Milestone)'), value: 'tracker:ids:NoMilestone' },
        ...filteredMilestones.map(m => ({
          title: m.label || m.name || 'Unknown',
          description: `Target: ${m.targetDate ? new Date(parseInt(m.targetDate)).toLocaleDateString() : 'No date'}`,
          value: m._id
        }))
      ];

      const milestoneResponse = await prompts({
        type: 'autocomplete',
        name: 'milestone',
        message: 'Select milestone (type to search):',
        choices: milestoneChoices,
        suggest: (input, choices) =>
          Promise.resolve(choices.filter(c => c.title.toLowerCase().includes(input.toLowerCase())))
      });

      if (milestoneResponse.milestone !== undefined) {
        selectedMilestoneId = milestoneResponse.milestone;
      }
      continue;
    }

    // ACTION: Query
    if (menuResponse.action === 'query') {
      console.log(chalk.cyan('\nQuerying Huly database...'));
      const fetchSpinner = ora({
        text: chalk.dim('Fetching issues matching filters...'),
        color: 'cyan'
      }).start();

      const query: any = {};
      if (selectedProject && selectedProject !== 'ANY') query.space = selectedProject._id;
      if (selectedAssigneeId && selectedAssigneeId !== 'ANY') query.assignee = selectedAssigneeId;
      if (selectedMilestoneId && selectedMilestoneId !== 'ANY') query.milestone = selectedMilestoneId;

      let issues: any[] = [];
      try {
        issues = await client.findAll('tracker:class:Issue', query);
        fetchSpinner.succeed(chalk.green(`Fetched ${issues.length} matching issue(s).`));
      } catch (err: any) {
        fetchSpinner.fail(chalk.red(`Failed to fetch issues: ${err.message}`));
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (issues.length === 0) {
        console.log(chalk.yellow('\nNo matching issues found.'));
        await askQuestionToContinue();
        continue;
      }

      // Show Issues in table
      const table = new Table({
        head: [
          chalk.bold.cyan('ID'),
          chalk.bold.cyan('Title'),
          chalk.bold.cyan('Priority'),
          chalk.bold.cyan('Status'),
          chalk.bold.cyan('Assignee')
        ],
        colWidths: [12, 45, 10, 18, 18],
        wordWrap: true
      });

      issues.forEach(issue => {
        const statusLabel = statusMap.get(issue.status) || issue.status || 'Unknown';
        const assigneeLabel = people.find(p => p._id === issue.assignee)?.name || 'Unassigned';
        
        const priorityLabel = translatePriority(issue.priority);
        let priorityStr = priorityLabel;
        if (priorityLabel === 'Urgent') {
          priorityStr = chalk.red('Urgent');
        } else if (priorityLabel === 'High') {
          priorityStr = chalk.yellow('High');
        } else if (priorityLabel === 'Medium') {
          priorityStr = chalk.blue('Medium');
        } else {
          priorityStr = chalk.dim('Low');
        }

        table.push([
          issue.identifier || issue._id.substring(0, 8),
          issue.title,
          priorityStr,
          statusLabel,
          assigneeLabel
        ]);
      });

      console.log('\n' + table.toString());

      // Ask to Export
      const csvExportPrompt = await prompts({
        type: 'confirm',
        name: 'export',
        message: 'Would you like to export these issues to a CSV file?',
        initial: true
      });

      if (csvExportPrompt.export) {
        // Select Export Format
        const formatPrompt = await prompts({
          type: 'select',
          name: 'format',
          message: 'Select CSV format:',
          choices: [
            { title: '📊 Project Planning Format (Hierarchical tasks + Day 1-31 Gantt timeline)', value: 'planning' },
            { title: '📋 Standard List Format (Flat list, basic columns)', value: 'standard' }
          ]
        });

        if (formatPrompt.format === undefined) {
          continue;
        }

        const defaultFilename = formatPrompt.format === 'planning' 
          ? `huly_planning_export_${Date.now()}.csv` 
          : `huly_export_${Date.now()}.csv`;

        const filenamePrompt = await prompts({
          type: 'text',
          name: 'filename',
          message: 'Enter output filename:',
          initial: defaultFilename
        });

        const filename = filenamePrompt.filename?.trim() || defaultFilename;
        let csvContent = '';

        const escape = (val: any) => {
          let str = String(val ?? '').trim();
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };

        if (formatPrompt.format === 'planning') {
          // --- PROJECT PLANNING EXPORT ---
          // Resolve milestone target month/year for Gantt columns 1-31
          let targetYear = new Date().getFullYear();
          let targetMonth = new Date().getMonth();
          
          if (selectedMilestoneId && selectedMilestoneId !== 'ANY') {
            const milestone = milestones.find(m => m._id === selectedMilestoneId);
            if (milestone?.targetDate) {
              const mDate = new Date(parseInt(milestone.targetDate));
              targetYear = mDate.getFullYear();
              targetMonth = mDate.getMonth();
            }
          }

          // Build issue parent-child map for tree layout
          const issueMap = new Map<string, any>();
          issues.forEach(i => issueMap.set(i._id, i));

          const roots: any[] = [];
          const childrenMap = new Map<string, any[]>();

          issues.forEach(issue => {
            const parentId = issue.attachedTo && issue.attachedTo !== 'tracker:ids:NoParent' ? issue.attachedTo : null;
            if (parentId && issueMap.has(parentId)) {
              if (!childrenMap.has(parentId)) {
                childrenMap.set(parentId, []);
              }
              childrenMap.get(parentId)!.push(issue);
            } else {
              roots.push(issue);
            }
          });

          // Sort roots & children by identifier
          const sortIssues = (arr: any[]) => arr.sort((a, b) => (a.identifier || '').localeCompare(b.identifier || ''));
          sortIssues(roots);
          childrenMap.forEach(v => sortIssues(v));

          // Flatten tree structure to maintain indentation
          const flattened: { issue: any; level: number; parentId: string }[] = [];
          function flatten(issue: any, level: number, pId: string) {
            flattened.push({ issue, level, parentId: pId });
            const children = childrenMap.get(issue._id) || [];
            children.forEach(child => flatten(child, level + 1, issue.identifier || issue._id));
          }
          roots.forEach(root => flatten(root, 0, ''));

          // Prepare CSV headers
          const dayHeaders = Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`);
          const csvHeaders = [
            'Level',
            'Identifier',
            'Parent ID',
            'Title',
            'Priority',
            'Status',
            'Assignee',
            'Milestone',
            'Is Done',
            'Estimation (Hours)',
            'Remaining (Hours)',
            'Reported (Hours)',
            'Created Date',
            'Due Date',
            'Start Date',
            'End Date',
            'Huly Link',
            ...dayHeaders
          ];

          const csvRows = flattened.map(({ issue, level, parentId }) => {
            const statusLabel = statusMap.get(issue.status) || issue.status || 'Unknown';
            const assigneeLabel = people.find(p => p._id === issue.assignee)?.name || 'Unassigned';
            const milestoneLabel = milestones.find(m => m._id === issue.milestone)?.label || 'None';
            const hulyLink = `${config.url}/workbench/${config.workspace}/tracker/issue/${issue.identifier || issue._id}`;

            const createdDateStr = issue.createdOn ? new Date(issue.createdOn).toISOString() : '';
            const dueDateStr = issue.dueDate ? new Date(issue.dueDate).toISOString() : '';
            
            // Resolve custom date fields: Start Date & End Date
            // custom6a02f6ea53726adb2f266836 maps to Start Date, custom6a1124fba3f809a2ee63da08 maps to End Date
            const startDateStr = issue.custom6a02f6ea53726adb2f266836 
              ? new Date(issue.custom6a02f6ea53726adb2f266836).toISOString() 
              : '';
            const endDateStr = issue.custom6a1124fba3f809a2ee63da08 
              ? new Date(issue.custom6a1124fba3f809a2ee63da08).toISOString() 
              : '';

            // Title indentation to visually reflect hierarchy
            const indentPrefix = level > 0 ? '  '.repeat(level) + '↳ ' : '';
            const titleField = indentPrefix + issue.title;

            // Translate Priority (Urgent/High/Medium/Low)
            const priorityText = translatePriority(issue.priority);

            // Generate Day 1-31 Gantt cell values prioritizing custom startDate and endDate fields
            const startVal = issue.custom6a02f6ea53726adb2f266836 || issue.createdOn;
            const start = startVal ? new Date(startVal) : null;
            
            const endVal = issue.custom6a1124fba3f809a2ee63da08 || issue.dueDate;
            const end = endVal 
              ? new Date(endVal) 
              : (start ? new Date(start.getTime() + 5 * 24 * 60 * 60 * 1000) : null);

            const dayCells = Array.from({ length: 31 }, (_, dayIdx) => {
              const currentDay = dayIdx + 1;
              if (!start || !end) return '';
              
              const dayDate = new Date(targetYear, targetMonth, currentDay);
              const compStart = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
              const compEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
              const compDay = dayDate.getTime();

              return (compDay >= compStart && compDay <= compEnd) ? '█' : '';
            });

            return [
              level,
              escape(issue.identifier),
              escape(parentId),
              escape(titleField),
              escape(priorityText),
              escape(statusLabel),
              escape(assigneeLabel),
              escape(milestoneLabel),
              escape(issue.isDone),
              escape(issue.estimation),
              escape(issue.remainingTime),
              escape(issue.reportedTime),
              escape(createdDateStr),
              escape(dueDateStr),
              escape(startDateStr),
              escape(endDateStr),
              escape(hulyLink),
              ...dayCells
            ].join(',');
          });

          csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        } else {
          // --- STANDARD LIST EXPORT ---
          const csvHeaders = [
            'Identifier',
            'Title',
            'Priority',
            'Status',
            'Assignee',
            'Milestone',
            'Is Done',
            'Start Date',
            'End Date',
            'Huly Link'
          ];
          const csvRows = issues.map(issue => {
            const statusLabel = statusMap.get(issue.status) || issue.status || 'Unknown';
            const assigneeLabel = people.find(p => p._id === issue.assignee)?.name || 'Unassigned';
            const milestoneLabel = milestones.find(m => m._id === issue.milestone)?.label || 'None';
            const hulyLink = `${config.url}/workbench/${config.workspace}/tracker/issue/${issue.identifier || issue._id}`;

            // Translate Priority (Urgent/High/Medium/Low)
            const priorityText = translatePriority(issue.priority);

            // Resolve custom date fields: Start Date & End Date
            const startDateStr = issue.custom6a02f6ea53726adb2f266836 
              ? new Date(issue.custom6a02f6ea53726adb2f266836).toISOString() 
              : '';
            const endDateStr = issue.custom6a1124fba3f809a2ee63da08 
              ? new Date(issue.custom6a1124fba3f809a2ee63da08).toISOString() 
              : '';

            return [
              escape(issue.identifier),
              escape(issue.title),
              escape(priorityText),
              escape(statusLabel),
              escape(assigneeLabel),
              escape(milestoneLabel),
              escape(issue.isDone),
              escape(startDateStr),
              escape(endDateStr),
              escape(hulyLink)
            ].join(',');
          });

          csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        }

        const outputPath = path.join(process.cwd(), filename);

        try {
          fs.writeFileSync(outputPath, csvContent, 'utf8');
          console.log(chalk.bold.green(`\n✓ CSV exported successfully to: ${outputPath}`));
        } catch (err: any) {
          console.error(chalk.red(`Failed to write CSV: ${err.message}`));
        }
      }

      await askQuestionToContinue();
    }
  }
}

// Simple prompt helper to pause execution before returning to main menu
async function askQuestionToContinue() {
  await prompts({
    type: 'text',
    name: 'continue',
    message: chalk.dim('Press Enter key to return to main menu...')
  });
}

main().catch((err) => {
  console.error(chalk.red('Unhandled CLI error:'), err);
});
