<template>
  <div :class="class_css">
    <b-form-group :label="field.text.label">
      <b-form-input
        v-model="value"
        :name="fieldName"
        @input="input"
      ></b-form-input>
    </b-form-group>
  </div>
</template>

<script>
export default {
  name: "field-text",
  props: {
    class_css: { type: Array },
    fieldName: { type: String, required: true },
    key_config: { type: String, required: true },
    field: { type: Object, required: true },
    sub_store: { type: String, default: "storeLayout" },
  },
  data() {
    return {
      value: this.field.text.value,
    };
  },
  methods: {
    input(val) {
      const payload = {
        key_config: this.key_config,
        fieldName: this.fieldName,
        type: "text",
        value: val,
      };
      this.$store.commit(this.sub_store + "/setValue", payload);
    },
  },
};
</script>
