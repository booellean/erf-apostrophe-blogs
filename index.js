const fs = require('fs');
const path = require('path');

module.exports = {
    extend: '@apostrophecms/piece-type',
    bundle: {
      directory: 'modules',
      modules: getBundleModuleNames()
    },
    options: {
        name: 'erf-apostrophe-blogs',
        alias: 'erf-blog-entry',
        label: 'Blog Entry',
        pluralLabel: 'Blog Entries',
        autopublish: false,
        editRole: 'editor',
        publishRole: 'editor',
        quickCreate: true,
        slugPrefix: '',
    },
    filters: {
      add: {
        _tags: {
          label: 'Tag'
        },
      }
    },
    columns: {
      // 👇 Adds a column showing when the article was published.
      add: {
        _tags: {
          label: 'Tags',
          component: 'BlogTagList'
        }
      },
      order: [ 'title', '_tags', 'updatedAt' ]
    },
    fields: {
        add: {
          _category: {
                label: 'Category',
                type: 'relationship',
                withType: 'erf-apostrophe-blog-category',
                max: 1,
                required: true
            },
            _banner: {
                label: 'Blog Banner',
                type: 'relationship',
                withType: '@apostrophecms/image',
                max: 1,
                required: false
            },
            erf_main_content: {
                label: 'Content',
                type: 'area',
                required: true,
                options: {
                    widgets: {
                        'erf-apostrophe-blog-editor': {}
                    },
                    max: 1
                }
            },
            description: {
                label: 'Description',
                help: 'A short description for SEO tags.',
                required: false,
                type: 'string'
            },
            _tags: {
                type: 'relationship',
                label: 'apostrophe:tags',
                withType: 'erf-apostrophe-blog-tag',
                required: false,
                builders: {
                  // Include only the information you need with a projection
                  project: {
                    title: 1,
                    slug: 1,
                    highSearchWords: 1,
                  },
                }
            },
            _author: {
              type: 'relationship',
              label: 'Entry Author',
              help: 'Leave blank to autosync to current user.',
              withType: '@apostrophecms/user',
              max: 1,
              withRelationships: [ '_profileImage' ]
            },
            publishDate: {
              type: 'dateAndTime',
              label: 'Publish Date',
              help: 'Leave blank to autosync when document is officially published.',
            }
        },
        group: {
          basics: {
            label: 'Content',
            fields: [
              'title', 'description', '_category', '_banner', 'erf_main_content', '_tags'
            ]
          },
          utility: {
            fields: ['_author', 'publishDate']
          }
        }
    },
    handlers(self){
      return{
        beforeSave: {
          syncAuthor(req, doc) {
            if(doc._author.length < 1){
              doc._author =[req.user]
              doc.authorIds =[req.user.aposDocId]
              doc.authorFields = {}
              doc.authorFields[req.user.aposDocId] = {}
            }
          },
          syncDate(req, doc){
            if(!doc.publishDate && req.query.aposMode !== 'draft'){
              doc.publishDate = new Date()
            }
          }
        }
      }
    }
}

function getBundleModuleNames() {
    const source = path.join(__dirname, './modules');
    return fs
        .readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => `${dirent.name}`);
}