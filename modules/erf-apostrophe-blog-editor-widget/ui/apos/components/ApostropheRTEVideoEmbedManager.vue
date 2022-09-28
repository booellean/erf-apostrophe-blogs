<template>
  <apos-modal
    :modal="modal" modal-title="Embed Video"
    class="apos-media-manager"
    @inactive="modal.active = false" @show-modal="modal.showModal = true"
    @esc="modal.showModal = false" @no-modal="$emit('safe-close')"
  >
    <template #secondaryControls>
      <apos-button
        type="default" label="apostrophe:exit"
        @click="modal.showModal = false"
      />
    </template>
    <template #primaryControls>
      <apos-button
        type="primary"
        label="Insert Video"
        :disabled="!selected.length"
        @click="insertVideo"
      />
    </template>
    <template #leftRail v-if="multipleVideoHosts">
      <apos-modal-rail>
        <h3 class="apos-tag-list__title">Host Providers</h3>
        <ul class="apos-tag-list__items">
            <apos-tag-list-item
                v-for="host in settings.hosts"
                :key="host"
                :active-tag="activeHost"
                :tag="{
                    label: host.charAt(0).toUpperCase()+ host.slice(1),
                    value: host
                }"
                @click="switchProvider"
            />
        </ul>
      </apos-modal-rail>
    </template>
    <template #main>
      <apos-modal-body class="stretch-fill">
        <template #bodyHeader>
            <apos-pager
                v-if="!isLoading && multiPage"
                @hook:mounted="handlePager"
                :total-pages="totalPages" :current-page="currentPage"
                @click="changePage" @change="changePage"
            />
        </template>
        <template #bodyMain>
            <div v-if="isLoading" id="loading-bar">
                <!-- Thank Sam Herbert -->
                <!-- https://github.com/SamHerbert/SVG-Loaders -->
                <svg xmlns="http://www.w3.org/2000/svg" id="loader" viewBox="0 0 105 105" fill="#461CA4">
                    <circle cx="12.5" cy="12.5" r="12.5">
                        <animate attributeName="fill-opacity" begin="0s" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="12.5" cy="52.5" r="12.5" fill-opacity=".5">
                        <animate attributeName="fill-opacity" begin="100ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="52.5" cy="12.5" r="12.5">
                        <animate attributeName="fill-opacity" begin="300ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="52.5" cy="52.5" r="12.5">
                        <animate attributeName="fill-opacity" begin="600ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="92.5" cy="12.5" r="12.5">
                        <animate attributeName="fill-opacity" begin="800ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="92.5" cy="52.5" r="12.5">
                        <animate attributeName="fill-opacity" begin="400ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="12.5" cy="92.5" r="12.5">
                        <animate attributeName="fill-opacity" begin="700ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="52.5" cy="92.5" r="12.5">
                        <animate attributeName="fill-opacity" begin="500ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="92.5" cy="92.5" r="12.5">
                        <animate attributeName="fill-opacity" begin="200ms" dur="1s" values="1;.2;1" calcMode="linear" repeatCount="indefinite"/>
                    </circle>
                </svg>
            </div>
            <div v-else-if="metadata[activeHost][currentPage].length" class="video-list">
                <figure
                    v-for="(video, index) in metadata[activeHost][currentPage]"
                    :key="video.contentDetails ? video.contentDetails.videoId : video.link"
                    @click="selectVideo(video, index)"
                >
                    <div class="wrapper" :ref="`wrapper-${index}`">
                        <img
                            :srcset="getVideoSrcSet(video)"
                            :src="getVideoSrc(video)"
                        />
                        <figcaption class="text wrapper">
                            <p>{{ (video.snippet ? video.snippet.title : video.name) }}</p>
                        </figcaption>
                    </div>
                </figure>
            </div>
        </template>
      </apos-modal-body>
    </template>
  </apos-modal>
</template>

