module.exports = {
    extend: '@apostrophecms/piece-type',
    options: {
        label: 'Blog Category',
        name: 'erf-apostrophe-blog-category',
        slugPrefix: 'category-',
        pluralLabel: 'Blog Categories',
        quickCreate: false,
        autopublish: true,
        editRole: 'editor',
        publishRole: 'editor',
        sort: {
            slug: 1
        },
    },
    fields: {
        remove: [ 'visibility' ]
    }
};
  