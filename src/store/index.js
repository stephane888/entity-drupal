import Vue from "vue";
import Vuex from "vuex";
import saveEntity from "./saveEntity";
import renderByStep from "../components/formRender/storeFields";
//import storeLayout from "../components/fieldsLayout/storeLayout";
//import storeLayoutFooter from "../components/fieldsLayout/storeLayoutFooter";
import storeFormRenderHeader from "../components/FormRenderHeader/storeFormRenderHeader";
import storeFormRenderFooter from "../components/FormRenderFooter/storeFormRenderFooter";
import config from "../rootConfig";

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
      },
      {
        titre: "Creation de vos contenus",
        step: "create_content",
        status: false,
      },
      {
        titre: "Creation de votre theme",
        status: false,
        step: "create_theme",
      },
      {
        titre: "Mise à jour de l'entete",
        status: false,
        step: "layout_header",
      },
      {
        titre: "Mise à jour du pied de page",
        status: false,
        step: "layout_footer",
      },
      {
        titre: "Genere les styles du theme",
        status: false,
        step: "generate_style",
      },
      // Selectionnner les menus, les pages, le logo.
    ],
    // utilisateur connecter.
    user: {},
    // Contient les textes traduites.
    strings: {},
    //
    messages: { errors: [], warnings: [] },
  },
  getters: {},
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
    // Load strings texte
    loadStrings({ commit }) {
      return config.get("/vuejs-entity/default-string").then((resp) => {
        if (resp.data) {
          commit("SET_STRINGS", resp.data);
        }
      });
    },
  },
  modules: {
    renderByStep: renderByStep,
    //storeLayout: storeLayout,
    //storeLayoutFooter: storeLayoutFooter,
    storeFormRenderHeader: storeFormRenderHeader,
    storeFormRenderFooter: storeFormRenderFooter,
  },
});
