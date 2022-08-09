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
                    def: true
                },
            },
            group: {
                basics: {
                  label: 'apostrophe:basics',
                  fields: [
                    'title',
                    'allowNameSplit',
                    'firstName',
                    'lastName'
                  ]
                },
                profile: {
                  label: 'Profile for SEO',
                  fields: [
                    'twitterHandle',
                    'gravatarUrl',
                    '_profileImage'
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
            'apostrophe:ready': {
                addToProfile() {
                  if(self.apos.modules['erf-apostrophe-blog-user-page']){
                    self.addUrlPropertyToUser()
                    self.addPagePreviewToManager()
                  }
                }
            },
            beforeSave: {
                async keepTwitterHandleStandard(req, doc){
                    doc.twitterHandle = doc.twitterHandle.replace(/@/g, "");
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
  