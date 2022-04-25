<template>
  <div :class="class_css">
    <div v-html="field.content"></div>
  </div>
</template>

<script>
export default {
  props: {
    class_css: { type: [Array] },
    field: { type: Object, required: true },
  },
};
</script>
