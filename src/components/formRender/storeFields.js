import config from "./config";
export default {
  namespaced: true,
  state: () => ({
    // Contient l'etape encours.
    current_step: 0,
    // permet de terminer si une requette est en attente
    running: false,
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
      // {
      //   keys: ["description"],
      // },
      {
        keys: [],
        templates: ["layout_entete"],
      },
      {
        keys: [],
        templates: ["layout_footer"],
      },
      {
        keys: [],
        templates: ["page_register"],
        states: [{ custom: "check_user_login" }],
      },
      {
        keys: [],
        templates: ["page_save"],
      },
    ],
    // Contient les informations sur le formaulaire.
    form: {},
    // Contient l'etat du formulaire.
    model: {},
  }),
  mutations: {
    // Passe à l'etape suivante.
    nextStep(state, step = null) {
      if (step !== null) {
        state.current_step = step;
      } else if (state.steppers.length > state.current_step) {
        state.current_step++;
      }
    },
    previewStep(state) {
      if (state.current_step > 0) {
        state.current_step--;
      }
    },
    SET_VALUE(state, payload) {
      if (payload.fieldName && payload.value) {
        if (state.model[payload.fieldName]) {
          state.model[payload.fieldName] = payload.value;
        }
      }
    },
    SET_FORM(state, payload) {
      state.form = payload.form;
      state.model = payload.model;
    },
    ACTIVE_RUNNING(state) {
      state.running = true;
    },
    DISABLE_RUNNING(state) {
      state.running = false;
    },
    // ...
  },
  actions: {
    // On charge les données du formulaire.
    loadForm({ commit }) {
      commit("ACTIVE_RUNNING");
      return config
        .bPost("/vuejs-entity/form/donnee_internet_entity/default/bundle")
        .then((resp) => {
          if (resp.data) {
            commit("SET_FORM", resp.data);
            commit("DISABLE_RUNNING");
          }
        });
    },
    // Permet de mettre à jour un champs ...
    setValue({ commit }, payload) {
      commit("SET_VALUE", payload);
    },
  },
  getters: {
    //
  },
};
