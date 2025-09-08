#!/usr/bin/env node

/**
 * CLI tool for AI Content Publisher SDK
 */

import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { AIContentPublisher, AIContent } from '../index';

const VERSION = '1.0.0';

// Configuration file path
const CONFIG_FILE = path.join(process.cwd(), '.ai-publisher-config.json');

interface CLIConfig {
  webflow?: {
    apiKey: string;
    siteId: string;
    defaultCollectionId?: string;
  };
  wordpress?: {
    siteUrl: string;
    username: string;
    password: string;
    defaultCategory?: string;
    defaultAuthor?: number;
  };
}

/**
 * Load configuration from file
 */
function loadConfig(): CLIConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return config;
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
  return null;
}

/**
 * Save configuration to file
 */
function saveConfig(config: CLIConfig): void {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('Configuration saved to', CONFIG_FILE);
  } catch (error) {
    console.error('Error saving configuration:', error);
    process.exit(1);
  }
}

/**
 * Load content from file
 */
function loadContentFromFile(filePath: string): AIContent | AIContent[] {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return content;
  } catch (error) {
    console.error('Error loading content file:', error);
    process.exit(1);
  }
}

/**
 * Initialize publisher with configuration
 */
async function initializePublisher(): Promise<AIContentPublisher> {
  const config = loadConfig();
  if (!config) {
    console.error('No configuration found. Run "ai-publisher config" first.');
    process.exit(1);
  }

  const publisher = new AIContentPublisher();

  try {
    if (config.webflow) {
      await publisher.configureWebflow(
        config.webflow.apiKey,
        config.webflow.siteId,
        config.webflow.defaultCollectionId,
      );
    }

    if (config.wordpress) {
      await publisher.configureWordPress(
        config.wordpress.siteUrl,
        config.wordpress.username,
        config.wordpress.password,
        {
          defaultCategory: config.wordpress.defaultCategory,
          defaultAuthor: config.wordpress.defaultAuthor,
        },
      );
    }

    return publisher;
  } catch (error) {
    console.error('Error initializing publisher:', error);
    process.exit(1);
  }
}

// Configure program
program
  .name('ai-publisher')
  .description('CLI for AI Content Publisher SDK')
  .version(VERSION);

// Config command
program
  .command('config')
  .description('Configure platform settings')
  .option('--webflow-key <key>', 'Webflow API key')
  .option('--webflow-site <siteId>', 'Webflow site ID')
  .option('--webflow-collection <collectionId>', 'Default Webflow collection ID')
  .option('--wp-url <url>', 'WordPress site URL')
  .option('--wp-username <username>', 'WordPress username')
  .option('--wp-password <password>', 'WordPress application password')
  .option('--wp-category <category>', 'Default WordPress category')
  .option('--wp-author <authorId>', 'Default WordPress author ID')
  .action((options) => {
    const config = loadConfig() || {};

    // Update Webflow config
    if (options.webflowKey || options.webflowSite || options.webflowCollection) {
      if (!config.webflow) {
        config.webflow = {} as any;
      }
      if (options.webflowKey) config.webflow!.apiKey = options.webflowKey;
      if (options.webflowSite) config.webflow!.siteId = options.webflowSite;
      if (options.webflowCollection) config.webflow!.defaultCollectionId = options.webflowCollection;
    }

    // Update WordPress config
    if (options.wpUrl || options.wpUsername || options.wpPassword || options.wpCategory || options.wpAuthor) {
      if (!config.wordpress) {
        config.wordpress = {} as any;
      }
      if (options.wpUrl) config.wordpress!.siteUrl = options.wpUrl;
      if (options.wpUsername) config.wordpress!.username = options.wpUsername;
      if (options.wpPassword) config.wordpress!.password = options.wpPassword;
      if (options.wpCategory) config.wordpress!.defaultCategory = options.wpCategory;
      if (options.wpAuthor) config.wordpress!.defaultAuthor = parseInt(options.wpAuthor);
    }

    saveConfig(config);
  });

