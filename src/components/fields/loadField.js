import rootConfig from "../../rootConfig";
import drupalString from "./drupal-string.vue";
import drupalBoolean from "./drupal-boolean.vue";
import drupalListString from "./drupal-list-string.vue";
import htmlRender from "./html-render.vue";

export default {
  ...rootConfig,
  getField(key) {
    console.log(key);
    var template;
    switch (key) {
      case "string":
        template = drupalString;
        break;
      case "boolean":
        template = drupalBoolean;
        break;
      case "list_string":
        template = drupalListString;
        break;
      case "render_html":
        template = htmlRender;
        break;
      default:
        break;
    }
    return template;
  },
  getImageUrl(fid, style = "medium") {
    return this.get("/vuejs-entity/image/" + fid + "/" + style);
  },
};
