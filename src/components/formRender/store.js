import config from "./config";
export default {
  namespaced: true,
  state: () => ({
    // Contient l'etape encours.
    current_step: 0,
    // Contient les etapes et les champs de ces etapes.
    steppers: [
      { keys: ["html_1"] },
      { keys: ["name"] },
      { keys: ["type_color_theme"] },
      { keys: ["site_theme_color"] },
      {
        keys: [
          "color_primary",
          "color_secondary",
          "color_linkhover",
          "background",
        ],
      },
      { keys: ["pages"] },
      {
        keys: ["description"],
      },
    ],
    // Contient les informations sur le formaulaire.
    form: {},
    // Contient l'etat du formulaire.
    model: {},
  }),
  mutations: {
    // Passe à l'etape suivante.
    nextStep(state) {
      if (state.steppers.length > state.current_step) {
        state.current_step++;
      }
    },
    previewStep(state) {
      if (state.current_step > 0) {
        state.current_step--;
      }
    },
    // Permet de mettre à jour un champs ...
    setValue(state, payload) {
      if (payload.fieldName && payload.value) {
        if (state.model[payload.fieldName]) {
          state.model[payload.fieldName] = payload.value;
        }
      }
    },
    // On charge les données du formulaire.
    loadForm(state) {
      config
        .bPost("/vuejs-entity/form/donnee_internet_entity/default/bundle")
        .then((resp) => {
          if (resp.data) {
            state.form = resp.data.form;
            state.model = resp.data.model;
          }
        });
    },
    // ...
  },
  actions: {
    //
  },
  getters: {
    //
  },
};
