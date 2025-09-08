# Deployment Guide

This guide covers how to deploy and publish the AI Content Publisher SDK across different platforms.

## 📦 NPM Publishing

### Prerequisites
- NPM account with publishing permissions
- GitHub repository setup
- All tests passing

### Manual Publishing
```bash
# Ensure you're on main branch
git checkout main
git pull origin main

# Install dependencies and build
npm ci
npm run build

# Run final tests
npm test

# Login to NPM (if not already)
npm login

# Publish to NPM
npm publish
```

### Automated Publishing
Publishing is automated via GitHub Actions when:
- Code is pushed to `main` branch
- A version tag is created (`v1.0.0`)

Set up the following GitHub secrets:
- `NPM_TOKEN`: Your NPM authentication token

## 🚀 Vercel Deployment

### Setup
1. **Connect GitHub to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Configure project settings

2. **Set Environment Variables**
   ```bash
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```

3. **Configure GitHub Secrets**
   Add these secrets to your GitHub repository:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Automatic Deployment
Documentation is automatically deployed when:
- Code is pushed to `main` branch
- The deploy-docs workflow runs successfully

## 🐳 Docker Deployment

### Building Docker Image
```bash
# Build the image
docker build -t ai-content-publisher:latest .

# Test the image
docker run --rm ai-content-publisher:latest

# Tag for registry
docker tag ai-content-publisher:latest ghcr.io/your-org/ai-content-publisher:latest
```

### Docker Hub Publishing
```bash
# Login to Docker Hub
docker login

# Push to Docker Hub
docker push your-org/ai-content-publisher:latest
```

### GitHub Container Registry
```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Push to GitHub Container Registry
docker push ghcr.io/your-org/ai-content-publisher:latest
```

### Docker Compose Example
```yaml
version: '3.8'
services:
  ai-publisher:
    image: ghcr.io/your-org/ai-content-publisher:latest
    environment:
      - WEBFLOW_API_KEY=${WEBFLOW_API_KEY}
      - WEBFLOW_SITE_ID=${WEBFLOW_SITE_ID}
      - WORDPRESS_SITE_URL=${WORDPRESS_SITE_URL}
      - WORDPRESS_USERNAME=${WORDPRESS_USERNAME}
      - WORDPRESS_PASSWORD=${WORDPRESS_PASSWORD}
    volumes:
      - ./content:/app/content
    command: ["ai-publisher", "publish", "--file=/app/content/posts.json", "--platform=both"]
```

## ☁️ Cloud Deployments

### AWS Lambda
```typescript
// lambda-handler.ts
import { AIContentPublisher } from 'ai-content-publisher';

export const handler = async (event: any) => {
  const publisher = new AIContentPublisher({
    webflow: {
      apiKey: process.env.WEBFLOW_API_KEY!,
      siteId: process.env.WEBFLOW_SITE_ID!
    },
    wordpress: {
      siteUrl: process.env.WORDPRESS_SITE_URL!,
      username: process.env.WORDPRESS_USERNAME!,
      password: process.env.WORDPRESS_PASSWORD!
    }
  });

  const result = await publisher.publish(event.content, event.platform);
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

### Google Cloud Functions
```typescript
// index.ts
import { Request, Response } from 'express';
import { AIContentPublisher } from 'ai-content-publisher';

export const publishContent = async (req: Request, res: Response) => {
  const publisher = new AIContentPublisher();
  // Configure publisher...
  
  const result = await publisher.publish(req.body.content, req.body.platform);
  res.json(result);
};
```

### Azure Functions
```typescript
// function.ts
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { AIContentPublisher } from 'ai-content-publisher';

const httpTrigger: AzureFunction = async (context: Context, req: HttpRequest): Promise<void> => {
  const publisher = new AIContentPublisher();
  // Configure publisher...
  
  const result = await publisher.publish(req.body.content, req.body.platform);
  context.res = {
    status: 200,
    body: result
  };
};

export default httpTrigger;
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Continuous Integration (`ci.yml`)
- Runs on every push and PR
- Tests across Node.js versions 16, 18, 20
- Runs linting, testing, and building
- Security auditing

#### 2. Release (`release.yml`)
- Runs on pushes to main and version tags
- Semantic versioning
- NPM publishing
- Docker image publishing
- GitHub releases

