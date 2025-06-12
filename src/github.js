// src/github.js
// TODO: Octokit helper to fetch /move comments
import { Octokit } from '@octokit/rest';

const octokit = new Octokit();

/**
 * Fetches comments with `/move` instructions from the issue or PR.
 * @param {Object} params - { owner, repo, issue_number }
 * @returns {Promise<Array<{user: string, move: string}>>}
 */
export async function fetchMoves({ owner, repo, issue_number }) {
  // TODO: implement fetching comments
  throw new Error("fetchMoves() not implemented");
}
