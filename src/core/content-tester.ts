/**
 * Content testing system for validating platform compatibility
 */

import { AIContent, PlatformType, ValidationResult, ValidationError } from '../types/content';

export interface ContentTestResult {
  platform: PlatformType;
  isCompatible: boolean;
  score: number; // 0-100 compatibility score
  issues: ContentIssue[];
  suggestions: string[];
  estimatedEngagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
}

export interface ContentIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface PlatformRequirements {
  maxTitleLength?: number;
  maxContentLength?: number;
  maxExcerptLength?: number;
  maxTags?: number;
  maxHashtags?: number;
  requiredFields?: string[];
  supportedContentTypes?: string[];
  imageRequirements?: {
    maxSize?: number;
    supportedFormats?: string[];
    maxCount?: number;
  };
  characterLimits?: {
    [key: string]: number;
  };
}

export class ContentTester {
  private platformRequirements: Map<PlatformType, PlatformRequirements> = new Map();

  constructor() {
    this.initializePlatformRequirements();
  }

  /**
   * Initialize platform-specific requirements
   */
  private initializePlatformRequirements(): void {
    // Twitter/X Requirements
    this.platformRequirements.set('twitter', {
      maxTitleLength: 280,
      maxContentLength: 280,
      maxHashtags: 3,
      supportedContentTypes: ['social-post', 'twitter-thread'],
      characterLimits: {
        tweet: 280,
        thread: 2800, // 10 tweets max
      },
    });

    // LinkedIn Requirements
    this.platformRequirements.set('linkedin', {
      maxTitleLength: 200,
      maxContentLength: 3000,
      maxExcerptLength: 300,
      maxHashtags: 5,
      supportedContentTypes: ['social-post', 'linkedin-article'],
      characterLimits: {
        post: 3000,
        article: 125000,
      },
    });

    // Instagram Requirements
    this.platformRequirements.set('instagram', {
      maxContentLength: 2200,
      maxHashtags: 30,
      supportedContentTypes: ['social-post', 'social-story', 'social-reel', 'social-carousel'],
      imageRequirements: {
        maxSize: 8 * 1024 * 1024, // 8MB
        supportedFormats: ['jpg', 'jpeg', 'png'],
        maxCount: 10,
      },
    });

    // Medium Requirements
    this.platformRequirements.set('medium', {
      maxTitleLength: 100,
      maxContentLength: 1000000,
      maxTags: 5,
      supportedContentTypes: ['article', 'medium-story'],
    });

    // Ghost Requirements
    this.platformRequirements.set('ghost', {
      maxTitleLength: 200,
      maxContentLength: 1000000,
      maxExcerptLength: 300,
      supportedContentTypes: ['blog', 'article'],
    });

    // WordPress Requirements
    this.platformRequirements.set('wordpress', {
      maxTitleLength: 200,
      maxContentLength: 1000000,
      maxExcerptLength: 300,
      supportedContentTypes: ['blog', 'article', 'page'],
    });

    // Webflow Requirements
    this.platformRequirements.set('webflow', {
      maxTitleLength: 200,
      maxContentLength: 1000000,
      supportedContentTypes: ['blog', 'article', 'landing-page'],
    });

    // Substack Requirements
    this.platformRequirements.set('substack', {
      maxTitleLength: 200,
      maxContentLength: 1000000,
      maxExcerptLength: 300,
      supportedContentTypes: ['newsletter', 'newsletter-issue', 'article'],
    });
  }

