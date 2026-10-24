import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demoContent } from '../apps/admin/src/data/content.ts';
import { demoWorkspace } from '../apps/admin/src/data/workspace.ts';
import { validateContent, type ContentDataset } from '../packages/core/src/content.ts';
import { validateWorkspace } from '../packages/core/src/workspace.ts';

test('content snapshot is optional for older local workspaces, but supplied data is validated', () => {
  const oldSnapshot = structuredClone(demoWorkspace);
  delete oldSnapshot.content;
  validateWorkspace(oldSnapshot);
  validateWorkspace(demoWorkspace);
  assert.ok(demoContent.collectedAt <= demoWorkspace.generatedAt);
  assert.throws(() => validateWorkspace({ ...oldSnapshot, content: null }));
  assert.throws(() => validateWorkspace({ ...oldSnapshot, content: { schemaVersion: 1 } }));
});

test('synthetic content uses portable artwork and coherent cross-references without remote assets', () => {
  validateContent(demoContent);
  assert.equal(demoContent.creators.length, 12);
  assert.equal(demoContent.posts.length, 36);
  assert.equal(new Set(demoContent.posts.map((p) => p.art)).size, 6);
  assert.ok(demoContent.posts.some((p) => p.saved));
  assert.ok(demoContent.posts.some((p) => p.likes === null));
  assert.ok(demoContent.accounts.every((a) => a.handle.startsWith('demo_')));
  assert.doesNotMatch(JSON.stringify(demoContent), /https?:\/\/|\/Users\/|\.local\//);
});

test('content boundary rejects invalid dates, counts, unknown fields, duplicate IDs and dangling links', () => {
  const invalid: ((d: ContentDataset) => void)[] = [
    (d) => {
      d.schemaVersion = 2 as 1;
    },
    (d) => {
      d.costs.todayUsd = -0.1;
    },
    (d) => {
      d.costs.monthUsd = Infinity;
    },
    (d) => {
      d.creators[0].followers = 1.5;
    },
    (d) => {
      d.posts[0].likes = -1;
    },
    (d) => {
      d.accounts[0].posts = 0.5;
    },
    (d) => {
      d.posts[0].date = '2026-02-31T08:00:00Z';
    },
    (d) => {
      d.posts[0].date = '2027-01-01T08:00:00Z';
    },
    (d) => {
      d.collectedAt = '2026-13-01T08:00:00Z';
    },
    (d) => {
      d.categories[0].color = 'url(https://example.invalid)';
    },
    (d) => {
      d.creators[0].categoryId = 'missing';
    },
    (d) => {
      d.posts[0].creatorId = 'missing';
    },
    (d) => {
      d.posts[0].entityIds = ['missing'];
    },
    (d) => {
      d.entities[0].relatedIds = ['missing'];
    },
    (d) => {
      d.creators.push(d.creators[0]);
    },
    (d) => {
      Object.assign(d.posts[0], { mediaUrl: 'https://example.invalid' });
    },
  ];
  for (const mutate of invalid) {
    const data = structuredClone(demoContent);
    mutate(data);
    assert.throws(() => validateContent(data), /Invalid content snapshot/);
  }
});
