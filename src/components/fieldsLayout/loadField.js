import fieldText from "./fieldText.vue";
import fieldTextarea from "./textarea-layout.vue";
export default {
  getTemplate(field) {
    var template = null;
    const keys = Object.keys(field);
    switch (keys[0]) {
      case "text":
        template = fieldText;
        break;
      case "text_html":
        template = fieldTextarea;
        break;
      default:
        break;
    }
    return template;
  },
};
