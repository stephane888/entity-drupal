<template>
  <main class="c-main">
    <transition name="fade" mode="out-in">
      <router-view :key="$route.path"></router-view>
    </transition>
  </main>
</template>

<script>
import "bootstrap-vue/dist/bootstrap-vue-icons.min.css";
import users from "../users.js";
export default {
  name: "the-container",
  mounted() {
    this.$store.dispatch("renderByStep/loadForm");
    this.$store.commit("storeLayoutFooter/loadLayout");
    this.$store.commit("storeLayout/loadLayout");
    this.$store.dispatch("loadStrings");
    users.getCurrentUser().then((user) => {
      this.$store.commit("SET_USER", user);
    });
  },
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0.2;
}
</style>
