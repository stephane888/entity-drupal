<template>
  <div>
    <component :is="render_template"></component>
  </div>
</template>

<script>
import renderByStep from "../components/formRender/renderByStep.vue";
import about from "./AboutView.vue";
export default {
  data() {
    return {
      render_template: null,
      type_render: "by-step",
    };
  },
  name: "formRender",
  mounted() {
    this.$store.commit("renderByStep/loadForm");
    this.getRender();
  },
  methods: {
    getRender() {
      switch (this.type_render) {
        case "by-step":
          this.render_template = renderByStep;
          break;
        default:
          this.render_template = about;
          break;
      }
    },
  },
};
</script>