// Publish command
program
  .command('publish')
  .description('Publish content to specified platform')
  .requiredOption('-f, --file <path>', 'Path to content JSON file')
  .requiredOption('-p, --platform <platform>', 'Target platform (webflow|wordpress|both)')
  .option('--validate-only', 'Only validate content without publishing')
  .action(async (options) => {
    const content = loadContentFromFile(options.file);
    const publisher = await initializePublisher();

    // Handle array of content items
    if (Array.isArray(content)) {
      console.log(`Publishing ${content.length} content items...`);
      
      if (options.platform === 'both') {
        console.error('Batch publishing to multiple platforms not supported via CLI yet');
        process.exit(1);
      }

      const platform = options.platform as 'webflow' | 'wordpress';
      const results = await publisher.batchPublish(content, platform);
      
      const successCount = results.filter(r => r.success).length;
      console.log(`Successfully published ${successCount}/${results.length} items`);
      
      // Show failed items
      results.forEach((result, index) => {
        if (!result.success) {
          console.error(`Item ${index + 1} failed:`, result.message);
        }
      });
      
      return;
    }

    // Validate content
    const validation = publisher.validateContent(content);
    if (!validation.isValid) {
      console.error('Content validation failed:');
      validation.errors.forEach(error => {
        console.error(`- ${error.field}: ${error.message}`);
      });
      process.exit(1);
    }

    if (validation.warnings && validation.warnings.length > 0) {
      console.warn('Content validation warnings:');
      validation.warnings.forEach(warning => {
        console.warn(`- ${warning.field}: ${warning.message}`);
      });
    }

    if (options.validateOnly) {
      console.log('Content validation passed!');
      return;
    }

    // Publish content
    try {
      let results;
      
      if (options.platform === 'both') {
        results = await publisher.publishToMultiple(content, ['webflow', 'wordpress']);
        results.forEach(result => {
          if (result.success) {
            console.log(`✅ Published to ${result.platform}: ${result.url || result.contentId}`);
          } else {
            console.error(`❌ Failed to publish to ${result.platform}: ${result.message}`);
          }
        });
      } else {
        const platform = options.platform as 'webflow' | 'wordpress';
        const result = await publisher.publish(content, platform);
        
        if (result.success) {
          console.log(`✅ Published to ${platform}: ${result.url || result.contentId}`);
        } else {
          console.error(`❌ Failed to publish to ${platform}: ${result.message}`);
          process.exit(1);
        }
      }
    } catch (error) {
      console.error('Publishing error:', error);
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Test connection to configured platforms')
  .option('-p, --platform <platform>', 'Test specific platform (webflow|wordpress)')
  .action(async (options) => {
    const publisher = await initializePublisher();
    
    const platforms = options.platform ? [options.platform] : ['webflow', 'wordpress'];
    
    for (const platform of platforms) {
      try {
        const result = await publisher.testConnection(platform as 'webflow' | 'wordpress');
        if (result.success) {
          console.log(`✅ ${platform}: Connected successfully`);
        } else {
          console.log(`❌ ${platform}: ${result.error}`);
        }
      } catch (error) {
        console.log(`❌ ${platform}: Connection test failed - ${error}`);
      }
    }
  });

// Collections command
program
  .command('collections')
  .description('List available collections/post types')
  .option('-p, --platform <platform>', 'Platform to check (webflow|wordpress)')
  .action(async (options) => {
    const publisher = await initializePublisher();
    
    const platforms = options.platform ? [options.platform] : ['webflow', 'wordpress'];
    
    for (const platform of platforms) {
      try {
        const collections = await publisher.getAvailableCollections(platform as 'webflow' | 'wordpress');
        console.log(`\n${platform.toUpperCase()} Collections:`);
        collections.forEach(collection => {
          console.log(`- ${collection.name} (${collection.id})`);
          if (collection.fields.length > 0) {
            console.log(`  Fields: ${collection.fields.map(f => f.name).join(', ')}`);
          }
        });
      } catch (error) {
        console.error(`Error fetching ${platform} collections:`, error);
      }
    }
  });

// Status command
program
  .command('status')
  .description('Show configuration status')
  .action(async () => {
    const config = loadConfig();
    
    if (!config) {
      console.log('No configuration found.');
      return;
    }

    console.log('Configuration Status:');
    console.log('- Webflow:', config.webflow ? '✅ Configured' : '❌ Not configured');
    console.log('- WordPress:', config.wordpress ? '✅ Configured' : '❌ Not configured');
    
    if (config.webflow || config.wordpress) {
      try {
        const publisher = await initializePublisher();
        
        if (config.webflow) {
          const webflowTest = await publisher.testConnection('webflow');
          console.log('- Webflow Connection:', webflowTest.success ? '✅ Working' : '❌ Failed');
        }
        
        if (config.wordpress) {
          const wpTest = await publisher.testConnection('wordpress');
          console.log('- WordPress Connection:', wpTest.success ? '✅ Working' : '❌ Failed');
        }
      } catch (error) {
        console.error('Error testing connections:', error);
      }
    }
  });

// Parse CLI arguments
program.parse();
