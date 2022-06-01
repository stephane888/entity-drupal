<template>
  <section class="step-donneesite mx-auto text-center">
    <progressBar></progressBar>
    <ValidationObserver tag="form" v-slot="v">
      <component
        :is="render.template"
        :field="render.field"
        :model="render.model"
        :class_css="['fieldset-wrapper', render.field.type]"
        namespace_store="renderByStep/setValue"
        v-for="(render, k) in stepFields"
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
import { mapState, mapGetters } from "vuex";
//import loadField from "../fieldsDrupal/loadField";
import nextPreviewVue from "./nextPreview.vue";
import { ValidationObserver } from "vee-validate";
import CKEditor from "ckeditor4-vue";
//import layoutREnder from "../fieldsLayout/layoutRenderHeader.vue";
//import storeFormRenderHeader from "../FormRenderHeader/formRenderHeader.vue";
//import layoutRenderFooter from "../fieldsLayout/layoutRenderFooter.vue";
//import sectionRegister from "../sections/page-register.vue";
//import sectionSave from "../sections/page-save.vue";
import progressBar from "./progress-bar.vue";
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
    progressBar,
  },
  mounted() {
    //this.buildFields();
  },
  computed: {
    ...mapState("renderByStep", {
      form: (state) => state.form,
      current_step: (state) => state.current_step,
      model: (state) => state.model,
      steppers: (state) => state.steppers,
      running: (state) => state.running,
    }),
    ...mapGetters("renderByStep", ["stepFields"]),
  },

  methods: {
    // Contruit les champs de l'etape.
    // buildFields() {
    //   alert("DFDff");
    //   console.log("buildFields");
    //   this.fields = [];
    //   const step = this.steppers[this.current_step];
    //   // validation de l'etape:
    //   var valid = true;
    //   if (step.states && step.states.length) {
    //     const getState = (i = 0) => {
    //       if (step.states[i]) return step.states[i];
    //     };
    //     var state = getState(0);
    //     console.log("sate :", state);
    //     if (state.custom == "check_user_login") {
    //       if (
    //         this.$store.state.user &&
    //         this.$store.state.user.uid &&
    //         this.$store.state.user.uid[0]
    //       ) {
    //         valid = false;
    //       }
    //     } else if (
    //       state.step &&
    //       state.step.name &&
    //       this.model[state.step.name] &&
    //       this.model[state.step.name].length &&
    //       this.model[state.step.name][0].value == state.step.value
    //     ) {
    //       valid = false;
    //     }
    //   }
    //   //alert(valid);
    //   if (!valid) {
    //     this.$store.commit("renderByStep/nextStep");
    //     this.$router.push({ path: `/form-render/${this.current_step}` });
    //     return;
    //   }
    //   //
    //   if (step.keys && step.keys.length) {
    //     step.keys.forEach((fieldName) => {
    //       if (this.form[fieldName]) {
    //         if (this.model[fieldName])
    //           this.fields.push({
    //             template: loadField.getField(this.form[fieldName]),
    //             field: this.form[fieldName],
    //             model: this.model,
    //           });
    //         else
    //           this.fields.push({
    //             template: loadField.getField(this.form[fieldName]),
    //             field: this.form[fieldName],
    //           });
    //       }
    //     });
    //   }
    //   //
    //   if (step.templates && step.templates.length) {
    //     step.templates.forEach((template) => {
    //       if (template == "layout_entete") {
    //         this.fields.push({
    //           template: storeFormRenderHeader,
    //           field: {},
    //         });
    //       } else if (template == "layout_footer") {
    //         this.fields.push({
    //           template: layoutRenderFooter,
    //           field: {},
    //         });
    //       } else if (template == "page_register") {
    //         this.fields.push({
    //           template: sectionRegister,
    //           field: {},
    //         });
    //       } else if (template == "page_save") {
    //         this.fields.push({
    //           template: sectionSave,
    //           field: {},
    //         });
    //       }
    //     });
    //   }
    //   this.$store.commit("renderByStep/ADD_VALID_STEP", this.current_step);
    //   //
    //   return this.fields;
    // },
  },
};
</script>

<style lang="scss">
.step-donneesite {
  max-width: 1200px;
  padding-left: 0;
  padding-right: 0;
  form > .fieldset-wrapper {
    max-height: 700px;
    overflow: auto;
    overflow-x: hidden;
    .form-group,
    .color_theme_field_type {
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }
  }
  .render-model {
    top: 0;
  }
}
</style>
