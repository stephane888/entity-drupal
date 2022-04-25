<template>
  <div :class="class_css">
    <ValidationProvider
      :name="field.label"
      :rules="{ required: true }"
      v-slot="v"
    >
      <ckeditor v-model="editorData" :config="editorConfig"></ckeditor>
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
export default {
  name: "drupal-string",
  props: {
    class_css: { type: [Array] },
    field: { type: Object, required: true },
    model: { type: [Object, Array], required: true },
    fieldName: { type: String, required: true },
  },
  components: {
    ValidationProvider,
  },
  data() {
    return {
      editorData: "<p>Content of the editor.</p>",
      editorConfig: {
        // The configuration of the editor.
      },
    };
  },
  methods: {
    getValidationState({ dirty, validated, valid = null }) {
      return (dirty || validated) && !valid ? valid : null;
    },
  },
};
</script>
