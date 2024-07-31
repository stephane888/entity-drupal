<template>
  <div>
    <label v-html="strings.ask_to_login"></label>
    <loginRegister
      actionAfterLogin="emit_even"
      modelRegisterForm="generate_password"
    ></loginRegister>
  </div>
</template>

<script>
import { mapState } from "vuex";
import users from "../../users.js";
export default {
  name: "page-register",
  components: {
    loginRegister: () => {
      return import("drupal-vuejs/src/App/components/LoginRegister.vue");
    },
  },
  mounted() {
    this.check_if_user_connected();
  },
  methods: {
    // ev_logingoogle(user) {
    //  // console.log(user);
    // },
    check_if_user_connected() {
      document.addEventListener(
        "login_rx_vuejs__user_is_login",
        () => {
          console.log("user login");
          users.getCurrentUser().then((user) => {
            this.$store.commit("SET_USER", user);
            this.$store.commit("renderByStep/nextStep");
          });
        },
        false
      );
    },
  },
  computed: {
    ...mapState({
      strings: (state) => state.strings,
    }),
  },
};
</script>
