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
        indexTemplateView: 'thumbnails',
        addOGTags: true
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
          async ogTagsIndex(req, data) {
                let settings = await self.getSettings()
                return { articleSettings: settings }
          },
          async ogTagsShow(req, data) {
            let hasProfileActive = self.apos.modules['erf-apostrophe-blog-user-page']
            return { hasProfileActive : hasProfileActive }
          },
        }
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

        if(self.options.addOGTags) self.apos.template.prepend('head', 'erf-apostrophe-blog-page:ogTagsIndex');
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
                        <span class="social-button ${classColor} ${classStyle}">
                            ${defaultSettings.icons[classFill][choice]}
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
            async showPage(_super, req) {
                let settings = await self.getSettings()
                req.data.articleSettings = settings;
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

let articleListItemTemplate = `
    <div class="article-list-item">
        <div class="list svg-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z"/></svg>
        </div>
        <div class="list content-container">
            <div class="title-mock"></div>
            <div class="description-mock"></div>
        </div>
    </div>
`
let articleThumbItemTempalte = `
    <div class="article-thumb">
        <div class="thumb svg-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M480 80C480 35.82 515.8 0 560 0C604.2 0 640 35.82 640 80C640 124.2 604.2 160 560 160C515.8 160 480 124.2 480 80zM0 456.1C0 445.6 2.964 435.3 8.551 426.4L225.3 81.01C231.9 70.42 243.5 64 256 64C268.5 64 280.1 70.42 286.8 81.01L412.7 281.7L460.9 202.7C464.1 196.1 472.2 192 480 192C487.8 192 495 196.1 499.1 202.7L631.1 419.1C636.9 428.6 640 439.7 640 450.9C640 484.6 612.6 512 578.9 512H55.91C25.03 512 .0006 486.1 .0006 456.1L0 456.1z"/></svg>
        </div>
        <div class="thumb content-container">
            <div class="title-mock"></div>
            <div class="description-mock"></div>
        </div>
    </div>
`

const collectionName = 'aposErfSettings';
const defaultSettings = {
    icons: {
        solid: {
            mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M464 64C490.5 64 512 85.49 512 112C512 127.1 504.9 141.3 492.8 150.4L275.2 313.6C263.8 322.1 248.2 322.1 236.8 313.6L19.2 150.4C7.113 141.3 0 127.1 0 112C0 85.49 21.49 64 48 64H464zM217.6 339.2C240.4 356.3 271.6 356.3 294.4 339.2L512 176V384C512 419.3 483.3 448 448 448H64C28.65 448 0 419.3 0 384V176L217.6 339.2z"/></svg>',
            fb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/></svg>',
            in: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"/></svg>',
            pi: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M204 6.5C101.4 6.5 0 74.9 0 185.6 0 256 39.6 296 63.6 296c9.9 0 15.6-27.6 15.6-35.4 0-9.3-23.7-29.1-23.7-67.8 0-80.4 61.2-137.4 140.4-137.4 68.1 0 118.5 38.7 118.5 109.8 0 53.1-21.3 152.7-90.3 152.7-24.9 0-46.2-18-46.2-43.8 0-37.8 26.4-74.4 26.4-113.4 0-66.2-93.9-54.2-93.9 25.8 0 16.8 2.1 35.4 9.6 50.7-13.8 59.4-42 147.9-42 209.1 0 18.9 2.7 37.5 4.5 56.4 3.4 3.8 1.7 3.4 6.9 1.5 50.4-69 48.6-82.5 71.4-172.8 12.3 23.4 44.1 36 69.3 36 106.2 0 153.9-103.5 153.9-196.8C384 71.3 298.2 6.5 204 6.5z"/></svg>',
            re: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M440.3 203.5c-15 0-28.2 6.2-37.9 15.9-35.7-24.7-83.8-40.6-137.1-42.3L293 52.3l88.2 19.8c0 21.6 17.6 39.2 39.2 39.2 22 0 39.7-18.1 39.7-39.7s-17.6-39.7-39.7-39.7c-15.4 0-28.7 9.3-35.3 22l-97.4-21.6c-4.9-1.3-9.7 2.2-11 7.1L246.3 177c-52.9 2.2-100.5 18.1-136.3 42.8-9.7-10.1-23.4-16.3-38.4-16.3-55.6 0-73.8 74.6-22.9 100.1-1.8 7.9-2.6 16.3-2.6 24.7 0 83.8 94.4 151.7 210.3 151.7 116.4 0 210.8-67.9 210.8-151.7 0-8.4-.9-17.2-3.1-25.1 49.9-25.6 31.5-99.7-23.8-99.7zM129.4 308.9c0-22 17.6-39.7 39.7-39.7 21.6 0 39.2 17.6 39.2 39.7 0 21.6-17.6 39.2-39.2 39.2-22 .1-39.7-17.6-39.7-39.2zm214.3 93.5c-36.4 36.4-139.1 36.4-175.5 0-4-3.5-4-9.7 0-13.7 3.5-3.5 9.7-3.5 13.2 0 27.8 28.5 120 29 149 0 3.5-3.5 9.7-3.5 13.2 0 4.1 4 4.1 10.2.1 13.7zm-.8-54.2c-21.6 0-39.2-17.6-39.2-39.2 0-22 17.6-39.7 39.2-39.7 22 0 39.7 17.6 39.7 39.7-.1 21.5-17.7 39.2-39.7 39.2z"/></svg>',
            tu: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M309.8 480.3c-13.6 14.5-50 31.7-97.4 31.7-120.8 0-147-88.8-147-140.6v-144H17.9c-5.5 0-10-4.5-10-10v-68c0-7.2 4.5-13.6 11.3-16 62-21.8 81.5-76 84.3-117.1.8-11 6.5-16.3 16.1-16.3h70.9c5.5 0 10 4.5 10 10v115.2h83c5.5 0 10 4.4 10 9.9v81.7c0 5.5-4.5 10-10 10h-83.4V360c0 34.2 23.7 53.6 68 35.8 4.8-1.9 9-3.2 12.7-2.2 3.5.9 5.8 3.4 7.4 7.9l22 64.3c1.8 5 3.3 10.6-.4 14.5z"/></svg>',
            tw: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"/></svg>'
        },
        linear: {
            mail: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.1.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M0 128C0 92.65 28.65 64 64 64H448C483.3 64 512 92.65 512 128V384C512 419.3 483.3 448 448 448H64C28.65 448 0 419.3 0 384V128zM48 128V150.1L220.5 291.7C241.1 308.7 270.9 308.7 291.5 291.7L464 150.1V127.1C464 119.2 456.8 111.1 448 111.1H64C55.16 111.1 48 119.2 48 127.1L48 128zM48 212.2V384C48 392.8 55.16 400 64 400H448C456.8 400 464 392.8 464 384V212.2L322 328.8C283.6 360.3 228.4 360.3 189.1 328.8L48 212.2z"/></svg>',
            fb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="50px" height="50px"><path d="M 30.140625 2 C 26.870375 2 24.045399 2.9969388 22.0625 4.9667969 C 20.079601 6.936655 19 9.823825 19 13.367188 L 19 18 L 13 18 A 1.0001 1.0001 0 0 0 12 19 L 12 27 A 1.0001 1.0001 0 0 0 13 28 L 19 28 L 19 47 A 1.0001 1.0001 0 0 0 20 48 L 28 48 A 1.0001 1.0001 0 0 0 29 47 L 29 28 L 36 28 A 1.0001 1.0001 0 0 0 36.992188 27.125 L 37.992188 19.125 A 1.0001 1.0001 0 0 0 37 18 L 29 18 L 29 14 C 29 12.883334 29.883334 12 31 12 L 37 12 A 1.0001 1.0001 0 0 0 38 11 L 38 3.3457031 A 1.0001 1.0001 0 0 0 37.130859 2.3554688 C 36.247185 2.2382213 33.057174 2 30.140625 2 z M 30.140625 4 C 32.578477 4 34.935105 4.195047 36 4.2949219 L 36 10 L 31 10 C 28.802666 10 27 11.802666 27 14 L 27 19 A 1.0001 1.0001 0 0 0 28 20 L 35.867188 20 L 35.117188 26 L 28 26 A 1.0001 1.0001 0 0 0 27 27 L 27 46 L 21 46 L 21 27 A 1.0001 1.0001 0 0 0 20 26 L 14 26 L 14 20 L 20 20 A 1.0001 1.0001 0 0 0 21 19 L 21 13.367188 C 21 10.22255 21.920305 7.9269075 23.472656 6.3847656 C 25.025007 4.8426237 27.269875 4 30.140625 4 z"/></svg>',
            in: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45.959 45.959"><g><path d="M5.392,0.492C2.268,0.492,0,2.647,0,5.614c0,2.966,2.223,5.119,5.284,5.119c1.588,0,2.956-0.515,3.957-1.489    c0.96-0.935,1.489-2.224,1.488-3.653C10.659,2.589,8.464,0.492,5.392,0.492z M7.847,7.811C7.227,8.414,6.34,8.733,5.284,8.733    C3.351,8.733,2,7.451,2,5.614c0-1.867,1.363-3.122,3.392-3.122c1.983,0,3.293,1.235,3.338,3.123    C8.729,6.477,8.416,7.256,7.847,7.811z"/><path d="M0.959,45.467h8.988V12.422H0.959V45.467z M2.959,14.422h4.988v29.044H2.959V14.422z"/><path d="M33.648,12.422c-4.168,0-6.72,1.439-8.198,2.792l-0.281-2.792H15v33.044h9.959V28.099c0-0.748,0.303-2.301,0.493-2.711    c1.203-2.591,2.826-2.591,5.284-2.591c2.831,0,5.223,2.655,5.223,5.797v16.874h10v-18.67    C45.959,16.92,39.577,12.422,33.648,12.422z M43.959,43.467h-6V28.593c0-4.227-3.308-7.797-7.223-7.797    c-2.512,0-5.358,0-7.099,3.75c-0.359,0.775-0.679,2.632-0.679,3.553v15.368H17V14.422h6.36l0.408,4.044h1.639l0.293-0.473    c0.667-1.074,2.776-3.572,7.948-3.572c4.966,0,10.311,3.872,10.311,12.374V43.467z"/></g></svg>',
            pi: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50.141 50.141"><g><path d="M44.092,12.485c-0.76-2.567-1.98-4.728-3.732-6.606c-1.713-1.837-3.684-3.23-6.026-4.259   c-2.668-1.169-5.761-1.737-8.716-1.6c-1.078,0.049-2.131,0.106-3.163,0.255c-2.908,0.416-5.469,1.283-7.828,2.65   C11.616,4.673,9.265,7.049,7.64,9.989c-0.844,1.53-1.675,4.228-2.028,5.99c-0.418,2.078-0.05,5.681,0.789,7.713   c1.048,2.533,1.91,3.656,4.013,5.223c0.013,0.009,1.313,0.945,2.179,0.931c1.577-0.03,1.891-1.539,2.041-2.264   c0.028-0.137,0.056-0.272,0.089-0.399c0.029-0.112,0.067-0.232,0.106-0.357c0.223-0.72,0.526-1.706,0.023-2.58   c-0.189-0.328-0.413-0.583-0.61-0.807c-0.107-0.122-0.215-0.24-0.302-0.37c-0.748-1.111-1.127-2.501-1.127-4.131   c0-2.139,0.484-4.077,1.481-5.923c1.808-3.349,4.808-5.462,8.677-6.114c2.202-0.369,4.768-0.214,6.693,0.402   c1.759,0.564,3.256,1.561,4.33,2.886c1.137,1.402,1.787,3.18,1.931,5.286c0.094,1.344-0.028,2.698-0.129,3.597   c-0.389,3.461-1.396,6.247-2.994,8.282c-1.309,1.67-2.72,2.507-4.315,2.561c-1.027,0.04-1.795-0.17-2.489-0.667   c-0.655-0.467-1.045-1.043-1.229-1.81c-0.208-0.876,0.043-1.784,0.31-2.746l0.043-0.154c0.233-0.846,0.477-1.619,0.716-2.38   c0.376-1.199,0.766-2.438,1.087-3.876c0.363-1.623,0.411-2.934,0.148-4.005c-0.324-1.33-1.039-2.326-2.125-2.962   c-1.149-0.67-2.777-0.799-4.144-0.329c-2.037,0.695-3.591,2.545-4.264,5.075c-0.341,1.285-0.44,2.634-0.293,4.006   c0.113,1.076,0.354,2.054,0.799,3.235c-0.015,0.051-0.031,0.105-0.047,0.157c-0.032,0.105-0.061,0.207-0.083,0.294   c-0.479,2-0.945,3.972-1.41,5.94c-0.441,1.869-0.883,3.735-1.334,5.62l-0.102,0.422c-0.462,1.92-0.938,3.906-1.049,6.277   l-0.05,0.99c-0.098,1.842-0.197,3.747,0.05,5.509c0.049,0.344,0.157,1.115,0.916,1.384c0.227,0.17,0.445,0.242,0.657,0.242   c0.635,0,1.2-0.645,1.681-1.192c1.569-1.784,2.903-4.037,4.079-6.885c0.526-1.274,0.875-2.645,1.212-3.971l0.203-0.79   c0.246-0.944,0.487-1.901,0.726-2.848l0.016-0.063c0.443,0.388,0.955,0.738,1.548,1.063c1.255,0.695,2.671,1.1,4.207,1.203   c1.44,0.098,2.956-0.087,4.629-0.567c1.271-0.362,2.487-0.913,3.617-1.636c4.054-2.596,6.817-7.137,7.781-12.786   c0.289-1.688,0.412-3.045,0.412-4.537C44.703,15.41,44.498,13.846,44.092,12.485z M42.32,21.332   c-0.869,5.088-3.315,9.15-6.889,11.438c-0.966,0.619-2.005,1.088-3.09,1.398c-1.446,0.416-2.738,0.577-3.942,0.495   c-1.261-0.085-2.364-0.398-3.379-0.96c-1.015-0.555-1.673-1.158-2.135-1.955l-1.226-2.118l-1.105,4.337   c-0.237,0.941-0.477,1.893-0.722,2.832l-0.205,0.802c-0.335,1.315-0.65,2.558-1.123,3.7c-1.053,2.552-2.229,4.571-3.589,6.163   c-0.106-1.355-0.026-2.875,0.052-4.352l0.051-1.002c0.101-2.182,0.556-4.073,0.995-5.902l0.103-0.425   c0.451-1.886,0.893-3.755,1.335-5.625c0.465-1.967,0.93-3.937,1.408-5.932c0.014-0.056,0.034-0.122,0.055-0.191   c0.12-0.403,0.245-0.82,0.076-1.243c-0.429-1.099-0.655-1.976-0.756-2.932c-0.12-1.13-0.041-2.234,0.238-3.282   c0.498-1.873,1.583-3.22,2.979-3.696c0.346-0.119,0.708-0.169,1.056-0.169c0.567,0,1.093,0.136,1.431,0.333   c0.607,0.356,0.997,0.914,1.19,1.71c0.185,0.756,0.133,1.797-0.156,3.094c-0.304,1.355-0.663,2.5-1.044,3.713   c-0.246,0.782-0.495,1.576-0.735,2.446l-0.042,0.152c-0.308,1.109-0.656,2.366-0.328,3.744c0.298,1.248,0.956,2.22,2.011,2.974   c1.048,0.749,2.278,1.084,3.72,1.039c2.191-0.074,4.149-1.193,5.821-3.325c1.831-2.332,2.978-5.458,3.409-9.295   c0.108-0.978,0.241-2.452,0.137-3.957c-0.174-2.524-0.972-4.68-2.373-6.408c-1.319-1.627-3.143-2.848-5.273-3.531   c-2.211-0.709-5.137-0.891-7.635-0.471c-4.5,0.758-7.994,3.225-10.106,7.136c-1.158,2.146-1.721,4.394-1.721,6.873   c0,2.036,0.493,3.801,1.467,5.247c0.134,0.2,0.294,0.386,0.46,0.574c0.149,0.17,0.29,0.33,0.376,0.479   c0.061,0.163-0.113,0.727-0.197,0.998c-0.047,0.153-0.092,0.3-0.128,0.437c-0.042,0.16-0.078,0.331-0.114,0.503   c-0.039,0.188-0.099,0.479-0.162,0.639c-0.237-0.093-0.67-0.331-0.904-0.504c-1.797-1.338-2.456-2.199-3.358-4.382   c-0.677-1.641-1.013-4.888-0.677-6.556c0.375-1.869,1.174-4.248,1.818-5.417c1.447-2.619,3.546-4.739,6.239-6.301   c2.133-1.236,4.457-2.022,7.109-2.401c0.943-0.137,1.943-0.19,2.971-0.237c2.65-0.125,5.429,0.385,7.819,1.433   c2.088,0.917,3.844,2.157,5.367,3.792c1.536,1.646,2.607,3.546,3.277,5.81c0.351,1.177,0.528,2.55,0.528,4.078   C42.703,18.505,42.588,19.761,42.32,21.332z"/></g></svg>',
            re: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25.2 21.13"><path d="M0,10.42c.05-.23,.1-.46,.16-.69,.44-1.54,1.81-2.63,3.41-2.69,.76-.03,1.47,.19,2.04,.57,.89-.37,1.72-.74,2.57-1.05,1.12-.4,2.28-.58,3.47-.65,.18-.01,.25-.09,.3-.24,.57-1.66,1.15-3.33,1.73-4.99,.03-.09,.07-.18,.11-.29,.92,.22,1.83,.44,2.73,.65,.39,.09,.78,.18,1.17,.28,.16,.04,.23,0,.32-.12,.7-.94,1.65-1.35,2.8-1.15,1.13,.19,1.91,.87,2.25,1.96,.36,1.17,.06,2.21-.86,3.03-.84,.75-2.09,.92-3.1,.41-1.09-.55-1.64-1.45-1.63-2.67,0-.06,0-.11,0-.19l-2.86-.68-1.38,3.97c.43,.04,.83,.07,1.23,.12,1.75,.19,3.4,.68,4.94,1.53,.12,.06,.21,.08,.33,0,2.18-1.25,4.81,.02,5.35,2.41,.36,1.59-.13,2.93-1.4,3.96-.15,.12-.19,.26-.22,.43-.21,1.23-.76,2.29-1.59,3.21-1.21,1.34-2.72,2.22-4.41,2.81-1.91,.67-3.88,.89-5.89,.75-2.21-.16-4.31-.75-6.19-1.95-1.35-.86-2.45-1.95-3.09-3.44-.19-.45-.28-.94-.42-1.41-.03-.09-.06-.2-.13-.24C.75,13.38,.19,12.45,.03,11.27c0-.02-.02-.05-.03-.07,0-.26,0-.53,0-.79Zm13.43,9.45c1.05,0,2.86-.34,4.54-1.07,1.37-.59,2.55-1.43,3.43-2.67,1.12-1.57,1.12-3.68,0-5.25-.91-1.27-2.13-2.11-3.54-2.72-1.83-.78-3.75-1.07-5.74-1-1.91,.07-3.73,.48-5.43,1.38-1.31,.69-2.42,1.6-3.11,2.95-.68,1.33-.68,2.68,0,4.02,.69,1.36,1.81,2.27,3.12,2.96,1.86,.98,3.86,1.37,6.72,1.4ZM21.91,2.87c0-.87-.7-1.58-1.57-1.59-.87-.01-1.6,.72-1.6,1.59,0,.88,.72,1.6,1.6,1.59,.87,0,1.57-.72,1.57-1.59ZM1.9,12.5c.17-.83,.48-1.56,.93-2.23,.45-.68,1.02-1.26,1.65-1.79-1.01-.4-2.09-.05-2.76,.89-.64,.9-.58,2.26,.18,3.12Zm18.92-4.03c1.25,1.03,2.19,2.26,2.57,3.88,.64-.79,.76-2.18-.11-3.21-.59-.71-1.74-1.05-2.47-.67Z"/><path d="M12.36,18.34c-1.27-.04-2.61-.43-3.81-1.25-.35-.24-.44-.63-.22-.93,.21-.3,.6-.34,.96-.11,2,1.32,4.04,1.35,6.12,.21,.17-.09,.32-.2,.49-.28,.33-.18,.7-.08,.88,.22,.17,.29,.08,.67-.22,.86-1.22,.8-2.54,1.27-4.19,1.28Z"/><path d="M10.54,12.21c0,.93-.76,1.69-1.69,1.69-.92,0-1.69-.76-1.7-1.69-.01-.93,.77-1.71,1.71-1.7,.93,0,1.68,.77,1.68,1.7Z"/><path d="M14.46,12.22c0-.93,.74-1.69,1.67-1.7,.93-.01,1.72,.76,1.71,1.7,0,.92-.77,1.69-1.69,1.7-.92,0-1.69-.76-1.69-1.69Z"/></svg>',
            tu: '<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24"><path d="M10.5071 2.25167C10.5238 2.25056 10.5404 2.25 10.5571 2.25H13.1029C13.5171 2.25 13.8529 2.58579 13.8529 3V6.71382H16.5902C17.0044 6.71382 17.3402 7.04961 17.3402 7.46382V10.0793C17.3402 10.4936 17.0044 10.8293 16.5902 10.8293H13.8529V15.5109C13.8529 15.5482 13.8501 15.5855 13.8445 15.6225C13.8269 15.7399 13.8364 15.8597 13.8724 15.9729C13.9083 16.086 13.9698 16.1894 14.052 16.275C14.1343 16.3607 14.235 16.4263 14.3466 16.4669C14.4582 16.5074 14.5776 16.5218 14.6956 16.509C14.7142 16.507 14.7329 16.5056 14.7516 16.505C15.1471 16.4917 15.537 16.4075 15.9027 16.2563C16.0955 16.1766 16.3127 16.1808 16.5023 16.2679C16.6919 16.355 16.8366 16.5171 16.9017 16.7153L17.7125 19.1826C17.7851 19.4036 17.7511 19.6457 17.6204 19.8382C17.4495 20.0898 17.1888 20.2794 16.9571 20.4165C16.7082 20.5638 16.4139 20.6961 16.1007 20.807C15.4792 21.0271 14.7188 21.1859 13.9808 21.1868C11.8845 21.219 10.3659 20.4612 9.37895 19.362C8.41035 18.2833 7.99368 16.9206 7.99368 15.7812V10.8293H7C6.58579 10.8293 6.25 10.4936 6.25 10.0793V7.82999C6.25 7.51813 6.44299 7.2388 6.73469 7.12848C7.56531 6.81435 8.2866 6.26537 8.81065 5.54846C9.33255 4.83449 9.63637 3.98469 9.68551 3.10183C9.69243 2.88909 9.77622 2.68563 9.92193 2.52952C10.0746 2.36593 10.2838 2.26659 10.5071 2.25167ZM11.1252 3.75C10.9799 4.71769 10.6025 5.63904 10.0216 6.43365C9.42988 7.24316 8.64874 7.8914 7.75 8.32373V9.32934H8.74368C9.15789 9.32934 9.49368 9.66512 9.49368 10.0793V15.7812C9.49368 16.586 9.79628 17.5816 10.4951 18.3599C11.1746 19.1167 12.2695 19.7141 13.9626 19.6869L13.9747 19.6867C14.5164 19.6867 15.1093 19.5669 15.5999 19.3931C15.809 19.319 15.9875 19.2394 16.1272 19.1631L15.7078 17.8868C15.4194 17.9525 15.1251 17.9916 14.8285 18.0032C14.4919 18.0354 14.1522 17.9922 13.8341 17.8766C13.5068 17.7576 13.2112 17.5651 12.97 17.3138C12.7287 17.0626 12.5484 16.7593 12.4429 16.4274C12.3436 16.1151 12.313 15.7852 12.3529 15.4604V10.0793C12.3529 9.66512 12.6887 9.32934 13.1029 9.32934H15.8402V8.21382H13.1029C12.6887 8.21382 12.3529 7.87803 12.3529 7.46382V3.75H11.1252Z"/></svg>',
            tw: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="M507.413,93.394c-3.709-2.51-8.607-2.383-12.174,0.327c-3.612,2.735-9.474,5.087-16.138,7.016    c18.245-21.301,18.623-35.541,18.408-38.893c-0.245-3.801-2.541-7.168-5.985-8.791c-3.459-1.612-7.51-1.23-10.587,1.005    c-21.893,15.908-43.689,19.373-56.791,19.76c-20.337-19.342-46.704-29.944-74.74-29.944c-60.271,0-109.307,49.684-109.307,110.751    c0,4.944,0.327,9.878,0.969,14.771C138.176,167.645,54.665,69.155,53.803,68.119c-2.184-2.617-5.5-4.041-8.929-3.714    c-3.398,0.296-6.444,2.235-8.148,5.189c-29.005,50.322-11.286,94.725,6.505,121.327c-1.837-1.092-3.342-2.097-4.372-2.857    c-3.143-2.337-7.337-2.725-10.852-0.995c-3.521,1.735-5.771,5.286-5.837,9.209c-0.786,48.255,21.764,76.49,43.674,92.49    c-2.372,0.327-4.597,1.459-6.266,3.276c-2.51,2.724-3.393,6.576-2.311,10.122c15.194,49.735,52.041,67.352,76.373,73.587    c-49.22,37.138-120.557,25.016-121.348,24.867c-4.73-0.831-9.464,1.663-11.408,6.082c-1.939,4.413-0.612,9.587,3.225,12.51    c52.464,40.041,115.21,48.913,160.53,48.913c34.272,0,58.573-5.077,60.91-5.582c228.617-54.179,235.864-263.063,235.394-298.66    c42.888-39.929,49.633-55.255,50.684-59.067C512.811,100.502,511.117,95.91,507.413,93.394z M443.283,151.752    c-2.33,2.143-3.56,5.235-3.346,8.398c0.036,0.561,3.536,57.179-21.694,120.266c-33.709,84.291-100.164,138.725-197.307,161.746    c-1.041,0.219-90.905,18.831-169.792-18.689c33.725-1.414,80.429-10.913,113.292-47.806c2.745-3.077,3.398-7.833,1.709-11.593    c-1.689-3.75-5.439-6.51-9.551-6.51c-0.02,0-0.041,0-0.071,0c-2.76,0-50.337-0.357-73.133-46.306    c9.219,0.398,20.24-0.145,29.122-4.237c4.092-1.888,6.51-6.1,6.005-10.574c-0.505-4.475-3.821-8.079-8.23-9.008    c-2.556-0.541-57.649-12.836-66.143-72.693c8.464,3.526,19.015,6.257,29.51,4.685c4.031-0.602,7.332-3.5,8.474-7.413    c1.138-3.908-0.107-8.13-3.184-10.809c-2.383-2.07-54.327-48.273-30.541-107.973c28.158,29.332,108.46,102.368,205.833,96.786    c3.107-0.179,5.975-1.74,7.82-4.25c1.843-2.51,2.471-5.709,1.71-8.728c-1.837-7.316-2.77-14.857-2.77-22.418    c0-49.546,39.658-89.853,88.409-89.853c23.842,0,46.203,9.515,62.97,26.796c1.923,1.985,4.556,3.122,7.322,3.174    c9.658,0.092,25.561-0.949,43.531-7.633c-5.359,6.275-12.852,13.622-23.332,21.852c-3.622,2.847-4.954,7.735-3.276,12.026    c1.684,4.301,6.056,7.02,10.566,6.607c2.112-0.168,12.352-1.071,24.352-3.505C464.662,131.4,455.494,140.523,443.283,151.752z"/></g></svg>',
        }
    },
    groups: {
        metaData: {
            items: ['blogTitle', 'siteName', 'blogDescription', 'previewImage'],
            label: 'MetaData',
            help: 'This section is for Search Engine Optimization (SEO) purposes. It will output OG tags to every page.',
            preview: false
        },
        template: {
            items: ['indexTemplate'],
            label: 'Template',
            preview: {
                list: `<div class="article-preview  article-list">
                    ${articleListItemTemplate}
                    ${articleListItemTemplate}
                    ${articleListItemTemplate}
                </div>`,
                thumbnails: `<div class="article-preview article-thumbnails">
                    ${articleThumbItemTempalte}
                    ${articleThumbItemTempalte}
                    ${articleThumbItemTempalte}
                    ${articleThumbItemTempalte}
                    ${articleThumbItemTempalte}
                    ${articleThumbItemTempalte}
                </div>`,
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
            help: '',
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
                'fb',
                'tw',
                're',
                'in',
                'pi',
                'tu',
                'mail'
            ],
        },
        socialMediaFill: {
            label: 'Fill of Icons',
            help: '',
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
            help: '',
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
            help: 'You will need to set a css variable named "--theme-base-color" to properly see a preview for the "Theme Based" option.',
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