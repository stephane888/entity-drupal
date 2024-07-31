import { extend } from "vee-validate";
import { required, email, alpha, numeric } from "vee-validate/dist/rules";
// No message specified.
extend("email", email);
// Override the default message.
extend("required", {
  ...required,
  message: "Ce champs est requis",
});
extend("alpha", alpha);
extend("alpha", numeric);
//export default extend;
