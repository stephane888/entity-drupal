<template>
  <div>
    <label> Veillez vous connecter, afin de sauvegarder vos données </label>
    <loginRegister action_after_login="emit_even"></loginRegister>
  </div>
</template>

<script>
import { loginRegister, users } from "drupal-vuejs";
export default {
  name: "page-register",
  components: {
    loginRegister,
  },
  mounted() {
    this.check_if_user_connected();
  },
  methods: {
    ev_logingoogle(user) {
      console.log(user);
    },
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
};
</script>
