<template>
  <!-- 无KML文件，无法展示效果 -->
  <div id="app">
    <!-- 地图容器 -->
    <div id="map" class="map"></div>
    <!-- 控制热力图参数的输入控件 -->
    <input id="radius" type="range" min="1" max="50" step="1" value="5" />
    <input id="blur" type="range" min="1" max="50" step="1" value="15" />
  </div>
</template>

<script setup>
import "ol/ol.css";
import Map from "ol/Map";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile"; // 使用 TileLayer 而不是 Tile
import View from "ol/View";
import { onMounted, ref, watch } from "vue";
// 经纬网
import Graticule from "ol/layer/Graticule";
import Stroke from "ol/style/Stroke";
// 热力图
import HeatmapLayer from "ol/layer/Heatmap";
import VectorSource from "ol/source/Vector";
import KML from "ol/format/KML"; // 导入 KML 解析器
//WebGL
import WebGLPointsLayer from "ol/layer/WebGLPoints";

let map;
let heatmapLayer;

onMounted(() => {
  initMap();
});
const refreshLayer = () => {
  var previousLayer = pointsLayer;
  pointsLayer = new WebGLPointsLayer({
    source: VectorSource,
    style: newStyle,
    disableHitDetection: true,
  });
  map.addLayer(pointsLayer);
  if (previousLayer) {
    map.removeLayer(previousLayer);
    previousLayer.dispose();
  }
  literalStyle = newStyle;
};
const initMap = () => {
  const graticule = new Graticule({
    strokeStyle: new Stroke({
      color: "rgba(255,120,0,0.9)",
      width: 2,
      lineDash: [0.5, 4],
    }),
    showLabels: true,
    wrapX: false,
  });

  // 创建热力图层
  heatmapLayer = new HeatmapLayer({
    source: new VectorSource({
      //无文件
      url: "data/kml/2012_Earthquakes_Mag5.kml",
      format: new KML({
        extractStyles: false,
      }),
    }),
    blur: parseInt(document.getElementById("blur").value, 10),
    radius: parseInt(document.getElementById("radius").value, 10),
    weight: function (feature) {
      var name = feature.get("name");
      if (name) {
        var magnitude = parseFloat(name.substr(2));
        return magnitude - 5;
      }
      return 0;
    },
  });

  // 创建地图实例，并将 Graticule 和热力图层添加为图层之一
  map = new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      graticule,
      heatmapLayer,
      refreshLayer,
    ],
    target: "map",
    view: new View({
      center: [0, 0],
      zoom: 2,
    }),
  });

  // 监听输入控件变化并更新热力图层属性
  watchRadiusAndBlur();
};

const watchRadiusAndBlur = () => {
  const radiusInput = document.getElementById("radius");
  const blurInput = document.getElementById("blur");

  function updateHeatmap() {
    heatmapLayer.setBlur(parseInt(blurInput.value, 10));
    heatmapLayer.setRadius(parseInt(radiusInput.value, 10));
  }

  radiusInput.addEventListener("input", updateHeatmap);
  blurInput.addEventListener("input", updateHeatmap);

  // 初始化时也调用一次
  updateHeatmap();
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 100vh;
}
</style>
