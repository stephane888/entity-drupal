<template>
  <div class="vuejs-uploader" :class="class_css">
    <ValidationProvider :name="field.name" :rules="getRules()" v-slot="v">
      <b-form-group :label="field.label" :description="field.description">
        <b-form-file
          v-model="files"
          placeholder="Ajouter un fichier ..."
          drop-placeholder="Drop file here..."
          :multiple="cardinality"
          accept=".jpg, .png, .gif, webp"
          size="sm"
          @input="previewImage"
          :state="getValidationState(v)"
        ></b-form-file>
      </b-form-group>
    </ValidationProvider>

    <div class="previews">
      <div v-for="(fil, i) in toUplode" :key="i">
        <b-img
          :src="fil.url"
          fluid
          alt="Fluid image"
          thumbnail
          class="img-preview"
        ></b-img>
      </div>
    </div>
  </div>
</template>

<script>
import "../scss/upload.scss";
import config from "./loadField";
import { ValidationProvider } from "vee-validate";
import "./vee-validation-rules";
export default {
  name: "UploaderFile",
  props: {
    class_css: { type: [Array] },
    field: { type: Object, required: true },
    model: { type: [Object, Array], required: true },
    namespace_store: { type: String, required: true },
  },
  components: {
    ValidationProvider,
  },
  data() {
    return {
      // Fichiers provenant de l'action utilisateur.
      files: [],
      // Fichiers pour la preview.
      urls: [],
      // Fichiers qui doivent etre uploader
      toUplode: [],
    };
  },
  computed: {
    cardinality() {
      if (this.field.cardinality === -1) {
        return true;
      } else {
        return false;
      }
    },
  },
  mounted() {
    this.getValue();
  },
  methods: {
    /**
     *
     * @param {*} param0
     */
    getValidationState({ dirty, validated, valid = null }) {
      return (dirty || validated) && !valid ? valid : null;
    },
    /**
     *
     */
    getRules() {
      return config.getRules(this.field);
    },
    /**
     *
     * @param {*} files
     */
    previewImage(files) {
      // preview
      var reader = new FileReader();
      if (this.cardinality) {
        for (const i in files) {
          const file = files[i];
          // Send images.
          config.postFile("/filesmanager/post", file).then((resp) => {
            reader.onload = (read) => {
              this.toUplode.push({
                file: file,
                status: resp,
                error: 0,
                url: read.target.result,
              });
            };
            reader.readAsDataURL(file);
          });
        }
      } else {
        const vals = [];
        this.toUplode = [];
        config.postFile("/filesmanager/post", files).then((resp) => {
          reader.onload = (read) => {
            this.toUplode.push({
              file: files,
              status: resp,
              error: 0,
              url: read.target.result,
            });
          };
          reader.readAsDataURL(files);
          vals.push({ target_id: resp.id });
          this.setValue(vals);
        });
      }
    },
    setValue(vals) {
      if (this.namespace_store) {
        this.$store.dispatch(this.namespace_store, {
          value: vals,
          fieldName: this.field.name,
        });
      } else
        this.$store.dispatch({
          value: vals,
          fieldName: this.field.name,
        });
    },
    getValue() {
      if (this.model[this.field.name] && this.model[this.field.name].length) {
        this.toUplode = [];
        this.model[this.field.name].forEach((item) => {
          config.getImageUrl(item.target_id).then((resp) => {
            this.toUplode.push({ url: resp.data });
          });
        });
      }
    },
  },
};
</script>
