<template>
  <div class="text-left row">
    <div class="accordion col-md-6" role="tablist">
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
              v-for="(render, k) in card.fields"
              :key="k"
              :is="render.template"
              :field="render.field"
              :model="render.model"
              :class_css="[]"
              namespace-store="storeFormRenderHeader"
              :parent-name="c + '.entity.'"
            ></component>
          </b-card-body>
        </b-collapse>
      </b-card>
    </div>
    <div class="col-md-6">
      <div class="position-sticky render-model">
        <label> Apercu de l'entete </label>
        <img
          class="img-fluid"
          src="/sites/default/files/2022-06/creer-votre-site-web-en-5-minutes-drush-site-install-2.png"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
//import loadField from "../fieldsDrupal/loadField";
import loadField from "components_h_vuejs/src/components/fieldsDrupal/loadField.js";
import config from "./config";
export default {
  name: "formRenderHeader",
  computed: {
    ...mapState("storeFormRenderHeader", {
      entities: (state) => state.entities,
    }),
  },
  methods: {
    /**
     * Permet de generer les champs pour les entites de premier niveau.
     * ( par principe on devrait avoir un seule entité de premier niveau ).
     */
    buildFields() {
      const fields = [];
      const subFields = [];
      loadField.setConfig(config);
      this.entities.forEach((element) => {
        if (element.form_sort && element.entity) {
          console.log(" element.entity : ", element);
          for (const i in element.form_sort) {
            subFields.push({
              template: loadField.getField(element.form_sort[i]),
              field: element.form_sort[i],
              model: element.entity,
            });
          }
        }
      });
      fields.push({
        title: "entete",
        fields: subFields,
      });
      return fields;
    },
  },
};
</script>