  /**
   * Test content compatibility with a specific platform
   */
  testContentForPlatform(content: AIContent, platform: PlatformType): ContentTestResult {
    const requirements = this.platformRequirements.get(platform);
    if (!requirements) {
      return {
        platform,
        isCompatible: false,
        score: 0,
        issues: [{
          type: 'error',
          field: 'platform',
          message: 'Platform requirements not defined',
          severity: 'critical',
        }],
        suggestions: ['Platform not supported for testing'],
      };
    }

    const issues: ContentIssue[] = [];
    let score = 100;

    // Test content type compatibility
    if (requirements.supportedContentTypes && !requirements.supportedContentTypes.includes(content.type)) {
      issues.push({
        type: 'warning',
        field: 'type',
        message: `Content type '${content.type}' may not be optimal for ${platform}`,
        suggestion: `Consider using: ${requirements.supportedContentTypes.join(', ')}`,
        severity: 'medium',
      });
      score -= 20;
    }

    // Test title length
    if (requirements.maxTitleLength && content.title.length > requirements.maxTitleLength) {
      issues.push({
        type: 'error',
        field: 'title',
        message: `Title too long for ${platform} (${content.title.length}/${requirements.maxTitleLength})`,
        suggestion: `Shorten title to ${requirements.maxTitleLength} characters or less`,
        severity: 'high',
      });
      score -= 30;
    }

    // Test content length
    if (requirements.maxContentLength && content.content.length > requirements.maxContentLength) {
      issues.push({
        type: 'error',
        field: 'content',
        message: `Content too long for ${platform} (${content.content.length}/${requirements.maxContentLength})`,
        suggestion: `Shorten content to ${requirements.maxContentLength} characters or less`,
        severity: 'high',
      });
      score -= 30;
    }

    // Test excerpt length
    if (requirements.maxExcerptLength && content.excerpt && content.excerpt.length > requirements.maxExcerptLength) {
      issues.push({
        type: 'warning',
        field: 'excerpt',
        message: `Excerpt too long for ${platform} (${content.excerpt.length}/${requirements.maxExcerptLength})`,
        suggestion: `Shorten excerpt to ${requirements.maxExcerptLength} characters or less`,
        severity: 'medium',
      });
      score -= 10;
    }

    // Test tags/hashtags
    if (requirements.maxTags && content.tags && content.tags.length > requirements.maxTags) {
      issues.push({
        type: 'warning',
        field: 'tags',
        message: `Too many tags for ${platform} (${content.tags.length}/${requirements.maxTags})`,
        suggestion: `Reduce tags to ${requirements.maxTags} or less`,
        severity: 'medium',
      });
      score -= 10;
    }

    // Test hashtags for social platforms
    if (requirements.maxHashtags) {
      const hashtagCount = this.countHashtags(content);
      if (hashtagCount > requirements.maxHashtags) {
        issues.push({
          type: 'warning',
          field: 'hashtags',
          message: `Too many hashtags for ${platform} (${hashtagCount}/${requirements.maxHashtags})`,
          suggestion: `Reduce hashtags to ${requirements.maxHashtags} or less`,
          severity: 'medium',
        });
        score -= 10;
      }
    }

    // Test required fields
    if (requirements.requiredFields) {
      for (const field of requirements.requiredFields) {
        if (!this.hasRequiredField(content, field)) {
          issues.push({
            type: 'error',
            field,
            message: `Required field '${field}' is missing for ${platform}`,
            suggestion: `Add the required ${field} field`,
            severity: 'high',
          });
          score -= 25;
        }
      }
    }

    // Test images for platforms that support them
    if (requirements.imageRequirements && content.images) {
      const imageIssues = this.testImages(content.images, requirements.imageRequirements, platform);
      issues.push(...imageIssues);
      score -= imageIssues.length * 5;
    }

    // Platform-specific tests
    const platformSpecificIssues = this.testPlatformSpecificRequirements(content, platform);
    issues.push(...platformSpecificIssues);
    score -= platformSpecificIssues.length * 5;

    // Generate suggestions
    const suggestions = this.generateSuggestions(content, platform, issues);

    // Estimate engagement based on content quality
    const estimatedEngagement = this.estimateEngagement(content, platform, score);

    return {
      platform,
      isCompatible: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      score: Math.max(0, score),
      issues,
      suggestions,
      estimatedEngagement,
    };
  }

  /**
   * Test content compatibility with multiple platforms
   */
  testContentForMultiplePlatforms(content: AIContent, platforms: PlatformType[]): Map<PlatformType, ContentTestResult> {
    const results = new Map<PlatformType, ContentTestResult>();
    
    for (const platform of platforms) {
      results.set(platform, this.testContentForPlatform(content, platform));
    }
    
    return results;
  }

  /**
   * Get the best platforms for content based on compatibility scores
   */
  getBestPlatformsForContent(content: AIContent, availablePlatforms: PlatformType[]): PlatformType[] {
    const results = this.testContentForMultiplePlatforms(content, availablePlatforms);
    
    return availablePlatforms
      .map(platform => ({
        platform,
        result: results.get(platform)!,
      }))
      .filter(item => item.result.isCompatible)
      .sort((a, b) => b.result.score - a.result.score)
      .map(item => item.platform);
  }

