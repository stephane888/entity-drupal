<template>
  <div :class="class_css">
    <b-form-group :label="field.text_html.label">
      <ckeditor
        v-model="editorData"
        :config="editorConfig"
        @input="input"
        @namespaceloaded="onNamespaceLoaded"
      ></ckeditor>
    </b-form-group>
  </div>
</template>

<script>
export default {
  name: "textarea-layout",
  props: {
    class_css: { type: Array },
    fieldName: { type: String, required: true },
    key_config: { type: String, required: true },
    field: { type: Object, required: true },
    sub_store: { type: String, default: "storeLayout" },
  },

  data() {
    return {
      editorData: this.field.text_html.value,
      editorConfig: {
        extraPlugins: "",
        protectedSource: [/<i class[\s\S]*?>/g, /<\/i>/g],
        contentsCss:
          " @import 'https://arche.lesroisdelareno.fr/themes/custom/arche_lesroisdelareno_fr/css/global-style.css?rbghzb';",
      },
    };
  },
  methods: {
    input(val) {
      const payload = {
        key_config: this.key_config,
        fieldName: this.fieldName,
        type: "text_html",
        value: val,
      };
      this.$store.commit(this.sub_store + "/setValue", payload);
      //console.log("input ", payload);
    },
    onNamespaceLoaded(CKEDITOR) {
      CKEDITOR.dtd.$removeEmpty["i"] = false;
      CKEDITOR.dtd.$removeEmpty["span"] = false;
      console.log(" CKEDITOR : ", CKEDITOR);
    },
  },
};
</script>
