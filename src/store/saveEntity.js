import rootConfig from "../rootConfig";
import store from "./index";
import { limit } from "stringz";

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
          this.CreateContent()
            .then((resp) => {
              this.homePageContent = resp.data;
              var passNext = () => {
                setTimeout(() => {
                  step.status = "ok";
                  this.currentBuildStep++;
                  this.runStep(steps, state);
                }, 500);
              };
              // On patiente que les autres pages soit ok.
              this.CreateOrtherPages()
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
            this.createBlockContentHeader(state)
              .then((resp) => {
                var passNext = () => {
                  setTimeout(() => {
                    step.status = "ok";
                    this.currentBuildStep++;
                    this.runStep(steps, state);
                  }, 500);
                };
                this.addEntityToBlock(resp.data, "top_header")
                  .then(() => {
                    passNext();
                  })
                  .catch(() => {
                    passNext();
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
        case "layout_footer":
          step.status = "run";
          if (this.domainRegister.id) {
            this.createBlockContentFooter(state)
              .then((resp) => {
                var passNext = () => {
                  setTimeout(() => {
                    step.status = "ok";
                    this.currentBuildStep++;
                    this.runStep(steps, state);
                  }, 500);
                };
                this.addEntityToBlock(resp.data, "footer")
                  .then(() => {
                    passNext();
                  })
                  .catch(() => {
                    passNext();
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
  // On va cree la page d'accueil en function de l'identifiant present dans l'url.
  CreateContent() {
    const idHome = window.location.pathname.split("/").pop();
    const title =
      this.donneeInternetEntity.name[0] &&
      this.donneeInternetEntity.name[0].value
        ? "Bienvenue chez " + this.donneeInternetEntity.name[0].value
        : "Theme generé";
    const values = {
      name: [{ value: title }],
      field_domain_access: [{ target_id: this.domainRegister.id }],
      field_domain_source: [{ target_id: this.domainRegister.id }],
      is_default_theme: [{ value: false }],
    };
    return this.bPost(
      "/vuejs-entity/entity/generate-page-web/" + idHome,
      values
    );
  },
  // On cree les autres pages :
  CreateOrtherPages() {
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
              this.bPost("/vuejs-entity/entity/generate-page-web/" + id, values)
                .then((resp) => {
                  this.OrtherPages.push(resp.data);
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
                  }, 1000);
                });
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
            // On met à jour le champs "field_reference_menu" au niveau de l'object du header
            state.storeFormRenderHeader.model.field_reference_menu = [
              { target_id: resp.data.menu.id },
            ];
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
   * Les données données ont ete simplifié afin de permettre un ajout rapide.
   * ( On envoit les données pour le paragraph. On cree le nouveau block, on assoccie le paragrah )
   * @param {*} state
   * @returns
   */
  createBlockContentHeader(state) {
    return new Promise((resolv, reject) => {
      state.storeFormRenderHeader.model.field_domain_access = [
        { target_id: this.domainRegister.id },
      ];
      state.storeFormRenderHeader.model.field_domain_source = [
        { target_id: this.domainRegister.id },
      ];
      // Pas necesssaire
      this.addDefaultBlockInRegion();
      this.CreateMenus(state)
        .then(() => {
          resolv(
            this.bPost(
              "/vuejs-entity/entity/add-paragrph-in-entity/block_content/header",
              {
                paragraph: state.storeFormRenderHeader.model,
                entity: {
                  info: [{ value: "Entete" }],
                  field_domain_access: [{ target_id: this.domainRegister.id }],
                  field_domain_source: [{ target_id: this.domainRegister.id }],
                },
              }
            )
          );
        })
        .catch(() => {
          reject();
        });
    });
  },
  /**
   *
   * @param {*} blockContent
   */
  addEntityToBlock(blockContent, region) {
    return new Promise((resolv, reject) => {
      if (blockContent["uuid"]) {
        const type = blockContent["type"][0]["target_id"];
        const uuid = blockContent["uuid"][0]["value"];
        const label = blockContent["info"][0]["value"];
        const id_domaine = limit(this.domainRegister.id, 20, "");
        const id_system = limit(id_domaine + type, 30, "");
        const values = {
          id: id_system,
          theme: this.domainRegister.id,
          region: region,
          plugin: "block_content:" + uuid,
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
            provider: "block_content",
          },
        };
        resolv(this.bPost("/vuejs-entity/entity/add-block-in-region", values));
      } else {
        this.messages.warnings.push(
          " Impossible d'ajouter le bloc, region : " + region
        );
        reject();
      }
    });
  },
  // On ajoute la config pour le footer du layout.
  createBlockContentFooter(state) {
    state.storeFormRenderFooter.model.field_domain_access = [
      { target_id: this.domainRegister.id },
    ];
    state.storeFormRenderFooter.model.field_domain_source = [
      { target_id: this.domainRegister.id },
    ];
    return this.bPost(
      "/vuejs-entity/entity/add-paragrph-in-entity/block_content/footer",
      {
        paragraph: state.storeFormRenderFooter.model,
        entity: {
          info: [{ value: " Pied de page " }],
          field_domain_access: [{ target_id: this.domainRegister.id }],
          field_domain_source: [{ target_id: this.domainRegister.id }],
        },
      }
    );
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
  /**
   *
   * @deprecated
   */
  convertPagesToItemsMainMenu() {
    const items = [];
    if (
      this.donneeInternetEntity.pages &&
      this.donneeInternetEntity.pages.length
    ) {
      const menusR = {
        nos_services_rc_web_: 58,
        qui_sommes_nous: 38,
        page_realisation: 14,
        page_tarif_rc_web_: 56,
        comment_sa_marche: 1,
        retructement: 16,
      };
      this.donneeInternetEntity.pages.forEach((item) => {
        if (menusR[item.value]) {
          items.push(menusR[item.value]);
        }
      });
      return items;
    } else return items;
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
};
