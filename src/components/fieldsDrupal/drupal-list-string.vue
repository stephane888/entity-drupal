<template>
  <div :class="class_css">
    <div class="field-item-value js-form-type-checkbox">
      <ValidationProvider :name="field.name" :rules="getRules()" v-slot="v">
        <b-form-group :label="field.label">
          <div class="fieldset-wrapper">
            <div class="checkbox">
              <b-form-checkbox-group v-model="selected" @input="setValue">
                <b-form-checkbox
                  :value="option.value"
                  v-for="(option, o) in field.entity_form_settings.list_options"
                  :key="o"
                  class="form-check"
                >
                  <transition name="fade" mode="out-in">
                    <div>
                      <b-img
                        thumbnail
                        fluid
                        :src="option.image_url"
                        v-if="option.image_url"
                        alt="Image 1"
                      ></b-img>
                      <svgLoader v-if="!option.image_url"></svgLoader>
                    </div>
                  </transition>
                  <div class="mt-5">{{ option.label }}</div>
                  <div
                    class="mt-5 text-hover"
                    v-html="option.description.value"
                    v-if="
                      option.description.value &&
                      option.description.value !== ''
                    "
                  ></div>
                </b-form-checkbox>
              </b-form-checkbox-group>
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
import svgLoader from "./svg-preloader.vue";
export default {
  name: "drupal-list-string",
  props: {
    class_css: { type: [Array] },
    field: { type: Object, required: true },
    model: { type: [Object], required: true },
    namespace_store: { type: String, required: true },
  },
  components: {
    ValidationProvider,
    svgLoader,
  },
  data() {
    return {
      selected: [],
    };
  },
  mounted() {
    this.getValue();
    // Lorsque le composant s'initialise on charge les images.
    this.getImage();
  },
  // watch: {
  //   /**
  //    * Lorsque le composant est chargé plusieurs durant le processus, on est obligé de forcer la MAJ des images si le nom change.
  //    * ( Idealement on devrait charger des instances du champs pour un espace bien donnée ).
  //    */
  //   fieldName() {
  //     this.getImage();
  //   },
  // },

  methods: {
    /**
     * --
     */
    getImage() {
      this.field.entity_form_settings.list_options.forEach((option) => {
        if (!option.image_url) this.$set(option, "image_url", "");
        if (option.image && option.image[0] && option.image_url == "") {
          config.getImageUrl(option.image[0]).then((resp) => {
            option.image_url = resp.data;
          });
        }
      });
    },
    /**
     *
     * @param {--} vals
     */
    setValue(e) {
      const vals = [];
      e.forEach((item) => {
        vals.push({ value: item });
      });
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
    /**
     * --
     */
    getRules() {
      return config.getRules(this.field);
    },
    /**
     * --
     */
    getValue() {
      if (this.model[this.field.name] && this.model[this.field.name].length) {
        this.model[this.field.name].forEach((item) => {
          this.selected.push(item.value);
        });
      }
    },
  },
};
</script>
<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0.2;
}
</style>
