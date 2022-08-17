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
    },
    components(self) {
        return {
          async profileLink(req, data) {
                return { user: data.user || {}, prefix: self.options.prefix }
          }
        }
    },
    extendMethods(self){
        return {
            async beforeShow(_super, req) {
                console.log('this was reading', req.data)
                if( req.data.piece && !req.data.piece.visibleOnListing){
                    // return a 404 not found if the user wants to be unlisted
                    req.notFound = true;
                }
                return req
            }
        }
    }
}