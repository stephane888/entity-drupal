import rootConfig from "../rootConfig";
import store from "./index";

//
export default {
  ...rootConfig,
  currentBuildStep: 0,
  donneeInternetEntity: {},
  homePageContent: {},
  domainRegister: {},
  autresPages: [],
  runStep(steps, state) {
    console.log("currentBuildStep : ", this.currentBuildStep);
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
              console.log(" CreateDomaine : ", resp);
            })
            .catch((resp) => {
              step.status = "error";
              console.log(" error : ", resp);
            });
          break;
        case "register_domaine":
          step.status = "run";
          this.RegisterDomaine()
            .then((resp) => {
              setTimeout(() => {
                step.status = "ok";
                this.currentBuildStep++;
                this.domainRegister = resp.data;
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
              console.log("error : ", resp);
            });
          break;
        case "create_content":
          step.status = "run";

          this.CreateOrtherPages().then(() => {
            this.CreateContent()
              .then((resp) => {
                setTimeout(() => {
                  this.homePageContent = resp.data;
                  step.status = "ok";
                  this.currentBuildStep++;
                  this.runStep(steps, state);
                }, 500);
              })
              .catch((resp) => {
                step.status = "error";
                console.log("error : ", resp);
              });
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
              console.log("error : ", resp);
            });
          break;
        case "layout_header":
          step.status = "run";
          if (this.domainRegister.id) {
            this.createBlockContentHeader(state).then((resp) => {
              //
              this.addEntityToBlock(resp.data, "top_header").then(() => {
                setTimeout(() => {
                  step.status = "ok";
                  this.currentBuildStep++;
                  this.runStep(steps, state);
                }, 500);
              });
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
            this.createBlockContentFooter(state).then((resp) => {
              this.addEntityToBlock(resp.data, "footer").then(() => {
                setTimeout(() => {
                  step.status = "ok";
                  this.currentBuildStep++;
                  this.runStep(steps, state);
                }, 500);
              });
            });
          } else {
            step.status = "error";
            this.currentBuildStep++;
            this.runStep(steps, state);
          }
          break;
        default:
          console.log("pre active finish");
          store.commit("ACTIVE_FINISH");
          break;
      }
    else {
      console.log("pre active finish");
      store.commit("ACTIVE_FINISH");
    }
  },
  // Dans cette etape, on cree l'entité "donnee_internet_entity", l'entite pour OVH.
  CreateDomaine(entity) {
    return this.bPost(
      "/vuejs-entity/entity/save/donnee_internet_entity",
      entity
    );
  },
  // On enregistre le domaine sur OVH et on l'enregistre egalement comme multidomaine sur drupal.
  RegisterDomaine() {
    if (
      this.donneeInternetEntity.domain_ovh_entity &&
      this.donneeInternetEntity.domain_ovh_entity[0].target_id
    ) {
      // Save domaine on OVH.
      this.bPost(
        "/ovh-api-rest/create-domaine/" +
          this.donneeInternetEntity.domain_ovh_entity[0].target_id
      )
        .then((resp) => {
          console.log(" Domaine enregistrer sur OVH : ", resp);
        })
        .catch((resp) => {
          console.log(" ECHEC Domaine save sur OVH : ", resp);
        });
      // Save domaine on drupal
      return this.bPost(
        "/vuejs-entity/domaine/add/" +
          this.donneeInternetEntity.domain_ovh_entity[0].target_id
      );
    }
  },
  // On va cree la page d'accueil en function de l'identifiant present dans l'url.
  CreateContent() {
    const idHome = window.location.pathname.split("/").pop();
    const title =
      this.donneeInternetEntity.name[0] &&
      this.donneeInternetEntity.name[0].value
        ? "Bienvenue chez " + this.donneeInternetEntity.name[0].value
        : "Theme generer";
    const values = {
      title: [{ value: title }],
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
        const loop = (i = 0, essaie = 1) => {
          return new Promise((resolv) => {
            const id = this.donneeInternetEntity.pages[i]
              ? this.donneeInternetEntity.pages[i].value
              : null;
            const values = {
              field_domain_access: [{ target_id: this.domainRegister.id }],
              field_domain_source: [{ target_id: this.domainRegister.id }],
              is_default_theme: [{ value: false }],
              is_home_page: [{ value: false }],
            };
            if (id) {
              this.bPost("/vuejs-entity/entity/generate-page-web/" + id, values)
                .then(() => {
                  var id = i + 1;
                  resolv(loop(id));
                })
                .catch(() => {
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
   * La creation de menu se ferra apres la creation des pages.
   * Car les liens de pages ainsi generer devront etre utiliser comme lien.
   * @returns
   */
  CreateMenus() {
    return new Promise((resolv) => {
      const getMenus = () => {
        return new Promise((resolv) => {
          this.get("/vuejs-entity/menu-links/main").then((resp) => {
            const menuItems = resp.data;
            const PageMenus = this.convertPagesToItemsMainMenu();
            console.log(" Active menu from page : ", PageMenus);
            PageMenus.forEach((idmenu) => {
              menuItems[idmenu] = idmenu;
            });
            resolv(menuItems);
          });
        });
      };
      //
      getMenus().then((menuItems) => {
        console.log(" Menu to create : ", menuItems);
        const values = {
          hostname: [{ value: this.domainRegister.id }],
          field_element_de_menu_valides: [{ value: JSON.stringify(menuItems) }],
        };
        this.bPost("/vuejs-entity/entity/save/wbumenudomain", values)
          .then((resp) => {
            resolv(resp);
          })
          .catch(() => {
            resolv();
          });
      });
    });
  },
  // On cree le theme de maniere statique, mais il faudra le rendre dynamique.
  // Il faudra aussi definir la page daccueil.
  async CreateTheme() {
    const idHome = window.location.pathname.split("/").pop();
    var lirairy = "lesroisdelareno/prestataires_m5";
    switch (idHome) {
      case "9":
        lirairy = "lesroisdelareno/prestataires_m8";
        break;
      case "1":
        lirairy = "lesroisdelareno/prestataires_m7";
        break;
      case "10":
        lirairy = "lesroisdelareno/prestataires_m6";
        break;
    }
    return new Promise((resolv) => {
      var values = {
        lirairy: lirairy,
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
      };
      //
      if (this.domainRegister.id) {
        values["hostname"] = [{ value: this.domainRegister.id }];
      }
      // Applis colors
      this.ApplieColor(values).then((resp) => {
        console.log(" Value : ", values);
        console.log(" Value : ", resp);
        // eslint-disable-next-line
        // debugger;
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
    state.storeFormRenderHeader.model.field_domain_access = [
      { target_id: this.domainRegister.id },
    ];
    state.storeFormRenderHeader.model.field_domain_source = [
      { target_id: this.domainRegister.id },
    ];
    return this.bPost(
      "/vuejs-entity/entity/add-paragrph-in-entity/block_content/header",
      {
        paragraph: state.storeFormRenderHeader.model,
        entity: {
          info: [{ value: this.domainRegister.id + " : header" }],
          field_domain_access: [{ target_id: this.domainRegister.id }],
          field_domain_source: [{ target_id: this.domainRegister.id }],
        },
      }
    );
  },
  /**
   *
   * @param {*} blockContent
   */
  addEntityToBlock(blockContent, region) {
    return new Promise((resolv, reject) => {
      if (blockContent["uuid"]) {
        var type = blockContent["type"][0]["target_id"];
        var uuid = blockContent["uuid"][0]["value"];
        const values = {
          id: this.domainRegister.id + type,
          theme: this.domainRegister.id,
          region: region,
          plugin: "block_content:" + uuid,
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
        };
        resolv(this.bPost("/vuejs-entity/entity/add-block-in-region", values));
      } else {
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
          info: [{ value: this.domainRegister.id + " : footer " }],
          field_domain_access: [{ target_id: this.domainRegister.id }],
          field_domain_source: [{ target_id: this.domainRegister.id }],
        },
      }
    );
  },
  //
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
   * @deprecated
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
};

// ^ array:7 [▼
//   "edit-config" => "domain.config.v2lesroisdelareno_kksa.system.site"
//   "name" => "Les rois de la réno ........."
//   "slogan" => "Un devis travaux en ligne dès que vous en avez besoin..."
//   "mail" => "contact@lesroisdelareno.fr"
//   "page.front" => "/node/1682"
//   "page.403" => ""
//   "page.404" => ""
// ]
//http://dimmat.lesroisdelareno.fr
