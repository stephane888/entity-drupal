import config from "./config";
export default {
  namespaced: true,
  state: () => ({
    // Contient l'entities ou les entities constituant l'entete.
    entities: [],
  }),
  mutations: {
    // Permet de mettre à jour un champs ...
    SET_VALUE(state, payload) {
      console.log(" SET_VALUE payload ", payload);
      function updateSettings(settings, keyPath, value) {
        const keys = keyPath.split(".");
        const targetKey = keys.pop();
        let current = settings;
        for (let i = 0; i < keys.length; ++i) {
          current = current[keys[i]];
          if (!current) {
            throw new Error(" Specified key not found. " + keys[i]);
          }
        }
        current[targetKey] = value;
      }
      updateSettings(state.entities, payload.fieldName, payload.value);
    },
    // On charge les données de configuration du layout.
    // /vuejs-entity/form/paragraph/default/headers
    // /vuejs-entity/form/block_content/default/header
    loadFields(state) {
      const idHome = window.location.pathname.split("/").pop();
      config
        .post("/vuejs-entity/form/paragraphs/" + idHome + "/header")
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
