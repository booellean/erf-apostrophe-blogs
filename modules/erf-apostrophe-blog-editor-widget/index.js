const fs = require('fs');
const path = require('path');
// const sanitize = require('mongo-sanitize');

module.exports = {
    extend: '@apostrophecms/widget-type',
    // bundle: {
    //   directory: 'modules',
    //   modules: getBundleModuleNames()
    // },
    // fields: {
    //   add: {
    //     _images:{
    //       label: 'Images',
    //       type: 'relationship',
    //       withType: '@apostrophecms/image'
    //     },
    //     _files:{
    //       label: 'Files',
    //       type: 'relationship',
    //       withType: '@apostrophecms/file'
    //     },
    //   }
    // },
    components(self) {
      return {
        async widgetCss(req, data) {},
        async widgetJs(req, data) {},
      }
    },
    options: {
        // icon: 'format-text-icon',
        name: 'erf-apostrophe-blog-editor-widget',
        alias: 'blog-editor',
        label: 'Rich Text Editor',
        pluralLabel: 'Rich Text Editors',
        contextual: true,
        scene: 'apos',
        // className: 'rte-field',
        // Indicate if saving assets on the frontend should sync to backend
        syncFileOnSave: false,
        syncImageOnSave: false,
        // Styles to be added to the editor so preview matches. Pass in all styles needed for main page
        styles: ['/apos-frontend/default/apos-bundle.css'],
        media_manager_image_url: '/api/v1/@apostrophecms/image',
        media_manager_file_url: '/api/v1/@apostrophecms/file',
        youtube_channel_parts: [
          "auditDetails",
          "brandingSettings",
          "contentDetails",
          "contentOwnerDetails",
          "id",
          "localizations",
          "snippet",
          "statistics",
          "status",
          "topicDetails"
        ],
        youtube_playlist_parts: [
          "contentDetails",
          "id",
          "snippet",
          "status"
        ],
        // contentDetails,id,snippet,status
        youtube_video_parts: [
          "contentDetails",
          // "fileDetails",
          "id",
          "liveStreamingDetails",
          "localizations",
          "player",
          // "processingDetails",
          "recordingDetails",
          "snippet",
          "statistics",
          "status",
          // "suggestions",
          "topicDetails"
        ],
        // contentDetails,id,liveStreamingDetails,localizations,player,recordingDetails,snippet,statistics,status,topicDetails
        defaultData: {
          metaType: 'area',
          items: []
        },
        plugins: [
          'video',
          // 'open-graph-embed'
        ],
        pluginSettings: {
          video: {
            hosts: [ 'youtube', 'vimeo'],
            getAllRoute: '/api/v1/erf-apostrophe-blog-editor-widget/media/videos',
            getRoute: '/api/v1/erf-apostrophe-blog-editor-widget/media/video',
          }
        },
        per_page: 20,
        widgetOptions: {},
        components: {
            widgetEditor: 'ApostropheRTEWidgetEditor',
            widget: 'ApostropheRTEWidget'
        }
    },
    
    init(self){
      self.apos.template.prepend('head', 'erf-apostrophe-blog-editor-widget:widgetCss');
      self.apos.template.prepend('body', 'erf-apostrophe-blog-editor-widget:widgetJs');
      self.addVideoManagerModal();
    },

    beforeSuperClass(self) {
      self.options.defaultOptions = {
        apiKey: self.options.apiKey,
        media_manager_image_url: self.options.media_manager_image_url,
        media_manager_file_url: self.options.media_manager_file_url,
        className: self.options.className,
        syncFileOnSave: self.options.syncFileOnSave,
        syncImageOnSave: self.options.syncImageOnSave,
        styles: self.options.styles,
        ...self.options.widgetOptions
      };
    },
    icons: {
        // 'format-text-icon': 'FormatText',
        // 'format-color-highlight-icon': 'FormatColorHighlight'
    },
    methods(self) {
        return {
          // async load(req, widgets) {
          // },

          removeScripts(content){
            // TODO: remove scripts
            return content;
          },
          canUpload(req, res, next) {
            if (!self.apos.permission.can(req, 'upload-attachment')) {
              res.statusCode = 403;
              return res.send({
                type: 'forbidden',
                message: req.t('apostrophe:uploadForbidden')
              });
            }
            next();
          },
          addVideoManagerModal() {
            self.apos.modal.add(
              `${self.__meta.name}-video:manager`,
              self.getComponentName('videoEmbedModal', 'ApostropheRTEVideoEmbedManager'),
              {
                pluginSettings: self.options.pluginSettings.video ? self.options.pluginSettings.video : {}
              } 
            );
          },
        }
    },
    extendMethods(self) {
      return {
        async sanitize(_super, req, input, options) {
          // TODO: actually sanitize...
          // console.log(_super, req, input, saniOptions);
          // const rteOptions = {
          //   ...self.options.defaultOptions,
          //   ...saniOptions
          // };
  
          // const output = await _super(req, input, rteOptions);

          // output.content = self.removeScripts(input.content);

          return input;
        },
        // Add on the core default options to use, if needed.
        getBrowserData(_super, req) {
          const initialData = _super(req);
          const finalData = {
            ...initialData,
            defaultOptions: self.options.defaultOptions
          };
          // console.log('widget', finalData)
          return finalData;
        }
      };
    },
    routes(self) {
      return getApiRoutes(self)
    }
};

function getBundleModuleNames() {
  const source = path.join(__dirname, './modules');
  return fs
    .readdirSync(source, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => `${dirent.name}`);
}
  
