<template>
  <div class="text-left">
    <div class="accordion" role="tablist">
      <b-card no-body class="mb-1" v-for="(card, c) in buildFields()" :key="c">
        <b-card-header header-tag="header" class="p-1" role="tab">
          <b-button
            block
            v-b-toggle="'accordion-' + c"
            variant="info"
            v-html="card.title"
          ></b-button>
        </b-card-header>
        <b-collapse
          :id="'accordion-' + c"
          visible
          accordion="my-accordion-layout-render"
          role="tabpanel"
        >
          <b-card-body>
            <component
              :is="render.template"
              :field="render.field"
              :fieldName="render.fieldName"
              :key_config="render.key_config"
              :class_css="[]"
              v-for="(render, k) in card.fields"
              :key="k"
            ></component>
          </b-card-body>
        </b-collapse>
      </b-card>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import loadField from "./loadField";
export default {
  name: "layoutRenderHeader",
  computed: {
    ...mapState("storeLayout", {
      configuration: (state) => state.configuration,
    }),
  },
  methods: {
    buildFields() {
      const fields = [];
      for (const i in this.configuration) {
        if (this.configuration[i]["builder-form"]) {
          const subFields = [];
          for (const f in this.configuration[i].fields) {
            subFields.push({
              template: loadField.getTemplate(this.configuration[i].fields[f]),
              field: this.configuration[i].fields[f],
              fieldName: f,
              key_config: i,
            });
          }
          fields.push({
            title: this.configuration[i].info.title,
            fields: subFields,
          });
        }
      }
      return fields;
    },
  },
};
</script>
