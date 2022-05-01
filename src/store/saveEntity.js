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
          if (this.domainRegister.id)
            this.addEnteteLayout(state).then(() => {
              setTimeout(() => {
                step.status = "ok";
                this.currentBuildStep++;
                this.runStep(steps, state);
              }, 500);
            });
          else {
            step.status = "error";
            this.currentBuildStep++;
            this.runStep(steps, state);
          }
          break;
        case "layout_footer":
          step.status = "run";
          if (this.domainRegister.id)
            this.addfooterLayout(state).then(() => {
              setTimeout(() => {
                step.status = "ok";
                this.currentBuildStep++;
                this.runStep(steps, state);
              }, 500);
            });
          else {
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
  // On va cree un contenu static,
  CreateContent() {
    //home page
    const title =
      this.donneeInternetEntity.name[0] &&
      this.donneeInternetEntity.name[0].value
        ? "Bienvenue chez " + this.donneeInternetEntity.name[0].value
        : "Theme generer";
    const values = {
      type: "model_d_affichage_theme_partenai",
      title: [{ value: title }],
      field_domain_access: [{ target_id: this.domainRegister.id }],
      field_domain_source: [{ target_id: this.domainRegister.id }],
    };
    return this.bPost("/vuejs-entity/entity/save/node", values);
  },
  // On cree les autres pages :
  CreateOrtherPages() {
    return new Promise((resolv) => {
      if (
        this.donneeInternetEntity.pages &&
        this.donneeInternetEntity.pages.length
      ) {
        const promises = [];
        promises.push(this.CreateMenus());
        this.donneeInternetEntity.pages.forEach((item) => {
          // Pour l'instant les pages sont tous les nodes.
          const values = {
            type: item.value,
            title: [{ value: item.value }],
            field_domain_access: [{ target_id: this.domainRegister.id }],
            field_domain_source: [{ target_id: this.domainRegister.id }],
          };
          promises.push(this.bPost("/vuejs-entity/entity/save/node", values));
        });
        Promise.all(promises)
          .then(() => resolv(true))
          .catch((err) => {
            resolv(err);
          });
      }
    });
  },
  // Creation de menu.
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
  CreateTheme() {
    const values = {
      lirairy: "lesroisdelareno/prestataires_m5",
      site_config: [
        {
          value: JSON.stringify({
            "edit-config":
              "domain.config." + this.domainRegister.id + ".system.site",
            "page.front":
              this.homePageContent.nid && this.homePageContent.nid[0]
                ? "/node/" + this.homePageContent.nid[0].value
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
    // site_config
    return this.bPost("/vuejs-entity/entity/save/config_theme_entity", values);
  },
  // On ajoute la config pour l'entete du layout.
  addEnteteLayout(state) {
    return this.bPost(
      "/layout/add-subconfigure/defaults/block_content.layout_entete_m1.default/0/formatage_models_header1/" +
        this.domainRegister.id,
      state.storeLayout.configuration
    );
  },
  // On ajoute la config pour le footer du layout.
  addfooterLayout(state) {
    return this.bPost(
      "/layout/add-subconfigure/defaults/block_content.block_footers_themes.default/0/formatage_models_footer1/" +
        this.domainRegister.id,
      state.storeLayoutFooter.configuration
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
        nos_services: 58,
        qui_sommes_nous: 38,
        page_realisation: 14,
        page_tarif_rc_web: 56,
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
