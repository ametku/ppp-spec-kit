#!/usr/bin/env node

/**
 * create-jira-ticket.js
 *
 * Standalone Node.js script to create a Jira issue via the REST API v3.
 *
 * Prerequisites:
 *   - Node.js >= 14 (uses built-in `https` module — no npm install required)
 *   - A Jira Cloud account with an API token
 *     (generate at: https://id.atlassian.com/manage-profile/security/api-tokens)
 *
 * CLI Flags:
 *   --title       (string, required)  Issue summary / title
 *   --description (string, optional)  Issue description in plain text; defaults to ""
 *                                     Omitted from the request body when empty.
 *   --project     (string, required)  Jira project key, e.g. "PLAT"
 *   --type        (string, optional)  Issue type name; defaults to "Story"
 *   --url         (string, required)  Jira base URL, e.g. "https://new-relic.atlassian.net"
 *   --username    (string, required)  Jira account email / username
 *   --token       (string, required)  Jira API token
 *   --team        (string, optional)  Team ID (UUID) for customfield_10001; find it on the parent issue's Team field
 *   --milestone   (string, optional)  Milestone ID (e.g. "M2-core-impl") for customfield_15348
 *   --parent      (string, optional)  Parent Feature issue key, e.g. "NR-510278"
 *
 * Example invocation:
 *   node scripts/create-jira-ticket.js \
 *     --title "Investigate memory leak in ingest service" \
 *     --description "Heap grows unbounded after ~2 hours of traffic." \
 *     --project PLAT \
 *     --type Story \
 *     --url https://new-relic.atlassian.net \
 *     --username user@example.com \
 *     --token YOUR_API_TOKEN \
 *     --parent NR-510278
 *
 * Output (stdout):
 *   PLAT-123 https://new-relic.atlassian.net/browse/PLAT-123
 *
 * Exit codes:
 *   0  — ticket created successfully
 *   1  — missing required argument or API error
 */

'use strict';

const https = require('https');
const url = require('url');

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      args[key] = value;
    }
  }
  return args;
}

const args = parseArgs(process.argv);

// ---------------------------------------------------------------------------
// Validate required arguments
// ---------------------------------------------------------------------------

const required = ['title', 'project', 'url', 'username', 'token'];
const missing = required.filter(k => !args[k]);

if (missing.length > 0) {
  process.stderr.write(
    `Error: missing required argument(s): ${missing.map(k => `--${k}`).join(', ')}\n\n` +
    'Usage:\n' +
    '  node scripts/create-jira-ticket.js \\\n' +
    '    --title "Issue summary" \\\n' +
    '    --project PROJECT_KEY \\\n' +
    '    --url https://your-domain.atlassian.net \\\n' +
    '    --username user@example.com \\\n' +
    '    --token YOUR_API_TOKEN \\\n' +
    '    [--description "Optional description"] \\\n' +
    '    [--type Story] \\\n' +
    '    [--team TEAM_UUID] \\\n' +
    '    [--parent NR-510278]\n'
  );
  process.exit(1);
}

const {
  title,
  description = '',
  project,
  type: issueType = 'Story',
  url: jiraBaseUrl,
  username,
  token,
  team,
  milestone,
  parent,
} = args;

// ---------------------------------------------------------------------------
// Build request body
// ---------------------------------------------------------------------------

const fields = {
  project: { key: project },
  summary: title,
  issuetype: { name: issueType },
  ...(team ? { customfield_10001: team } : {}),
  ...(milestone ? { customfield_15348: milestone } : {}),
  ...(parent ? { parent: { key: parent } } : {}),
};

if (description) {
  fields.description = {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: description,
          },
        ],
      },
    ],
  };
}

const requestBody = JSON.stringify({ fields });

// ---------------------------------------------------------------------------
// Make the API request
// ---------------------------------------------------------------------------

const auth = Buffer.from(`${username}:${token}`).toString('base64');
const parsedUrl = url.parse(`${jiraBaseUrl.replace(/\/$/, '')}/rest/api/3/issue`);

const options = {
  hostname: parsedUrl.hostname,
  port: parsedUrl.port || 443,
  path: parsedUrl.path,
  method: 'POST',
  headers: {
    'Authorization': `Basic ${auth}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(requestBody),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    if (res.statusCode === 201) {
      let parsed;
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        process.stderr.write(`Error: failed to parse API response: ${e.message}\n`);
        process.exit(1);
      }
      const issueKey = parsed.key;
      const browseUrl = `${jiraBaseUrl.replace(/\/$/, '')}/browse/${issueKey}`;
      process.stdout.write(`${issueKey} ${browseUrl}\n`);
    } else {
      let errorDetail = data;
      try {
        const parsed = JSON.parse(data);
        if (parsed.errorMessages && parsed.errorMessages.length > 0) {
          errorDetail = parsed.errorMessages.join('; ');
        } else if (parsed.errors && Object.keys(parsed.errors).length > 0) {
          errorDetail = Object.entries(parsed.errors)
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ');
        }
      } catch (_) {
        // keep raw data as error detail
      }
      process.stderr.write(`Error: Jira API returned HTTP ${res.statusCode}: ${errorDetail}\n`);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  process.stderr.write(`Error: network request failed: ${err.message}\n`);
  process.exit(1);
});

req.write(requestBody);
req.end();
