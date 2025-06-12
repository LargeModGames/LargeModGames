// src/github.js
// TODO: Octokit helper to fetch /move comments
import { Octokit } from '@octokit/rest';

// configure Octokit with GitHub token
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// derive owner/repo from environment
const [owner, repo] = (process.env.GITHUB_REPOSITORY || '').split('/');

/**
 * Fetches `/move [UDLR]` comments since a given timestamp.
 * @param {string} sinceTimestamp ISO timestamp
 * @returns {Promise<Array<{username: string, dir: string, timestamp: string}>>}
 */
export async function getNewMoves(sinceTimestamp) {
  // list comments since the given time
  const res = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: 1,
    since: sinceTimestamp,
    per_page: 100
  });
  const comments = res.data;
  // TODO: handle pagination if more than 100 comments
  const moves = comments
    .filter(c => /^\/move [UDLR]$/.test(c.body.trim()))
    .map(c => ({
      username: c.user.login,
      dir: c.body.trim().split(' ')[1],
      timestamp: c.created_at
    }))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  return moves;
}
