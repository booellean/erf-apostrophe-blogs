<template>
    <apos-modal
        :modal="modal"
        :modal-title="{
          key: 'Blog Settings',
          type: 'erf-apostrophe-blog-page'
        }"
        @inactive="modal.active = false"
        @show-modal="modal.showModal = true"
        @esc="modal.showModal = false"
        @no-modal="$emit('safe-close')"
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
                icon=""
                label="Save"
                :modifiers="['no-motion']"
                :disabled="busy"
                @click="saveSettings()"
            />
        </template>
        <template #main>
            <apos-modal-body>
                <template #bodyMain>
                    <div v-for="(group, name) in groups" :key="'group-'+name" class="settings-group">
                        <h3 class="apos-modal__heading">
                            {{ group.label }}
                        </h3>
                        <p v-if="group.help" class="apos-field__help" style="text-align: center; color: var(--a-base-3);">{{group.help}}</p>
                        <div class="field-and-preview-wrapper">
                            <div>
                                <div v-for="schemaName in group.items" :key="'schema-'+schemaName">
                                    <component
                                        v-for="schema in settingsSchema.filter( s => s.name === schemaName)"
                                        :key="'schema-'+schemaName+'loop'"
                                        v-model="settingsValues[schemaName]"
                                        :is="fieldComponentMap[schema.type]"
                                        :field="schema"
                                        :value="settingsValues[schemaName] && settingsValues[schemaName].data ? settingsValues[schemaName].data : { data: (schema.def ? schema.def : '') }"
                                    />
                                </div>
                            </div>
                            <div v-if="group.preview" v-html="generateContent(name)"></div>
                        </div>
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

