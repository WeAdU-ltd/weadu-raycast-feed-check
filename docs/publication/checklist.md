# Before publication

Nothing in this folder may be posted before every box below is ticked.

- [ ] Pull requests #1 and #2 reviewed independently and merged.
- [ ] `sh test.sh` green on `main` (and the GitHub Actions workflow enabled: copy `ci/github-actions-test.yml` to `.github/workflows/test.yml` with a token that has the `workflow` scope).
- [ ] `author` in `package.json` set to the Raycast username that will own the extension. `ray lint` currently fails with `Invalid author "TODO_RAYCAST_USERNAME"` (404 on raycast.com).
- [ ] Raycast linting set up as in the official template (`@raycast/eslint-config`, ESLint, Prettier, and the `build`, `lint`, and `publish` scripts), then `npx ray lint` green. Expect it to ask for Title Case action titles ("Check Another Feed", "Copy Findings"); update the README if the labels change.
- [ ] Final icon: `assets/icon.png` is a 512×512 placeholder (a light octagon on dark green).
- [ ] Screenshots in a `metadata/` folder (recommended by the Store).
- [ ] Manual test in Raycast with a real feed exported from Merchant Center or a feed app.
- [ ] Store submission (pull request to `raycast/extensions`) done by the owner of the Raycast account, then accepted.
- [ ] Store link sent to the person who posts, so `LINK` can be replaced.
