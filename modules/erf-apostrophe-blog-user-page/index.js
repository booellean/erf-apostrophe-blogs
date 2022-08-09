module.exports = {
    extend: '@apostrophecms/piece-page-type',
    options: {
        name: 'erf-apostrophe-blog-user-page',
        label: 'OG Profile Page',
        pluralLabel: 'OG Profile Pages',
        pieceModuleName: '@apostrophecms/user',
        alias: 'erf-blog-user-page',
        perPage: 10,
        autoPark: true,
        prefix: 'og/profile',
        pageTitle: 'OG Profiles',
    },
    async init(self){
        if(self.options.autoPark){
            self.apos.page.parked.push(  {
                slug: `/${self.options.prefix}`,
                parkedId: 'erf-blogs-user',
                title: self.options.pageTitle,
                type: 'erf-apostrophe-blog-user-page'
            })
        }
    }
}