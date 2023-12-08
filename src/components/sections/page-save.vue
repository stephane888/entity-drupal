<template>
  <div class="last-stepe">
    <label> Creer votre site maintenant !!! </label>

    <p class="step-donneesite--label">
      <span v-html="strings.page_save_1"></span>
    </p>
    <b-alert variant="info" show dismissible class="width-phone mx-auto">
      {{ strings.page_save_alert_info }}
    </b-alert>
    <div v-if="errorMessages.length" class="content-save-text mx-auto mt-5">
      <b-alert show dismissible variant="danger" v-for="(msg, i) in errorMessages" :key="i">
        <div v-html="msg"></div>
      </b-alert>
    </div>
    <div v-if="warningMessages.length" class="content-save-text mx-auto mt-5">
      <b-alert show dismissible variant="warning" v-for="(msg, i) in warningMessages" :key="i">
        <div v-html="msg"></div>
      </b-alert>
    </div>
    <div class="text-left mx-auto content-save-text" v-if="creation_running">
      <ul class="puce-step-vertical step-build">
        <li
          v-for="(item, i) in build_steps"
          :key="i"
          :class="[item.status == 'ok' ? 'active' : '', item.status == 'error' ? 'text-danger' : '']"
          class="d-flex align-items-baseline"
        >
          <div>
            <div>{{ item.titre }}</div>
            <small v-for="(incresing, i) in item.entities" :key="i" class="d-block">
              {{ incresing.creates }}/{{ incresing.numbers }} Contenu(s) à creer pour la page : {{ incresing.page }}.
            </small>
          </div>
          <b-icon icon="three-dots" font-scale="1.3" animation="cylon" class="ml-auto" variant="primary" v-if="item.status == 'run'"></b-icon>
          <b-icon icon="check2" font-scale="1.5" class="ml-auto" variant="primary" v-if="item.status == 'ok'"></b-icon>
        </li>
      </ul>
      <div v-if="finish_status" class="my-5 h3 text-primary d-none">
        Votre site serra disponible d'ici 1 minute
        <small>
          <i class="d-block"> ( le temps de progagation des données DNS ) </i>
        </small>
      </div>
      <div class="action d-flex flex-column" v-if="finish_status">
        <b-button @click="open_new_site">
          <span v-html="strings.page_save_vue"></span>
          <b-icon icon="award" font-scale="1.3" class="float-right"></b-icon>
        </b-button>
        <b-button @click="open_new_site_admin">
          {{ strings.page_save_admin }}
          <b-icon icon="folder-symlink" font-scale="1.3" class="float-right"></b-icon>
        </b-button>
      </div>
      <div v-if="finish_status" class="my-5 h3">
        {{ strings.page_save_url }}
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
      strings: (state) => state.strings,
      messages: (state) => state.messages,
    }),
    warningMessages() {
      if (this.messages.warnings && this.messages.warnings.length) {
        return this.messages.warnings;
      } else {
        return [];
      }
    },
    errorMessages() {
      if (this.messages.errors && this.messages.errors.length) {
        return this.messages.errors;
      } else {
        return [];
      }
    },
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
