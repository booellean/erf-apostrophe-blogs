module.exports = {
    improve: '@apostrophecms/user',
    fields(self) {
        return {
            add: {
                allowNameSplit: {
                    type: 'boolean',
                    help: 'This is for SEO purposes since OG protocol only recognizes western standardized names.',
                    toggle: {
                      true: 'Allow',
                      false: 'Disable'
                    },
                    def: false
                },
                description: {
                    type: 'string',
                    label: 'Description',
                    help: 'A Description introducing yourself, shown under your articles.',
                    required: false,
                    textarea: true,
                    max: 800
                },
                blurb: {
                    type: 'string',
                    label: 'Blurb',
                    help: 'A brief blurb about yourself, shown under your profile picture.',
                    required: false,
                    textarea: true,
                    max: 230
                },
                firstName: {
                    type: 'string',
                    label: 'First Name',
                    required: false,
                    if: {
                      allowNameSplit: true
                    }
                },
                lastName: {
                    type: 'string',
                    label: 'Last Name',
                    required: false,
                    if: {
                      allowNameSplit: true
                    }
                },
                twitterHandle: {
                    type: 'string',
                    help: 'You do not need to include the "@".',
                    label: 'Twitter handle',
                    required: false,
                },
                gravatarUrl:{
                    label: 'Gravatar Url',
                    help: 'This will override any local profile photo. Simply paste your Gravatar url here.',
                    type: 'string',
                },
                _profileImage:{
                    label: 'Profile',
                    type: 'relationship',
                    withType: '@apostrophecms/image',
                    max: 1
                },
                visibleOnListing: {
                    type: 'boolean',
                    help: 'Visible to public',
                    toggle: {
                      true: 'Allow',
                      false: 'Disable'
                    },
                    def: false
                },
            },
            group: {
                basics: {
                  label: 'apostrophe:basics',
                  fields: [
                    'title',
                  ]
                },
                profile: {
                  label: 'Profile (SEO)',
                  fields: [
                    'allowNameSplit',
                    'firstName',
                    'lastName',
                    'twitterHandle',
                    'gravatarUrl',
                    '_profileImage',
                    'blurb',
                    'description'
                  ]
                },
                utility: {
                  fields: [
                    'username',
                    'email',
                    'password',
                    'visibleOnListing',
                    'slug',
                    'archived'
                  ]
                }
            }
        }
    },
    handlers(self){
        return {
            beforeSave: {
                async keepTwitterHandleStandard(req, doc){
                  if(doc.twitterHandle){
                    doc.twitterHandle = doc.twitterHandle.replace(/@/g, "");
                  }
                }
            }
        }
    },
    methods(self){
        return {
            addUrlPropertyToUser(){

            },
            addPagePreviewToManager(){

            }
        }
    }
};
  