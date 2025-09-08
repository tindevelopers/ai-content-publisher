#!/bin/bash

# AI Content Publisher SDK - GitHub Setup Script
# This script helps set up the repository for GitHub with all necessary configurations

set -e

echo "🚀 Setting up AI Content Publisher SDK for GitHub..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run 'git init' first."
    exit 1
fi

# Install additional dependencies for development
echo "📦 Installing development dependencies..."
npm install --save-dev @semantic-release/changelog@^6.0.3 @semantic-release/git@^10.0.1 semantic-release@^21.0.0 typedoc@^0.25.0

# Build the project to ensure everything works
echo "🔨 Building project..."
npm run build

# Run tests to ensure quality
echo "🧪 Running tests..."
npm test

# Run linter
echo "🔍 Running linter..."
npm run lint

# Make CLI executable
echo "🔧 Making CLI executable..."
chmod +x dist/cli/cli.js

# Generate initial documentation
echo "📚 Generating API documentation..."
if command -v typedoc &> /dev/null; then
    npm run docs:generate
else
    echo "⚠️  TypeDoc not found globally. Installing..."
    npm install -g typedoc
    npm run docs:generate
fi

# Create initial changelog
echo "📝 Creating initial changelog..."
cat > CHANGELOG.md << 'EOF'
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of AI Content Publisher SDK
- Support for Webflow CMS integration
- Support for WordPress REST API integration
- TypeScript SDK with full type definitions
- Command-line interface (CLI) tool
- Content validation and error handling
- Batch publishing capabilities
- SEO optimization features
- Comprehensive test suite
- Docker containerization support
- GitHub Actions CI/CD workflows
- Automated documentation deployment

### Features
- ✅ Unified interface for multiple CMS platforms
- ✅ Secure API key management
- ✅ Content validation with helpful error messages
- ✅ Batch publishing for efficiency
- ✅ CLI tool for automation
- ✅ Full TypeScript support
- ✅ SEO optimization built-in
- ✅ Docker deployment ready
- ✅ Comprehensive documentation

## [1.0.0] - 2024-01-01

### Added
- Initial release
EOF

# Set up git hooks (if not already configured)
echo "🪝 Setting up git hooks..."
if [ ! -d ".git/hooks" ]; then
    mkdir -p .git/hooks
fi

# Create pre-commit hook for code quality
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# AI Content Publisher SDK - Pre-commit hook

echo "🔍 Running pre-commit checks..."

# Run tests
echo "🧪 Running tests..."
npm test

# Run linter
echo "🔍 Running linter..."
npm run lint

# Build to ensure no compilation errors
echo "🔨 Building project..."
npm run build

echo "✅ Pre-commit checks passed!"
EOF

chmod +x .git/hooks/pre-commit

# Create commit message template
echo "📝 Setting up commit message template..."
cat > .gitmessage << 'EOF'
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>

# Type should be one of:
# * feat (new feature)
# * fix (bug fix)
# * docs (documentation)
# * style (formatting, missing semi colons, etc; no code change)
# * refactor (refactoring production code)
# * test (adding tests, refactoring test; no production code change)
# * chore (updating build tasks, package manager configs, etc; no production code change)
#
# Scope is the module/component affected (webflow, wordpress, cli, core, etc.)
#
# Subject line should be 50 characters or less
# Body should wrap at 72 characters
# Footer should contain any BREAKING CHANGES and reference issues
#
# Examples:
# feat(webflow): add support for custom field mapping
# fix(wordpress): resolve authentication timeout issue
# docs(readme): update installation instructions
EOF

git config commit.template .gitmessage

# Check for required environment setup
echo "🔐 Checking environment setup..."

if [ ! -f ".env.example" ]; then
    echo "⚠️  .env.example not found. This is expected."
fi

if [ ! -f "example.env" ]; then
    echo "⚠️  example.env found - good for documentation."
fi

# Display setup summary
echo ""
echo "✅ GitHub setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Add the remote origin:"
echo "   git remote add origin https://github.com/your-org/ai-content-publisher.git"
echo ""
echo "3. Set up GitHub secrets (in repository settings):"
echo "   - NPM_TOKEN: Your NPM publishing token"
echo "   - VERCEL_TOKEN: Your Vercel deployment token"
echo "   - VERCEL_ORG_ID: Your Vercel organization ID"
echo "   - VERCEL_PROJECT_ID: Your Vercel project ID"
echo ""
echo "4. Update package.json repository URLs:"
echo "   - repository.url"
echo "   - bugs.url"
echo "   - homepage"
echo ""
echo "5. Update author information in package.json"
echo ""
echo "6. Commit and push to GitHub:"
echo "   git add ."
echo "   git commit -m \"feat: initial release of AI Content Publisher SDK\""
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "7. Create release tags for automatic publishing:"
echo "   git tag v1.0.0"
echo "   git push origin v1.0.0"
echo ""
echo "8. Set up Vercel project and connect to GitHub repository"
echo ""
echo "🚀 Your AI Content Publisher SDK is ready for GitHub!"
echo ""
echo "📚 Documentation will be available at:"
echo "   - GitHub: https://github.com/your-org/ai-content-publisher"
echo "   - NPM: https://www.npmjs.com/package/ai-content-publisher"
echo "   - Vercel: https://your-project.vercel.app"
echo ""

# Final validation
echo "🔍 Running final validation..."
if npm test >/dev/null 2>&1; then
    echo "✅ Tests passing"
else
    echo "❌ Tests failing - please fix before pushing"
    exit 1
fi

if npm run lint >/dev/null 2>&1; then
    echo "✅ Linting passing"
else
    echo "❌ Linting failing - please fix before pushing"
    exit 1
fi

if npm run build >/dev/null 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failing - please fix before pushing"
    exit 1
fi

if [ -x "dist/cli/cli.js" ]; then
    echo "✅ CLI executable"
else
    echo "❌ CLI not executable - please fix before pushing"
    exit 1
fi

echo ""
echo "🎉 All checks passed! Repository is ready for GitHub."
