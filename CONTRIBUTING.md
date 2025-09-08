# Contributing to AI Content Publisher SDK

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/ai-content-publisher.git
   cd ai-content-publisher
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Run tests**
   ```bash
   npm test
   ```
5. **Start developing!**

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+ (recommended: Node.js 20)
- npm 8+
- Git

### Local Development
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Test CLI locally
node dist/cli/cli.js --help
```

### Project Structure
```
src/
├── core/                 # Main SDK classes
├── adapters/            # Platform-specific adapters
├── types/               # TypeScript type definitions
├── cli/                 # Command-line interface
├── examples/            # Usage examples
└── __tests__/           # Test files
```

## 🔄 Development Workflow

### Branching Strategy
- `main` - Production-ready code
- `develop` - Development branch for features
- `feature/feature-name` - Feature branches
- `fix/bug-description` - Bug fix branches
- `docs/update-description` - Documentation updates

### Commit Messages
We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance tasks
- `perf`: Performance improvements

**Examples:**
```bash
feat(webflow): add support for custom field mapping
fix(wordpress): resolve authentication timeout issue
docs(readme): update installation instructions
test(validator): add tests for FAQ content validation
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following existing patterns
   - Add tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(platform): add new feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Fill out the PR template**
   - Describe your changes
   - Check all applicable boxes
   - Add screenshots if relevant

## 🧪 Testing Guidelines

### Test Structure
- Unit tests: `src/__tests__/`
- Test files: `*.test.ts`
- Mock external dependencies
- Aim for high coverage

### Writing Tests
```typescript
describe('FeatureName', () => {
  let instance: ClassName;

  beforeEach(() => {
    instance = new ClassName();
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = instance.method(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### Test Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

## 📝 Code Style

### TypeScript Guidelines
- Use strict TypeScript settings
- Provide type definitions for all public APIs
- Use interfaces for object types
- Use enums for constants

### Code Formatting
- Use Prettier for formatting (automatic)
- Use ESLint for code quality
- Follow existing naming conventions

### Documentation
- Add JSDoc comments for public methods
- Include usage examples
- Update README for new features

## 🌐 Adding Platform Support

### Creating a New Platform Adapter

1. **Create adapter file**
   ```typescript
   // src/adapters/new-platform-adapter.ts
   export class NewPlatformAdapter {
     async publishContent(content: AIContent): Promise<PublishResult> {
       // Implementation
     }
   }
   ```

2. **Add platform types**
   ```typescript
   // src/types/config.ts
   export interface NewPlatformConfig {
     apiKey: string;
     // other config
   }
   ```

3. **Update main SDK**
   ```typescript
   // src/core/ai-content-publisher.ts
   // Add configuration and publishing methods
   ```

4. **Add tests**
   ```typescript
   // src/__tests__/new-platform-adapter.test.ts
   ```

5. **Update documentation**

### Platform Requirements
- RESTful API or GraphQL endpoint
- Authentication mechanism
- Content creation/update capabilities
- Error handling and rate limiting

## 🐛 Bug Reports

### Before Reporting
1. Check existing issues
2. Update to latest version
3. Test with minimal reproduction case

### Bug Report Template
Use the GitHub issue template and include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Code examples
- Error messages

## 💡 Feature Requests

### Feature Request Guidelines
- Check existing feature requests
- Describe the use case clearly
- Explain why it would be valuable
- Consider implementation complexity
- Propose API design if applicable

## 📚 Documentation

### Types of Documentation
- **README.md** - Main documentation
- **GETTING_STARTED.md** - Quick start guide
- **API Documentation** - Generated from TypeScript
- **Examples** - Real-world usage examples

### Documentation Standards
- Clear, concise language
- Working code examples
- Up-to-date information
- Good formatting

## 🔒 Security

### Reporting Security Issues
- **DO NOT** create public issues for security vulnerabilities
- Email security issues to: [security@yourorg.com]
- Include detailed reproduction steps
- We'll respond within 24 hours

### Security Best Practices
- Never commit API keys or secrets
- Validate all input data
- Use secure authentication methods
- Follow OWASP guidelines

## 📦 Release Process

### Automated Releases
- Releases are automated via semantic-release
- Commit messages determine version bumps
- Published to npm automatically

### Version Strategy
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features
- **Patch** (0.0.1): Bug fixes

## 🤝 Community

### Code of Conduct
- Be respectful and inclusive
- Help others learn and grow
- Give constructive feedback
- Collaborate effectively

### Getting Help
- 📝 Check documentation first
- 🐛 Search existing issues
- 💬 Join our Discord community
- 📧 Email for urgent matters

### Recognition
Contributors are recognized in:
- CHANGELOG.md
- Contributors section
- Release notes

## 📊 Metrics and Analytics

### What We Track
- Usage statistics (anonymous)
- Error rates and types
- Performance metrics
- Feature adoption

### Privacy
- No personal information collected
- Opt-out available
- Transparent data usage

## 🎯 Roadmap

### Current Priorities
1. Shopify platform support
2. Advanced SEO features
3. Batch operations improvements
4. Performance optimizations

### Future Considerations
- Additional CMS platforms
- AI content optimization
- Advanced analytics
- Plugin system

## ❓ FAQ

### Q: How do I add support for a new content type?
A: Add the type to `ContentType` enum and update validation logic.

### Q: Can I contribute platform adapters?
A: Yes! We welcome platform adapters. See the platform support section.

### Q: How is the project licensed?
A: MIT License - you're free to use and modify.

### Q: How often are releases made?
A: Releases are automated based on commits to main branch.

## 📞 Contact

- **GitHub Issues**: For bugs and features
- **Email**: [contact@yourorg.com]
- **Discord**: [Join our community]
- **Twitter**: [@yourorg]

---

Thank you for contributing to AI Content Publisher SDK! 🚀
