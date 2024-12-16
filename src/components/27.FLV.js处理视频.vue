<template>
  <div id="app">
    <div id="map" class="map"></div>
    <div id="popup" class="ol-popup">
      <a href="#" id="popup-closer" class="ol-popup-closer"></a>
      <div class="block text-center" m="t-4">
        <el-carousel trigger="click" height="150px" v-if="showPicture">
          <el-carousel-item v-for="item in 4" :key="item">
            <img
              style="width: 100%; height: 100%"
              src="https://img2.baidu.com/it/u=1337068678,3064275007&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=750"
              alt="示例图片"
            />
          </el-carousel-item>
        </el-carousel>
        <div v-show="!showPicture">
          <video
            controls
            id="videoElement"
            ref="videoElement"
            style="width: 300px; height: 200px"
          ></video>
          <!-- 添加一个按钮来启动播放 -->
          <!-- <el-button type="primary" @click="handlePlayButtonClick"
            >开始播放视频</el-button
          > -->
        </div>
        <el-button
          type="primary"
          style="margin-top: 5px"
          @click="() => (showPicture = true)"
          >图片</el-button
        >
        <el-button
          type="primary"
          style="margin-top: 5px"
          @click="() => (showPicture = false)"
          >视频</el-button
        >
      </div>
      <div id="popup-content"></div>
    </div>
    <button id="locate-to-chengdu" @click="locateToChengdu">定位到成都</button>
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
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Circle as CircleStyle } from "ol/style";
import VectorLayer from "ol/layer/Vector";
import { onMounted, ref, nextTick } from "vue";
import { areaGeo } from "./geoJson/china.js";
import Point from "ol/geom/Point";
import Feature from "ol/Feature";
import {
  defaults as defaultInteractions,
  DragRotateAndZoom,
} from "ol/interaction";
import { Overlay } from "ol";
import { fromLonLat } from "ol/proj";
import Icon from "ol/style/Icon";
import Cluster from "ol/source/Cluster";
import Text from "ol/style/Text";
import { Select } from "ol/interaction";
import { Draw } from "ol/interaction";
import flvjs from "flv.js";

