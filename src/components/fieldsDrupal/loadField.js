import rootConfig from "../../rootConfig";
import drupalString from "./drupal-string.vue";
import drupalLink from "./drupal-link.vue";
import drupalColor from "./drupal-color.vue";
import drupalBoolean from "./drupal-boolean.vue";
import drupalListString from "./drupal-list-string.vue";
import drupalTextLong from "./textarea-ckeditor.vue";
import htmlRender from "./html-render.vue";
import drupalFile from "./drupal-file.vue";

export default {
  ...rootConfig,
  getField(field) {
    var key = field.type;
    if (key == "list_string" && field.cardinality == 1) key = "boolean";
    var template;
    console.log(" key : ", key);
    switch (key) {
      case "string":
        template = drupalString;
        break;
      case "link":
        template = drupalLink;
        break;
      case "color_theme_field_type":
        template = drupalColor;
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
      case "text_long":
        template = drupalTextLong;
        break;
      case "image":
        template = drupalFile;
        break;
      default:
        break;
    }
    return template;
  },
  getImageUrl(fid, style = "medium") {
    return this.get("/vuejs-entity/image/" + fid + "/" + style);
  },
  getRules(field) {
    const rules = {};
    if (field.constraints) {
      for (const i in field.constraints) {
        if (i == "NotNull") {
          rules["required"] = true;
        }
      }
    }
    return rules;
  },
};
