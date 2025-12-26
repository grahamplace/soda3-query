# Release Process

This document outlines the release process for `soda3-query`.

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/) (SemVer):

- **MAJOR** (1.0.0): Breaking changes that require users to modify their code
- **MINOR** (0.1.0): New features that are backward compatible
- **PATCH** (0.0.1): Bug fixes that are backward compatible

## Release Workflow

### Option 1: Automated Release (Recommended)

1. **Prepare Release:**
   - Go to Actions → "Prepare Release" workflow
   - Click "Run workflow"
   - Select version type (patch/minor/major)
   - This creates a release branch and PR

2. **Review Release PR:**
   - Review the automated PR
   - Update `CHANGELOG.md` with changes
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
   - Add entries for the new version
   - Document all changes

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
- [ ] `CHANGELOG.md` is updated
- [ ] Version is bumped in `package.json`
- [ ] All changes are committed
- [ ] Release notes are prepared

## Publishing to npm

### Prerequisites

1. **npm Account:**
   - Create account at https://www.npmjs.com/
   - Enable 2FA for security

2. **Authentication:**
   - For automated publishing: Set up trusted publishing (OIDC) in GitHub Actions
   - For manual publishing: Run `npm login` locally

3. **Package Name:**
   - Ensure package name is available on npm
   - Check: https://www.npmjs.com/package/soda3-query

### Automated Publishing (GitHub Actions)

The release workflow uses **trusted publishing** (OIDC) which:

- Eliminates need for long-lived npm tokens
- Uses short-lived, cryptographically-signed tokens
- More secure than traditional token-based auth

To enable:

1. Go to npm → Access Tokens → Automation
2. Enable "Trusted Publishing" for your GitHub repository
3. The workflow will automatically authenticate

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
   - Update CHANGELOG.md
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
