import rootConfig from "../rootConfig";
import store from "./index";
import { limit } from "stringz";
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
   * entité domain
   */
  domainOvhEntity: {},
  OrtherPages: [],
  messages: { errors: [], warnings: [] },
  runStep(steps, state) {
    console.log(" currentBuildStep : ", this.currentBuildStep);
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
              this.bPost(
                "/ovh-api-rest/create-domaine/" +
                  this.donneeInternetEntity.domain_ovh_entity[0].target_id
              ).catch(() => {
                this.messages.warnings.push(
                  " Votre domaine n'a pas pu etre generer "
                );
              });
              setTimeout(() => {
                step.status = "ok";
                this.currentBuildStep++;
                if (resp.data && resp.data.domain)
                  this.domainRegister = resp.data.domain;
                if (resp.data && resp.data.domain_ovh_entity)
                  this.domainOvhEntity = resp.data.domain_ovh_entity;
                if (this.domainRegister.hostname) {
                  store.commit("SET_HOSTNAME", {
                    domain: this.domainRegister.hostname,
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
              console.log(" this.homePageContent ", this.homePageContent);
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
                    this.addEntityToBlock(
                      resp,
                      "paragraph",
                      "top_header",
                      "entete"
                    )
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
        default:
          // on ne devrait pas arrivé ici.
          this.messages.warnings.push(
            " Cette etape n'est pas definit : " + step.step
          );
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
  // Dans cette etape, on cree les entités "donnee_internet_entity" et "domain_ovh_entity".
  CreateDomaine(entity) {
    return this.bPost(
      "/vuejs-entity/entity/save/donnee_internet_entity",
      entity
    );
  },
  // On enregistre le domaine sur OVH et on l'enregistre egalement comme multidomaine sur drupal.
  RegisterDomaine() {
    return new Promise((resolv, reject) => {
      if (
        this.donneeInternetEntity.domain_ovh_entity &&
        this.donneeInternetEntity.domain_ovh_entity[0] &&
        this.donneeInternetEntity.domain_ovh_entity[0].target_id
      ) {
        // Cree l'entité domain s'il n'existe pas et recupere les entites domain et domain_ovh_entity.
        resolv(
          this.bPost(
            "/vuejs-entity/domaine/add/" +
              this.donneeInternetEntity.domain_ovh_entity[0].target_id
          )
        );
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
      const title =
        this.donneeInternetEntity.name[0] &&
        this.donneeInternetEntity.name[0].value
          ? "Bienvenue chez " + this.donneeInternetEntity.name[0].value
          : "Theme generé";
      const payload = {
        id: idHome,
        content: {
          name: [{ value: title }],
          field_domain_access: [{ target_id: this.domainRegister.id }],
          field_domain_source: [{ target_id: this.domainRegister.id }],
          is_default_theme: [{ value: false }],
        },
      };
      store
        .dispatch("getMatriceEntities", payload)
        .then((resp) => {
          console.log(" CreateContent resp : ", resp);
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
                } else
                  reject(
                    " Une erreur s'est produite pendant la construction de la page "
                  );
              })
              .catch((er) => {
                this.runErrorsMessages(er);
                reject(
                  " Une erreur s'est produite pendant la construction de la page ... "
                );
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
    return new Promise((resolv, reject) => {
      if (
        this.donneeInternetEntity.pages &&
        this.donneeInternetEntity.pages.length
      ) {
        const options = this.getLabelPages();
        const loop = (i = 0, essaie = 1) => {
          return new Promise((resolv) => {
            const id = this.donneeInternetEntity.pages[i]
              ? this.donneeInternetEntity.pages[i].value
              : null;
            const title = options[id] ? options[id] : "page generate";
            const values = {
              field_domain_access: [{ target_id: this.domainRegister.id }],
              field_domain_source: [{ target_id: this.domainRegister.id }],
              is_default_theme: [{ value: false }],
              is_home_page: [{ value: false }],
              name: [{ value: title }],
            };
            if (id) {
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
                    .catch(() => {
                      this.messages.warnings.push(
                        " Erreur rencontrée lors de la creation de cette page : <b>" +
                          title +
                          "</b> vous pourriez la re-creer plus tard. "
                      );
                      setTimeout(() => {
                        if (essaie == 1) loop(i, 2);
                        else {
                          var id2 = i + 1;
                          loop(id2);
                        }
                      }, 3000);
                    });
                  step.entities.push(vals);
                });
              });
              // this.bPost("/vuejs-entity/entity/generate-page-web/" + id, values)
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
        resolv(loop());
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
        id: this.domainOvhEntity.sub_domain[0].value + "_main",
        label: this.domainRegister.id + ": menu principal",
        description: "Menu generé automatiquement",
      };
      // build items
      const items = [];
      this.OrtherPages.forEach((page) => {
        if (page.id[0] && page.id[0].value)
          items.push({
            title: [
              {
                value: page.name[0]
                  ? page.name[0].value
                  : "lien genere :" + page.id[0].value,
              },
            ],
            enabled: [{ value: true }],
            link: [
              { uri: "internal:/site-internet-entity/" + page.id[0].value },
            ],
          });
      });
      // Contruit le menus et les items.
      this.bPost("/vuejs-entity/entity/add-menu-items", {
        menu: menu,
        items: items,
        domain: {
          field_domain_access: this.domainRegister.id,
          field_domain_source: this.domainRegister.id,
        },
        // block_content_type: "header_footer", // La construction doit etre statique car il ya un mappage de champs à faire.
      })
        .then((resp) => {
          console.log("resp : ", resp);
          if (resp.data.menu && resp.data.menu.id) {
            console.log(state);
            // On met à jour le champs "field_reference_menu" au niveau de l'object du header
            state.storeFormRenderHeader.entities[0].entity.field_reference_menu =
              [{ target_id: resp.data.menu.id }];
            resolv();
          } else {
            this.messages.warnings.push(
              " Une erreur est survenu lors de la disposition des menus, vous pourriez le faire plus tard. "
            );
            reject();
          }
        })
        .catch(() => {
          this.messages.warnings.push(
            " Une erreur est survenu lors de la creation des menus, vous pourriez le faire plus tard. "
          );
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
    return this.bPost(
      "/vuejs-entity/entity/add-block-in-region",
      system_main_block
    );
  },
  //
  async CreateTheme() {
    return new Promise((resolv) => {
      var values = {
        site_config: [
          {
            value: JSON.stringify({
              "edit-config":
                "domain.config." + this.domainRegister.id + ".system.site",
              "page.front":
                this.homePageContent.id && this.homePageContent.id[0]
                  ? "/site-internet-entity/" + this.homePageContent.id[0].value
                  : "",
              name:
                this.donneeInternetEntity.name[0] &&
                this.donneeInternetEntity.name[0].value
                  ? this.donneeInternetEntity.name[0].value
                  : "",
              "page.404": "",
              "page.403": "",
            }),
          },
        ],
        logo:
          this.donneeInternetEntity.image_logo &&
          this.donneeInternetEntity.image_logo.length
            ? this.donneeInternetEntity.image_logo
            : [],
        run_npm: [{ value: false }],
      };
      //
      if (this.domainRegister.id) {
        values["hostname"] = [{ value: this.domainRegister.id }];
      }
      // Applis colors
      this.ApplieColor(values).then((resp) => {
        resolv(
          this.bPost("/vuejs-entity/entity/save/config_theme_entity", resp)
        );
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
              } else
                reject(
                  " Une erreur s'est produite pendant la construction de l'entete "
                );
            })
            .catch((er) => {
              this.runErrorsMessages(er);
              reject(
                " Une erreur s'est produite pendant la construction de l'entete ... "
              );
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
      console.log("footers : ", footers);
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
              } else
                reject(
                  " Une erreur s'est produite pendant la construction de l'entete "
                );
            })
            .catch((er) => {
              this.runErrorsMessages(er);
              reject(
                " Une erreur s'est produite pendant la construction de l'entete ... "
              );
            });
        })
        .catch((er) => {
          this.runErrorsMessages(er);
          reject(" Impossible de determiner les sous entites de l'entete ... ");
        });
    });
  },

  addEntityToBlock(entity, entity_type_id, region, info = "") {
    return new Promise((resolv, reject) => {
      console.log("addEntityToBlock : ", entity);
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
        console.log(" addEntityToBlock values : ", values);
        resolv(this.bPost("/vuejs-entity/entity/add-block-in-region", values));
      } else reject(" ID du paragraph non definit ");
    });
  },

  generateStyleTheme() {
    return new Promise((resolv, reject) => {
      const idHome = window.location.pathname.split("/").pop();
      this.bGet(
        "/generate_style_theme/set_default_style/" +
          idHome +
          "/" +
          this.domainRegister.id
      )
        .then(() => {
          this.bGet(
            "/layoutgenentitystyles/manuel/api-generate/" +
              this.domainRegister.id
          )
            .then(() => {
              resolv(
                this.bGet(
                  "/generate-style-theme/update-style-theme/" +
                    this.domainRegister.id
                )
              );
            })
            .catch(() => {
              reject();
            });
        })
        .catch((e) => {
          reject(e);
        });
    });
  },

  //
  ApplieColor(values) {
    return new Promise((resolv) => {
      var newValue = {};
      const type = this.donneeInternetEntity.type_color_theme.length
        ? this.donneeInternetEntity.type_color_theme[0].value
        : "0";
      // l'utilisateur a choisie les couleurs.
      if (type == "0") {
        newValue = {
          ...values,
          wbubackground:
            this.donneeInternetEntity.background &&
            this.donneeInternetEntity.background.length
              ? this.donneeInternetEntity.background
              : [],
          color_link_hover:
            this.donneeInternetEntity.color_linkhover &&
            this.donneeInternetEntity.color_linkhover.length
              ? this.donneeInternetEntity.color_linkhover
              : [],
          color_primary:
            this.donneeInternetEntity.color_primary &&
            this.donneeInternetEntity.color_primary.length
              ? this.donneeInternetEntity.color_primary
              : [],
          color_secondaire:
            this.donneeInternetEntity.color_secondary &&
            this.donneeInternetEntity.color_secondary.length
              ? this.donneeInternetEntity.color_secondary
              : [],
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
    const site_theme_color = this.donneeInternetEntity.site_theme_color.length
      ? this.donneeInternetEntity.site_theme_color[0].value
      : "audacieux";
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

    if (
      form.pages &&
      form.pages.entity_form_settings &&
      form.pages.entity_form_settings.list_options &&
      form.pages.entity_form_settings.list_options.length
    ) {
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
    this.messages.errors.push(
      "<h3> Oups! Un problème est survenu. Veuillez réessayer </h3>"
    );
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
    if (this.messages.warnings.length)
      store.commit("SET_WARNING_MESSAGES", this.messages.warnings);
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
   * Sauvegarde toutes les données d'une matrice, et retourne les entites parentes.
   * @param {Object} response
   * @param {Object} suivers
   * @return {Array} un tableau d'entité de drupal.
   */
  prepareSaveEntities(response, suivers, ActionDomainId = false) {
    return new Promise((resolu, rejecte) => {
      const updateDomainId = (entity) => {
        if (
          ActionDomainId &&
          this.domainRegister.id &&
          entity.field_domain_access
        ) {
          entity.field_domain_access = [{ target_id: this.domainRegister.id }];
        }
        return entity;
      };

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
                store
                  .dispatch("saveEntity", {
                    entity_type_id: items[i].target_type,
                    value: updateDomainId(entity),
                    index: i,
                  })
                  .then((resp) => {
                    suivers.creates++;
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
              store
                .dispatch("saveEntity", {
                  entity_type_id: item.target_type,
                  value: updateDomainId(item.entity),
                  index: i,
                })
                .then((resp) => {
                  suivers.creates++;
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
       * Permet de sauvegarder les données d'une matrice.
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
          console.log(" loopFieldEntity : ", datas);
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
       * il retourne un tableau de d'entity => [{target_id:...},{target_id:...}, ... ].
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
                store
                  .dispatch("saveEntity", {
                    entity_type_id: datas[i].target_type,
                    value: updateDomainId(entity),
                    index: i,
                  })
                  .then((resp) => {
                    suivers.creates++;
                    values.push(resp.data.json);
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
              store
                .dispatch("saveEntity", {
                  entity_type_id: datas[i].target_type,
                  value: updateDomainId(datas[i].entity),
                  index: i,
                })
                .then((resp) => {
                  suivers.creates++;
                  values.push(resp.data.json);
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
      loopEntityPromise(response, 0)
        .then((entities) => {
          resolu(entities);
        })
        .catch((er) => {
          rejecte(er);
        });
    });
  },
};
