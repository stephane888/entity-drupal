import Vue from "vue";
import VueRouter from "vue-router";
//import HomeView from "../views/HomeView.vue";
const TheContainer = () => import("../views/TheContainer.vue");
const formRender = () => import("../views/formRender.vue");

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "home",
    component: TheContainer,
    redirect: "/form-render",
    children: [
      {
        path: "/form-render",
        name: "form-render",
        component: formRender,
      },
      {
        path: "/form-render/:idstep",
        name: "Step",
        component: formRender,
        props: true,
      },
    ],
  },
  // {
  //   path: "/",
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
