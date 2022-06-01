<template>
  <div :class="class_css">
    <ValidationProvider :name="field.name" :rules="getRules()" v-slot="v">
      <b-form-group :label="field.label" :description="field.description">
        <div class="field-item-value">
          <b-form-input
            v-model="input_value"
            :placeholder="field.placeholder"
            :state="getValidationState(v)"
            :name="field.name"
            debounce="500"
            @input="input"
          ></b-form-input>
        </div>
        <div class="text-danger my-2" v-if="v.errors">
          <small v-for="(error, ii) in v.errors" :key="ii" class="d-block">
            {{ error }}
          </small>
        </div>
      </b-form-group>
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
      input_value: null,
    };
  },
  mounted() {
    this.input_value = this.getValue();
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
      vals.push({ value: v });
      this.setValue(vals);
    },
  },
};
</script>
