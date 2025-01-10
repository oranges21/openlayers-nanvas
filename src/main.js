// import './assets/main.css'
import * as Cesium from "cesium";

import { createApp } from "vue";
import "ol/ol.css";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

const app = createApp(App);
window.CESIUM_TOKEN = "your_cesium_ion_token_here";

if (!Cesium.Ion.defaultAccessToken && window.CESIUM_TOKEN) {
  Cesium.Ion.defaultAccessToken = window.CESIUM_TOKEN;
}

app.use(createPinia());
app.use(router);
app.use(ElementPlus);

app.mount("#app");
