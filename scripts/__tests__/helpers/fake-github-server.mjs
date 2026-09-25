/**
 * fake-github-server.mjs — in-process fake GitHub API for bot integration
 * tests. Implements exactly the surface the repo's bots touch:
 *
 *   GET/POST /repos/:owner/:repo/issues/:n/comments    list + create comments
 *   PATCH    /comments/:id                             update comment
 *   GET      /search/issues                            issue search (marker match)
 *   GET/POST /repos/:owner/:repo/issues                (unused GET) / create issue
 *   GET/PATCH /repos/:owner/:repo/issues/:n            read / update issue (body, state)
 *   GET      /repos/.../actions/workflows/:file/runs   workflow runs
 *   GET      /repos/.../actions/runs/:id/artifacts     run artifacts
 *   GET      /repos/.../actions/artifacts/:id/zip      artifact zip download
 *   GET      /repos/.../pulls?state=open               open PR list (ci-dark)
 *   GET      /repos/.../actions/runs?head_sha=…        runs for a sha (ci-dark)
 *   GET      /repos/.../actions/runs/:id/jobs          jobs+steps (ci-dark)
 *   GET      /repos/.../check-runs/:id/annotations     job annotations (ci-dark)
 *   PATCH    /repos/.../issues/comments/:id            comment update (ci-dark)
 *
 * Every request is recorded (method, url, auth, body) so tests can assert
 * auth identities and call ordering. Issue/comment URLs point back at THIS
 * server — bots PATCH the `url` field verbatim, like the real API contract.
 *
 * Used by: post-drift-pr-comment.integration.test.mjs,
 *          update-drift-tracking-issue.integration.test.mjs
 */

import http from 'node:http';

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function json(res, obj, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(obj));
}

/**
 * Start the fake API. Options:
 *   comments  — seeded PR comments [{id, url?, body}]
 *   issues    — seeded issues [{number, title, body, state?}]
 *   runs      — [{id}] nightly workflow runs
 *   artifacts — { [runId]: [{id, name, zip: Buffer}] }
 *   pullRequests — [{number, headSha}] open PRs (ci-dark watchdog)
 *   headRuns  — { [sha]: [{id, name, conclusion, createdAt, updatedAt,
 *               jobs: [{name, conclusion, steps: [conclusion], annotations: [msg]}]}] }
 *               runs for a head sha (ci-dark watchdog); job ids are derived
 *               deterministically (runId*100 + index) and annotations resolve
 *               through /check-runs/:id/annotations
 *   behavior  — forced statuses: { listCommentsStatus, runsStatus,
 *               searchIssuesStatus, createIssueStatus, getIssueStatus,
 *               updateIssueStatus, addIssueCommentStatus }
 */
