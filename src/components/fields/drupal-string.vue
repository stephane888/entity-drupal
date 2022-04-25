<template>
  <div :class="class_css">
    <b-form-group :label="field.label" :description="field.description">
      <div
        v-for="(val, k) in model[fieldName]"
        :key="k"
        class="field-item-value"
      >
        <b-form-input
          v-model="val.value"
          :placeholder="field.placeholder"
        ></b-form-input>
      </div>
    </b-form-group>
  </div>
</template>

<script>
export default {
  name: "drupal-string",
  props: {
    class_css: { type: [Array] },
    field: { type: Object, required: true },
    model: { type: [Object, Array], required: true },
    fieldName: { type: String, required: true },
  },
};
</script>
