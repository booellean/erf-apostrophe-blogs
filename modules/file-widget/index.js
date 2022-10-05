module.exports = {
    extend: '@apostrophecms/widget-type',
    options: {
      label: 'apostrophe:file',
      className: false,
      icon: 'file-icon',
    },
    fields: {
      add: {
        _file: {
          type: 'relationship',
          label: 'apostrophe:file',
          max: 1,
          required: true,
          withType: '@apostrophecms/file'
        }
      }
    }
  };
  