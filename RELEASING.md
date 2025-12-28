# Release Process

This document outlines the release process for `soda3-query`.

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** (1.0.0): Breaking changes that require users to modify their code
- **MINOR** (0.1.0): New features that are backward compatible
- **PATCH** (0.0.1): Bug fixes that are backward compatible

## Release Workflow

**Important:** Before using the automated release workflow, ensure your repository settings allow GitHub Actions to create pull requests:

1. Go to Repository Settings → Actions → General
2. Under "Workflow permissions", select "Read and write permissions"
3. Check "Allow GitHub Actions to create and approve pull requests"
4. Click "Save"

### Option 1: Automated Release (Recommended)

1. **Prepare Release:**
   - Go to Actions → "Prepare Release" workflow
   - Click "Run workflow"
   - Select version type (patch/minor/major)
   - This creates a release branch and PR

2. **Review Release PR:**
   - Review the automated PR
   - Update `CHANGELOG.md` with changes (see [Updating CHANGELOG.md](#updating-changelogmd))
   - Ensure all tests pass
   - Merge the PR

3. **Create and Push Tag:**

   ```bash
   git pull origin main
   git tag v1.2.3  # Use the version from the PR
   git push origin v1.2.3
   ```

4. **Automated Publishing:**
   - The `release.yml` workflow automatically:
     - Runs full test suite (including live integration tests)
     - Builds the package
     - Publishes to npm
     - Creates a GitHub release

### Option 2: Manual Release

1. **Update Version:**

   ```bash
   npm version patch   # or minor, major
   # This updates package.json, creates a git tag, and commits
   ```

2. **Update CHANGELOG.md:**
   - Move entries from `[Unreleased]` to the new version section (see [Updating CHANGELOG.md](#updating-changelogmd))
   - Add the release date
   - Update comparison links

3. **Push Tag:**

   ```bash
   git push origin main
   git push --tags
   ```

4. **Publish (if not automated):**
   ```bash
   npm publish --provenance --access public
   ```

## Pre-Release Checklist

- [ ] All tests pass (`npm test`)
- [ ] Live integration tests pass (`npm run test:live-integration`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] `CHANGELOG.md` is updated (see [Updating CHANGELOG.md](#updating-changelogmd) below)
- [ ] Version is bumped in `package.json`
- [ ] All changes are committed
- [ ] Release notes are prepared

## Updating CHANGELOG.md

When preparing a release, you must update `CHANGELOG.md` to document the changes:

1. **Move entries from `[Unreleased]` to the new version section:**
   - Create a new version heading: `## [X.Y.Z] - YYYY-MM-DD`
   - Move all relevant entries from `[Unreleased]` to the new version section
   - Use the current date in `YYYY-MM-DD` format

2. **Update the comparison links at the bottom:**
   - Update `[Unreleased]` link to compare from the new version: `https://github.com/grahamplace/soda3-query/compare/vX.Y.Z...HEAD`
   - Add a new link for the version: `[X.Y.Z]: https://github.com/grahamplace/soda3-query/releases/tag/vX.Y.Z`

3. **Follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:**
   - Use appropriate categories: Added, Changed, Deprecated, Removed, Fixed, Security
   - Keep entries concise and user-focused
   - Group related changes together

**Example:**

```markdown
## [Unreleased]

### Added

- New feature X
- New feature Y

## [1.2.3] - 2025-01-15

### Added

- New feature X
- New feature Y

[Unreleased]: https://github.com/grahamplace/soda3-query/compare/v1.2.3...HEAD
[1.2.3]: https://github.com/grahamplace/soda3-query/releases/tag/v1.2.3
```

## Publishing to npm

### Prerequisites

1. **npm Account:**
   - Create account at https://www.npmjs.com/
   - Enable 2FA for security

2. **Authentication:**
   - For automated publishing: Uses OIDC trusted publishing (configured in npm account)
   - For manual publishing: Run `npm login` locally

3. **Package Name:**
   - Ensure package name is available on npm
   - Check: https://www.npmjs.com/package/soda3-query

### Automated Publishing (GitHub Actions)

The release workflow uses **OIDC trusted publishing** which:

- Eliminates need for long-lived npm tokens
- Uses short-lived, cryptographically-signed tokens
- More secure than traditional token-based auth

**To set up OIDC trusted publishing:**

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Trusted Publishing" tab
3. Click "Add Trusted Publisher"
4. Select "GitHub Actions"
5. Enter your repository: `grahamplace/soda3-query`
6. Enter workflow file: `.github/workflows/release.yml`
7. **Environment name:** Leave blank (not needed unless using protected environments)
8. Click "Add"

**Note:** The workflow automatically upgrades npm to 11.5.1+ (required for OIDC support). No `NPM_TOKEN` secret is needed - npm automatically uses the OIDC token from GitHub Actions.

### Manual Publishing

```bash
# Login to npm (first time only)
npm login

# Build and publish
npm run build
npm publish --provenance --access public
```

## Release Branches

For major releases or when you need to prepare a release while continuing development:

1. **Create Release Branch:**

   ```bash
   git checkout -b release/v1.0.0
   ```

2. **Finalize Release:**
   - Update CHANGELOG.md (see [Updating CHANGELOG.md](#updating-changelogmd))
   - Bump version
   - Run full test suite
   - Fix any issues

3. **Merge to Main:**

   ```bash
   git checkout main
   git merge release/v1.0.0
   git tag v1.0.0
   git push origin main --tags
   ```

4. **Cleanup:**
   ```bash
   git branch -d release/v1.0.0
   ```

## Post-Release

After a successful release:

1. **Verify on npm:**
   - Check: https://www.npmjs.com/package/soda3-query
   - Verify version and files are correct

2. **Update Documentation:**
   - Update README if needed
   - Update any examples

3. **Announce (Optional):**
   - Post on GitHub Discussions
   - Update project status

## Troubleshooting

### Publishing Fails

- Check npm authentication: `npm whoami`
- Verify package name is available
- Check for duplicate version (can't republish same version)
- Ensure `dist/` directory exists and is built

### Version Already Exists

If a version tag already exists:

- Use a different version number
- Or delete the tag: `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`

### Workflow Fails

- Check GitHub Actions logs
- Verify secrets are set correctly
- Ensure npm account has proper permissions