  /**
   * Count hashtags in content
   */
  private countHashtags(content: AIContent): number {
    let count = 0;
    const text = `${content.title} ${content.content} ${content.excerpt || ''}`;
    const hashtagMatches = text.match(/#\w+/g);
    if (hashtagMatches) {
      count += hashtagMatches.length;
    }
    return count;
  }

  /**
   * Check if content has a required field
   */
  private hasRequiredField(content: AIContent, field: string): boolean {
    switch (field) {
      case 'title':
        return !!content.title;
      case 'content':
        return !!content.content;
      case 'excerpt':
        return !!content.excerpt;
      case 'tags':
        return !!(content.tags && content.tags.length > 0);
      case 'images':
        return !!(content.images && content.images.length > 0);
      default:
        return !!(content as any)[field];
    }
  }

  /**
   * Test image requirements
   */
  private testImages(images: any[], requirements: any, platform: PlatformType): ContentIssue[] {
    const issues: ContentIssue[] = [];

    if (requirements.maxCount && images.length > requirements.maxCount) {
      issues.push({
        type: 'error',
        field: 'images',
        message: `Too many images for ${platform} (${images.length}/${requirements.maxCount})`,
        suggestion: `Reduce images to ${requirements.maxCount} or less`,
        severity: 'high',
      });
    }

    // Note: In a real implementation, you would check image file sizes and formats
    // This would require file system access or URL validation

    return issues;
  }

  /**
   * Test platform-specific requirements
   */
  private testPlatformSpecificRequirements(content: AIContent, platform: PlatformType): ContentIssue[] {
    const issues: ContentIssue[] = [];

    switch (platform) {
      case 'twitter':
        // Test for Twitter thread
        if (content.type === 'twitter-thread' && content.twitterThread) {
          const totalLength = content.twitterThread.tweets.reduce((sum, tweet) => sum + tweet.text.length, 0);
          if (totalLength > 2800) {
            issues.push({
              type: 'warning',
              field: 'twitterThread',
              message: 'Twitter thread too long',
              suggestion: 'Consider splitting into multiple threads',
              severity: 'medium',
            });
          }
        }
        break;

      case 'linkedin':
        // Test for professional tone
        if (content.content.includes('!!!') || content.content.includes('???')) {
          issues.push({
            type: 'info',
            field: 'content',
            message: 'Content may be too casual for LinkedIn',
            suggestion: 'Consider a more professional tone',
            severity: 'low',
          });
        }
        break;

      case 'instagram':
        // Test for visual content
        if (!content.images || content.images.length === 0) {
          issues.push({
            type: 'warning',
            field: 'images',
            message: 'Instagram performs better with visual content',
            suggestion: 'Add images or videos to improve engagement',
            severity: 'medium',
          });
        }
        break;
    }

    return issues;
  }

  /**
   * Generate suggestions for improving content
   */
  private generateSuggestions(content: AIContent, platform: PlatformType, issues: ContentIssue[]): string[] {
    const suggestions: string[] = [];

    // General suggestions based on issues
    if (issues.some(i => i.field === 'title' && i.type === 'error')) {
      suggestions.push('Consider shortening the title for better readability');
    }

    if (issues.some(i => i.field === 'content' && i.type === 'error')) {
      suggestions.push('Break up long content into smaller, digestible sections');
    }

    // Platform-specific suggestions
    switch (platform) {
      case 'twitter':
        suggestions.push('Use relevant hashtags to increase discoverability');
        suggestions.push('Consider creating a thread for longer content');
        break;

      case 'linkedin':
        suggestions.push('Add a professional summary or key takeaways');
        suggestions.push('Use industry-relevant keywords');
        break;

      case 'instagram':
        suggestions.push('Include high-quality, engaging visuals');
        suggestions.push('Use relevant hashtags (up to 30)');
        break;

      case 'medium':
        suggestions.push('Add a compelling subtitle');
        suggestions.push('Include relevant tags for better categorization');
        break;
    }

    return suggestions;
  }

  /**
   * Estimate engagement based on content quality
   */
  private estimateEngagement(content: AIContent, platform: PlatformType, score: number): any {
    const baseEngagement = {
      likes: Math.floor(score * 0.1),
      shares: Math.floor(score * 0.05),
      comments: Math.floor(score * 0.03),
      views: Math.floor(score * 2),
    };

    // Platform-specific adjustments
    switch (platform) {
      case 'twitter':
        return {
          ...baseEngagement,
          retweets: Math.floor(score * 0.08),
        };

      case 'linkedin':
        return {
          ...baseEngagement,
          reactions: Math.floor(score * 0.12),
        };

      case 'instagram':
        return {
          ...baseEngagement,
          saves: Math.floor(score * 0.02),
        };

      default:
        return baseEngagement;
    }
  }
}
