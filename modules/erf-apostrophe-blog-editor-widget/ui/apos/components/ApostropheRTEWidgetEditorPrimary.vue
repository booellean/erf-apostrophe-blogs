<template>
    <div :class="'se-main-content-wrapper' + (isNotNested ? '' : ' se-modal')">
      <textarea  ref="se-blog-container" class="se-blog-editor-container"></textarea>
  </div>
</template>

<script>
// import 'suneditor/dist/css/suneditor.min.css'
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
      default() {
        return {};
      }
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
    const FormData = new window.FormData()
    FormData.append('file', null)

    const docIcons = {
      txt: 'file-text',
      rtf: 'file-text',
      docx: 'file-word-o ',
      doc: 'file-word-o ',
      dotx: 'file-word-o ',
      xlsx : 'file-excel-o',
      xlm : 'file-excel-o',
      xls: 'file-excel-o',
      xltx: 'file-excel-o',
      csv: 'file-excel-o',
      pdf: 'file-pdf-o ',
      ppt: 'file-powerpoint-o ',
      pptx: 'file-powerpoint-o ',
      sldx: 'file-powerpoint-o ',
      ppsx: 'file-powerpoint-o ',
      potx: 'file-powerpoint-o ',
      default: 'file',
    }

    return {
      docIcons: docIcons,
      loaded: false,
      pending: null,
      formData: FormData,
      file: null,
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

            let linkHTML = this.plugins.anchor.createAnchor.call(this, anchor, false)
            if(linkHTML) this.insertNode(linkHTML, null, true)

            // TODO: set relationship of file id
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
          // TODO: save first
          this.$emit('close')
        }
      }

      customPlugins.push(save_plugin);

      // let buttonSaves = config.buttonList.
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
    // if(this.$data.docFields.data.content && this.$data.docFields.data.content.projectData){
    //   this.editor.loadProjectData(this.$data.docFields.data.content.projectData)
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
      // widget.images = deepArrayAssign(widget.content.projectData.pages[0].frames[0].component.components, 'picture')
      // widget.files = deepArrayAssign(widget.content.projectData.pages[0].frames[0].component.components, 'file')
      // ... removes need for deep watching in parent
      this.$emit('update', widget);
    },
    stripBodyTag(html) {
      return html.replace(/(<([body]+)>)/ig, '');
    },
    async updatePage(page){
      // if(this.currentPage !== page){
      //   this.currentPage = page;
      //   for(let i = 0; i < this.results.length; i++){
      //     this.editor.AssetManager.remove(this.results[i].src)
      //   }

      //   await this.getAssetDocuments();
      //   return this.editor.AssetManager.add(this.results)
      // }
      
    },
    handleClose() {
      // this.editor.AssetManager.clear()
      // this.handleUpdate();
    },
    async handleOpen() {
      // let apiUrl = this.editor.AssetManager.assetType === 'image'
      //   ? this.imgApiUrl
      //   : this.fileApiUrl

      // if(this.editor.AssetManager.assetType !== 'image') this.editor.Modal.setTitle('Select File')

      // // We are opening up a different asset type. Let's reset our values for pagination and assets
      // if(apiUrl !== this.apiUrl){
      //   this.apiUrl = apiUrl;
      //   this.currentPage = 1
      //   this.totalPages = null
      //   this.results = []
      //   if(this.paginationFooter){
      //     this.paginationFooter.parentNode.removeChild(this.paginationFooter)
      //     this.paginationFooter = null
      //   }

      //   await this.getAssetDocuments();

      //   const mediaContainer = document.querySelector('div.gjs-am-assets-cont')
      //   if(mediaContainer && this.totalPages > 1 && !this.paginationFooter){
      //     mediaContainer.classList.add('gjs-flex-asset-column')
      //     this.paginationFooter = document.createElement('nav')
      //     this.paginationFooter.id = 'erf-grapesjs-paginate'
      //     this.paginationFooter.className = 'gjs-erf-asset-pagination-footer'
      //     mediaContainer.appendChild(this.paginationFooter)
      //     new Pagination(this.updatePage, this.paginationFooter, this.currentPage, this.totalPages, 5)
      //   }
      // }

      // // Set our url for getting and posting assets
      // return this.editor.AssetManager.add(this.results);

    },
    async getAssetDocuments(){
      // // Now get those assets from the backend
      // const media = await apos.http.get(this.apiUrl, {
      //   busy: true,
      //   qs : {
      //     page: this.currentPage
      //   },
      //   draft: true
      // })

      // if(media.results && media.results.length > 0){
      //   this.totalPages = media.pages
      //   this.currentPage = media.currentPage

      //   if(this.editor.AssetManager.assetType === 'image'){
      //     this.results = media.results.map( result => {
      //       return {
      //         ...result,
      //         type: 'picture',
      //         name: result.title,
      //         src: result.attachment._urls['one-third'],
      //         width: result.attachment.width,
      //         height: result.attachment.height,
      //       }
      //     });
      //   }else{
      //     this.results = media.results.map( result => {
      //       return {
      //         ...result,
      //         name: result.title,
      //         href: result._url,
      //         type: 'file',
      //         src: this.docIcons[result.attachment.extension] || this.docIcons.default
      //       }
      //     });
      //   }
      // }
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