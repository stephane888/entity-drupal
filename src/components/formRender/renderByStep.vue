<template>
  <section class="step-donneesite mx-auto text-center">
    <ValidationObserver tag="form" v-slot="v">
      <component
        :is="render.template"
        :field="render.field"
        :model="render.model"
        :fieldName="render.fieldName"
        :class_css="['fieldset-wrapper', render.field.type]"
        v-for="(render, k) in buildFields()"
        :key="k"
      ></component>
      <div>
        <nextPreviewVue :validation_form="v"></nextPreviewVue>
      </div>
    </ValidationObserver>
  </section>
</template>

<script>
import Vue from "vue";
import { mapState } from "vuex";
import loadField from "../fields/loadField";
import nextPreviewVue from "./nextPreview.vue";
import { ValidationObserver } from "vee-validate";
import CKEditor from "ckeditor4-vue";
Vue.use(CKEditor);
export default {
  name: "renderByStep",
  data() {
    return {
      fields: [],
    };
  },
  components: {
    nextPreviewVue,
    ValidationObserver,
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
              template: loadField.getField(this.form[fieldName]),
              field: this.form[fieldName],
              model: this.model,
            });
          else
            fields.push({
              template: loadField.getField(this.form[fieldName]),
              field: this.form[fieldName],
            });
        }
      });
      return fields;
    },
  },
};
</script>
