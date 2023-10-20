import rootConfig from "../rootConfig";
import store from "./index";
import { limit } from "stringz";
import FormUttilities from "components_h_vuejs/src/js/FormUttilities";
// ?XDEBUG_TRIGGER=run
//
export default {
  ...rootConfig,
  currentBuildStep: 0,
  donneeInternetEntity: {},
  homePageContent: {},
  /**
   * entité domain
   */
  domainRegister: {},
  /**
   * Entité domain_ovh_entity sur drupal
   */
  domainOvhEntity: {},
  OrtherPages: [],
  /**
   * time to wait before retry.
   */
  timeWaitBeforeRetry: 25000,
  /**
   * nombre d'essaie.
   */
  numberRetry: 5,
  messages: { errors: [], warnings: [] },
  runStep(steps, state) {
    // On recupere
    var getDataStep = () => {
      if (steps[this.currentBuildStep]) {
        return steps[this.currentBuildStep];
      }
      return null;
    };
    var step = getDataStep();
    if (step)
      switch (step.step) {
        case "create_domaine":
          step.status = "run";
          this.CreateDomaine(state.renderByStep.model)
            .then((resp) => {
              this.donneeInternetEntity = resp.data;
              setTimeout(() => {
                step.status = "ok";
                this.currentBuildStep++;
                this.runStep(steps, state);
              }, 500);
            })
            .catch((resp) => {
              step.status = "error";
              this.runErrorsMessages(resp);
            });
          break;
        case "register_domaine":
          step.status = "run";
          this.RegisterDomaine()
            .then((resp) => {
              // On lance la creation sur OVH, apres cette etape.(car les deux etapes modifie la meme entité)
              this.bPost("/ovh-api-rest/create-domaine/" + this.donneeInternetEntity.domain_ovh_entity[0].target_id).catch(() => {
                this.messages.warnings.push(" Votre domaine n'a pas pu etre generer ");
              });
              setTimeout(() => {
                step.status = "ok";
                this.currentBuildStep++;
                if (resp.data && resp.data.domain) this.domainRegister = resp.data.domain;
                if (resp.data && resp.data.domain_ovh_entity) this.domainOvhEntity = resp.data.domain_ovh_entity;
                if (this.domainRegister.hostname) {
                  var languageId = "/";
                  languageId += rootConfig.languageId && rootConfig.languageId != null ? rootConfig.languageId : "";
                  store.commit("SET_HOSTNAME", {
                    domain: this.domainRegister.hostname + languageId,
                    scheme: this.domainRegister.scheme,
                  });
                }
                this.runStep(steps, state);
              }, 500);
            })
            .catch((resp) => {
              step.status = "error";
              this.runErrorsMessages(resp);
            });
          break;
        case "create_content":
          step.status = "run";
          this.CreateHomeContent(step)
            .then((resp) => {
              this.homePageContent = resp;
              var passNext = () => {
                setTimeout(() => {
                  step.status = "ok";
                  this.currentBuildStep++;
                  this.runStep(steps, state);
                }, 500);
              };
              // On patiente que les autres pages soit ok.
              this.CreateOrtherPages(step)
                .then(() => {
                  passNext();
                })
                .catch(() => {
                  // la creation des pages n'est pas un processus blocant, donc on continue meme en cas d'echac.
                  passNext();
                });
            })
            .catch((resp) => {
              step.status = "error";
              this.runErrorsMessages(resp);
            });

          break;
        case "create_theme":
          step.status = "run";
          this.CreateTheme()
            .then(() => {
              setTimeout(() => {
                step.status = "ok";
                this.currentBuildStep++;
                this.runStep(steps, state);
              }, 500);
            })
            .catch((resp) => {
              step.status = "error";
              this.runErrorsMessages(resp);
            });
          break;
        case "layout_header":
          step.status = "run";
          if (this.domainRegister.id) {
            this.CreateMenus(state)
              .then(() => {
                this.createParagraphHeader(state)
                  .then((resp) => {
                    var passNext = () => {
                      setTimeout(() => {
                        step.status = "ok";
                        this.currentBuildStep++;
                        this.runStep(steps, state);
                      }, 500);
                    };
                    this.addEntityToBlock(resp, "paragraph", "top_header", "entete")
                      .then(() => {
                        passNext();
                      })
                      .catch((er) => {
                        this.runErrorsMessages(er);
                        //passNext();
                      });
                  })
                  .catch(() => {
                    step.status = "error";
                  });
              })
              .catch(() => {
                step.status = "error";
              });
          } else {
            step.status = "error";
            this.currentBuildStep++;
            this.runStep(steps, state);
          }
          break;
        case "layout_footer":
          step.status = "run";
          if (this.domainRegister.id) {
            this.addDefaultBlockInRegion();
            this.createParagraphFooter(state)
              .then((resp) => {
                var passNext = () => {
                  setTimeout(() => {
                    step.status = "ok";
                    this.currentBuildStep++;
                    this.runStep(steps, state);
                  }, 500);
                };
                this.addEntityToBlock(resp, "paragraph", "footer", "footer")
                  .then(() => {
                    passNext();
                  })
                  .catch((er) => {
                    this.runErrorsMessages(er);
                    // passNext();
                  });
              })
              .catch((resp) => {
                step.status = "error";
                this.runErrorsMessages(resp);
              });
          } else {
            step.status = "error";
            this.currentBuildStep++;
            this.runStep(steps, state);
          }
          break;
        case "generate_style":
          step.status = "run";
          if (this.domainRegister.id) {
            var passNext = () => {
              setTimeout(() => {
                step.status = "ok";
                this.currentBuildStep++;
                this.runStep(steps, state);
              }, 500);
            };
            this.generateStyleTheme()
              .then(() => {
                passNext();
              })
              .catch(() => {
                passNext();
              });
          } else {
            step.status = "error";
            this.currentBuildStep++;
            this.runStep(steps, state);
          }
          break;
        case "check_apply_actions":
          step.status = "run";
          this.CheckApplyActions()
            .then(() => {
              step.status = "ok";
              this.currentBuildStep++;
              this.runStep(steps, state);
            })
            .catch(() => {
              step.status = "error";
              this.currentBuildStep++;
              this.runStep(steps, state);
            });
          break;
        default:
          // on ne devrait pas arrivé ici.
          this.messages.warnings.push(" Cette etape n'est pas definit : " + step.step);
          step.status = "ok";
          this.currentBuildStep++;
          this.runStep(steps, state);
          break;
      }
    // Execution terminée.
    else {
      store.commit("ACTIVE_FINISH");
      store.commit("CLEAN_LOCALSTORAGE");
      this.runWarningsMessages();
    }
  },
  /**
   * Cette etape permet d'appliquer les configurations importante
   */
  CheckApplyActions() {
    const idHome = window.location.pathname.split("/").pop();
    // this.bPost("/admin/config/manage-add-plugins/" + this.domainRegister.id + "/" + idHome);
    this.LoopGetRequest("/admin/config/manage-add-plugins/" + this.domainRegister.id + "/" + idHome);
    return this.LoopPostRequest("/vuejs-entity/check-apply-actions", {
      domain: this.domainRegister,
    });
    // return this.bPost("/vuejs-entity/check-apply-actions", {
    //   domain: this.domainRegister,
    // });
  },
  // Dans cette etape, on cree les entités "donnee_internet_entity" et "domain_ovh_entity".
  CreateDomaine(entity) {
    return new Promise((resolv, reject) => {
      this.LoopGetRequest("/admin/lesroidelareno/add-roles")
        .then(() => {
          this.LoopPostRequest("/vuejs-entity/entity/save/donnee_internet_entity", entity)
            .then((resp) => {
              resolv(resp);
            })
            .catch((er) => {
              reject(er);
            });
        })
        .catch((er) => {
          reject(er);
        });
    });
  },
  // On enregistre le domaine sur OVH et on l'enregistre egalement comme multidomaine sur drupal.
  RegisterDomaine() {
    return new Promise((resolv, reject) => {
      if (this.donneeInternetEntity.domain_ovh_entity && this.donneeInternetEntity.domain_ovh_entity[0] && this.donneeInternetEntity.domain_ovh_entity[0].target_id) {
        // Cree l'entité domain s'il n'existe pas et recupere les entites domain et domain_ovh_entity.
        this.LoopGetRequest("/vuejs-entity/domaine/add/" + this.donneeInternetEntity.domain_ovh_entity[0].target_id)
          .then((resp) => {
            resolv(resp);
          })
          .catch((er) => {
            reject(er);
          });
      } else {
        reject(" Le nom de domaine n'a pas pu etre creer ");
      }
    });
  },
  /**
   * On cree la page d'accueil.
   * Cela se fait en deux etapes : on recupere la matrice et on cree chaque entité.
   */
  CreateHomeContent(step) {
    return new Promise((resolv, reject) => {
      const idHome = window.location.pathname.split("/").pop();
      const title = this.donneeInternetEntity.name[0] && this.donneeInternetEntity.name[0].value ? "Bienvenue chez " + this.donneeInternetEntity.name[0].value : "Theme generé";
      const payload = {
        id: idHome,
        content: {
          name: [{ value: title }], // Ce titre va etre surcharger par celui de la version model. Ensuite on devrait le supprimer.(meme pour auther page)
          field_domain_access: [{ target_id: this.domainRegister.id }],
          field_domain_source: [{ target_id: this.domainRegister.id }],
          is_default_theme: [{ value: false }],
        },
      };
      store
        .dispatch("getMatriceEntities", payload)
        .then((resp) => {
          this.getNumberEntities(resp.data).then((numbers) => {
            var vals = {
              numbers: numbers,
              creates: 0,
              page: "",
            };
            if (resp.data[0].entity && resp.data[0].entity.name[0]) {
              vals.page = resp.data[0].entity.name[0].value;
            }
            this.prepareSaveEntities(resp.data, vals)
              .then((entities) => {
                // Dans ce cas principalment, on doit retourner uniquement le contenu de la homepage.
                if (entities[0] && entities[0].id) {
                  resolv(entities[0]);
                } else {
                  reject(" Une erreur s'est produite pendant la construction de la page ");
                }
              })
              .catch((er) => {
                this.runErrorsMessages(er);
                reject(" Une erreur s'est produite pendant la construction de la page ... ");
              });
            step.entities.push(vals);
          });
        })
        .catch((er) => {
          reject(er);
        });
    });
  },

  // On cree les autres pages :
  CreateOrtherPages(step) {
    return new Promise((resolv2, reject) => {
      if (this.donneeInternetEntity.pages && this.donneeInternetEntity.pages.length) {
        const options = this.getLabelPages();
        /**
         * Cree une page et son contenu à chaque execution
         * @param {*} i
         * @param {*} essaie
         * @returns
         */
        const loop = (i = 0, essaie = 1) => {
          return new Promise((resolv) => {
            const id = this.donneeInternetEntity.pages[i] ? this.donneeInternetEntity.pages[i].value : null;
            const title = options[id] ? options[id] : "page generate";
            const values = {
              field_domain_access: [{ target_id: this.domainRegister.id }],
              field_domain_source: [{ target_id: this.domainRegister.id }],
              is_default_theme: [{ value: false }],
              is_home_page: [{ value: false }],
              name: [{ value: title }],
            };
            if (id !== null) {
              // on recupere la matrice.
              const payload = {
                id: id,
                content: values,
              };
              store.dispatch("getMatriceEntities", payload).then((resp) => {
                this.getNumberEntities(resp.data).then((numbers) => {
                  var vals = {
                    numbers: numbers,
                    creates: 0,
                    page: "",
                  };
                  if (resp.data[0].entity && resp.data[0].entity.name[0]) {
                    vals.page = resp.data[0].entity.name[0].value;
                  }
                  this.prepareSaveEntities(resp.data, vals)
                    .then((entities) => {
                      entities.forEach((entity) => {
                        this.OrtherPages.push(entity);
                      });
                      var id = i + 1;
                      resolv(loop(id));
                    })
                    /**
                     * En cas d'erreur.
                     * On fait 2 tentatives, si elle n'aboutie pas on passe à la suite.
                     */
                    .catch(() => {
                      this.messages.warnings.push(" Erreur rencontrée lors de la creation de cette page : <b>" + title + "</b> vous pourriez la re-creer plus tard. ");
                      setTimeout(() => {
                        if (essaie <= 2) {
                          essaie++;
                          resolv(loop(i, essaie));
                        } else {
                          var id2 = i + 1;
                          resolv(loop(id2));
                        }
                      }, 15000);
                    });
                  step.entities.push(vals);
                });
              });
              //   .then((resp) => {
              //     this.OrtherPages.push(resp.data);
              //     var id = i + 1;
              //     resolv(loop(id));
              //   })
              //   .catch(() => {
              //     this.messages.warnings.push(
              //       " Erreur rencontrée lors de la creation de cette page : <b>" +
              //         title +
              //         "</b> vous pourriez la re-creer plus tard. "
              //     );
              //     setTimeout(() => {
              //       if (essaie == 1) loop(i, 2);
              //       else {
              //         var id2 = i + 1;
              //         loop(id2);
              //       }
              //     }, 1000);
              //   });
            } else {
              resolv();
            }
          });
        };
        // On lance la page 0.
        resolv2(loop());
      } else {
        reject();
      }
    });
  },
  /**
   * La creation de menu se fait apres la creation des pages.
   * Car les liens de pages ainsi generer devront etre utiliser comme lien.
   * @returns
   */
  CreateMenus(state) {
    return new Promise((resolv, reject) => {
      // Build menu :
      const menu = {
        //this.domainOvhEntity.sub_domain[0].value contient a-z0-9,
        id: this.domainOvhEntity.sub_domain[0].value + "-main", //on a remplacé "_" par "-", il faudra resterter l'export/import.
        label: this.domainRegister.id + ": menu principal",
        description: "Menu generé automatiquement",
        third_party_settings: {
          lesroidelareno: { domain_id: this.domainRegister.id },
        },
      };
      // build items
      const items = [];
      this.OrtherPages.forEach((page) => {
        if (page.id[0] && page.id[0].value)
          items.push({
            title: [
              {
                value: page.name[0] ? page.name[0].value : "lien genere :" + page.id[0].value,
              },
            ],
            enabled: [{ value: true }],
            link: [{ uri: "internal:/site-internet-entity/" + page.id[0].value }],
          });
      });
      // Contruit le menus et les items.
      const menuParam = {
        menu: menu,
        items: items,
        domain: {
          field_domain_access: this.domainRegister.id,
          field_domain_source: this.domainRegister.id,
        },
      };
      // this.bPost("/vuejs-entity/entity/add-menu-items", {
      //   menu: menu,
      //   items: items,
      //   domain: {
      //     field_domain_access: this.domainRegister.id,
      //     field_domain_source: this.domainRegister.id,
      //   },
      // });
      this.LoopPostRequest("/vuejs-entity/entity/add-menu-items", menuParam)
        .then((resp) => {
          if (resp.data.menu && resp.data.menu.id) {
            // On met à jour le champs "field_reference_menu" au niveau de l'object du header
            state.storeFormRenderHeader.entities[0].entity.field_reference_menu = [{ target_id: resp.data.menu.id }];
            resolv();
          } else {
            this.messages.warnings.push(" Une erreur est survenu lors de la disposition des menus, vous pourriez le faire plus tard. ");
            reject();
          }
        })
        .catch(() => {
          this.messages.warnings.push(" Une erreur est survenu lors de la creation des menus, vous pourriez le faire plus tard. ");
          reject();
        });
    });
  },
  /**
   * -
   */
  addDefaultBlockInRegion() {
    // Add default content region
    const id_system = limit("mainpagecontent" + this.domainRegister.id, 30, "");
    const system_main_block = {
      id: id_system,
      theme: this.domainRegister.id,
      region: "content",
      plugin: "system_main_block",
      status: true,
      visibility: {
        domain: {
          id: "domain",
          negate: false,
          context_mapping: {
            domain: "@domain.current_domain_context:domain",
          },
          domains: {
            [this.domainRegister.id]: this.domainRegister.id,
          },
        },
      },
      settings: {
        id: id_system,
        label: this.domainRegister.id + " : contenu principal",
        label_display: false,
        provider: "system",
      },
      weight: 0,
    };
    return this.LoopPostRequest("/vuejs-entity/entity/add-block-in-region", system_main_block);
    // return this.bPost("/vuejs-entity/entity/add-block-in-region", system_main_block);
  },
  //
  CreateTheme() {
    return new Promise((resolv, reject) => {
      var values = {
        site_config: [
          {
            value: JSON.stringify({
              "edit-config": "domain.config." + this.domainRegister.id + ".system.site",
              "page.front": this.homePageContent.id && this.homePageContent.id[0] ? "/site-internet-entity/" + this.homePageContent.id[0].value : "",
              name: this.donneeInternetEntity.name[0] && this.donneeInternetEntity.name[0].value ? this.donneeInternetEntity.name[0].value : "",
              mail: this.domainOvhEntity.sub_domain[0] && this.domainOvhEntity.sub_domain[0].value ? this.domainOvhEntity.sub_domain[0].value + "@wb-horizon.com" : "",
              "page.404": "",
              "page.403": "",
            }),
          },
        ],
        logo: this.donneeInternetEntity.image_logo && this.donneeInternetEntity.image_logo.length ? this.donneeInternetEntity.image_logo : [],
        run_npm: [{ value: false }],
      };
      //
      if (this.domainRegister.id) {
        values["hostname"] = [{ value: this.domainRegister.id }];
      }
      // Applis colors
      this.ApplieColor(values)
        .then((resp) => {
          // Permet de relancer en cas d'erreur du serveur.
          /**
           * Pour le theme, il faut essayer de comprendre ce qui se passe en cas d'echec. il ya plusieurs cas de figure possible.
           */
          this.LoopPostRequest("/vuejs-entity/entity/save/config_theme_entity", resp)
            .then((resp) => {
              resolv(resp);
            })
            .catch((er) => {
              reject(er);
            });
        })
        .catch((er) => {
          reject(er);
        });
    });
  },
  /**
   * Creation du paragraph d'entete.
   * Les paraphages doivent suivrent le meme logique de creation de contenu que le systeme matrice,
   * car cela permet de modifier les données et les sous données.
   *
   * @param {*} state
   * @returns
   */
  createParagraphHeader(state) {
    return new Promise((resolv, reject) => {
      const headers = state.storeFormRenderHeader.entities;
      this.getNumberEntities(headers)
        .then((numbers) => {
          // On met à jour le domaineId;
          var vals = {
            numbers: numbers,
            creates: 0,
            page: "",
          };

          this.prepareSaveEntities(headers, vals, true)
            .then((entities) => {
              // car on doit avoir un seul niveau de données.
              if (entities[0] && entities[0].id) {
                resolv(entities[0]);
              } else reject(" Une erreur s'est produite pendant la construction de l'entete ");
            })
            .catch((er) => {
              this.runErrorsMessages(er);
              reject(" Une erreur s'est produite pendant la construction de l'entete ... ");
            });
        })
        .catch((er) => {
          this.runErrorsMessages(er);
          reject(" Impossible de determiner les sous entites de l'entete ... ");
        });
    });
  },
  createParagraphFooter(state) {
    return new Promise((resolv, reject) => {
      const footers = state.storeFormRenderFooter.entities;
      this.getNumberEntities(footers)
        .then((numbers) => {
          // On met à jour le domaineId;
          var vals = {
            numbers: numbers,
            creates: 0,
            page: "",
          };
          this.prepareSaveEntities(footers, vals, true)
            .then((entities) => {
              // car on doit avoir un seul niveau de données.
              if (entities[0] && entities[0].id) {
                resolv(entities[0]);
              } else reject(" Une erreur s'est produite pendant la construction de l'entete ");
            })
            .catch((er) => {
              this.runErrorsMessages(er);
              reject(" Une erreur s'est produite pendant la construction de l'entete ... ");
            });
        })
        .catch((er) => {
          this.runErrorsMessages(er);
          reject(" Impossible de determiner les sous entites de l'entete ... ");
        });
    });
  },

  /**
   *
   * @param {*} entity
   * @param {*} entity_type_id
   * @param {*} region
   * @param {*} info
   * @returns
   */
  addEntityToBlock(entity, entity_type_id, region, info = "") {
    return new Promise((resolv, reject) => {
      if (entity.id && entity.id[0].value) {
        const type = entity["type"][0]["target_id"];
        const label = info + " : " + this.domainRegister.id;
        const id_domaine = limit(this.domainRegister.id, 20, "");
        const id_system = limit(id_domaine + type, 30, "");
        const id = entity.id[0].value;
        const values = {
          id: id_system,
          theme: this.domainRegister.id,
          region: region,
          plugin: "entity_block:" + entity_type_id,
          provider: "entity_block",
          status: true,
          visibility: {
            domain: {
              id: "domain",
              negate: false,
              context_mapping: {
                domain: "@domain.current_domain_context:domain",
              },
              domains: {
                [this.domainRegister.id]: this.domainRegister.id,
              },
            },
          },
          settings: {
            id: id_system,
            label: label,
            label_display: false,
            provider: "entity_block",
            entity: id,
            view_mode: "default",
          },
        };
        // Permet de relancer en cas d'erreur du serveur.
        // const loop = () => {
        //   return new Promise((resolvChild, rejectChild) => {
        //     this.bPost("/vuejs-entity/entity/add-block-in-region", values)
        //       .then((resp) => {
        //         resolvChild(resp);
        //       })
        //       .catch((err) => {
        //         if (essaie <= this.numberRetry) {
        //           essaie++;
        //           setTimeout(() => {
        //             resolvChild(loop());
        //           }, this.timeWaitBeforeRetry);
        //         } else rejectChild(err);
        //       });
        //   });
        // };
        this.LoopPostRequest("/vuejs-entity/entity/add-block-in-region", values)
          .then((resp) => {
            resolv(resp);
          })
          .catch((er) => {
            reject(er);
          });
      } else reject(" ID du paragraph non definit ");
    });
  },

  //
  generateStyleTheme() {
    return new Promise((resolv, reject) => {
      const idHome = window.location.pathname.split("/").pop();
      // il ya une nouvelle fonction de filtre d'entite et qui est tres stricte.
      // du coup pour pouvoir generer les styles, on doit le faire absolument via le domaine.
      // this.bGet("/layoutgenentitystyles/manuel/api-generate/" + this.domainRegister.id);
      const url = window.location.protocol + "//" + this.domainRegister.hostname;
      this.LoopGetRequest(url + "/lesroidelareno-generate_style_theme/set_default_style/" + idHome + "/" + this.domainRegister.id)
        .then(() => {
          this.LoopGetRequest(url + "/layoutgenentitystyles/manuel/api-generate/" + this.domainRegister.id)
            .then(() => {
              this.LoopGetRequest(url + "/generate-style-theme/update-style-theme/" + this.domainRegister.id)
                .then(() => {
                  resolv();
                })
                .catch(() => {
                  reject();
                });
            })
            .catch(() => {
              reject();
            });
        })
        .catch((e) => {
          reject(e);
        });

      //
      // this.bGet(url + "/lesroidelareno-generate_style_theme/set_default_style/" + idHome + "/" + this.domainRegister.id)
      //   .then(() => {
      //     this.bGet(url + "/layoutgenentitystyles/manuel/api-generate/" + this.domainRegister.id)
      //       .then(() => {
      //         resolv(this.bGet(url + "/generate-style-theme/update-style-theme/" + this.domainRegister.id));
      //       })
      //       .catch(() => {
      //         reject();
      //       });
      //   })
      //   .catch((e) => {
      //     reject(e);
      //   });
    });
  },

  //
  ApplieColor(values) {
    return new Promise((resolv) => {
      var newValue = {};
      const type = this.donneeInternetEntity.type_color_theme.length ? this.donneeInternetEntity.type_color_theme[0].value : "0";
      // l'utilisateur a choisie les couleurs.
      if (type == "0") {
        newValue = {
          ...values,
          wbubackground: this.donneeInternetEntity.background && this.donneeInternetEntity.background.length ? this.donneeInternetEntity.background : [],
          color_link_hover: this.donneeInternetEntity.color_linkhover && this.donneeInternetEntity.color_linkhover.length ? this.donneeInternetEntity.color_linkhover : [],
          color_primary: this.donneeInternetEntity.color_primary && this.donneeInternetEntity.color_primary.length ? this.donneeInternetEntity.color_primary : [],
          color_secondaire: this.donneeInternetEntity.color_secondary && this.donneeInternetEntity.color_secondary.length ? this.donneeInternetEntity.color_secondary : [],
        };
      } else {
        newValue = {
          ...values,
          ...this.themeColors(),
        };
      }
      resolv(newValue);
    });
  },
  themeColors() {
    var colors = {};
    const site_theme_color = this.donneeInternetEntity.site_theme_color.length ? this.donneeInternetEntity.site_theme_color[0].value : "audacieux";
    switch (site_theme_color) {
      case "audacieux":
        colors = {
          wbubackground: [{ name: "", color: "#221f22" }],
          color_link_hover: [{ name: "", color: "#d324e3" }],
          color_primary: [{ name: "", color: "#ffc107" }],
          color_secondaire: [{ name: "", color: "#8d898d" }],
        };
        break;
      case "jetblack":
        colors = {
          wbubackground: [{ name: "", color: "#202020" }],
          color_link_hover: [{ name: "", color: "#a96d0b" }],
          color_primary: [{ name: "", color: "#14354a" }],
          color_secondaire: [{ name: "", color: "#346a8d" }],
        };
        break;
      case "etincelant":
        colors = {
          wbubackground: [{ name: "", color: "#202020" }],
          color_link_hover: [{ name: "", color: "#ba1bf5" }],
          color_primary: [{ name: "", color: "#f51b1b" }],
          color_secondaire: [{ name: "", color: "#1b6df5" }],
        };
        break;
      case "precieux":
        colors = {
          wbubackground: [{ name: "", color: "#202020" }],
          color_link_hover: [{ name: "", color: "#ba1bf5" }],
          color_primary: [{ name: "", color: "#b4c4dd" }],
          color_secondaire: [{ name: "", color: "#5c6572" }],
        };
        break;
      case "retro":
        colors = {
          wbubackground: [{ name: "", color: "#202020" }],
          color_link_hover: [{ name: "", color: "#ba1bf5" }],
          color_primary: [{ name: "", color: "#99521c" }],
          color_secondaire: [{ name: "", color: "#723e19" }],
        };
        break;
      case "nature":
        colors = {
          wbubackground: [{ name: "", color: "#202020" }],
          color_link_hover: [{ name: "", color: "#ba1bf5" }],
          color_primary: [{ name: "", color: "#559e0f" }],
          color_secondaire: [{ name: "", color: "#929e0f" }],
        };
        break;
      default:
        colors = {
          wbubackground: [{ name: "", color: "#221f22" }],
          color_link_hover: [{ name: "", color: "#d324e3" }],
          color_primary: [{ name: "", color: "#ffc107" }],
          color_secondaire: [{ name: "", color: "#8d898d" }],
        };
        break;
    }
    return colors;
  },
  /**
   * Retorune les id/Label.
   * L'id representant l'identifiant de la page à dupliquer.
   * //@deprecated
   */
  getLabelPages() {
    const options = {};
    const form = store.state.renderByStep.form;

    if (form.pages && form.pages.entity_form_settings && form.pages.entity_form_settings.list_options && form.pages.entity_form_settings.list_options.length) {
      const list_options = form.pages.entity_form_settings.list_options;
      list_options.forEach((item) => {
        options[item.value] = item.label;
      });
      return options;
    } else {
      // eslint-disable-next-line
      // debugger;
      return options;
    }
  },
  /**
   *
   * @param {*} resp
   */
  runErrorsMessages(resp) {
    console.log("runErrorsMessages : ", resp);
    this.messages.errors.push("<h3> Oups! Un problème est survenu. Veuillez réessayer </h3>");
    if (typeof resp === "string" || resp instanceof String) {
      this.messages.errors.push(resp);
    }
    store.commit("SET_ERROR_MESSAGES", this.messages.errors);
    store.commit("CLEAN_LOCALSTORAGE");
    this.runWarningsMessages();
  },
  /**
   * -
   */
  runWarningsMessages() {
    if (this.messages.warnings.length) store.commit("SET_WARNING_MESSAGES", this.messages.warnings);
  },
  getNumberEntities(entityDuplicate) {
    return new Promise((resolv) => {
      var number = 0;
      const loopCount = (datas) => {
        for (const i in datas) {
          number++;
          if (datas[i].entities) {
            for (const j in datas[i].entities) {
              loopCount(datas[i].entities[j]);
            }
          }
        }
      };
      loopCount(entityDuplicate);
      setTimeout(() => {
        resolv(number);
      }, 300);
    });
  },

  /**
   * --
   * @param {*} response
   * @param {*} suivers
   * @param {*} ActionDomainId
   * @returns
   */
  prepareSaveEntities(response, suivers, ActionDomainId = true) {
    FormUttilities.domainRegister = this.domainRegister;
    FormUttilities.numberTry = this.numberRetry;
    FormUttilities.timeWaitBeforeRetry = this.timeWaitBeforeRetry;
    return FormUttilities.prepareSaveEntities(store, response, suivers, ActionDomainId);
  },
  /**
   * Permet de relancer les requetes de types POST.
   */
  LoopPostRequest(url, resp) {
    return new Promise((resolv, reject) => {
      console.log("LoopPostRequest");
      var essaie = 0;
      const loop = () => {
        return new Promise((resolvChild, rejectChild) => {
          this.bPost(url, resp)
            .then((resp) => {
              resolvChild(resp);
            })
            .catch((err) => {
              if (essaie <= this.numberRetry) {
                essaie++;
                setTimeout(() => {
                  resolvChild(loop());
                }, this.timeWaitBeforeRetry);
              } else rejectChild(err);
            });
        });
      };
      loop()
        .then((resp) => {
          resolv(resp);
        })
        .catch((er) => {
          reject(er);
        });
    });
  },
  /**
   * Permet de relancer les requetes de types GET.
   */
  LoopGetRequest(url) {
    return new Promise((resolv, reject) => {
      var essaie = 0;
      const loop = () => {
        return new Promise((resolvChild, rejectChild) => {
          this.bGet(url)
            .then((resp) => {
              resolvChild(resp);
            })
            .catch((err) => {
              if (essaie <= this.numberRetry) {
                essaie++;
                setTimeout(() => {
                  resolvChild(loop());
                }, this.timeWaitBeforeRetry);
              } else rejectChild(err);
            });
        });
      };
      loop()
        .then((resp) => {
          resolv(resp);
        })
        .catch((er) => {
          reject(er);
        });
    });
  },
};
