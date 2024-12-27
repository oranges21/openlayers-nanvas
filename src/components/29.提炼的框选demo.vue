<template>
  <div id="app">
    <div id="map" class="map"></div>
    <select
      id="selection-type"
      v-model="selectionType"
      @change="onSelectionChange"
    >
      <option value="point">点选</option>
      <option value="Circle">圈选</option>
      <option value="Polygon">面选</option>
      <option value="LineString">线选</option>
    </select>
    <button id="locate-Switch" @click="offSwitch">关闭框选</button>
  </div>
</template>

<script setup>
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Stroke from "ol/style/Stroke";
import VectorSource from "ol/source/Vector";
import { Style, Fill, Circle as CircleStyle } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import { onMounted, ref, nextTick } from "vue";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
} from "ol/interaction";
import { fromLonLat } from "ol/proj";
import { Select } from "ol/interaction";
import { Draw } from "ol/interaction";

let markerSource;
let selectInteraction;
let drawInteraction;
let onSelectionChange;
let offSwitch;
let selectSwitch = ref(false);
const selectionType = ref("");
onMounted(() => {
  initMap();
});
const initMap = () => {
  markerSource = new VectorSource();
  const drawSource = new VectorSource();
  const drawLayer = new VectorLayer({
    source: drawSource,
    style: new Style({
      stroke: new Stroke({
        color: "#ffcc00",
        width: 2,
      }),
      fill: new Fill({
        color: "rgba(255, 204, 0, 0.1)",
      }),
    }),
  });
  const map = new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      drawLayer,
    ],
    target: "map",
    view: new View({
      center: fromLonLat([104.195397, 35.86166]),
      zoom: 4,
      projection: "EPSG:3857",
    }),
    interactions: defaultInteractions({ doubleClickZoom: false }).extend([
      new DragRotateAndZoom(),
    ]),
  });
  function singleClick(mapBrowserEvent) {
    return mapBrowserEvent.type === "click";
  }
  const select = (type) => {
    selectSwitch.value = "ture";
    if (selectInteraction) {
      map.removeInteraction(selectInteraction);
    }
    if (drawInteraction) {
      map.removeInteraction(drawInteraction);
    }
    if (type === "point") {
      selectInteraction = new Select({
        condition: singleClick,
      });
      selectInteraction.on("select", function (event) {
        const selectedFeatures = event.selected;
        selectedFeatures.forEach((feature) => {
          const coord = feature.getGeometry().getCoordinates();
          console.log("选择的目标点坐标:", coord);
        });
      });
      map.addInteraction(selectInteraction);
    } else {
      drawInteraction = new Draw({
        source: drawSource,
        type: type === "box" ? "LineString" : type,
      });
      map.addInteraction(drawInteraction);
      drawInteraction.on("drawend", (event) => {
        const geometry = event.feature.getGeometry();
        let extent;
        if (geometry.getType() === "Point") {
          extent = geometry.getExtent();
        } else {
          extent = geometry.getExtent();
        }
        const features = [];
        markerSource.forEachFeature((feature) => {
          const geom = feature.getGeometry();
          if (geom.intersectsExtent(extent)) {
            features.push(feature);
          }
        });
        console.log("选中的目标坐标:");
        features.forEach((feature) => {
          const coord = feature.getGeometry().getCoordinates();
          console.log(coord);
        });
        drawSource.clear();
      });
    }
  };
  offSwitch = () => {
    console.log("关闭框选");
    selectSwitch.value = "false";
    if (drawSource) {
      drawSource.clear();
    }
    if (drawInteraction) {
      map.removeInteraction(drawInteraction);
      drawInteraction = null;
    }
    if (selectInteraction) {
      map.removeInteraction(selectInteraction);
      selectInteraction = null;
    }
    selectionType.value = "";
    selectSwitch.value = false;
    console.log("框选已关闭");
  };
  onSelectionChange = (e) => {
    selectionType.value = e.target.value;
    console.log(e.target.value);
    select(selectionType.value);
  };
  console.log("init finished");
};
</script>

<style scoped>
.map {
  position: relative;
  width: 100%;
  height: 100vh;
}
#selection-type {
  margin-bottom: 10px;
  position: absolute;
  top: 100px;
  right: 10px;
}
#locate-Switch {
  position: absolute;
  top: 50px;
  right: 10px;
}
</style>
