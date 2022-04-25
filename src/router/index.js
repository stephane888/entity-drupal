import Vue from "vue";
import VueRouter from "vue-router";
//import HomeView from "../views/HomeView.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "form-render",
    component: () => import("../views/formRender.vue"),
  },
  // {
  //   path: "/about",
  //   name: "about",
  //   component: () => import("../views/AboutView.vue"),
  // },
  // {
  //   path: "/form-render",
  //   name: "form-render",
  //   component: () => import("../views/formRender.vue"),
  // },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes,
});

export default router;
