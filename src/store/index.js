import Vue from "vue";
import Vuex from "vuex";
import renderByStep from "../components/formRender/store";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {
    renderByStep: renderByStep,
  },
});
