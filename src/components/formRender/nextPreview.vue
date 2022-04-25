<template>
  <div
    class="d-flex justify-content-around align-items-center step-donneesite--submit"
    :check_validation="check_validation"
  >
    <b-button variant="secondary" v-if="current_step" @click="previewStep">
      <b-icon icon="arrow-left"></b-icon> Precedent
    </b-button>
    <b-button
      variant="primary"
      @click="nextStep"
      v-if="count_step < steppers.length"
      :disabled="disabled"
    >
      Suivant <b-icon icon="arrow-right"></b-icon>
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
  computed: {
    ...mapState("renderByStep", {
      current_step: (state) => state.current_step,
      steppers: (state) => state.steppers,
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
  },
  methods: {
    nextStep() {
      if (this.validationStep()) this.$store.commit("renderByStep/nextStep");
    },
    previewStep() {
      this.$store.commit("renderByStep/previewStep");
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
  },
};
</script>