export async function startFakeGitHub({
  comments = [],
  issues = [],
  runs = [],
  artifacts = {},
  pullRequests = [],
  headRuns = {},
  behavior = {},
} = {}) {
  const state = {
    comments: comments.map((c) => ({ ...c })),
    issues: issues.map((i, idx) => ({
      id: 500 + idx,
      number: i.number ?? idx + 1,
      title: i.title ?? '',
      body: i.body ?? '',
      state: i.state ?? 'open',
      labels: i.labels ?? [],
      html_url: '',
      url: '',
      comments_url: '',
    })),
    nextCommentId: 1000,
    nextIssueNumber: issues.length + 1,
    requests: [],
  };

  // ── ci-dark fixtures: derive REST-shaped stores ─────────────────────────
  const state2 = state; // alias for clarity below
  state2.pullRequests = pullRequests.map((p) => ({ number: p.number, head: { sha: p.headSha } }));
  state2.runsBySha = {};
  state2.jobsByRunId = {};
  state2.annotationsByJobId = {};
  for (const [sha, runList] of Object.entries(headRuns)) {
    state2.runsBySha[sha] = runList.map((r) => {
      state2.jobsByRunId[r.id] = (r.jobs ?? []).map((j, i) => ({
        id: r.id * 100 + i,
        name: j.name,
        conclusion: j.conclusion,
        steps: (j.steps ?? []).map((conclusion) => ({ conclusion })),
      }));
      (r.jobs ?? []).forEach((j, i) => {
        state2.annotationsByJobId[r.id * 100 + i] = j.annotations ?? [];
      });
      return {
        id: r.id,
        name: r.name,
        html_url: `${'http://x'}/actions/runs/${r.id}`,
        head_sha: sha,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
        conclusion: r.conclusion,
      };
    });
  }

  const server = http.createServer(async (req, res) => {
    const body = await readBody(req);
    state.requests.push({
      method: req.method,
      url: req.url,
      auth: req.headers.authorization ?? null,
      body,
    });
    const p = new URL(req.url, 'http://x').pathname;
    const base = `http://127.0.0.1:${server.address().port}`;

    // ── PR/issue comments ──────────────────────────────────────────────
    const mComments = /^\/repos\/[^/]+\/[^/]+\/issues\/(\d+)\/comments$/.exec(p);
    if (mComments) {
      if (behavior.listCommentsStatus && req.method === 'GET') {
        res.writeHead(behavior.listCommentsStatus);
        res.end('boom');
        return;
      }
      if (behavior.addIssueCommentStatus && req.method === 'POST') {
        res.writeHead(behavior.addIssueCommentStatus);
        res.end('boom');
        return;
      }
      if (req.method === 'GET') return json(res, state.comments);
      if (req.method === 'POST') {
        const { body: commentBody } = JSON.parse(body);
        const id = state.nextCommentId++;
        const created = { id, url: `${base}/comments/${id}`, body: commentBody };
        state.comments.push(created);
        return json(res, created, 201);
      }
    }

    const mComment = /^\/comments\/(\d+)$/.exec(p);
    if (mComment && req.method === 'PATCH') {
      const { body: commentBody } = JSON.parse(body);
      const existing = state.comments.find((c) => String(c.id) === mComment[1]);
      if (!existing) {
        res.writeHead(404);
        res.end();
        return;
      }
      existing.body = commentBody;
      return json(res, existing);
    }

    const mRepoComment = /\/issues\/comments\/(\d+)$/.exec(p);
    if (mRepoComment && req.method === 'PATCH') {
      const { body: commentBody } = JSON.parse(body);
      const existing = state.comments.find((c) => String(c.id) === mRepoComment[1]);
      if (!existing) {
        res.writeHead(404);
        res.end();
        return;
      }
      existing.body = commentBody;
      return json(res, existing);
    }

    // ── ci-dark watchdog endpoints ──────────────────────────────────────
    if (/\/repos\/[^/]+\/[^/]+\/pulls$/.test(p) && req.method === 'GET') {
      return json(res, state.pullRequests ?? []);
    }
    if (/\/repos\/[^/]+\/[^/]+\/actions\/runs$/.test(p) && req.method === 'GET') {
      const sha = new URL(req.url, 'http://x').searchParams.get('head_sha');
      const list = (sha && state.runsBySha?.[sha]) ?? [];
      return json(res, { total_count: list.length, workflow_runs: list });
    }
    const mJobs = /\/repos\/[^/]+\/[^/]+\/actions\/runs\/(\d+)\/jobs$/.exec(p);
    if (mJobs && req.method === 'GET') {
      return json(res, {
        total_count: (state.jobsByRunId?.[mJobs[1]] ?? []).length,
        jobs: state.jobsByRunId?.[mJobs[1]] ?? [],
      });
    }
    const mAnnot = /\/repos\/[^/]+\/[^/]+\/check-runs\/(\d+)\/annotations$/.exec(p);
    if (mAnnot && req.method === 'GET') {
      return json(
        res,
        (state.annotationsByJobId?.[mAnnot[1]] ?? []).map((message) => ({ message }))
      );
    }

    // ── Issues ─────────────────────────────────────────────────────────
    if (p === '/search/issues' && req.method === 'GET') {
      if (behavior.searchIssuesStatus) {
        res.writeHead(behavior.searchIssuesStatus);
        res.end('boom');
        return;
      }
      const q = new URL(req.url, 'http://x').searchParams.get('q') ?? '';
      // The bots search for a quoted phrase (the HTML marker); match issues
      // whose body or title contains it (GitHub phrase-search semantics).
      const needle = /"([^"]+)"/.exec(q)?.[1] ?? '';
      const items = state.issues.filter((i) => i.body.includes(needle) || i.title.includes(needle));
      return json(res, { total_count: items.length, incomplete_results: false, items });
    }

    const mIssuesCollection = /^\/repos\/[^/]+\/[^/]+\/issues$/.exec(p);
    if (mIssuesCollection && req.method === 'POST') {
      if (behavior.createIssueStatus) {
        res.writeHead(behavior.createIssueStatus);
        res.end('boom');
        return;
      }
      const payload = JSON.parse(body);
      const number = state.nextIssueNumber++;
      const created = {
        id: 500 + number,
        number,
        title: payload.title ?? '',
        body: payload.body ?? '',
        state: 'open',
        labels: payload.labels ?? [],
        html_url: `${base}/issues/${number}`,
        url: `${base}/repos/acme/repo/issues/${number}`,
        comments_url: `${base}/repos/acme/repo/issues/${number}/comments`,
      };
      state.issues.push(created);
      return json(res, created, 201);
    }

    const mIssue = /^\/repos\/[^/]+\/[^/]+\/issues\/(\d+)$/.exec(p);
    if (mIssue) {
      const issue = state.issues.find((i) => String(i.number) === mIssue[1]);
      if (req.method === 'GET') {
        if (behavior.getIssueStatus) {
          res.writeHead(behavior.getIssueStatus);
          res.end('boom');
          return;
        }
        if (!issue) {
          res.writeHead(404);
          res.end('not found');
          return;
        }
        return json(res, issue);
      }
      if (req.method === 'PATCH') {
        if (behavior.updateIssueStatus) {
          res.writeHead(behavior.updateIssueStatus);
          res.end('boom');
          return;
        }
        if (!issue) {
          res.writeHead(404);
          res.end('not found');
          return;
        }
        const payload = JSON.parse(body);
        if (payload.title !== undefined) issue.title = payload.title;
        if (payload.body !== undefined) issue.body = payload.body;
        if (payload.state !== undefined) issue.state = payload.state;
        if (payload.labels !== undefined) issue.labels = payload.labels;
        return json(res, issue);
      }
    }

    // ── Actions: nightly runs / artifacts / zips ───────────────────────
    if (/^\/repos\/[^/]+\/[^/]+\/actions\/workflows\/schema-lock-nightly\.yml\/runs$/.test(p)) {
      if (behavior.runsStatus) {
        res.writeHead(behavior.runsStatus);
        res.end('boom');
        return;
      }
      return json(res, {
        total_count: runs.length,
        workflow_runs: runs.map((r) => ({
          id: r.id,
          html_url: `${base}/actions/runs/${r.id}`,
          head_sha: 'a'.repeat(40),
          created_at: '2026-09-11T04:30:00Z',
        })),
      });
    }

    const mArtifacts = /^\/repos\/[^/]+\/[^/]+\/actions\/runs\/(\d+)\/artifacts$/.exec(p);
    if (mArtifacts) {
      const list = artifacts[mArtifacts[1]] ?? [];
      return json(res, {
        total_count: list.length,
        artifacts: list.map((a) => ({ id: a.id, name: a.name })),
      });
    }

    const mZip = /^\/repos\/[^/]+\/[^/]+\/actions\/artifacts\/(\d+)\/zip$/.exec(p);
    if (mZip) {
      const found = Object.values(artifacts)
        .flat()
        .find((a) => String(a.id) === mZip[1]);
      if (!found?.zip) {
        res.writeHead(404);
        res.end('no artifact');
        return;
      }
      res.writeHead(200, { 'content-type': 'application/zip' });
      res.end(found.zip);
      return;
    }

    res.writeHead(404);
    res.end('not found');
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  // Fill in self-referential URLs now that the port is known.
  for (const issue of state.issues) {
    issue.html_url = `${base}/issues/${issue.number}`;
    issue.url = `${base}/repos/acme/repo/issues/${issue.number}`;
    issue.comments_url = `${base}/repos/acme/repo/issues/${issue.number}/comments`;
  }

  return {
    base,
    state,
    requests: state.requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
