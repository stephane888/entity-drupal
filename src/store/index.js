import Vue from "vue";
import Vuex from "vuex";
import saveEntity from "./saveEntity";
import renderByStep from "../components/formRender/storeFields";
//import storeLayout from "../components/fieldsLayout/storeLayout";
//import storeLayoutFooter from "../components/fieldsLayout/storeLayoutFooter";
import storeFormRenderHeader from "../components/FormRenderHeader/storeFormRenderHeader";
import storeFormRenderFooter from "../components/FormRenderFooter/storeFormRenderFooter";
import config from "../rootConfig";
// ?XDEBUG_TRIGGER=run
Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    /**
     * Permet de suivre l'etat de creation du site.
     * True, le site est encours de creation.
     */
    creation_running: false,
    // Permet de determiner si la creation est terminé.
    finish_status: false,
    // Nouveau nom de domaine.
    new_hostname: null,

    // Les differences etapes du processus.
    build_steps: [
      {
        titre: "Creation de votre domaine",
        step: "create_domaine",
        status: false,
      },
      {
        titre: "Enregistrement de votre domaine",
        step: "register_domaine",
        status: false,
        entities: [],
      },
      {
        titre: "Creation de vos contenus",
        step: "create_content",
        status: false,
        entities: [],
      },
      {
        titre: "Creation de votre theme",
        status: false,
        step: "create_theme",
        entities: [],
      },
      {
        titre: "Mise à jour de l'entete",
        status: false,
        step: "layout_header",
        entities: [],
      },
      {
        titre: "Mise à jour du pied de page",
        status: false,
        step: "layout_footer",
        entities: [],
      },
      {
        titre: "Genere les styles du theme",
        status: false,
        step: "generate_style",
      },
      {
        titre: "Verification",
        status: false,
        step: "check_apply_actions",
      },
      // Selectionnner les menus, les pages, le logo.
    ],
    // utilisateur connecter.
    user: {},
    // Contient les textes traduites.
    strings: {},
    //
    messages: { errors: [], warnings: [] },
    // Array contenant les données a sauvegarder.
    entityDuplicate: [],
    // use by module login
    form: {
      name: [{ value: "" }],
      mail: [{ value: "" }],
    },
    configs_login_rx_vuejs: {
      client_google_id: "513247959752-qapd9jb30pdtoh51m0h53070a2v8c4er.apps.googleusercontent.com", //from https://console.cloud.google.com/apis/credentials?project=lesroisdelareno
    },
  },
  getters: {
    numbersEntities: (state) => {
      var number = 0;
      const loopCount = (datas) => {
        for (const i in datas) {
          number++;
          if (datas[i].entities) {
            //console.log("loopCount : ", datas[i].entities);
            for (const j in datas[i].entities) {
              loopCount(datas[i].entities[j]);
            }
          }
        }
      };
      loopCount(state.entityDuplicate);
      return number;
    },
  },
  mutations: {
    ACTIVE_CREATION(state) {
      state.creation_running = true;
    },
    DISABLE_CREATION(state) {
      state.creation_running = false;
    },
    ACTIVE_FINISH(state) {
      state.finish_status = true;
    },
    SET_HOSTNAME(state, payload) {
      if (payload.domain && payload.scheme) {
        state.new_hostname = payload.scheme + "://" + payload.domain;
      }
    },
    SET_USER(state, user) {
      state.user = user;
    },
    SET_STRINGS(state, strings) {
      state.strings = strings;
    },
    SET_WARNING_MESSAGES(state, messages) {
      state.messages.warnings = messages;
    },
    SET_ERROR_MESSAGES(state, messages) {
      state.messages.errors = messages;
    },
    CLEAN_LOCALSTORAGE() {
      localStorage.removeItem("app.model");
      localStorage.removeItem("app.form");
      localStorage.removeItem("app.hash");
    },
    SET_ENTITYDUPLICATE(state, payload) {
      state.entityDuplicate = payload;
    },
  },
  actions: {
    //
    create_site({ commit, state }) {
      commit("ACTIVE_CREATION");
      saveEntity.runStep(state.build_steps, state);
    },
    //
    reset_creation({ commit }) {
      commit("DISABLE_CREATION");
      saveEntity.currentBuildStep = 0;
    },

    /**
     * Recupere la matrice de l'entite afin de pouvoir creer les entites en relations avec ce dernier.
     *
     * @param {*} param0
     * @param {*} payload
     * @returns
     */
    getMatriceEntities({ commit }, payload) {
      return new Promise((resolv, reject) => {
        /**
         * Permet de relancer les requetes de types POST.
         */
        var essaie = 0;
        var numberRetry = 5;
        var timeWaitBeforeRetry = 25000;
        const loop = () => {
          return new Promise((resolvChild, rejectChild) => {
            config
              .bPost("/vuejs-entity/entity/generate-page-web/" + payload.id, payload.content)
              .then((resp) => {
                resolvChild(resp);
              })
              .catch((err) => {
                if (essaie <= numberRetry) {
                  essaie++;
                  setTimeout(() => {
                    resolvChild(loop());
                  }, timeWaitBeforeRetry);
                } else rejectChild(err);
              });
          });
        };
        loop()
          .then((resp) => {
            commit("SET_ENTITYDUPLICATE", resp.data);
            resolv(resp);
          })
          .catch((er) => {
            reject(er);
          });
        // config
        //   .bPost("/vuejs-entity/entity/generate-page-web/" + payload.id, payload.content)
        //   .then((resp) => {
        //     commit("SET_ENTITYDUPLICATE", resp.data);
        //     resolv(resp);
        //   })
        //   .catch((er) => {
        //     reject(er);
        //   });
      });
    },
    saveEntity({ commit }, payload) {
      commit("ACTIVE_CREATION");
      return new Promise((resolv, reject) => {
        if (payload.entity_type_id == undefined || !payload.entity_type_id) {
          reject("Paramettre manquant");
        } else
          config
            .bPost("/apivuejs/save-entity/" + payload.entity_type_id, payload.value)
            .then((resp) => {
              //console.log("resp : ", resp);
              //setTimeout(() => {
              //console.log(" payload : ", payload);
              resolv(resp);
              //}, 1000);
            })
            .catch((er) => {
              reject(er);
            });
      });
    },
    // Load strings texte
    loadStrings({ commit }) {
      return config.bGet("/vuejs-entity/default-string").then((resp) => {
        if (resp.data) {
          commit("SET_STRINGS", resp.data);
        }
      });
    },
  },
  modules: {
    renderByStep: renderByStep,
    // storeLayout: storeLayout,
    // storeLayoutFooter: storeLayoutFooter,
    storeFormRenderHeader: storeFormRenderHeader,
    storeFormRenderFooter: storeFormRenderFooter,
  },
});
