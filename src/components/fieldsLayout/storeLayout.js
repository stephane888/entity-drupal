import config from "./config";
export default {
  namespaced: true,
  state: () => ({
    // Contient les informations de configuration du layout.
    configuration: {},
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
    loadLayout(state) {
      config
        .post(
          "/layout/defaultconfigure/defaults/block_content.layout_entete_m1.default/0/formatage_models_header1"
        )
        .then((resp) => {
          if (resp.data) {
            state.configuration = resp.data;
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