<script>
import AposButton from 'apostrophe/modules/@apostrophecms/ui/ui/apos/components/AposButton'
import AposModal from 'apostrophe/modules/@apostrophecms/modal/ui/apos/components/AposModal'
import AposModalBody from 'apostrophe/modules/@apostrophecms/modal/ui/apos/components/AposModalBody'
import AposModalRail from 'apostrophe/modules/@apostrophecms/modal/ui/apos/components/AposModalBody'
import AposModalToolbar from 'apostrophe/modules/@apostrophecms/modal/ui/apos/components/AposModalToolbar'
import AposPager from 'apostrophe/modules/@apostrophecms/ui/ui/apos/components/AposPager'
import AposTagListItem from 'apostrophe/modules/@apostrophecms/ui/ui/apos/components/AposTagListItem'

export default {
    name: 'ApostropheRTEVideoEmbedManager',

    emits: [ 'safe-close', 'modal-result' ],

    components: {
        AposButton,
        AposModal,
        AposModalBody,
        AposModalToolbar,
        AposPager,
        AposTagListItem
    },

    props: {
        pluginSettings : {
            type: Object,
            required: false
        }
    },

    data() {
        let moduleSettings = window.apos.modal.modals.find( modal => modal.itemName === 'erf-apostrophe-blog-editor-widget-video:manager') || {};
        let defaults = this.$props.pluginSettings ? this.$props.pluginSettings : (moduleSettings.props && moduleSettings.props.pluginSettings ? moduleSettings.props.pluginSettings : {})
        
        // This object will keep track of the important metadata, such as page number, per page, etc.
        let videoMetadata = {}
        if(defaults.hosts) defaults.hosts.forEach( host => videoMetadata[host] = {})

        return {
            activeHost: defaults.hosts ? defaults.hosts[0] : '',
            previousIndex: null,
            currentPage: 1,
            previousPage: null,
            getRoute: defaults.getRoute,
            getAllRoute: defaults.getAllRoute,
            isLoading: true,
            metadata: videoMetadata,
            modal: {
                active: false,
                type: 'overlay',
                showModal: false
            },
            multiPage: false,
            totalPages: 0,
            selected: [],
            settings: defaults
        }
    },

    computed: {
        multipleVideoHosts() {
            return this.settings && this.settings.hosts && this.settings.hosts.length > 1
        }
    },

    watch: {
        activeHost(newHost){
            this.resetVariables()
            this.getVideos()
        }
    },

    async mounted() {
        this.modal.active = true
        await this.getVideos()
    },

    methods: {
        async getVideos(){
            this.isLoading = true;
            let currentMeta = this.metadata[this.activeHost]
            if(!currentMeta[this.currentPage]) currentMeta[this.currentPage] = {}
            let query = this.getQueryString();

            let results = await apos.http.get(`${this.getAllRoute}/${this.activeHost}${query}`, {})

            if(
                // Youtube Pagination
                (results.nextPageToken || results.prevPageToken) || 
                // Vimeo Pagination
                (results.paging && (results.paging.next || results.paging.previous))
            ) this.multiPage = true

            this.totalPages = results.pageInfo ? Math.ceil(results.pageInfo.totalResults/results.pageInfo.resultsPerPage) : Math.ceil(results.total/results.per_page)

            // Updating Pagination metadata every run
            this.metadata[this.activeHost]['paging'] = results.paging ? results.paging : { nextPageToken : (results.nextPageToken || ''), prevPageToken : (results.prevPageToken || '') }
            this.metadata[this.activeHost][this.currentPage] = results.items ? results.items : results.data

            this.isLoading = false
            return true;
        },
        getQueryString(){
            let returnString = ''

            // If this is not the first call
            if(this.previousPage !== null){
                let isNextPage = this.currentPage > this.previousPage
                returnString += '?'
                
                if(this.activeHost === 'youtube'){

                    returnString += 'pageToken='

                    if(isNextPage){
                        returnString += this.metadata[this.activeHost]['paging'].nextPageToken
                    }else{
                        returnString += this.metadata[this.activeHost]['paging'].prevPageToken
                    }

                }else{

                    returnString += `page=${this.currentPage}`

                }
            }

            return returnString
        },
        resetVariables() {
            this.currentPage = 1
            this.previousPage = null
        },
        selectVideo(video, index){
            let previousSelected = this.$refs[`wrapper-${this.previousIndex}`]
            if(previousSelected) previousSelected[0].classList.remove('is-selected')
            this.previousIndex = index
            
            let currentSelected = this.$refs[`wrapper-${index}`]
            if(currentSelected) currentSelected[0].classList.add('is-selected')

            this.selected = [ video ]
        },
        changePage(pageNum) {
            this.previousPage = this.currentPage
            this.currentPage = pageNum
            this.getVideos()
        },
        async insertVideo() {
            // Make sure youtube video has proper url
            if(this.activeHost === 'youtube'){
                try{
                    let videoData = await apos.http.get(`${this.getRoute}/${this.activeHost}?video_id=${this.selected[0].contentDetails.videoId}`, {})
                    this.selected = [ videoData ]
                }catch(error){
                    return apos.alert({
                        heading: 'apostrophe:error',
                        description: 'The video is not embeddable. Please verify settings on your youtube channel.'
                    });
                }
            }

            this.$emit('modal-result', this.selected);
            this.modal.showModal = false;
        },
        switchProvider(host){
            this.activeHost = host
        },
        handlePager() {
            let pager = document.querySelector('.apos-pager select')
            if(pager && this.activeHost === 'youtube') pager.setAttribute('disabled', '')
        },
        getVideoSrcSet(video){
            let imgArr = []
            let urlKey = ''
            if(video.pictures && video.pictures.sizes){
                imgArr = video.pictures.sizes
                urlKey = 'link'
            }
            
            if(video.snippet && video.snippet.thumbnails){
                let sizes = Object.keys(video.snippet.thumbnails)
                sizes.sort( (a, b) => a.width < b.width)
                imgArr = sizes.map( size => video.snippet.thumbnails[size])
                urlKey = 'url'
            }

            return imgArr.map( pic => {
                return `${pic[urlKey]} ${pic.width}w`
            }).join(', ')   
        },
        getVideoSrc(video){
            return video.pictures && video.pictures.sizes 
                ? video.pictures.sizes.pop().link 
                : ( video.snippet && video.snippet.thumbnails && video.snippet.thumbnails.standard
                    ? video.snippet.thumbnails.standard.url
                    : ''
                )
        }
    }
}
</script>

