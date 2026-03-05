# npm Publishing Instructions

## Prerequisites

1. Node.js 18+ installed
2. npm account (https://www.npmjs.com)
3. Git repository initialized

## Preparation

1. Update `package.json`:
   - Update `version` (follow semver)
   - Update `author` field
   - Update `repository` field
   - Update `keywords`

2. Build the package:
```bash
npm install
npm run build
```

3. Test locally:
```bash
npm link
# In a test project
npm link saas-backend-kit
```

## Publishing

### Option 1: Publish to npm (public)

```bash
npm login
npm publish --access public
```

### Option 2: Publish to npm (private - paid plan)

```bash
npm login
npm publish
```

### Option 3: Publish to GitHub Package Registry

Add to `.npmrc`:
```
@yourusername:registry=https://npm.pkg.github.com
```

```bash
npm login --registry=https://npm.pkg.github.com
npm publish
```

## Version Management

Use semantic versioning:

```bash
# Patch release
npm version patch

# Minor release  
npm version minor

# Major release
npm version major
```

This will:
1. Update version in package.json
2. Create a git tag
3. Commit changes

Then publish:
```bash
git push && git push --tags
npm publish
```

## After Publishing

1. Create a GitHub release with the new version tag
2. Update CHANGELOG.md
3. Announce on social media

## Automation with GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Troubleshooting

### Error: "You do not have permission to publish"

- Make sure you're logged in to the correct npm account
- Check if the package name is available
- Verify your npm account has publishing rights for scoped packages

### Error: "Token not recognized"

- Regenerate your npm token
- Ensure the token has publish permissions
- Check your `.npmrc` file for correct configuration
