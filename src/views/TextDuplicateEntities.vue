<template>
  <div>
    <b-button variant="info" @click="duplicateEntities">
      duplicate entities
    </b-button>
    <div>numbersEntities: {{ numbersEntities }}</div>
  </div>
</template>
<script>
import { mapState, mapGetters } from "vuex";
export default {
  name: "TextDuplicateEntities",
  data() {
    return {
      payload: {
        id: 139, //152, //139,
        content: {
          name: [
            {
              value: "Bienvenue chez test",
            },
          ],
          field_domain_access: [
            {
              target_id: "test328_wb_horizon_kksa",
            },
          ],
          field_domain_source: [
            {
              target_id: "test328_wb_horizon_kksa",
            },
          ],
          is_default_theme: [
            {
              value: false,
            },
          ],
        },
      },
    };
  },

  computed: {
    ...mapState(["entityDuplicate"]),
    ...mapGetters(["numbersEntities"]),
  },
  mounted() {
    //
  },
  methods: {
    duplicateEntities() {
      this.$store.dispatch("getMatriceEntities", this.payload).then(() => {
        this.prepareSaveEntities(this.$store.state);
      });
    },
    prepareSaveEntities(state) {
      /**
       * Permet de creer les sous contenus et return les target_ids.
       * @param {Array} items
       * @param {Integer} i
       * @param {Array} values
       */
      const loopItem = (items, i, values = []) => {
        return new Promise((resolv, reject) => {
          console.log("loopItem : ", items);
          if (items[i]) {
            const item = items[i];
            if (items[i].entities) {
              const keys = Object.keys(items[i].entities);
              loopFieldEntity(
                items[i].entities,
                keys[0],
                items[i].entity,
                keys,
                0
              ).then((entity) => {
                this.$store
                  .dispatch("saveEntity", {
                    entity_type_id: items[i].target_type,
                    value: entity,
                    index: i,
                  })
                  .then((resp) => {
                    //items[i].entity = resp.data.json;
                    values.push({ target_id: resp.data.id });
                    i = i + 1;
                    if (i < items.length) {
                      // loopEntityPromise(items, i).then((resp) => {
                      //   values.push({ target_id: resp.data.id });
                      // });
                      resolv(loopItem(items, i, values));
                    } else resolv(values);
                  })
                  .catch((er) => {
                    console.log(" catch : ", er);
                    reject(er);
                  });
              });
            } else {
              this.$store
                .dispatch("saveEntity", {
                  entity_type_id: item.target_type,
                  value: item.entity,
                  index: i,
                })
                .then((resp) => {
                  values.push({ target_id: resp.data.id });
                  i = i + 1;
                  if (items.length <= i) {
                    resolv(loopItem(items, i, values));
                  } else {
                    resolv(values);
                  }
                })
                .catch((er) => {
                  console.log("catch : ", er);
                  reject(er);
                });
            }
          } else resolv(values);
        });
      };
      //
      /**
       * loopFieldEntity parcourt les entites enfants d'une entité parente, et a chaque passage MAJ l'entité parent.
       *
       * @param {Array} datas // tableau des entites enfants.
       * @param {String} fieldname // fieldname
       * @param {String} entity // entité parente
       * @param {Array} keys // tableau des champs à parcourirt (permet de passer à l'etape suivante)
       * @param {Integer} i   // l'etape encours (permet de passer à l'etape suivante)
       * @return {Object} entity // l'entité parente MAJ.
       */
      const loopFieldEntity = (datas, fieldname, entity, keys, i) => {
        return new Promise((resolv) => {
          console.log("loopFieldEntity : ", datas);
          // Si le champs contient des données,
          // on parcourt chacune des entrées.
          if (datas[fieldname] && datas[fieldname].length > 0) {
            // Pour chaque champs, on cree les contenus et on recupere les ids.
            loopItem(datas[fieldname], 0).then((resp) => {
              console.log("loopFieldEntity result of loopItem : ", resp);
              entity[fieldname] = resp;
              // on passe au champs suivant.
              i = i + 1;
              if (keys.length > i) {
                resolv(loopFieldEntity(datas, keys[i], entity, keys, i));
              } else {
                resolv(entity);
              }
            });
          } else resolv(entity);
        });
      };
      /**
       * Permet de cree l'entité parent, apres que tous les entitées enfants soient ok.
       * il est appelle par tous les enfants possedant des enfants.
       * loopEntityPromise recois un tableau contenant les entites qui doivent etre cree.
       * il retourne un tableau de target_ids => [{target_id:...},{target_id:...}, ... ].
       *
       * @param {*} datas
       * @param {*} i
       * @return resp [{id:..., json:...}] // return un json avec une proprieté json et une autre id.
       */
      const loopEntityPromise = (datas, i = null, values = []) => {
        return new Promise((resolv, reject) => {
          console.log("loopEntityPromise : ", datas);
          if (datas[i]) {
            // S'il contient des sous entités.
            if (datas[i].entities && typeof datas[i].entities === "object") {
              const keys = Object.keys(datas[i].entities);
              loopFieldEntity(
                datas[i].entities,
                keys[0],
                datas[i].entity,
                keys,
                0
              ).then((entity) => {
                console.log(
                  " loopEntityPromise SEND with override entity : ",
                  entity
                );
                this.$store
                  .dispatch("saveEntity", {
                    entity_type_id: datas[i].target_type,
                    value: entity,
                    index: i,
                  })
                  .then((resp) => {
                    values.push({ target_id: resp.data.id });
                    // datas[i].entity = resp.data.json;
                    i = i + 1;
                    if (i < datas.length) {
                      resolv(loopEntityPromise(datas, i));
                    } else resolv(values);
                  })
                  .catch((er) => {
                    console.log("catch : ", er);
                    reject(er);
                  });
              });
            }
            // S'il ne contient pas de sous entité.
            else {
              this.$store
                .dispatch("saveEntity", {
                  entity_type_id: datas[i].target_type,
                  value: datas[i].entity,
                  index: i,
                })
                .then((resp) => {
                  values.push({ target_id: resp.data.id });
                  // datas[i].entity = resp.data.json;
                  i = i + 1;
                  if (i < datas.length) {
                    resolv(loopEntityPromise(datas, i));
                  } else resolv(values);
                })
                .catch((er) => {
                  console.log("catch : ", er);
                  reject(er);
                });
            }
          } else {
            console.log(" loopEntityPromise END ");
            resolv([]);
          }
        });
      };
      loopEntityPromise(state.entityDuplicate, 0);
    },
  },
};
</script>