<style>
    #loading-bar {
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        align-items: center;
        height: 100%;
    }
    .apos-modal__body.stretch-fill > .apos-modal__body-inner {
        display: flex;
        flex-flow: column nowrap;
        height: 100%;
    }
    .apos-modal__body.stretch-fill > .apos-modal__body-inner > .apos-modal__body-main {
        flex-grow: 1;
    }
    .apos-modal__body.stretch-fill > .apos-modal__body-inner > .apos-modal__body-main svg#loader {
        height: 50vh;
        max-height: 200px;
    }
    div.video-list {
        display: flex;
        flex-flow: row wrap;
    }
    div.video-list > figure {
        width: 33.33%;
        cursor: pointer;
        padding: 1rem;
        box-sizing: border-box;
        margin: 0;
    }
    div.video-list > figure > div.wrapper {
        height: 100%;
        width: 100%;
        position: relative;
        display: inline-block;
    }
    div.video-list > figure > div.wrapper > img {
        width: 100%;
        height: 100%;
        object-position: 50% 50%;
        object-fit: contain;
    }
    div.video-list > figure > div.wrapper > figcaption.text.wrapper {
        position: absolute;
        background-color: rgba(0,0,0,.6);
        top: 0;
        left: 0;
        right: 0;
        text-align: center;
        vertical-align: middle;
        color: #fff;
        text-shadow: 0 0 15px;
        height: 100%;
        padding: 0;
        margin: 0;
        box-sizing: border-box;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity ease-in-out .2s
    }
    div.video-list > figure > div.wrapper > figcaption.text.wrapper:hover {
        opacity: 1;
    }
    .is-selected {
        border-color: var(--a-primary);
        outline: 2px solid var(--a-primary);
        box-shadow: 0 0 10px 1px var(--a-base-7);
    }
</style>
