<template>
  <section class="step-donneesite mx-auto text-center">
    <div v-for="(render, k) in buildFields()" :key="k">
      <component
        :is="render.template"
        :field="render.field"
        :model="render.model"
        :fieldName="render.fieldName"
        :class_css="['fieldset-wrapper']"
      ></component>
    </div>
    <div>
      <nextPreviewVue></nextPreviewVue>
    </div>
  </section>
</template>

<script>
import { mapState } from "vuex";
import loadField from "../fields/loadField";
import nextPreviewVue from "./nextPreview.vue";
export default {
  name: "renderByStep",
  data() {
    return {
      fields: [],
    };
  },
  components: {
    nextPreviewVue,
  },
  mounted() {
    this.buildFields();
  },
  computed: {
    ...mapState("renderByStep", {
      form: (state) => state.form,
      current_step: (state) => state.current_step,
      model: (state) => state.model,
      steppers: (state) => state.steppers,
    }),
  },
  methods: {
    // Contruit les champs de l'etape.
    buildFields() {
      console.log("buildFields");
      const fields = [];
      const step = this.steppers[this.current_step];
      step.keys.forEach((fieldName) => {
        if (this.form[fieldName]) {
          if (this.model[fieldName])
            fields.push({
              template: loadField.getField(this.form[fieldName].type),
              field: this.form[fieldName],
              model: this.model,
              fieldName: fieldName,
            });
          else
            fields.push({
              template: loadField.getField(this.form[fieldName].type),
              field: this.form[fieldName],
            });
        }
      });
      return fields;
    },
  },
};
</script>
