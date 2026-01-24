#!/usr/bin/env node

/**
 * Jira DEMO Project Integration Setup
 *
 * This script helps set up the connection between your Visual Flow Builder
 * and your Jira DEMO project for automated issue processing.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupJiraIntegration() {
  console.log('🔧 ACCOS Visual Flow Builder - Jira DEMO Integration Setup\n');

  console.log('This will help you connect the Visual Flow Builder to your Jira DEMO project.\n');

  // Get Jira configuration
  const jiraUrl = await askQuestion('Enter your Jira URL (e.g., https://your-org.atlassian.net): ');
  const userEmail = await askQuestion('Enter your Jira email: ');
  const apiToken = await askQuestion('Enter your Jira API token: ');

  // Validate DEMO project
  console.log('\n📋 Checking DEMO project access...');

  try {
    const auth = Buffer.from(`${userEmail}:${apiToken}`).toString('base64');
    const response = await fetch(`${jiraUrl}/rest/api/3/project/DEMO`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const project = await response.json();
      console.log(`✅ Successfully connected to project: ${project.name}`);
      console.log(`   Key: ${project.key}`);
      console.log(`   Type: ${project.projectTypeKey}`);
    } else {
      console.log(`❌ Could not access DEMO project. Status: ${response.status}`);
      console.log('   Please check your credentials and project access.');
      rl.close();
      return;
    }
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    console.log('   Please check your Jira URL and network connection.');
    rl.close();
    return;
  }

  // Create environment configuration
  console.log('\n🔨 Creating configuration files...');

  const envConfig = `# Jira Integration Configuration for ACCOS Visual Flow Builder
JIRA_BASE_URL=${jiraUrl}
JIRA_USER_EMAIL=${userEmail}
JIRA_API_TOKEN=${apiToken}
JIRA_PROJECT_KEY=DEMO

# Local Development Configuration
LOCAL_WORKSPACE=C:\\Users\\MarkusAhling\\pro\\alpha-0.1\\claude
GIT_DEFAULT_BRANCH=main

# Notification Configuration
SLACK_WEBHOOK_URL=your-slack-webhook-url-here
SLACK_CHANNEL=#dev-updates
`;

  fs.writeFileSync('.env.jira', envConfig);
  console.log('✅ Created .env.jira configuration file');

  // Create Jira workflow configuration
  const workflowConfig = {
    jira: {
      baseUrl: jiraUrl,
      project: 'DEMO',
      email: userEmail,
      apiToken: '${JIRA_API_TOKEN}', // Reference to env var
      webhook: {
        events: ['jira:issue_created', 'jira:issue_updated'],
        filters: {
          projects: ['DEMO'],
          issueTypes: ['Task', 'Bug', 'Story'],
          statusCategories: ['To Do', 'In Progress']
        }
      }
    },
    local: {
      workspace: 'C:\\Users\\MarkusAhling\\pro\\alpha-0.1\\claude',
      gitBranch: 'main',
      testCommand: 'npm test',
      buildCommand: 'npm run build'
    },
    notifications: {
      slack: {
        webhook: '${SLACK_WEBHOOK_URL}',
        channel: '#dev-updates'
      },
      jira: {
        commentOnCompletion: true,
        transitionOnSuccess: 'In Review'
      }
    }
  };

  fs.writeFileSync('jira-workflow-config.json', JSON.stringify(workflowConfig, null, 2));
  console.log('✅ Created jira-workflow-config.json');

  // Create usage instructions
  const instructions = `# Using Your Jira DEMO Integration

## Quick Start

1. **Start Visual Flow Builder**: Open http://localhost:3002/
2. **Load Template**: Click "Templates" → "Jira DEMO to Local Development"
3. **Configure Workflow**: Your template is pre-configured for DEMO project

## How It Works

### Trigger Phase
- Monitors DEMO project for new issues or status changes
- Filters for: Tasks, Bugs, Stories in "To Do" or "In Progress" status

### Development Phase
- Analyzes Jira issue requirements automatically
- Creates local git branch: \`DEMO-123-fix-user-login\`
- Sets up development environment in: \`${workflowConfig.local.workspace}\`

### Validation Phase
- Runs tests: \`${workflowConfig.local.testCommand}\`
- Runs build: \`${workflowConfig.local.buildCommand}\`
- Quality gates: 80% test coverage, no lint errors

### Integration Phase
- Updates Jira issue with development progress
- Creates pull request with automatic Jira linking
- Transitions issue to "In Review" status

## Manual Testing

To test your Jira connection:

\`\`\`bash
# Test API access
curl -H "Authorization: Basic $(echo -n '${userEmail}:YOUR_API_TOKEN' | base64)" \\
     "${jiraUrl}/rest/api/3/project/DEMO"

# List DEMO project issues
curl -H "Authorization: Basic $(echo -n '${userEmail}:YOUR_API_TOKEN' | base64)" \\
     "${jiraUrl}/rest/api/3/search?jql=project=DEMO"
\`\`\`

## Configuration Files

- **.env.jira**: Environment variables (keep secure)
- **jira-workflow-config.json**: Workflow configuration
- **src/workflows/jira-dev-workflow-template.json**: Template definition

## Security Notes

⚠️  **IMPORTANT**:
- Never commit .env.jira to version control
- Store API token securely
- Use project-specific tokens with minimal permissions

## Next Steps

1. Test the connection using the curl commands above
2. Create a test issue in DEMO project
3. Use Visual Flow Builder to process it
4. Monitor the workflow execution in real-time

## Troubleshooting

### Common Issues:

**"Could not access DEMO project"**
- Check API token permissions
- Verify project key is exactly "DEMO"
- Ensure user has access to project

**"Workflow not triggering"**
- Verify webhook configuration
- Check issue status matches filters
- Review Visual Flow Builder logs

**"Git branch creation fails"**
- Check local workspace path
- Verify git repository is initialized
- Ensure proper git credentials

For more help, see the Visual Flow Builder User Guide.
`;

  fs.writeFileSync('JIRA_INTEGRATION_GUIDE.md', instructions);
  console.log('✅ Created JIRA_INTEGRATION_GUIDE.md');

  console.log('\n🎉 Setup Complete!');
  console.log('\nNext Steps:');
  console.log('1. Review JIRA_INTEGRATION_GUIDE.md for usage instructions');
  console.log('2. Test your connection using the curl commands in the guide');
  console.log('3. Open Visual Flow Builder: http://localhost:3002/');
  console.log('4. Click "Templates" and load "Jira DEMO to Local Development"');
  console.log('5. Create a test issue in your DEMO project to see it in action!');

  rl.close();
}

// Handle errors gracefully
process.on('uncaughtException', (error) => {
  console.error('\n❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});

// Run setup
setupJiraIntegration().catch(console.error);