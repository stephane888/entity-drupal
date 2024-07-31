import { AjaxToastBootStrap } from "wbuutilities";

// On surcharger la durée d'attente d'une requete.
AjaxToastBootStrap.axiosInstance.defaults.timeout = 800000;
AjaxToastBootStrap.setHeaders("x-semaphore", "bloquant");
export default {
  ...AjaxToastBootStrap,
  languageId: window.drupalSettings && window.drupalSettings.path && window.drupalSettings.path.currentLanguage ? window.drupalSettings.path.currentLanguage : null,
  TestDomain: "http://wb-horizon.kksa",
  debug: false,
  // on doit surcharger les les requetes afin d'ajouter un header "x-semaphore", qui permettra que toutes les requtes passe par le semaphore.
  // bGet(url, configs = {}, showNotification = false) {
  //   configs = this.mergeHeaders(configs);
  //   return AjaxToastBootStrap.bGet(url, { headers: configs }, showNotification);
  // },
  // bPost(url, datas, configs = {}, showNotification = false) {
  //   configs = this.mergeHeaders(configs);
  //   return AjaxToastBootStrap.bPost(url, datas, { headers: configs }, showNotification);
  // },
};
