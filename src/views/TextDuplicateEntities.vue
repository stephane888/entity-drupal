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
        id: 139,
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
      this.$store.dispatch("duplicateEntities", this.payload).then(() => {
        this.prepareSaveEntities(this.$store.state);
      });
    },
    prepareSaveEntities(state) {
      const loopItem = (items, i, values = []) => {
        return new Promise((resolv, reject) => {
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
                    items[i].entity = resp.data.json;
                    i = i + 1;
                    if (i < items.length) {
                      resolv(loopEntityPromise(items, i));
                    } else resolv(items);
                  })
                  .catch((er) => {
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
                  values.push({ target_id: resp.data.id, index: i });
                  i = i + 1;
                  if (items.length <= i) {
                    resolv(loopItem(items, i, values));
                  } else {
                    resolv(values);
                  }
                })
                .catch((er) => {
                  reject(er);
                });
            }
          } else resolv(values);
        });
      };
      //
      /**
       * On parcourt les champs.
       * @param {Array} datas
       * @param {String} fieldname // fieldname
       * @return ids // les ids des entites pour le champs.
       */
      const loopFieldEntity = (datas, fieldname, entity, keys, i) => {
        return new Promise((resolv) => {
          // Si le champs contient des données,
          // on parcourt chaqu'une des entrées.
          if (datas[fieldname] && datas[fieldname].length > 0) {
            // Pour chaque champs, on cree les contenus et on recupere les ids.
            loopItem(datas[fieldname], 0).then((resp) => {
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
      //
      const loopEntityPromise = (datas, i = null) => {
        return new Promise((resolv, reject) => {
          if (datas[i]) {
            // S'il contient des sous entités.
            if (datas[i].entities) {
              const keys = Object.keys(datas[i].entities);
              loopFieldEntity(
                datas[i].entities,
                keys[0],
                datas[i].entity,
                keys,
                0
              ).then((entity) => {
                this.$store
                  .dispatch("saveEntity", {
                    entity_type_id: datas[i].target_type,
                    value: entity,
                    index: i,
                  })
                  .then((resp) => {
                    datas[i].entity = resp.data.json;
                    i = i + 1;
                    if (i < datas.length) {
                      resolv(loopEntityPromise(datas, i));
                    } else resolv(datas);
                  })
                  .catch((er) => {
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
                  datas[i].entity = resp.data.json;
                  i = i + 1;
                  if (i < datas.length) {
                    resolv(loopEntityPromise(datas, i));
                  } else resolv(datas);
                })
                .catch((er) => {
                  reject(er);
                });
            }
          } else {
            resolv([]);
          }
        });
      };
      loopEntityPromise(state.entityDuplicate, 0);
    },
  },
};
</script>
