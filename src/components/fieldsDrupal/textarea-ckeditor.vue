<template>
  <div :class="class_css" class="mb-4">
    <ValidationProvider
      :name="field.label"
      :rules="{ required: true }"
      v-slot="v"
      class="form-group"
    >
      <legend v-html="field.label"></legend>
      <ckeditor
        v-model="editorData"
        :config="editorConfig"
        @input="input"
        @namespaceloaded="onNamespaceLoaded"
      ></ckeditor>
      <div class="text-danger my-2" v-if="v.errors">
        <small v-for="(error, ii) in v.errors" :key="ii" class="d-block">
          {{ error }}
        </small>
      </div>
    </ValidationProvider>
  </div>
</template>

<script>
import { ValidationProvider } from "vee-validate";
import "./vee-validation-rules";
import config from "./loadField";
export default {
  name: "drupal-string",
  props: {
    class_css: { type: [Array] },
    field: { type: Object, required: true },
    model: { type: [Object, Array], required: true },
    namespace_store: { type: String, required: true },
  },
  components: {
    ValidationProvider,
  },
  data() {
    return {
      editorData: "",
      preEditorConfig: {
        codeSnippet_theme: "monokai_sublime",
        stylesSet: [],
        contentsCss:
          "@import '" +
          config.getBaseUrl() +
          "/themes/contrib/wb_universe/node_modules/%40fortawesome/fontawesome-free/css/all.min.css'; @import 'http://wb-horizon.com/themes/custom/wb_horizon_com/css/vendor-style.css';",
        on: {
          instanceReady: function (ev) {
            ev.sender.dataProcessor.writer.setRules("p", {
              indent: true,
              breakBeforeOpen: true,
              breakAfterOpen: false,
              breakBeforeClose: true,
              breakAfterClose: true,
            });
            ev.sender.dataProcessor.writer.setRules("img", {
              indent: true,
              breakBeforeOpen: true,
              breakAfterOpen: false,
              breakBeforeClose: false,
              breakAfterClose: false,
            });
            ev.sender.dataProcessor.writer.setRules("h1", {
              indent: true,
              breakBeforeOpen: false,
              breakAfterOpen: false,
              breakBeforeClose: false,
              breakAfterClose: false,
            });

            ev.sender.dataProcessor.writer.setRules("h2", {
              indent: true,
              breakBeforeOpen: false,
              breakAfterOpen: false,
              breakBeforeClose: false,
              breakAfterClose: false,
            });
            ev.sender.dataProcessor.writer.setRules("h3", {
              indent: true,
              breakBeforeOpen: false,
              breakAfterOpen: false,
              breakBeforeClose: false,
              breakAfterClose: false,
            });
            ev.sender.dataProcessor.writer.setRules("h4", {
              indent: true,
              breakBeforeOpen: false,
              breakAfterOpen: false,
              breakBeforeClose: false,
              breakAfterClose: false,
            });
            ev.sender.dataProcessor.writer.setRules("h5", {
              indent: true,
              breakBeforeOpen: false,
              breakAfterOpen: false,
              breakBeforeClose: false,
              breakAfterClose: false,
            });
            ev.sender.dataProcessor.writer.setRules("h6", {
              indent: true,
              breakBeforeOpen: false,
              breakAfterOpen: false,
              breakBeforeClose: false,
              breakAfterClose: false,
            });
            ev.sender.dataProcessor.writer.setRules("div", {
              indent: true,
              breakBeforeOpen: true,
              breakAfterOpen: true,
              breakBeforeClose: true,
              breakAfterClose: false,
            });
          },
        },
      },
    };
  },
  mounted() {
    this.editorData = this.getValue();
  },
  computed: {
    editorConfig() {
      //,ckawesome, ckeditorfa
      var extraPlugins =
        "codesnippet,print,format,font,colorbutton,justify,image,filebrowser,stylesheetparser";
      return {
        extraPlugins: extraPlugins,
        ...this.preEditorConfig,
      };
    },
  },
  methods: {
    getValidationState({ dirty, validated, valid = null }) {
      return (dirty || validated) && !valid ? valid : null;
    },
    getRules() {
      return config.getRules(this.field);
    },
    setValue(vals) {
      if (this.namespace_store) {
        this.$store.dispatch(this.namespace_store, {
          value: vals,
          fieldName: this.field.name,
        });
      } else
        this.$store.dispatch({
          value: vals,
          fieldName: this.field.name,
        });
    },
    getValue() {
      if (this.model[this.field.name] && this.model[this.field.name][0]) {
        return this.model[this.field.name][0].value;
      }
    },
    input(v) {
      const vals = [];
      vals.push({ value: v, format: "full_html" });
      this.setValue(vals);
    },
    onNamespaceLoaded(CKEDITOR) {
      CKEDITOR.config.allowedContent = true;
      // CKEDITOR.config.contentsCss =
      //   "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css";
      CKEDITOR.config.htmlEncodeOutput = false;
      CKEDITOR.config.entities = false;
      // CKEDITOR.config.entities_processNumerical = 'force';
      CKEDITOR.dtd.$removeEmpty.span = 0;
      CKEDITOR.dtd.$removeEmpty.i = 0;
      CKEDITOR.dtd.$removeEmpty.label = 0;
    },
  },
};
</script>
