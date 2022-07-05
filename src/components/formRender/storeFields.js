import config from "./config";
import loadField from "../fieldsDrupal/loadField";
//import layoutREnder from "../fieldsLayout/layoutRenderHeader.vue";
import storeFormRenderHeader from "../FormRenderHeader/formRenderHeader.vue";
//import layoutRenderFooter from "../fieldsLayout/layoutRenderFooter.vue";
import storeFormRenderFooter from "../FormRenderFooter/FormRenderFooter.vue";
//
import sectionRegister from "../sections/page-register.vue";
import sectionSave from "../sections/page-save.vue";
import router from "../../router";
import store from "../../store/index";
// console.log("config store : ", config);
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
      {
        keys: ["site_theme_color"],
        states: [
          {
            step: {
              action: "visible",
              name: "type_color_theme",
              operator: "==",
              value: "0",
              state_name: "",
            },
          },
        ],
      },
      {
        keys: [
          "color_primary",
          "color_secondary",
          "color_linkhover",
          "background",
        ],
        states: [
          {
            step: {
              action: "visible",
              name: "type_color_theme",
              operator: "==",
              value: "1",
              state_name: "",
            },
          },
        ],
      },
      { keys: ["image_logo"] },
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
    // Contient les etapes valides.
    valid_steppers: [],
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
    previewStep(state, step = null) {
      if (step !== null) {
        state.current_step = step;
      } else if (state.current_step > 0) {
        state.current_step--;
      }
    },
    SET_VALUE(state, payload) {
      if (payload.fieldName && payload.value) {
        if (state.model[payload.fieldName]) {
          state.model[payload.fieldName] = payload.value;
          localStorage.setItem("app.model", JSON.stringify(state.model));
        }
      }
    },
    SET_FORM(state, payload) {
      state.form = payload.form;
      state.model = payload.model;
      localStorage.setItem("app.model", JSON.stringify(state.model));
      localStorage.setItem("app.form", JSON.stringify(state.form));
    },
    ACTIVE_RUNNING(state) {
      state.running = true;
    },
    DISABLE_RUNNING(state) {
      state.running = false;
    },
    /**
     * @deprecated 'Not use'
     * @param {*} state
     * @param {*} payload
     */
    ADD_VALID_STEP(state, payload) {
      if (!state.valid_steppers.includes(payload))
        state.valid_steppers.push({ value: payload });
    },
    /**
     * @deprecated 'Not use'
     * @param {*} state
     */
    REMOVE_LAST_VALID_STEP(state) {
      const ar = state.valid_steppers;
      const n_ar = [];
      ar.forEach((item) => {
        if (ar.length > n_ar.length + 1) n_ar.push(item);
      });
      console.log("n_ar : ", n_ar);
      state.valid_steppers = n_ar;
    },
    // SET_VALID_STEPPERS(state, payload) {
    //   state.valid_steppers = payload;
    // },
    // ...
  },
  actions: {
    // On charge les données du formulaire.
    loadForm({ commit }) {
      commit("ACTIVE_RUNNING");
      console.log(" loadForm config ", config);
      const param = {
        homepage: window.location.pathname.split("/").pop(),
      };
      return config
        .bPost(
          "/vuejs-entity/form/donnee_internet_entity/default/bundle",
          param
        )
        .then((resp) => {
          if (resp.data) {
            //on verifie si on a des données en cache.
            if (localStorage.getItem("app.model")) {
              const model = JSON.parse(localStorage.getItem("app.model"));
              const form = JSON.parse(localStorage.getItem("app.form"));
              // const valid_steppers = JSON.parse(
              //   localStorage.getItem("app.valid_steppers")
              // );
              commit("SET_FORM", { form: form, model: model });
              // commit("SET_VALID_STEPPERS", valid_steppers);
            } else {
              commit("SET_FORM", resp.data);
              commit("DISABLE_RUNNING");
            }
          }
        });
    },
    // Permet de mettre à jour un champs ...
    setValue({ commit }, payload) {
      commit("SET_VALUE", payload);
    },
    //
    removeLastValidStep({ commit }) {
      commit("REMOVE_LAST_VALID_STEP");
      return new Promise((resolv) => {
        setTimeout(() => {
          resolv(true);
        }, 200);
      });
    },
  },
  getters: {
    // Contient les champs d'une etape.
    stepFields: (state) => {
      const fields = [];
      //console.log(" Getters.fields :: ", state, " \n store : ", store.state);
      const step = state.steppers[state.current_step];
      var save_step = true;
      // validation de l'etape:
      var valid = true;
      if (step.states && step.states.length) {
        const getState = (i = 0) => {
          if (step.states[i]) return step.states[i];
        };
        var stepState = getState(0);
        if (stepState.custom == "check_user_login") {
          save_step = false;
          if (
            store.state.user &&
            store.state.user.uid &&
            store.state.user.uid[0]
          ) {
            valid = false;
          }
        } else if (
          stepState.step &&
          stepState.step.name &&
          state.model[stepState.step.name] &&
          state.model[stepState.step.name].length &&
          state.model[stepState.step.name][0].value == stepState.step.value
        ) {
          valid = false;
        }
      }
      //
      if (!valid) {
        router.push({ path: `/form-render/${state.current_step + 1}` });
        return [];
      }
      // Charge les champs drupal.
      if (step.keys && step.keys.length) {
        step.keys.forEach((fieldName) => {
          if (state.form[fieldName]) {
            // Ces deux conditions ne me semble pas claire.
            if (state.model[fieldName])
              fields.push({
                template: loadField.getField(state.form[fieldName]),
                field: state.form[fieldName],
                model: state.model,
              });
            else
              fields.push({
                template: loadField.getField(state.form[fieldName]),
                field: state.form[fieldName],
              });
          }
        });
      }
      // Charge les templates.
      if (step.templates && step.templates.length) {
        step.templates.forEach((template) => {
          if (template == "layout_entete") {
            fields.push({
              template: storeFormRenderHeader,
              field: {},
            });
          } else if (template == "layout_footer") {
            fields.push({
              template: storeFormRenderFooter,
              field: {},
            });
          } else if (template == "page_register") {
            fields.push({
              template: sectionRegister,
              field: {},
            });
          } else if (template == "page_save") {
            fields.push({
              template: sectionSave,
              field: {},
            });
          }
        });
      }
      // Ajout de l'epape
      if (
        state.valid_steppers.indexOf(state.current_step) === -1 &&
        save_step
      ) {
        state.valid_steppers.push(state.current_step);
        // localStorage.setItem(
        //   "app.valid_steppers",
        //   JSON.stringify(state.valid_steppers)
        // );
      }

      return fields;
    },
  },
};
