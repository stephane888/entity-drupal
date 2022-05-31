<template>
  <div :class="class_css">
    <ValidationProvider :name="field.name" :rules="getRules()" v-slot="v">
      <b-form-group :label="field.label" :description="field.description">
        <div class="field-item-value">
          <b-form-input
            v-model="input_value.title"
            :placeholder="field.placeholder"
            :state="getValidationState(v)"
            :name="field.name + 'title'"
            debounce="500"
            @input="input"
          ></b-form-input>
          <b-form-input
            v-model="input_value.uri"
            :placeholder="field.placeholder"
            :state="getValidationState(v)"
            :name="field.name + 'url'"
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
  name: "drupal-link",
  props: {
    class_css: { type: [Array] },
    field: { type: Object, required: true },
    model: { type: [Object, Array], required: true },
  },
  components: {
    ValidationProvider,
  },
  data() {
    return {
      input_value: { title: "", uri: "#" },
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
      this.$store.dispatch("renderByStep/setValue", {
        value: vals,
        fieldName: this.field.name,
      });
    },
    getValue() {
      if (this.model[this.field.name] && this.model[this.field.name][0]) {
        var url = this.model[this.field.name][0];
        if (url.uri) {
          url.uri = url.uri.replace("internal:", "");
        }
        return url;
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
