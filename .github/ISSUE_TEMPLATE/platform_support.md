---
name: Platform Support Request
about: Request support for a new CMS platform
title: '[PLATFORM] Add support for [Platform Name]'
labels: enhancement, platform-support
assignees: ''

---

**Platform Information**
- **Platform Name**: [e.g. Shopify, Drupal, Ghost, etc.]
- **Platform Website**: [official website URL]
- **API Documentation**: [link to API docs]
- **Authentication Method**: [API key, OAuth, etc.]

**API Capabilities**
Please research and provide information about the platform's API:

**Content Management:**
- [ ] Create posts/articles
- [ ] Update existing content
- [ ] Delete content
- [ ] Content status management (draft/published)
- [ ] Category/tag support
- [ ] Media/image upload

**Content Types Supported:**
- [ ] Blog posts
- [ ] Pages
- [ ] Custom post types
- [ ] E-commerce products
- [ ] FAQs
- [ ] Other: ___________

**API Endpoints (if known):**
```
POST /api/content - Create content
PUT /api/content/{id} - Update content
DELETE /api/content/{id} - Delete content
GET /api/categories - List categories
```

**Authentication Requirements:**
- API key location: [header, query param, etc.]
- Required permissions: [read, write, admin, etc.]
- Rate limiting: [requests per minute/hour]

**Use Case**
- Why do you need this platform supported?
- How many users would benefit?
- What content types would you primarily use?

**Implementation Priority**
- [ ] Critical - many users requesting
- [ ] High - growing platform with good API
- [ ] Medium - established platform, some interest
- [ ] Low - niche platform or experimental

**Platform Complexity**
Rate the implementation complexity (if you know):
- [ ] Simple - REST API similar to WordPress
- [ ] Medium - requires additional authentication flow
- [ ] Complex - unique API structure or limitations

**Additional Resources**
- SDK/libraries: [any official or community SDKs]
- Code examples: [links to integration examples]
- Community discussions: [relevant forum threads, etc.]

**Volunteer to Help**
- [ ] I can help with research
- [ ] I can help with testing
- [ ] I can provide API access for testing
- [ ] I can contribute code

**Additional Notes**
Any other relevant information about this platform or its API.
