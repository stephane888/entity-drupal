<template>
  <div :class="class_css">
    <div
      class="field-item-value js-form-type-checkbox"
      :format_val="format_val"
    >
      <b-form-group :label="field.label" v-slot="{ ariaDescribedby }">
        <div class="fieldset-wrapper">
          <div class="checkbox">
            <b-form-checkbox-group
              v-model="selected"
              :aria-describedby="ariaDescribedby"
            >
              <b-form-checkbox
                :value="option.value"
                v-for="(option, o) in field.entity_form_settings.list_options"
                :key="o"
                class="form-check"
              >
                <div>
                  <b-img
                    thumbnail
                    fluid
                    :src="option.image_url"
                    alt="Image 1"
                  ></b-img>
                </div>
                {{ option.label }}
                <div
                  class="mt-5 text-hover"
                  v-html="option.description.value"
                  v-if="
                    option.description.value && option.description.value !== ''
                  "
                ></div>
              </b-form-checkbox>
            </b-form-checkbox-group>
          </div>
        </div>
      </b-form-group>
    </div>
  </div>
</template>

<script>
import config from "./loadField";
export default {
  name: "drupal-list-string",
  props: {
    class_css: { type: [Array] },
    field: { type: Object, required: true },
    model: { type: [Object], required: true },
    fieldName: { type: String, required: true },
  },
  data() {
    return {
      selected: [],
    };
  },
  mounted() {
    // lorsque le composant s'initialise on charge les images.
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
      if (this.selected) {
        this.selected.forEach((item) => {
          vals.push({ value: item });
        });
      }
      this.setValue(vals);
      return vals;
    },
  },
};
</script>
