import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

export default defineConfig({
  name: 'jars-cms',
  title: 'Jars CMS',
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET!,
  plugins: [deskTool()],
  schema: {
    types: [
      // Legal
      {
        name: 'legalDoc',
        title: 'Legal Doc',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'slug', type: 'slug', options: {source: 'title'}},
          {
            name: 'type',
            type: 'string',
            options: {list: ['terms', 'privacy', 'accessibility', 'ageGate']},
          },
          {name: 'stateCode', type: 'string', title: 'State code (optional)'},
          {name: 'version', type: 'string'},
          {name: 'effectiveFrom', type: 'datetime'},
          {name: 'effectiveTo', type: 'datetime'},
          {name: 'body', type: 'array', of: [{type: 'block'}]},
          {name: 'notes', type: 'text'},
          {name: 'status', type: 'string', options: {list: ['draft', 'published']}},
        ],
      },
      // FAQ
      {
        name: 'faqGroup',
        title: 'FAQ Group',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'slug', type: 'slug', options: {source: 'title'}},
          {name: 'weight', type: 'number'},
          {
            name: 'items',
            type: 'array',
            of: [
              {
                type: 'object',
                fields: [
                  {name: 'question', type: 'string'},
                  {name: 'answer', type: 'array', of: [{type: 'block'}]},
                ],
              },
            ],
          },
        ],
      },
      // Articles
      {
        name: 'greenhouseArticle',
        title: 'Article',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'slug', type: 'slug', options: {source: 'title'}},
          {name: 'excerpt', type: 'text'},
          {
            name: 'coverImage',
            type: 'image',
            options: {hotspot: true},
            fields: [{name: 'alt', type: 'string'}],
          },
          {name: 'body', type: 'array', of: [{type: 'block'}]},
          {name: 'tags', type: 'array', of: [{type: 'string'}]},
          {name: 'author', type: 'string'},
          {name: 'publishedAt', type: 'datetime'},
          {name: 'status', type: 'string', options: {list: ['draft', 'published']}},
          {name: 'featured', type: 'boolean'},
        ],
      },
      // Shop taxonomies
      {
        name: 'shopCategory',
        title: 'Shop Category',
        type: 'document',
        fields: [
          {name: 'name', type: 'string'},
          {name: 'slug', type: 'slug', options: {source: 'name'}},
          {name: 'iconRef', type: 'string'},
          {name: 'weight', type: 'number'},
          {name: 'active', type: 'boolean'},
          {
            name: 'channels',
            type: 'array',
            of: [{type: 'string'}],
            options: {list: ['mobile', 'web', 'kiosk', 'email', 'ads']},
            title: 'Channels (optional)',
          },
        ],
      },
      {
        name: 'shopFilter',
        title: 'Shop Filter',
        type: 'document',
        fields: [
          {name: 'name', type: 'string'},
          {name: 'slug', type: 'slug', options: {source: 'name'}},
          {
            name: 'type',
            type: 'string',
            options: {list: ['effect', 'format', 'brand', 'thc', 'cbd', 'priceBand']},
          },
          {
            name: 'options',
            type: 'array',
            of: [
              {
                type: 'object',
                fields: [
                  {name: 'label', type: 'string'},
                  {name: 'value', type: 'string'},
                  {name: 'weight', type: 'number'},
                  {name: 'active', type: 'boolean'},
                ],
              },
            ],
          },
          {
            name: 'channels',
            type: 'array',
            of: [{type: 'string'}],
            options: {list: ['mobile', 'web', 'kiosk', 'email', 'ads']},
            title: 'Channels (optional)',
          },
        ],
      },
      // Deals
      {
        name: 'deal',
        title: 'Deal',
        type: 'document',
        fields: [
          {name: 'title', type: 'string'},
          {name: 'slug', type: 'slug', options: {source: 'title'}},
          {name: 'badge', type: 'string'},
          {name: 'ctaText', type: 'string'},
          {name: 'ctaLink', type: 'url'},
          {
            name: 'image',
            type: 'image',
            options: {hotspot: true},
            fields: [{name: 'alt', type: 'string'}],
          },
          {name: 'priority', type: 'number'},
          {name: 'startAt', type: 'datetime'},
          {name: 'endAt', type: 'datetime'},
          {name: 'stores', type: 'array', of: [{type: 'string'}]},
          {name: 'active', type: 'boolean'},
          {
            name: 'channels',
            type: 'array',
            of: [{type: 'string'}],
            options: {list: ['mobile', 'web', 'kiosk', 'email', 'ads']},
            title: 'Channels (optional)',
          },
          {name: 'reasonHint', type: 'string'},
        ],
      },
      // System copy
      {
        name: 'appCopy',
        title: 'App Copy',
        type: 'document',
        fields: [
          {name: 'key', type: 'string'},
          {
            name: 'context',
            type: 'string',
            options: {
              list: ['onboarding', 'emptyStates', 'awards', 'accessibility', 'dataTransparency'],
            },
          },
          {name: 'text', type: 'array', of: [{type: 'block'}]},
        ],
      },
    ],
  },
})
