module.exports = {
    extend: '@apostrophecms/piece-page-type',
    options: {
        name: 'erf-apostrophe-blog-page',
        label: 'Blog Page',
        pluralLabel: 'Blog Pages',
        pieceModuleName: 'erf-apostrophe-blogs',
        alias: 'erf-blog-page',
        perPage: 10,
        autoPark: true,
        prefix: 'articles',
        pageTitle: 'Articles',
        indexTemplateView: 'thumbnails'
    },
    webpack: {
        bundles: {
            'share-links': {
                templates: [ 'show' ]
            }
        }
    },
    components(self) {
        return {
          async ogTagsIndex(req, data) {},
          async ogTagsShow(req, data) {},
        }
    },
    beforeSuperClass(self){
        self.settings = defaultSettings;
    },
    async init(self){
        if(self.options.autoPark){
            self.apos.page.parked.push(  {
                slug: `/${self.options.prefix}`,
                parkedId: 'erf-blogs',
                title: self.options.pageTitle,
                type: 'erf-apostrophe-blog-page'
            })
        }

        await self.addSettingsCollection();
        await self.addDefaultSettings();
        self.addSettingsModal();
        self.addSettingsToAdminBar();
    },
    methods(self) {
        return {
            async getSettings() {
                let doc = await self.apos.db.collection(collectionName).findOne({'moduleType': self.__meta.name + ':published'})
                return doc.settings;
            },
            addSettingsModal() {
                self.apos.modal.add(
                    `${self.__meta.name}:settings`,
                    self.getComponentName('settingsModal', 'ApostropheBlogSettingsManager'),
                    {
                        moduleName: self.__meta.name,
                        groups: defaultSettings.groups,
                        icons: defaultSettings.icons,
                        saveRoute: '/v1/api/erf-apostrophe-blog-page/settings'
                    }
                );
            },
            addSettingsToAdminBar() {
                if (self.schema.length > 0) {
                  self.apos.adminBar.add(
                    `${self.__meta.name}:settings`,
                    'Blog Settings',
                    {
                      action: 'edit',
                      type: self.name
                    }
                  );
                }
            },
            buildIcons(settings){
                let data = '<div class="share-btn">';
                for(let i = 0; i < settings.socialMediaChoices.data.length; i++){
                    let choice = settings.socialMediaChoices.data[i];
                    let classColor = settings.socialMediaColors.data === 'og' ? 'social-button__'+choice : ''
                    let classFill = settings.socialMediaFill.data
                    let classStyle = settings.socialMediaStyle.data === 'inverted' ? 'inverted' : ''
                    data += `
                    <a class="social-button-link" data-id="${choice}">
                        <span class="social-button ${classColor} ${classFill} ${classStyle}">
                            ${defaultSettings.icons[choice]}
                        </span>
                    </a>`
                }
                data += '</div>';
                return data;
            },
            async addSettingsCollection(){
                await self.apos.db.collection(collectionName);
                await self.apos.db.collection(collectionName).createIndex({ moduleType: 'text' }, { unique: true });
            },
            async addDefaultSettings(){
                let doc = {
                    'moduleType': self.__meta.name + ':published',
                    'settings': {}
                }

                Object.keys(defaultSettings.fields).forEach(key =>{
                    doc.settings[key] = { data: defaultSettings.fields[key].def }
                })

                doc.settings.icons = self.buildIcons(doc.settings)
                try{
                    await self.apos.db.collection(collectionName).insertOne(doc)
                }catch(e){
                    console.log('Default Settings already exist')
                }
            }
        }
    },
    extendMethods(self) {
        return {
            getBrowserData(_super, req) {
                const data = _super(req);
                data.pageSettings = {
                    socialMedia : [
                        'facebook',
                        'twitter',
                        'reddit',
                        'linkedin',
                        'pinterest',
                        'tumblr',
                        'email'
                    ]
                },
                data.settingsSchema = self.settingsSchema;
                return data;
            },
            composeSchema(_super) {
                _super();
                self.settingsSchema = self.apos.schema.compose({
                    addFields: self.apos.schema.fieldsToArray(`Module ${self.__meta.name}`, defaultSettings.fields),
                    arrangeFields: self.apos.schema.groupsToArray([])
                }, self);
            },
            async indexPage(_super, req) {
                let settings = await self.getSettings()
                req.data.articleSettings = settings;
                return _super(req);
            },
            async showPage(_super, req) {
                let settings = await self.getSettings()
                req.data.articleSettings = settings;
                console.log(req);
                return _super(req);
            }
        };
    },
    routes(self) {
        return {
            get:{
                '/v1/api/erf-apostrophe-blog-page/settings': async (req, res) => {
                    try{
                        let settings = await self.getSettings();
                        return res.status(200).json({ 'settings': settings });
                    }catch(e){
                        return res.status(500).json({ 'message': 'An unkown error occurred' });
                    }
                }
            },
            post: {
                '/v1/api/erf-apostrophe-blog-page/settings': async (req, res) => {
                    let settings = req.body.settings;
                    settings.icons = self.buildIcons(req.body.settings);
                    // TODO: sanitize input
                    try{
                        let doc = await self.apos.db.collection(collectionName)
                        .findOneAndUpdate(
                            {'moduleType': self.__meta.name + ':published'},
                            { $set: { settings : settings } }
                        )
                        return res.status(200).json({ 'settings': doc });
                    }catch(e){
                        console.log(e)
                        return res.status(500).json({ 'message': 'An unkown error occurred' });
                    }
                }
            }
        };
    }
}

