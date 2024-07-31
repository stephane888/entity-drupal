import Vue from "vue";
import VueRouter from "vue-router";
//import HomeView from "../views/HomeView.vue";
const TheContainer = () => import("../views/TheContainer.vue");
const formRender = () => import("../views/formRender.vue");
const textDuplicateEntities = () =>
  import("../views/TextDuplicateEntities.vue");

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
  {
    path: "/test-form-render",
    name: "test-form-render",
    component: textDuplicateEntities,
  },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes,
});

export default router;
