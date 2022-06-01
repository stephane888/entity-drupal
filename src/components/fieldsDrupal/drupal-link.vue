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
            @input="input"
          ></b-form-input>
          <b-form-input
            v-model="input_value.uri"
            :placeholder="field.placeholder"
            :state="getValidationState(v)"
            :name="field.name + 'url'"
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
    namespace_store: { type: String, required: true },
  },
  components: {
    ValidationProvider,
  },
  data() {
    return {
      input_value: { title: "", uri: "#" },
      timer: null,
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
        var url = this.model[this.field.name][0];
        if (url.uri) {
          return {
            uri: url.uri.replace("internal:", ""),
            title: url.title,
            attributes: url.attributes,
            options: url.options,
          };
        }
        return url;
      }
    },
    input() {
      const vals = [];
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        const value = {
          uri: "internal:" + this.input_value.uri,
          title: this.input_value.title,
          attributes: [],
          options: [],
        };
        vals.push(value);
        this.setValue(vals);
      }, 500);
    },
  },
};
</script>
