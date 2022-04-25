<template>
  <div :class="class_css">
    <div class="field-item-value" :format_val="format_val">
      <b-form-group :label="field.label" v-slot="{ ariaDescribedby }">
        <b-form-checkbox-group
          v-model="selected"
          :aria-describedby="ariaDescribedby"
        >
          <b-form-checkbox
            :value="option.value"
            v-for="(option, o) in field.entity_form_settings.list_options"
            :key="o"
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
            ></div>
          </b-form-checkbox>
        </b-form-checkbox-group>
      </b-form-group>
    </div>
    <pre> Selected:: {{ selected }}  </pre>
    <pre> Model:: {{ model }} </pre>
    <pre> Format_val :: {{ format_val }} </pre>
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
    this.getImage();
  },
  methods: {
    getImage() {
      this.field.entity_form_settings.list_options.forEach((option) => {
        if (!option.image_url) this.$set(option, "image_url", "");
        if (option.image[0]) {
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
