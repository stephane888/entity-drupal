<template>
  <div class="vuejs-uploader">
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

    <b-form-group label="Ajouter un fichier" description="description et autre">
      <b-form-file
        v-model="files"
        :state="Boolean(files)"
        placeholder="Ajouter un fichier ..."
        drop-placeholder="Drop file here..."
        multiple
        accept=".jpg, .png, .gif, webp"
        size="sm"
        @input="previewImage"
      ></b-form-file>
    </b-form-group>
  </div>
</template>

<script>
import "./scss/upload.scss";
export default {
  name: "UploaderFile",
  props: {},
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
    //
  },
  methods: {
    previewImage(files) {
      var reader = new FileReader();
      for (const i in files) {
        const file = files[i];
        reader.onload = (read) => {
          this.toUplode.push({
            file: file,
            status: 0,
            error: 0,
            url: read.target.result,
          });
        };
        reader.readAsDataURL(file);
      }
    },
    onSubmit() {
      //
    },
    onReset() {
      //
    },
  },
};
</script>