function getApiRoutes(self) {
  let routes = {}
  let plugins = self.options.plugins;
  // let plugins = [];

  // If they want to include a Youtube Embed Manager...
  if(plugins.indexOf('video') > -1){
    let hosts = self.options.pluginSettings && self.options.pluginSettings.video && self.options.pluginSettings.video.hosts
    // Instantiate get routes if needed
    if(!routes.get) routes.get = {}

    // Only require what we need
    let youtube, vimeoClient = null;
    if(hosts.indexOf('youtube' > -1)){
      // TODO: structure this so we don't download the Vimeo or youtube items unnecessarily
      const { google } = require('googleapis')
      youtube = google.youtube({
        version: 'v3',
        auth: process.env.ERF_APOSTROPHE_BLOG_EDITOR_YOUTUBE_API_KEY,
      });
    }

    if(hosts.indexOf('vimeo' > -1)){
      const Vimeo = require('vimeo').Vimeo;
      vimeoClient = new Vimeo(
        process.env.ERF_APOSTROPHE_BLOG_EDITOR_VIMEO_CLIENT_ID,
        process.env.ERF_APOSTROPHE_BLOG_EDITOR_VIMEO_CLIENT_SECRET,
        process.env.ERF_APOSTROPHE_BLOG_EDITOR_VIMEO_ACCESS_TOKEN
      );
    }

    routes.get['/api/v1/erf-apostrophe-blog-editor-widget/media/video/:context'] = async function (req, res) {
      if(req.params.context === 'youtube' && hosts.indexOf('youtube' > -1)){
        let parts = self.options.youtube_video_parts.join(',');

        let query = {
          part: parts,
          id: req.query.video_id
        }

        try{
          vid = await youtube.videos.list(query);

          if(vid && vid.data) return res.json(vid.data);
        }catch(error){
          return res.status(400).json(error)
        }
      }

      return res.status(500).json(new Error('Server Error'))
    }

    routes.get['/api/v1/erf-apostrophe-blog-editor-widget/media/videos/:context'] = async function (req, res) {
      // ERF_APOSTROPHE_BLOG_EDITOR_YOUTUBE_PLAYLIST_ID
      // ERF_APOSTROPHE_BLOG_EDITOR_YOUTUBE_CHANNEL_ID
      console.log('context', req.params.context);

      if(req.params.context === 'youtube' && hosts.indexOf('youtube' > -1)){
        let parts = self.options.youtube_playlist_parts.join(',');

        let query = {
          part: parts,
          id: process.env.ERF_APOSTROPHE_BLOG_EDITOR_YOUTUBE_CHANNEL_ID,
          playlistId : process.env.ERF_APOSTROPHE_BLOG_EDITOR_YOUTUBE_PLAYLIST_ID,
          maxResults: (req.query.per_page ? req.query.per_page : (self.options.per_page ? self.options.per_page : 20))
        }

        console.log('query', query)

        if(req.query.pageToken) query['pageToken'] = req.query.pageToken;

        try{
          vids = await youtube.playlistItems.list(query);
          
          if(vids && vids.data) return res.json(vids.data);
        }catch(error){
          return res.status(400).json(error)
        }
      }

      if(req.params.context === 'vimeo' && hosts.indexOf('vimeo' > -1)){
        let uri = `/users/${process.env.ERF_APOSTROPHE_BLOG_EDITOR_VIMEO_USER_ID}/videos`
        return vimeoClient.request({
          method: 'GET',
          path: uri,
          query: {
            per_page: (req.query.per_page ? req.query.per_page : (self.options.per_page ? self.options.per_page : 20)),
            page: (req.query.page ? req.query.page : 1),
            sort : 'date',
            direction: 'desc'
          }
        }, function (error, body, status_code, headers) {
          if(error) return res.status(400).json(error)
          return res.status(200).json(body)
        })
      }

      return res.status(500).json(new Error('Server Error'))
    }
  }

  // If they want to include Open Graph Embed Cards
  // TODO: actually build something with some query potential... this shouldn't even be a thing.
  if(plugins.indexOf('grapesjs-open-graph-embed-card') > -1){
    // Instantiate get routes if needed
    if(!routes.get) routes.get = {}
    let { getMetadata, metadataRuleSets } = require('page-metadata-parser');
    const domino = require('domino');
    metadataRuleSets = addMetadataRules(metadataRuleSets)

    routes.get['/api/v1/erf-apostrophe-blog-editor-widget/open-graph'] = async function (req, res) {
      let url = decodeURIComponent(req.query.url);
      let html = await self.apos.http.get(url, {});
      html.replace(/noscript/g, 'div');
      const doc = domino.createWindow(html).document;
      const metadata = getMetadata(doc, url);
      return res.status(200).json({ 'data': metadata })
    }

    // TODO: default action
  }

  return routes;
}

function addMetadataRules(metadataRuleSets) {
  // Add some custom rules
  metadataRuleSets.image.rules.push(['img:not([src=""])', node => node.getAttribute('src')])
  metadataRuleSets.image.rules.push(['img', node => node.getAttribute('src')])
  metadataRuleSets.title.rules.push(['h1', node => node.textContent])
  metadataRuleSets.title.rules.push(['h2', node => node.textContent])
  metadataRuleSets.title.rules.push(['h3', node => node.textContent])
  metadataRuleSets.title.rules.push(['h4', node => node.textContent])
  metadataRuleSets.description.rules.push(['p:not([class])', node => node.textContent])
  metadataRuleSets.description.rules.push(['p:not(:empty)', node => node.textContent])
  metadataRuleSets.description.rules.push(['body', node => node.textContent])
  return metadataRuleSets;
}