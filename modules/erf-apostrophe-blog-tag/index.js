module.exports = {
    extend: '@apostrophecms/piece-type',
    options: {
        label: 'Blog Tag',
        name: 'erf-apostrophe-blog-tag',
        pluralLabel: 'Blog Tags',
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
  