<template>
  <div :class="class_css" field="drupal_boolean">
    <div class="field-item-value js-form-type-radio" :format_val="format_val">
      <b-form-group :label="field.label" v-slot="{ ariaDescribedby }">
        <div class="fieldset-wrapper">
          <div class="radio">
            <b-form-radio
              v-model="selected"
              :aria-describedby="ariaDescribedby"
              name="some-radios"
              v-for="(option, o) in field.entity_form_settings.list_options"
              :key="o"
              :value="option.value"
              class="form-check"
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
        </div>
      </b-form-group>
    </div>
  </div>
</template>

<script>
import config from "./loadField";
export default {
  name: "drupal-boolean",
  props: {
    class_css: { type: [Array] },
    field: { type: Object, required: true },
    model: { type: [Object, Array], required: true },
    fieldName: { type: String, required: true },
  },
  data() {
    return {
      selected: null,
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
      this.$store.commit("renderByStep/setValue", {
        value: vals,
        fieldName: this.fieldName,
      });
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
  },
};
</script>
