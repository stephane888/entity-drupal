import config from "./config";
export default {
  namespaced: true,
  state: () => ({
    // Contient l'entities ou les entities constituant l'entete.
    entities: [],
  }),
  mutations: {
    SET_VALUE(state, payload) {
      if (payload.fieldName && payload.value) {
        if (
          state.entities[0] &&
          state.entities[0].entity &&
          state.entities[0].entity[payload.fieldName]
        ) {
          state.entities[0].entity[payload.fieldName] = payload.value;
        }
      }
    },
    // On charge les données de configuration du layout.
    // /vuejs-entity/form/paragraph/default/headers
    // /vuejs-entity/form/block_content/default/header
    loadFields(state) {
      const idHome = window.location.pathname.split("/").pop();
      config
        .post("/vuejs-entity/form/paragraphs/" + idHome + "/footer")
        .then((resp) => {
          if (resp.data) {
            state.entities = resp.data;
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
