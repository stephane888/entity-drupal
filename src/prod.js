import Vue from "vue";
import "./plugins/bootstrap-vue-prod.js";
import App from "./App.vue";
import router from "./router";
import store from "./store";

Vue.config.productionTip = false;
//
import { ValidationObserver, ValidationProvider, extend } from "vee-validate";
Vue.component("ValidationObserver", ValidationObserver);
Vue.component("ValidationProvider", ValidationProvider);
import "drupal-vuejs/src/App/components/vee-validate-custom.js";
import { required, email, alpha } from "vee-validate/dist/rules";
extend("required", {
  ...required,
  message: "Ce champs est requis",
});
extend("email", email);
extend("alpha", alpha);
//
new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount("#app");
//alert("sdsd2");