#### 3. Documentation Deployment (`deploy-docs.yml`)
- Deploys documentation to Vercel
- Generates API documentation
- Updates on main branch changes

### Setting Up Secrets

#### GitHub Secrets Required:
```bash
# NPM Publishing
NPM_TOKEN=npm_xxxxxxxxxxxxx

# Docker Registry
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password

# Vercel Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Optional: Codecov
CODECOV_TOKEN=your_codecov_token
```

#### Adding Secrets:
1. Go to GitHub repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Click "New repository secret"
4. Add each required secret

## 📋 Pre-Deployment Checklist

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] CLI works (`node dist/cli/cli.js --help`)

### Documentation
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] API documentation current
- [ ] Examples working

### Security
- [ ] No secrets in code
- [ ] Dependencies audited (`npm audit`)
- [ ] Security policies updated

### Versioning
- [ ] Version number updated
- [ ] Release notes prepared
- [ ] Breaking changes documented

## 🔧 Environment Configuration

### Development
```bash
NODE_ENV=development
DEBUG=ai-content-publisher:*
```

### Production
```bash
NODE_ENV=production
WEBFLOW_API_KEY=your_production_key
WEBFLOW_SITE_ID=your_production_site
WORDPRESS_SITE_URL=https://your-production-site.com
WORDPRESS_USERNAME=your_production_user
WORDPRESS_PASSWORD=your_production_password
```

### Docker Environment
```dockerfile
ENV NODE_ENV=production
ENV SDK_TIMEOUT=30000
ENV SDK_DEBUG=false
```

## 📊 Monitoring and Logging

### Application Monitoring
```typescript
// Add monitoring to your deployment
import { AIContentPublisher } from 'ai-content-publisher';

const publisher = new AIContentPublisher({
  // ... config
  debug: process.env.NODE_ENV !== 'production'
});

// Add error tracking
publisher.on('error', (error) => {
  console.error('Publisher error:', error);
  // Send to monitoring service
});
```

### Health Checks
```typescript
// health-check.ts
export const healthCheck = async () => {
  const publisher = new AIContentPublisher();
  
  const webflowHealth = await publisher.testConnection('webflow');
  const wpHealth = await publisher.testConnection('wordpress');
  
  return {
    status: webflowHealth.success && wpHealth.success ? 'healthy' : 'unhealthy',
    webflow: webflowHealth.success,
    wordpress: wpHealth.success,
    timestamp: new Date().toISOString()
  };
};
```

## 🚨 Rollback Procedures

### NPM Rollback
```bash
# Unpublish specific version (within 24 hours)
npm unpublish ai-content-publisher@1.0.1

# Deprecate a version
npm deprecate ai-content-publisher@1.0.1 "Version deprecated due to critical bug"
```

### Docker Rollback
```bash
# Rollback to previous image
docker pull ghcr.io/your-org/ai-content-publisher:1.0.0
docker tag ghcr.io/your-org/ai-content-publisher:1.0.0 ghcr.io/your-org/ai-content-publisher:latest
```

### Vercel Rollback
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote https://ai-content-publisher-xyz.vercel.app
```

## 📈 Performance Optimization

### Bundle Size Optimization
```bash
# Analyze bundle size
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/

# Optimize dependencies
npm install --production
```

### Docker Optimization
```dockerfile
# Multi-stage build for smaller images
FROM node:20-alpine AS builder
# ... build steps

FROM node:20-alpine AS production
# ... production setup
```

## 🔐 Security Considerations

### API Key Management
- Never commit API keys to code
- Use environment variables or secure vaults
- Rotate keys regularly
- Use least-privilege access

### Docker Security
```dockerfile
# Use non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S aicontentpublisher -u 1001
USER aicontentpublisher
```

### Network Security
- Use HTTPS for all API calls
- Implement rate limiting
- Monitor for suspicious activity

## 📞 Support and Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

#### Test Failures
```bash
# Update snapshots
npm test -- --updateSnapshot

# Run specific test
npm test -- --testPathPattern=publisher.test.ts
```

#### Deployment Issues
```bash
# Check logs
vercel logs
docker logs container-name

# Verify environment variables
env | grep -E "(WEBFLOW|WORDPRESS)"
```

### Getting Help
- Check GitHub Issues
- Review deployment logs
- Contact support team
- Join community Discord

---

This deployment guide ensures your AI Content Publisher SDK is properly deployed and maintained across all platforms! 🚀
