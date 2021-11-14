// chrome-manifest-loader requires to import manifest.json
import "../manifest.json";

// Insert the script into the page because custom elements don't work properly with content scripts in firefox.
const script = document.createElement("script");
script.setAttribute("type", "module");
script.setAttribute("src", (chrome || browser).runtime.getURL("js/kinDraw.js"));
document.body.appendChild(script);
