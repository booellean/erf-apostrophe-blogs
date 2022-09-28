<template>
  <div>
    <div @click="clicked" v-html="rendered" />
  </div>
</template>

<script>

export default {
  name: 'ApostropheRTEWidget',
  emits: [ 'edit' ],
  methods: {
    clicked(e) {
      const link = apos.util.closest(e.target, 'a');
      if (link) {
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      this.$emit('edit');
    }
  },
};
</script>
