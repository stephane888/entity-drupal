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
      <b-icon icon="arrow-left"></b-icon> {{ strings.previous }}
    </b-button>
    <b-button
      variant="primary"
      @click="nextStep"
      v-if="count_step < steppers.length"
      :disabled="disabled || disable_submit"
    >
      {{ strings.next }} <b-icon icon="arrow-right"></b-icon>
    </b-button>

    <b-button
      variant="primary"
      v-if="count_step >= steppers.length && !finish_status"
      @click="create_site"
      :disabled="creation_running"
    >
      {{ strings.create_web_site }}
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
      valid_steppers: (state) => state.renderByStep.valid_steppers,
      strings: (state) => state.strings,
      running: (state) => state.renderByStep.running,
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
        if (
          (step.templates && step.templates.includes("page_register")) ||
          this.running
        )
          return true;
      }
      return false;
    },
  },

  methods: {
    nextStep() {
      if (this.validationStep()) {
        this.scrollUp();
        this.$store.commit("renderByStep/nextStep");
        this.$router.push({ path: `/form-render/${this.current_step}` });
      }
    },
    previewStep() {
      var idstep = parseInt(this.$route.params.idstep);
      const length = this.valid_steppers.length;
      if (this.valid_steppers.length > 1) {
        const id = this.valid_steppers[length - 2];
        if (idstep == id) {
          this.$store.dispatch("renderByStep/removeLastValidStep").then(() => {
            this.previewStep();
            // console.log("this.valid_steppers : ", this.valid_steppers);
            // // eslint-disable-next-line
            // debugger;
            // const id2 = this.valid_steppers.splice(-1, 3);
            // console.log(" beofre second back : ", id2);
            // if (id2 && id2[0]) {
            //   console.log(" second back : ", id2);
            //   this.$router.push({ path: `/form-render/${id2}` });
            // }
          });
        } else {
          this.$store.dispatch("renderByStep/removeLastValidStep").then(() => {
            this.$router.push({ path: `/form-render/${id}` });
          });
        }
        this.scrollUp();
      }
    },
    scrollUp() {
      window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
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
    /**
     * S'execute uniquement lorsqu'on actualise la page et lorqu'on change de route.
     */
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
