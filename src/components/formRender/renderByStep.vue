<template>
  <section
    class="step-donneesite mx-auto text-center"
    :get_running="get_running"
  >
    <ValidationObserver tag="form" v-slot="v">
      <component
        :is="render.template"
        :field="render.field"
        :model="render.model"
        :class_css="['fieldset-wrapper', render.field.type]"
        v-for="(render, k) in fields"
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
import loadField from "../fieldsDrupal/loadField";
import nextPreviewVue from "./nextPreview.vue";
import { ValidationObserver } from "vee-validate";
import CKEditor from "ckeditor4-vue";
import layoutREnder from "../fieldsLayout/layoutRenderHeader.vue";
import layoutRenderFooter from "../fieldsLayout/layoutRenderFooter.vue";
import sectionRegister from "../sections/page-register.vue";
import sectionSave from "../sections/page-save.vue";
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
    //
  },
  computed: {
    ...mapState("renderByStep", {
      form: (state) => state.form,
      current_step: (state) => state.current_step,
      model: (state) => state.model,
      steppers: (state) => state.steppers,
      running: (state) => state.running,
    }),
    get_running() {
      const keys = Object.keys(this.form);
      if (keys.length) {
        console.log("get_running");
        this.buildFields();
      }
      return this.running;
    },
  },

  methods: {
    // Contruit les champs de l'etape.
    buildFields() {
      this.fields = [];
      const step = this.steppers[this.current_step];
      // validation de l'etape:
      var valid = true;
      if (step.states && step.states.length) {
        const getState = (i = 0) => {
          if (step.states[i]) return step.states[i];
        };
        var state = getState(0);
        console.log("sate :", state);
        if (state.custom == "check_user_login") {
          if (
            this.$store.state.user &&
            this.$store.state.user.uid &&
            this.$store.state.user.uid[0]
          ) {
            valid = false;
          }
        }
      }
      //alert(valid);
      if (!valid) {
        this.$store.commit("renderByStep/nextStep");
        this.$router.push({ path: `/form-render/${this.current_step}` });
        return;
      }

      //
      if (step.keys && step.keys.length) {
        console.log("buildFields");
        step.keys.forEach((fieldName) => {
          if (this.form[fieldName]) {
            if (this.model[fieldName])
              this.fields.push({
                template: loadField.getField(this.form[fieldName]),
                field: this.form[fieldName],
                model: this.model,
              });
            else
              this.fields.push({
                template: loadField.getField(this.form[fieldName]),
                field: this.form[fieldName],
              });
          }
        });
      }
      //
      if (step.templates && step.templates.length) {
        console.log("buildFields template");
        step.templates.forEach((template) => {
          if (template == "layout_entete") {
            this.fields.push({
              template: layoutREnder,
              field: {},
            });
          } else if (template == "layout_footer") {
            this.fields.push({
              template: layoutRenderFooter,
              field: {},
            });
          } else if (template == "page_register") {
            this.fields.push({
              template: sectionRegister,
              field: {},
            });
          } else if (template == "page_save") {
            this.fields.push({
              template: sectionSave,
              field: {},
            });
          }
        });
      }
      //
      return this.fields;
    },
  },
};
</script>
