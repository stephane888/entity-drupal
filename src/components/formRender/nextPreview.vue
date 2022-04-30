<template>
  <div
    class="d-flex justify-content-between align-items-center step-donneesite--submit mx-auto"
    :check_validation="check_validation"
  >
    <b-button
      variant="secondary"
      v-if="current_step && !creation_running"
      @click="previewStep"
    >
      <b-icon icon="arrow-left"></b-icon> Precedent
    </b-button>
    <b-button
      variant="primary"
      @click="nextStep"
      v-if="count_step < steppers.length"
      :disabled="disabled || disable_submit"
    >
      Suivant <b-icon icon="arrow-right"></b-icon>
    </b-button>

    <b-button
      variant="primary"
      v-if="count_step >= steppers.length && !finish_status"
      @click="create_site"
      :disabled="creation_running"
    >
      je cree mon site
      <b-icon
        icon="check2"
        font-scale="2"
        v-if="!creation_running"
        class="ml-2"
      ></b-icon>
      <b-icon
        icon="arrow-clockwise"
        font-scale="2"
        animation="spin"
        class="ml-2"
        v-if="creation_running"
      ></b-icon>
    </b-button>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "next-preview",
  props: {
    validation_form: { type: Object, required: true },
  },
  data() {
    return {
      disabled: false,
    };
  },
  mounted() {
    this.ajustStep();
  },
  computed: {
    ...mapState({
      creation_running: (state) => state.creation_running,
      steppers: (state) => state.renderByStep.steppers,
      current_step: (state) => state.renderByStep.current_step,
      finish_status: (state) => state.finish_status,
    }),
    count_step() {
      return this.current_step + 1;
    },
    check_validation() {
      if (this.disabled && this.validation_form.valid) {
        this.validationStep();
        return true;
      }
      return false;
    },
    disable_submit() {
      const step = this.steppers[this.current_step];
      if (step) {
        if (step.templates && step.templates.includes("page_register"))
          return true;
      }
      return false;
    },
  },

  methods: {
    nextStep() {
      if (this.validationStep()) {
        this.$store.commit("renderByStep/nextStep");
        this.$router.push({ path: `/form-render/${this.current_step}` });
      }
    },
    previewStep() {
      this.$store.commit("renderByStep/previewStep");
      this.$router.push({ path: `/form-render/${this.current_step}` });
    },
    validationStep() {
      if (this.validation_form.valid) {
        this.disabled = false;
        return true;
      } else {
        this.validation_form.validate();
        this.disabled = true;
      }
    },
    ajustStep() {
      var idstep = parseInt(this.$route.params.idstep);
      if (
        parseInt(this.current_step) !== idstep &&
        idstep <= this.steppers.length
      ) {
        this.$store.commit("renderByStep/nextStep", idstep);
      }
    },
    create_site() {
      this.$store.dispatch("create_site");
    },
    // reset_creation() {
    //   this.$store.dispatch("reset_creation");
    // },
  },
};
</script>
