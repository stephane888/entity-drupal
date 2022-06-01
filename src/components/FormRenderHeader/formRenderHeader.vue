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
              :is="render.template"
              :field="render.field"
              :model="render.model"
              :class_css="[]"
              namespace_store="storeFormRenderHeader/setValue"
              v-for="(render, k) in card.fields"
              :key="k"
            ></component>
          </b-card-body>
        </b-collapse>
      </b-card>
    </div>
    <div class="col-md-6">
      <div class="position-sticky render-model">
        <label> Apercu de l'entete </label>
        <!-- <img
          class="img-fluid"
          src="http://www.wb-horizon.com/sites/default/files/2022-05/opera-instantane_2022-05-05_111359_lesroisdelareno.kksa_.png"
        /> -->
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import loadField from "../fieldsDrupal/loadField";
export default {
  name: "formRenderHeader",

  methods: {
    buildFields() {
      const fields = [];
      const subFields = [];
      for (const i in this.form) {
        subFields.push({
          template: loadField.getField(this.form[i]),
          field: this.form[i],
          model: this.model,
        });
      }
      fields.push({
        title: "entete",
        fields: subFields,
      });
      return fields;
    },
  },
  computed: {
    ...mapState("storeFormRenderHeader", {
      form: (state) => state.form,
      model: (state) => state.model,
    }),
  },
};
</script>
