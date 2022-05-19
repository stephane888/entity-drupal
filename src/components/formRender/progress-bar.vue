<template>
  <div class="container-progress position-relative p-4">
    <ul class="progressive-bar d-flex">
      <li
        v-for="(step, k) in steppers"
        :key="k"
        :class="current_step >= k ? 'active' : 'none'"
      ></li>
    </ul>
  </div>
</template>
<script>
import { mapState } from "vuex";
export default {
  name: "progress-bar",
  computed: {
    ...mapState("renderByStep", {
      current_step: (state) => state.current_step,
      steppers: (state) => state.steppers,
    }),
  },
};
</script>
<style lang="scss">
.progressive-bar {
  padding: 0;
  margin: 0;
  top: 0;
  left: 50%;
  list-style: none;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
  position: absolute;
  transform: translateX(-50%);
  width: 600px;
  > li {
    width: auto;
    background-color: #ccc;
    height: 5px;
    min-width: 15px;
    margin-right: 5px;
    flex-basis: 100%;
  }
}
</style>
