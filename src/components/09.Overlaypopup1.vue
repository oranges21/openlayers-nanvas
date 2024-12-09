<template>
  <div id="app">
    <!-- 地图容器 -->
    <div id="map" class="map"></div>
    <!-- Popup 容器 -->
    <div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div id="popup-content"></div>
    </div>
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
import { createStringXY } from "ol/coordinate";
import OverviewMap from "ol/control/OverviewMap";
import { XYZ } from "ol/source.js";
//scaleline比例尺控件
import { ScaleLine } from "ol/control";
//overlay实现popup弹窗
import { Overlay } from "ol";

//overviewmap地图全局视图（鹰眼图）控件
var overviewMapControl = new OverviewMap({
  layers: [
    new TileLayer({
      source: new XYZ({
        // url: "http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurpli",
        url: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png", // 使用 OSM 瓦片服务
        attributions:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }),
    }),
  ],
});
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

  //overlay实现popup弹窗
  const container = document.getElementById("popup");
  const closer = document.getElementById("popup-closer");
  const content = document.getElementById("popup-content");
  //创建Overlay
  const overlay = new Overlay({
    element: container,
    autoPan: false, //自动平移以确保弹窗可见
    positioning: "bottom-center", //设置Popup的定位方式
    stopEvent: false, //允许事件穿透到地图
    autoPanAnimation: {
      duration: 250,
    },
  });
  //当点击关闭按钮时隐藏 Popup
  closer.onclick = () => {
    overlay.setPosition(undefined);
    container.classList.remove("ol-popup-visible"); //隐藏Popup
    closer.blur();
    return false;
  };

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
    controls: defaultControls({ zoom: true }).extend([overviewMapControl]),
    interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    overlays: [overlay],
  });
  map.addControl(new FullScreen());
  map.addControl(mousePositionControl);
  map.addControl(new ScaleLine());
  //监听地图上的单击事件以显示Popup
  map.on("singleclick", (evt) => {
    const coordinate = evt.coordinate;
    content.innerHTML = `<p>你点击的位置是： ${coordinate}</p>`;
    overlay.setPosition(coordinate);
    container.classList.add("ol-popup-visible"); //显示Popup
  });
  console.log("init finished");
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 100vh;
}
/* Popup弹窗样式 */
.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  /* 默认居中 */
  left: 50%;
  /* 精确调整到中心 */
  transform: translateX(-50%);
  /* 默认隐藏 */
  visibility: hidden;
  width: auto;
}

.ol-popup:after,
.ol-popup:before {
  /* 确保箭头位于弹窗底部 */
  top: 100%;
  border: solid transparent;
  content: " ";
  height: 0;
  width: 0;
  position: absolute;
  pointer-events: none;
}

.ol-popup:after {
  border-top-color: white;
  border-width: 10px;
  /* left: 48px; */
  /* 箭头居中 */
  left: 50%;
  transform: translateX(-50%);
  margin-left: -10px;
}

.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 48px;
  margin-left: -11px;
}

.ol-popup-closer {
  text-decoration: none;
  position: absolute;
  top: 2px;
  right: 8px;
}

.ol-popup-closer:after {
  content: "✖";
}
.ol-popup-visible {
  visibility: visible; /* 显示时应用 */
}
</style>
