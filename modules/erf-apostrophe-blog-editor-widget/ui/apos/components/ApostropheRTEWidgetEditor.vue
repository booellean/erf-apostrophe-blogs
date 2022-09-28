<template>
  <div>
    <!-- Apply external script tags -->
    <script
      v-for="plugin in defaultPlugins"
      type="application/javascript"
      :src="`https://unpkg.com/${plugin}`"
    >
    </script>
    <component
      :is="contextEditor"
      :type="type"
      :options="options"
      :value="value"
      :doc-id="docId"
      :focused="focused"
      :is-not-nested="!isNested"
      @update="(widget) => $emit('update', widget)"
    />
  </div>
</template>

<script>
import ApostropheRTEWidgetEditorPrimary from './ApostropheRTEWidgetEditorPrimary'
import ApostropheRTEWidgetEditorModal from './ApostropheRTEWidgetEditorModal'

export default {
  name: 'ApostropheRTEWidgetEditor',

  emits: [ 'update' ],

  components: {
    ApostropheRTEWidgetEditorPrimary,
    ApostropheRTEWidgetEditorModal
  },

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
  data(){
    let isNested = false
    for(let key in this.$root.$refs){
      if(key) isNested = true;
      break
    }

    return {
      isNested: isNested,
      contextEditor: isNested ? ApostropheRTEWidgetEditorModal : ApostropheRTEWidgetEditorPrimary,
      defaultPlugins: []
      // defaultPlugins: window.apos.modules[`${this.$props.type}-widget`].defaultOptions.grapesjsPlugins
    }
  }
};
</script>