let markerSource;
let locateToChengdu;
let selectInteraction;
let drawInteraction;
let onSelectionChange;
let offSwitch;
let selectSwitch = ref(false);
let showPicture = ref(true);
const selectionType = ref("");
const videoElement = ref(null);
let flvPlayer = null;
// 用户交互事件中调用 play()
// function handlePlayButtonClick() {
//   if (flvPlayer) {
//     flvPlayer.play().catch((error) => {
//       console.error("Playback failed:", error);
//       if (error.name === "NotAllowedError") {
//         console.warn("User must interact with page before playback can start.");
//       }
//     });
//   }
// }
function initFlvPlayer() {
  if (flvjs.isSupported()) {
    console.log("init");
    console.log("videoElement:", videoElement.value);
    // 假设有一个有效的 FLV 流 URL
    // 使用相对路径，假设 .flv 文件位于 img 目录下
    // 使用绝对路径，假设 .flv 文件位于 public/img 目录下
    const flvStreamUrl = "/img/maps.flv"; // 打印完整 URL 用于调试
    console.log("Using FLV stream URL:", flvStreamUrl); // 打印完整 URL 用于调试
    flvPlayer = flvjs.createPlayer({
      type: "flv",
      url: flvStreamUrl,
    });
    console.log("flvPlayer:", flvPlayer);
    // 添加事件监听器来捕获错误和其他重要事件
    flvPlayer.on(flvjs.Events.ERROR, function (code, msg) {
      console.error("FLV Player Error:", code, msg);
    });
    flvPlayer.on(flvjs.Events.LOADING_COMPLETE, function () {
      console.log("FLV Player Loading Complete");
    });
    flvPlayer.on(flvjs.Events.PLAYING, function () {
      console.log("FLV Player Playing");
    });
    try {
      flvPlayer.attachMediaElement(videoElement.value);
      flvPlayer.load();
    } catch (error) {
      console.error("Failed to attach media element or load player:", error);
    }
  } else {
    console.warn("FLV.js is not supported in this browser.");
  }
}
onMounted(() => {
  nextTick(() => {
    if (videoElement.value) {
      console.log("actions");
      initFlvPlayer();
    }
  });
  initMap();
  const coordinatedata = [
    [11585424.079541972, 3590576.879235157],
    [11815902.844893824, 3621620.1690649893],
    [12111122.86177541, 4071747.8715975597],
    [12654949.208662543, 4136421.352602793],
    [12758535.25852801, 4578788.232677905],
    [13045986.327596923, 4400289.316156369],
    [12890607.371343456, 3882901.1128522437],
    [12577259.730535809, 3298252.4087765645],
    [12393394.711332364, 3600924.6030381834],
  ];
  for (var i = 0; i < coordinatedata.length; i++) {
    const pointFeature = new Feature({
      geometry: new Point(coordinatedata[i]),
    });
    markerSource.addFeature(pointFeature);
  }
});
const initMap = () => {
  const vectorSource = new VectorSource({
    features: new GeoJSON().readFeatures(areaGeo, {
      dataProjection: "EPSG:4326",
      featureProjection: "EPSG:3857",
    }),
  });
  const style = new Style({
    stroke: new Stroke({
      color: "#319FD3",
      width: 1,
    }),
  });
  const vectorLayer = new VectorLayer({
    source: vectorSource,
    style: style,
  });
  const container = document.getElementById("popup");
  const closer = document.getElementById("popup-closer");
  const content = document.getElementById("popup-content");
  const overlay = new Overlay({
    element: container,
    autoPan: true,
    positioning: "bottom-center",
    stopEvent: true,
    autoPanAnimation: {
      duration: 250,
    },
  });
  closer.onclick = () => {
    overlay.setPosition(undefined);
    container.classList.remove("ol-popup-visible");
    closer.blur();
    return false;
  };
  markerSource = new VectorSource();
  const clusterSource = new Cluster({
    distance: 40,
    source: markerSource,
  });
  function clusterStyleFunction(feature) {
    const size = feature.get("features").length;
    let style;
    if (size === 1) {
      style = new Style({
        image: new Icon({
          anchor: [0.5, 1],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
          src: "https://img2.baidu.com/it/u=1337068678,3064275007&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=750",
          scale: 0.03,
        }),
      });
    } else {
      style = new Style({
        image: new CircleStyle({
          radius: 20,
          fill: new Fill({
            color: "#ffcc33",
          }),
          stroke: new Stroke({
            color: "#fff",
            width: 2,
          }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: "#333", // 文本颜色
          }),
          font: 'bold 14px "Arial"',
          textAlign: "center",
          textBaseline: "middle",
        }),
      });
    }
    return style;
  }
  const markerLayer = new VectorLayer({
    source: clusterSource,
    style: clusterStyleFunction,
  });
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
      vectorLayer,
      markerLayer,
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
    overlays: [overlay],
  });
  let selectedMarker = null;
  map.on("singleclick", (evt) => {
    if (!selectSwitch.value) {
      const coordinate = evt.coordinate;
      const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
        return feature;
      });
      if (feature) {
        const geometry = feature.getGeometry();
        const coord = geometry.getCoordinates();
        content.innerHTML = `<p>你点击的位置是： ${coord}</p>`;
        overlay.setPosition(coord);
        container.classList.add("ol-popup-visible");
        selectedMarker = feature;
      } else {
        overlay.setPosition(undefined);
        container.classList.remove("ol-popup-visible");
        const pointFeature = new Feature({
          geometry: new Point(coordinate),
        });
        markerSource.addFeature(pointFeature);
        if (!selectedMarker) {
          overlay.setPosition(undefined);
          container.classList.remove("ol-popup-visible");
        }
      }
    }
  });
  locateToChengdu = () => {
    const chengduLonLat = [104.065735, 30.659462];
    const chengduCoordinate = fromLonLat(chengduLonLat);
    map.getView().animate({
      center: chengduCoordinate,
      zoom: 12,
      duration: 2000,
    });
  };
  function singleClick(mapBrowserEvent) {
    return mapBrowserEvent.type === "click";
  }
  function pointSelection() {
    select("point");
  }
  function boxSelection() {
    select("Square");
  }
  function circleSelection() {
    select("Circle");
  }
  function polygonSelection() {
    select("Polygon");
  }
  function lineSelection() {
    select("LineString");
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
        if (type === "box") {
          const coordinates = geometry.getCoordinates();
          if (coordinates.length === 2) {
            const start = coordinates[0];
            const end = coordinates[1];
            const rectangleCoords = [
              [start[0], start[1]],
              [end[0], start[1]],
              [end[0], end[1]],
              [start[0], end[1]],
              [start[0], start[1]],
            ];
            const polygonFeature = new Feature({
              geometry: new Polygon([rectangleCoords]),
            });
            drawSource.addFeature(polygonFeature);
            drawSource.removeFeature(event.feature);
          }
          map.removeInteraction(drawInteraction);
          drawInteraction = null;
        }
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
#locate-to-chengdu {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  padding: 5px 10px;
  background-color: #fff;
  border: 1px solid #ccc;
  cursor: pointer;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
.ol-popup {
  position: absolute;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #cccccc;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  visibility: hidden;
  width: auto;
}
.ol-popup:after,
.ol-popup:before {
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
  left: 50%;
  transform: translateX(-50%);
  margin-left: -10px;
}
.ol-popup:before {
  border-top-color: #cccccc;
  border-width: 11px;
  left: 50%;
  transform: translateX(-50%);
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
  visibility: visible;
}
.demonstration {
  color: var(--el-text-color-secondary);
}
.el-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 150px;
  margin: 0;
  text-align: center;
}
.el-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}
.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
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