export default {
    name: 'ApostropheBlogSettingsManager',
    emits: [ 'safe-close', 'archive', 'save' ],
    components: { AposButton, AposModal, AposModalBody },
    props: {
        moduleName: {
            type: String,
            required: true
        },
        groups: {
            type: Object,
            required: true
        },
        icons: {
            type: Object,
            required: true
        },
        saveRoute: {
            type: String,
            required: true
        }
    },
    data(){
        let settingsSchema = window.apos.modules[this.moduleName].settingsSchema || []
        let settingsValues = {}
        settingsSchema.map( (schema, index) => {
            let value =  { data : (schema.def || '') }
            settingsValues[schema.name] = value
        })
        console.log(settingsValues);
        return {
            fieldComponentMap: window.apos.schema.components.fields || {},
            modal: {
                active: false,
                type: 'overlay',
                showModal: false,
            },
            settingsSchema: settingsSchema,
            settingsValues: settingsValues
        }
    },
    computed: {
        socialPreview() {
            return `<div>Social</div>`
        },
        templatePreview() {
            return `<div>template</div>`
        },
        busy() {
            return window.apos.busy.busy
        }
    },
    async mounted() {
        this.modal.active = true;
        console.log('props...', this.$props, this.$data)
        await this.getCurrentSettings();
        window.apos.bus.$on('content-changed', this.onContentChanged);
    },
    methods: {
        async getCurrentSettings(){
            await window.apos.http.get(this.saveRoute, { busy: true })
                .then( res => {
                    if(res.settings) {
                        console.log('assigning settings...')
                        this.settingsValues = { ...this.settingsValues, ...res.settings }
                    }
                }).catch( err => {
                    return window.apos.notify('An error occurred while retrieving your settings. Please contact IT.', {
                        type: 'error',
                        icon: 'alert-circle-icon'
                    })
                })
        },
        async saveSettings(){
            // let settings = await window.apos.http.post(this.saveRoute, { busy: true, body: { settings: this.settingsValues } })?
            await window.apos.http.post(this.saveRoute, { busy: true, body: { settings: this.settingsValues } })
                .then( res => {
                    return window.apos.notify('Your settinsg have been saved.', {
                        type: 'success',
                        icon: 'check-all-icon',
                        dismiss: true
                    })
                })
                .catch( err => {
                    return window.apos.notify('An error occurred while saving your settings. Please contact IT.', {
                        type: 'error',
                        icon: 'alert-circle-icon'
                    })
                })
        },
        generateContent(type){
            if(type === 'social') return this.generateSocialPreview()
            if(type === 'template') return this.generateTemplatePreview()
        },
        generateSocialPreview(){
            let data = '<div class="social-icons-preview">';
            for(let i = 0; i < this.settingsValues.socialMediaChoices.data.length; i++){
                let choice = this.settingsValues.socialMediaChoices.data[i];
                let classColor = this.settingsValues.socialMediaColors.data === 'og' ? 'social-button__'+choice : ''
                let classFill = this.settingsValues.socialMediaFill.data
                let classStyle = this.settingsValues.socialMediaStyle.data === 'inverted' ? 'inverted' : ''
                data += `
                <span class="social-button ${classColor} ${classStyle}">
                    ${this.icons[classFill][choice]}
                </span>`
            }
            data += '</div>';
            return data;
        },
        generateTemplatePreview(){
            return this.groups.template.preview[this.settingsValues.indexTemplate.data] || ''
        }
    }
}
</script>
<style>
    .apos-field {
        padding: 1rem 0 !important;
    }
    div.social-icons-preview {
        display: flex;
        flex-flow: column nowrap;
        align-items: flex-end;
    }
    div.article-preview {
        display: flex;
        min-height: 10rem;
    }
    div.article-preview.article-thumbnails {
        flex-flow: row wrap;
    }
    div.article-preview.article-thumbnails > div.article-thumb {
        display: flex;
        flex-flow: column nowrap;
        width: 4rem;
        height: 4rem;
    }
    div.article-preview.article-list {
        width: 100%;
        flex-flow: column nowrap;
    }

    div.article-preview.article-list > div.article-list-item {
        width: 100%;
        height: 2rem;
        display: flex;
        overflow: hidden;
    }
    .svg-container {
        height: inherit;
        box-sizing: border-box;
        padding: 0.5rem;
        background: #62a9e0;
    }
    .svg-container > svg {
        width: 100%;
        height: 100%;
    }
    .list.svg-container {
        width: 2rem;
    }
    .list.content-container {
        width: 100%;
        display: flex;
        flex-flow: column nowrap;
        margin: 0.5rem;
    }
    .thumb.content-container {
        display: flex;
        flex-flow: column nowrap;
        justify-content: space-around;
        height: 100%;
        padding: 0.25rem;
    }
    .thumb.svg-container {
        height: 70%;
    }
    .content-container > div {
        background: #62a9e0;
        box-sizing: border-box;
    }
    .list.content-container > .title-mock {
        width: 30%;
        height: 0.7rem;
        margin: 0.1rem 0;
    }
    .list.content-container > .description-mock {
        margin: 0.1rem 0;
        height: 0.7rem;
    }
    .thumb.content-container > .title-mock {
        width: 63%;
        height: 0.2rem;
    }
    .thumb.content-container > .description-mock {
        height: 0.2rem;
    }
    .svg-container > svg > path {
        fill: #fff4dd;
    }
    div.article-preview > div {
        background-color: #fff4dd;
        border-radius: 0.4rem;
        margin: 0.5rem;
        overflow: hidden;
    }
    .settings-group{
        padding: 2rem;
    }
    .settings-group:not(:last-child) {
        border-bottom: 1px solid var(--a-base-9);
    }
    .field-and-preview-wrapper{
        display: flex;
        flex-flow: row nowrap;
    }
    .field-and-preview-wrapper > div {
        box-sizing: border-box;
    }
    .field-and-preview-wrapper > div:first-child {
        width: 70%;
    }
    .field-and-preview-wrapper > div:last-child {
        width: 30%;
    }
    .field-and-preview-wrapper > div:only-child {
        width: 100%;
    }
</style>