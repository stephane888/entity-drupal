<template>
  <div :class="class_css" field="drupal_boolean">
    <div class="field-item-value js-form-type-radio" :format_val="format_val">
      <ValidationProvider :name="field.name" :rules="getRules()" v-slot="v">
        <b-form-group :label="field.label" :name="field.name">
          <div class="fieldset-wrapper">
            <div class="radio">
              <b-form-radio
                v-model="selected"
                :name="field.name"
                v-for="(option, o) in field.entity_form_settings.list_options"
                :key="o"
                :value="option.value"
                class="form-check"
                :state="getValidationState(v)"
              >
                <b-img
                  thumbnail
                  fluid
                  :src="option.image_url"
                  alt="Image 1"
                ></b-img>

                <div class="mt-5">{{ option.label }}</div>
                <div
                  v-if="
                    option.description.value && option.description.value !== ''
                  "
                  class="mt-5 text-hover"
                  v-html="option.description.value"
                ></div>
              </b-form-radio>
            </div>
            <div class="text-danger my-2" v-if="v.errors">
              <small v-for="(error, ii) in v.errors" :key="ii" class="d-block">
                {{ error }}
              </small>
            </div>
          </div>
        </b-form-group>
      </ValidationProvider>
    </div>
  </div>
</template>

<script>
import config from "./loadField";
import { ValidationProvider } from "vee-validate";
import "./vee-validation-rules";
export default {
  name: "drupal-boolean",
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
      selected:
        this.model[this.field.name] && this.model[this.field.name][0]
          ? this.model[this.field.name][0].value
          : null,
    };
  },
  mounted() {
    this.getImage();
  },
  watch: {
    /**
     * Lorsque le composant est chargé plusieurs durant le processus, on est obligé de forcer la MAJ des images si le nom change.
     * ( Idealement on devrait charger des instances du champs pour un espace bien donnée ).
     */
    fieldName() {
      this.getImage();
    },
  },
  methods: {
    getImage() {
      this.field.entity_form_settings.list_options.forEach((option) => {
        if (!option.image_url) this.$set(option, "image_url", "");
        if (option.image[0] && option.image_url == "") {
          config.getImageUrl(option.image[0]).then((resp) => {
            option.image_url = resp.data;
          });
        }
      });
    },
    setValue(vals) {
      this.$store.dispatch("renderByStep/setValue", {
        value: vals,
        fieldName: this.field.name,
      });
    },
    getValidationState({ dirty, validated, valid = null }) {
      return (dirty || validated) && !valid ? valid : null;
    },
    getRules() {
      return config.getRules(this.field);
    },
  },
  computed: {
    format_val() {
      const vals = [];
      if (this.selected !== null) {
        vals.push({ value: this.selected });
      }
      this.setValue(vals);
      return vals;
    },
    fieldName() {
      return this.field.name;
    },
  },
};
</script>
