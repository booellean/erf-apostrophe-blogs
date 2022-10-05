<template>
    <div :class="'se-main-content-wrapper' + (isNotNested ? '' : ' se-modal')">
      <textarea  ref="se-blog-container" class="se-blog-editor-container"></textarea>
  </div>
</template>

<script>
import suneditor from 'suneditor'
import plugins from 'suneditor/src/plugins'
import config from 'erf-apostrophe-blogs/modules/erf-apostrophe-blog-editor-widget/helpers/config'
// import deepArrayAssign from 'erf-apostrophe-grapesjs-widget/helpers/deepArrayAssign'

export default {
  name: 'ApostropheRTEWidgetEditorPrimary',

  emits: [ 'update', 'close' ],

  props: {
    type: {
      type: String,
      required: true
    },
    options: {
      type: Object,
      required: true
    },
    value: {
      type: Object,
      default: () => {}
    },
    docId: {
      type: String,
      required: false,
      default() {
        return null;
      }
    },
    focused: {
      type: Boolean,
      required: false
    },
    isNotNested: {
      type: Boolean,
      required: false
    }
  },
  data() {
    return {
      loaded: false,
      pending: null,
      widgetOptions: apos['blog-editor'].defaultOptions,
      moduleOptions: apos.modules[apos.area.widgetManagers[this.type]],
      editorToolbar: null,
      editorBody: null,
      imageSchema: apos['blog-editor'].schema.find( el => el.withType === '@apostrophecms/image') || {},
      fileSchema: apos['blog-editor'].schema.find( el => el.withType === '@apostrophecms/file') || {},
      docFields: {
        data: {
          ...this.$props.value
        },
        hasErrors: false
      },
      editor: null,
    };
  },
  mounted(){

    console.log('props', this.$props)
    
    // disable scroll on background body 
    if(!this.$props.isNotNested) document.body.style.overflow = 'hidden'

    var self = this;
    // If you need to edit config values (such as function passed into props), do so here
    let customPlugins = [
      {
        name: 'aposImageModal',
        display: 'command',
        title: 'Image Selector',
        innerHTML: '<div>image</div>',
        buttonClass: '',
        add: function(core, targetElement){
          console.log('opening...', core, targetElement)
          const rangeTag = core.util.createElement('div');
          core.util.addClass(rangeTag, '__se__format__range_custom');
          // @Required
          // Registering a namespace for caching as a plugin name in the context object
          core.context.customCommand = {
              targetButton: targetElement,
              tag: rangeTag
          };
        },
        action: async function() {
          const result = await window.apos.modal.execute("AposMediaManager", {
            moduleName: "@apostrophecms/image",
            relationshipField: {
              max: 1
            }, 
          });

          console.log(result);

          result.forEach( image => {
            this.plugins.image.create_image.call(this, image.attachment._urls.full, null, '100%', 'auto', null, { name: image.title, size: image.attachment.length }, image.alt);
            // TODO: set relationship of file id

            // Add a data tag to properly format when getting html
            let imgTag = this.context.image._element;
            console.log(JSON.stringify(image));
            if(imgTag) imgTag.setAttribute('data-apos-doc', JSON.stringify(image))

          })

        }
      },
      {
        name: 'aposVideoModal',
        display: 'command',
        title: 'Video Selector',
        innerHTML: '<div>video</div>',
        buttonClass: '',
        add: function(core, targetElement){
          console.log('opening...', core, targetElement)
          const rangeTag = core.util.createElement('div');
          core.util.addClass(rangeTag, '__se__format__range_custom');
          // @Required
          // Registering a namespace for caching as a plugin name in the context object
          core.context.customCommand = {
              targetButton: targetElement,
              tag: rangeTag
          };
        },
        action: async function() {
          const result = await window.apos.modal.execute("ApostropheRTEVideoEmbedManager", {
            value: {}
          });

          result.forEach( video => {
            let vid_link = video.items && video.items.length && video.items[0].player
              ? video.items[0].player.embedHtml
              : (video.embed && video.embed.html ? video.embed.html : '')
            
            this.plugins.video.setup_url.call(this, vid_link);
          })
        }
      },
      {
        name: 'aposFileModal',
        display: 'command',
        title: 'File Selector',
        innerHTML: '<div>file</div>',
        buttonClass: '',
        add: function(core, targetElement){
          console.log('opening...', core, targetElement)
          const rangeTag = core.util.createElement('div');
          core.util.addClass(rangeTag, '__se__format__range_custom');
            // @Required
          // Registering a namespace for caching as a plugin name in the context object
          core.context.customCommand = {
              targetButton: targetElement,
              tag: rangeTag
          };
        },
        action: async function() {
          const result = await window.apos.modal.execute("AposDocsManager", {
            moduleName: "@apostrophecms/file",
            relationshipField: {
              schema: self.fileSchema.schema,
              max: 1,
              withType: "@apostrophecms/file"
            },
          });

          console.log(result);

          result.forEach( file => {

            let anchor = {...this.context.anchor.caller.link, linkValue : window.location.origin + file._url, anchorText: { value: file.title }}
            anchor.downloadCheck.checked = true;

            let linkNode = this.plugins.anchor.createAnchor.call(this, anchor, false)
            if(linkNode) {
              linkNode.setAttribute('data-apos-doc', JSON.stringify(file))
              this.insertNode(linkNode, null, true)
            }
          })
        }
      }
    ];

    if(!this.$props.isNotNested){
      let save_plugin = {
        name: 'savePlugin',
        display: 'command',
        title: 'Save and Close',
        // TODO: make pretty
        innerHTML: '<span class="apos-button__label">Save & Close</span>',
        buttonClass: '',
        add: function(core, targetElement){
          console.log('opening...', core, targetElement)
          const rangeTag = core.util.createElement('div');
          core.util.addClass(rangeTag, '__se__format__range_custom');
          // @Required
          // Registering a namespace for caching as a plugin name in the context object
          core.context.customCommand = {
              targetButton: targetElement,
              tag: rangeTag
          };
        },
        action: async () => {
          this.saveAndClose()
        }
      }

      customPlugins.push(save_plugin);
    }

    this.editor = suneditor.create(this.$refs['se-blog-container'], {
      plugins: {
        ...plugins,
        ...customPlugins
      },
      ...(config(!this.$props.isNotNested))
    })

    console.log('editor', this.editor);

    // // Must always be last one... Load the former Project Data
    // if(this.$data.docFields.data.items && this.$data.docFields.data.items.projectData){
    //   // TODO: Fix
    //   this.editor.setContents(//contents)
    // }

    this.loaded = true;

    // If this is on a page instead of an editing modal
    if(!this.$props.isNotNested){
      this.editorToolbar = document.querySelector('.se-modal .se-container .se-toolbar')
      this.editorBody = document.querySelector('.se-modal .se-container .se-wrapper')
      this.formatBodyPosition()
      window.addEventListener('resize', this.formatBodyPosition)
    }
  },

  beforeDestroy(){
    // re-enable scroll on background body 
    // TODO: return to any original styling or remove
    if(!this.$props.isNotNested) {
      document.body.style.overflow = 'auto'
      window.removeEventListener('resize', this.formatBodyPosition)
    }
  },

  methods: {
    async editorUpdate() {
      // Hint that we are typing, even though we're going to
      // debounce the actual updates for performance
      if (this.docId === window.apos.adminBar.contextId) {
        apos.bus.$emit('context-editing');
      }
      // Debounce updates. We have our own plumbing for
      // this so that we can change our minds to update
      // right away if we lose focus.
      if (this.pending) {
        // Don't reset the timeout; we still want to save at
        // least once per second if the user is actively typing
        return;
      }
      this.pending = setTimeout(() => {
        this.emitWidgetUpdate();
      }, 1000);
    },
    emitWidgetUpdate() {
      if (this.pending) {
        clearTimeout(this.pending);
        this.pending = null;
      }
      const widget = this.docFields.data;
      // widget.images = deepArrayAssign(widget.items.projectData.pages[0].frames[0].component.components, 'picture')
      // widget.files = deepArrayAssign(widget.items.projectData.pages[0].frames[0].component.components, 'file')
      // ... removes need for deep watching in parent
      this.$emit('update', widget);
    },
    saveAndClose(){
      this.assignValue()

      // Save our relationships
      // Close
      this.$emit('close')
    },
    assignValue(){

      let regex = /:?(<img[^>]+data\-apos\-doc.+?>|<[a-zA-Z][^>]+data\-apos\-doc.*?<\/[a-zA-Z]>)/gm
      // Get array of html strings
      let htmlArray = this.editor.getContents().split(regex)

      // convert to a node array for apostrophe
      let nodeArray = htmlArray.map( string => {

        if(string.match(regex)){

          let parent = document.createElement('div')
          parent.innerHTML = string
          let node = parent.firstChild
          let docString = node.getAttribute('data-apos-doc')
          node.removeAttribute('data-apos-doc')
          node.removeAttribute('src')
          node.removeAttribute('href')
          node.removeAttribute('alt')

          let attrs = node.getAttributeNames().map( name => `${name}=${node.getAttribute(name)}`)

          // Format to a functional JSON object
          let aposData = JSON.parse(docString)
          let name = aposData.type.split('/')[1]
          let idName = `${name}Ids`
          let fieldName = `${name}Fields`
          aposData.attributes = attrs

          let returnObj = {
            attributes : attrs,
            metaType: 'widget',
            type: aposData.type,
            [idName] : [ aposData.aposDocId ],
            [fieldName] : { [aposData.aposDocId] : {} }
          }

          // returnObj[] = [ aposData.aposDocId ],
          // returnObj[] = { `${aposData.aposDocId}` : {} }

          return returnObj

        }

        return string;

      })

      this.docFields.data.items = nodeArray

      this.editorUpdate()
    },
    formatBodyPosition(){
      if(this.editorToolbar && this.editorBody){
        let offset = this.editorToolbar.scrollHeight
        this.editorBody.style.marginTop = (offset-60)+'px'
      }
    },
    b64toFile(b64Data, contentType, filename = 'file-edit', sliceSize = 512) {
      let byteCharacters = atob(b64Data);
      let byteArrays = [];
      let ext = contentType.split('/').pop()

      for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        let slice = byteCharacters.slice(offset, offset + sliceSize);

        let byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        let byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, {type: contentType});
      return new File([blob], `${filename}.${ext}`, { type : contentType, size: 2 });
    }
  }
};
</script>
<style>
  @import 'suneditor/dist/css/suneditor.min.css';

  .apos-modal__body.erf-apostrophe-blog-editor-content .apos-modal__body-inner,
  .apos-modal__body.erf-apostrophe-blog-editor-content .apos-modal__body-inner .apos-modal__body-main,
  .apos-modal__body.erf-apostrophe-blog-editor-content .apos-modal__body-inner .apos-modal__body-main .se-main-content-wrapper,
  .apos-modal__body.erf-apostrophe-blog-editor-content .apos-modal__body-inner .apos-modal__body-main .se-main-content-wrapper #suneditor_se-blog-container {
    height: 100%;
  }

  .apos-modal__body.erf-apostrophe-blog-editor-content .apos-modal__body-inner .apos-modal__body-main .se-main-content-wrapper #suneditor_se-blog-container .se-container {
    display: flex;
    flex-flow: column nowrap;
  }

  .apos-modal__body.erf-apostrophe-blog-editor-content .apos-modal__body-inner .apos-modal__body-main .se-main-content-wrapper #suneditor_se-blog-container .se-container .se-wrapper {
    flex-grow: 1;
    overflow: auto;
  }

  .se-modal .se-container .se-toolbar.sun-editor-common {
    position: fixed;
    top: 0;
    left: 0;
  }
</style>