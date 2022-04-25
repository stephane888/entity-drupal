<template>
  <div
    class="d-flex justify-content-around align-items-center step-donneesite--submit"
  >
    <b-button variant="secondary" v-if="current_step" @click="previewStep">
      <b-icon icon="arrow-left"></b-icon> Precedent
    </b-button>
    <b-button
      variant="primary"
      @click="nextStep"
      v-if="count_step < steppers.length"
    >
      Suivant <b-icon icon="arrow-right"></b-icon>
    </b-button>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "next-preview",
  computed: {
    ...mapState("renderByStep", {
      current_step: (state) => state.current_step,
      steppers: (state) => state.steppers,
      count_step() {
        return this.current_step + 1;
      },
    }),
  },
  methods: {
    nextStep() {
      this.$store.commit("renderByStep/nextStep");
    },
    previewStep() {
      this.$store.commit("renderByStep/previewStep");
    },
  },
};
</script>
