<template>
  <div id="app">
    <!-- 地图容器 -->
    <div id="map" class="map"></div>
  </div>
</template>

<script setup>
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Graticule from "ol/layer/Graticule";
import Stroke from "ol/style/Stroke";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke as FeatureStroke } from "ol/style";
import VectorLayer from "ol/layer/Vector"; // 新增导入
import { onMounted } from "vue";
// geoJson中国地图数据
import { areaGeo } from "./geoJson/china.js";
//栗子： dragrotateandzoom(shift + 鼠标拖拽进行缩放和旋转地图)
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
} from "ol/interaction";
//control全屏
import { defaults as defaultControls, FullScreen } from "ol/control";
//control鼠标位置控件
import MousePosition from "ol/control/MousePosition";
import { ColorFormat } from "antd/es/color-picker/interface.js";
import { createStringXY } from "ol/coordinate";
//向地图添加MousePosition
var mousePositionControl = new MousePosition({
  //坐标格式
  coordinateFormat: createStringXY(5),
  //地图投影坐标系（若未设置则输出为默认投影坐标系下的坐标）
  projection: "EPSG:4326",
  //坐标信息显示样式类名，默认是"ol-mouse-position"
  className: "custom-mouse-position",
  //显示鼠标位置信息的目标容器
  target: document.getElementById("map"),
  //未定义坐标的标记
  undefinedHTML: "&nbsp;",
});

onMounted(() => {
  initMap();
});

const initMap = () => {
  // 创建一个向量源并读取 GeoJSON 数据
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(areaGeo),
  });

  // 定义样式
  const style = new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.6)",
    }),
    stroke: new FeatureStroke({
      color: "#319FD3",
      width: 1,
    }),
  });

  // 创建向量图层
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: style,
  });

  // 创建一个 Graticule (经纬网)实例并设置样式
  const graticule = new Graticule({
    strokeStyle: new Stroke({
      color: "rgba(255,120,0,0.9)",
      width: 2,
      lineDash: [0.5, 4],
    }),
    showLabels: true,
    wrapX: false,
  });

  // 创建地图实例，并将 Graticule 和向量图层添加为图层之一
  const map = new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      graticule,
      vectorLayer,
    ],
    target: "map",
    view: new View({
      center: [104.195397, 35.86166], // 设置为中国中心点
      zoom: 4,
    }),
    interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
  });
  map.addControl(new FullScreen());
  map.addControl(mousePositionControl);
  console.log("init finished");
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 100vh;
}
</style>
