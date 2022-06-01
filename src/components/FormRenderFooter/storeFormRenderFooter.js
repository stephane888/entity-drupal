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
    SET_VALUE(state, payload) {
      if (payload.fieldName && payload.value) {
        if (state.model[payload.fieldName]) {
          state.model[payload.fieldName] = payload.value;
        }
      }
    },
    // On charge les données de configuration du layout.
    // /vuejs-entity/form/paragraph/default/headers
    // /vuejs-entity/form/block_content/default/header
    loadFields(state) {
      config
        .post("/vuejs-entity/form/paragraph/default/footer")
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
    // Permet de mettre à jour un champs ...
    setValue({ commit }, payload) {
      commit("SET_VALUE", payload);
    },
  },
  getters: {
    //
  },
};
