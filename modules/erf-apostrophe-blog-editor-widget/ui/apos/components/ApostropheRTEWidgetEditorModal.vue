<template>
  <div>
    <p
      v-if="modal.active===false"
      style="text-align: center; margin: 0; padding: 1rem;"
      @click="modal.active = true"
    >
      Click to Edit Content
    </p>
    <apos-modal
      :modal="modal"
      @inactive="modal.active = false"
      @show-modal="modal.showModal = true"
      @esc="modal.showModal = false"
      @no-modal="$emit('safe-close')"
    >
      <template #main>
        <apos-button
          @click.prevent="modal.showModal = false"
          class="erf-apostrophe-blogs-close-button"
          label='Close'
          icon='arrow-right-icon'
          :iconOnly="true"
          type='primary'
          :modifiers="['small', 'no-motion', 'round']"
        />
        <apos-modal-body class="erf-apostrophe-blog-editor-content">
            <template #bodyMain>
              <apostrophe-r-t-e-widget-editor-primary
                :type="type"
                :options="options"
                :value="value"
                :doc-id="docId"
                @update="(widget) => $emit('update', widget)"
                @close="modal.showModal = false"
              />
            </template>
        </apos-modal-body>
      </template>
    </apos-modal>
  </div>
</template>

<script>
import AposButton from 'apostrophe/modules/@apostrophecms/ui/ui/apos/components/AposButton'
import AposModal from 'apostrophe/modules/@apostrophecms/modal/ui/apos/components/AposModal'
import AposModalBody from 'apostrophe/modules/@apostrophecms/modal/ui/apos/components/AposModalBody'
import ApostropheRTEWidgetEditorPrimary from './ApostropheRTEWidgetEditorPrimary'

export default {
  name: 'ApostropheRTEWidgetEditorModal',

  emits: [ 'update' ],

  components: { AposButton, AposModal, AposModalBody, ApostropheRTEWidgetEditorPrimary },

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
      required: true
    }
  },
  data() {
    return {
      modal: {
        active: false,
        type: 'slide',
        width: 'full',
        showModal: false,
        disableHeader: true,
      },
      loaded: false,
      pending: null
    };
  },
  watch: {
    // Open the Modal when the content area is in focus
    focused(newVal){
      if(newVal) this.modal.active = true
    }
  },
  mounted(){
    this.loaded = true;
  },
};
</script>
<style>
  .apos-modal__inner--full {
    width:100% !important;
    max-width: 100% !important;
    box-sizing: border-box;
  }
  .apos-modal__body.erf-apostrophe-grapesjs-content .apos-modal__body-main {
    height: 100% !important;
    box-sizing: border-box;
  }
  .apos-modal__body.erf-apostrophe-grapesjs-content .apos-modal__body-inner {
    height: 100%;
  }
  .apos-button__wrapper.erf-apostrophe-blogs-close-button {
    position: fixed;
  }
</style>