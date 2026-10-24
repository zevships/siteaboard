# GitHub Pages demo

The live demo is https://zevships.github.io/siteaboard/.
Pages serves static files only. The demo contains fictional data and does not run
the future local service, connect accounts, or collect site events.

## Repository setup

1. Publish this source to a public GitHub repository with `main` as its default branch.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
3. Push to `main` or run the **Check and deploy demo** workflow manually.
4. Inspect the Actions run and its `github-pages` deployment URL.

`.github/workflows/pages.yml` pins actions by commit. The build job needs read-only
repository access. Only the main-branch deployment job receives `pages: write` and
`id-token: write`; it uses GitHub's built-in token/OIDC, not a personal token.

Every PR and main-branch push installs the lockfile, checks formatting, types,
contracts, publication boundaries, and desktop/mobile browser behavior. The final
build uses the repository name as its base (`/siteaboard/` here). A repository named
`<owner>.github.io` uses `/`. Only `apps/admin/dist` is uploaded as the Pages artifact.
PRs never deploy. Local data, Git history, tests, credentials, and development files
are not included in that artifact.

## Forks and local preview

Change the README demo links and the UI's repository links when publishing a fork.
The workflow derives the asset base from the repository name. Hash routing means
`/siteaboard/#/sites` can be opened or refreshed without a server fallback rule.

```sh
SITEABOARD_BASE_PATH=/siteaboard/ pnpm build
pnpm preview
```

Open http://127.0.0.1:4310/siteaboard/. `SITEABOARD_BASE_PATH` is public build
configuration and never a place for credentials. The default local base is `/`.
If adding a custom domain later, set the build base to `/` and follow GitHub's
custom-domain setup before publishing.

## Release checks and recovery

Before pushing, inspect the commit, run `pnpm check`, and review the built files.
The publication checker catches common credential, local-path, and private-artifact
patterns; manual review is still required. Do not substitute real data for fixtures.

After deployment, verify the root page, a copied hash route, theme/language changes,
and mobile layout. Confirm the deployed workflow SHA matches the intended commit.
If a deployment regresses, revert the offending change in a new commit and let the
same workflow deploy it. Do not force-rewrite shared history as a rollback.

References: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[Vite static deployment](https://vite.dev/guide/static-deploy.html#github-pages).
