import config from "./config";
export default {
  namespaced: true,
  state: () => ({
    // Contient les informations sur le formaulaire.
    form: {},
    // Contient l'etat du formulaire.
    model: {},
  }),
  mutations: {
    setValue(state, payload) {
      if ((payload.key_config && payload.fieldName, payload.type)) {
        if (
          state.configuration[payload.key_config] &&
          state.configuration[payload.key_config].fields[payload.fieldName] &&
          state.configuration[payload.key_config].fields[payload.fieldName][
            payload.type
          ]
        ) {
          state.configuration[payload.key_config].fields[payload.fieldName][
            payload.type
          ].value = payload.value;
        }
      }
    },
    // On charge les données de configuration du layout.
    // /vuejs-entity/form/paragraph/default/headers
    // /vuejs-entity/form/block_content/default/header
    loadFields(state) {
      config
        .post("/vuejs-entity/form/paragraph/default/headers")
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
