<template>
  <div :class="class_css">
    <ValidationProvider :name="field.name" :rules="getRules()" v-slot="v">
      <b-form-group :label="field.label" :description="field.description">
        <div
          v-for="(val, k) in model[field.name]"
          :key="k"
          class="field-item-value"
        >
          <b-form-input
            v-model="val.value"
            :placeholder="field.placeholder"
            :state="getValidationState(v)"
            :name="field.name"
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
  },
  components: {
    ValidationProvider,
  },
  methods: {
    getValidationState({ dirty, validated, valid = null }) {
      return (dirty || validated) && !valid ? valid : null;
    },
    getRules() {
      return config.getRules(this.field);
    },
  },
};
</script>