const collectionName = 'aposErfSettings';
const defaultSettings = {
    icons: {
        mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M464 64C490.5 64 512 85.49 512 112C512 127.1 504.9 141.3 492.8 150.4L275.2 313.6C263.8 322.1 248.2 322.1 236.8 313.6L19.2 150.4C7.113 141.3 0 127.1 0 112C0 85.49 21.49 64 48 64H464zM217.6 339.2C240.4 356.3 271.6 356.3 294.4 339.2L512 176V384C512 419.3 483.3 448 448 448H64C28.65 448 0 419.3 0 384V176L217.6 339.2z"/></svg>',
        fb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>',
        in: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"/></svg>',
        pi: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M204 6.5C101.4 6.5 0 74.9 0 185.6 0 256 39.6 296 63.6 296c9.9 0 15.6-27.6 15.6-35.4 0-9.3-23.7-29.1-23.7-67.8 0-80.4 61.2-137.4 140.4-137.4 68.1 0 118.5 38.7 118.5 109.8 0 53.1-21.3 152.7-90.3 152.7-24.9 0-46.2-18-46.2-43.8 0-37.8 26.4-74.4 26.4-113.4 0-66.2-93.9-54.2-93.9 25.8 0 16.8 2.1 35.4 9.6 50.7-13.8 59.4-42 147.9-42 209.1 0 18.9 2.7 37.5 4.5 56.4 3.4 3.8 1.7 3.4 6.9 1.5 50.4-69 48.6-82.5 71.4-172.8 12.3 23.4 44.1 36 69.3 36 106.2 0 153.9-103.5 153.9-196.8C384 71.3 298.2 6.5 204 6.5z"/></svg>',
        re: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M440.3 203.5c-15 0-28.2 6.2-37.9 15.9-35.7-24.7-83.8-40.6-137.1-42.3L293 52.3l88.2 19.8c0 21.6 17.6 39.2 39.2 39.2 22 0 39.7-18.1 39.7-39.7s-17.6-39.7-39.7-39.7c-15.4 0-28.7 9.3-35.3 22l-97.4-21.6c-4.9-1.3-9.7 2.2-11 7.1L246.3 177c-52.9 2.2-100.5 18.1-136.3 42.8-9.7-10.1-23.4-16.3-38.4-16.3-55.6 0-73.8 74.6-22.9 100.1-1.8 7.9-2.6 16.3-2.6 24.7 0 83.8 94.4 151.7 210.3 151.7 116.4 0 210.8-67.9 210.8-151.7 0-8.4-.9-17.2-3.1-25.1 49.9-25.6 31.5-99.7-23.8-99.7zM129.4 308.9c0-22 17.6-39.7 39.7-39.7 21.6 0 39.2 17.6 39.2 39.7 0 21.6-17.6 39.2-39.2 39.2-22 .1-39.7-17.6-39.7-39.2zm214.3 93.5c-36.4 36.4-139.1 36.4-175.5 0-4-3.5-4-9.7 0-13.7 3.5-3.5 9.7-3.5 13.2 0 27.8 28.5 120 29 149 0 3.5-3.5 9.7-3.5 13.2 0 4.1 4 4.1 10.2.1 13.7zm-.8-54.2c-21.6 0-39.2-17.6-39.2-39.2 0-22 17.6-39.7 39.2-39.7 22 0 39.7 17.6 39.7 39.7-.1 21.5-17.7 39.2-39.7 39.2z"/></svg>',
        tu: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M309.8 480.3c-13.6 14.5-50 31.7-97.4 31.7-120.8 0-147-88.8-147-140.6v-144H17.9c-5.5 0-10-4.5-10-10v-68c0-7.2 4.5-13.6 11.3-16 62-21.8 81.5-76 84.3-117.1.8-11 6.5-16.3 16.1-16.3h70.9c5.5 0 10 4.5 10 10v115.2h83c5.5 0 10 4.4 10 9.9v81.7c0 5.5-4.5 10-10 10h-83.4V360c0 34.2 23.7 53.6 68 35.8 4.8-1.9 9-3.2 12.7-2.2 3.5.9 5.8 3.4 7.4 7.9l22 64.3c1.8 5 3.3 10.6-.4 14.5z"/></svg>',
        tw: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"/></svg>'
    },
    groups: {
        metaData: {
            items: ['blogTitle', 'siteName', 'blogDescription', 'previewImage'],
            label: 'MetaData',
            help: 'This section is for Search Engine Optimization (SEO) purposes on your listings page.',
            preview: false
        },
        template: {
            items: ['indexTemplate'],
            label: 'Template',
            preview: {
                list: '<div class="article-preview  article-list"><div class="article-list-item"></div><div class="article-list-item"></div><div class="article-list-item"></div></div>',
                thumbnails: '<div class="article-preview article-thumbnails"><div class="article-thumb"></div><div class="article-thumb"></div><div class="article-thumb"></div><div class="article-thumb"></div><div class="article-thumb"></div><div class="article-thumb"></div></div>',
            }
        },
        social: {
            label: 'Social Media Icons',
            items: ['socialMediaChoices', 'socialMediaFill', 'socialMediaStyle', 'socialMediaColors'],
            preview: true
        }
    },
    fields:{
        siteName: {
            label: 'Site Name',
            help: 'A name for your website or brand.',
            type: 'string'
        },
        previewImage: {
            label: 'Preview Image',
            help: 'An image that encompasses your content.',
            type: 'relationship',
            withType: '@apostrophecms/image',
            max: 1,
        },
        blogTitle: {
            label: 'Title',
            help: 'A short title.',
            type: 'string'
        },
        blogDescription: {
            label: 'Description',
            help: 'A brief description about your content.',
            type: 'string'
        },
        indexTemplate: {
            label: "Template type for showing all items.",
            type: 'radio',
            choices: [
                {
                    label: 'List',
                    value: 'list'
                },
                {
                    label: 'Thumbnails',
                    value: 'thumbnails'
                },
            ],
            def: 'thumbnails',
        },
        socialMediaChoices: {
            label: "Websites for your share links.",
            type: 'checkboxes',
            help: 'If you want to change the order of the icons, deselect and reselect the options in your intended order.',
            choices: [
                {
                    label: 'Email',
                    value: 'mail'
                },
                {
                    label: 'Facebook',
                    value: 'fb'
                },
                {
                    label: 'LinkedIn',
                    value: 'in'
                },
                {
                    label: 'Pinterest',
                    value: 'pi'
                },
                {
                    label: 'Reddit',
                    value: 're'
                },
                {
                    label: 'Tumblr',
                    value: 'tu'
                },
                {
                    label: 'Twitter',
                    value: 'tw'
                },
            ],
            def: [
                'mail',
                'fb',
                'in',
                'pi',
                're',
                'tu',
                'tw'
            ],
        },
        socialMediaFill: {
            label: 'Fill of Icons',
            type: 'radio',
            choices: [
                {
                    label: 'Linear',
                    value: 'linear'
                },
                {
                    label: 'Solid',
                    value: 'solid'
                }
            ],
            def: 'solid',
        },
        socialMediaStyle: {
            label: 'Fill Location',
            type: 'radio',
            choices: [
                {
                    label: 'Standard',
                    value: 'standard'
                },
                {
                    label: 'Inverted',
                    value: 'inverted'
                }
            ],
            def: 'standard',
        },
        socialMediaColors: {
            label: 'Color of Icons',
            type: 'radio',
            help: 'You will need to set a css variable named "a-primary" to properly see a preview for the "Theme Based" option.',
            choices: [
                {
                    label: 'Theme Based',
                    value: 'theme'
                },
                {
                    label: 'Original Brand Colors',
                    value: 'og'
                }
            ],
            def: 'og'
        }
    }
};