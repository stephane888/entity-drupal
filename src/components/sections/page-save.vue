<template>
  <div>
    <label> Creer votre site maintenant !!! </label>
    <p class="step-donneesite--label">
      Si votre contenu vous convient, cliquez sur le bouton
      <b> 'Je cree mon site' </b>. Vous pourriez le modifier à tout moment.
    </p>
    <div class="text-left mx-auto content-save-text" v-if="creation_running">
      <ul class="puce-step-vertical step-build">
        <li
          v-for="(item, i) in build_steps"
          :key="i"
          :class="[
            item.status == 'ok' ? 'active' : '',
            item.status == 'error' ? 'text-danger' : '',
          ]"
        >
          {{ item.titre }}
          <b-icon
            icon="three-dots"
            font-scale="1.3"
            animation="cylon"
            class="ml-auto"
            variant="primary"
            v-if="item.status == 'run'"
          ></b-icon>
          <b-icon
            icon="check2"
            font-scale="1.5"
            class="ml-auto"
            variant="primary"
            v-if="item.status == 'ok'"
          ></b-icon>
        </li>
      </ul>
      <div v-if="finish_status" class="my-5 h3 text-primary">
        Votre site serra disponible d'ici 15 minutes
        <small>
          <i class="d-block"> (le temps de progagation des données DNS) </i>
        </small>
      </div>
      <div class="action d-flex flex-column" v-if="finish_status">
        <b-button @click="open_new_site">
          Visiter votre nouveau site
          <b-icon icon="award" font-scale="1.3" class="float-right"></b-icon>
        </b-button>
        <b-button @click="open_new_site_admin">
          Administrer son contenu
          <b-icon
            icon="folder-symlink"
            font-scale="1.3"
            class="float-right"
          ></b-icon>
        </b-button>
      </div>
      <div v-if="finish_status" class="my-5 h3">
        Votre site web :
        <a @click="open_new_site">
          <b> {{ new_hostname }} </b>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "page-save",
  data() {
    return {};
  },
  computed: {
    ...mapState({
      build_steps: (state) => state.build_steps,
      creation_running: (state) => state.creation_running,
      finish_status: (state) => state.finish_status,
      new_hostname: (state) => state.new_hostname,
    }),
  },
  methods: {
    open_new_site() {
      window.open(this.new_hostname, "_blank");
    },
    open_new_site_admin() {
      window.open(this.new_hostname + "/user", "_blank");
    },
  },
};
</script>
