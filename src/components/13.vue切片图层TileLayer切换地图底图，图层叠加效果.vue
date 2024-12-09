<template>
  <div id="app">
    <!-- 地图容器 -->
    <div id="map" class="map"></div>
    <!-- 切换图层 -->
    <div id="mouse-position">
      <el-checkbox-group v-model="checkList">
        <el-checkbox
          label="天地图影像图"
          @change="toggleLayer('img')"
        ></el-checkbox>
        <el-checkbox
          label="天地图影像标注"
          @change="toggleLayer('cia')"
        ></el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script setup>
import "ol/ol.css";
import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { fromLonLat } from "ol/proj";
import { onMounted, ref } from "vue";

let map;
const checkList = ref([]);
const layers = {};

// 初始化地图
const initMap = () => {
  const target = "map";
  const baseLayer = new TileLayer({
    source: new XYZ({
      url: "http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreet/MapServer/tile/{z}/{y}/{x}",
    }),
  });

  // 定义天地图影像图层
  layers.img = new TileLayer({
    name: "天地图影像图层",
    visible: false,
    source: new XYZ({
      url: "http://t0.tianditu.gov.cn/img_w/wmts?service=WMTS&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&tk=2db74745ac4cdf8487632ded903aca62",
      wrapX: false,
    }),
  });

  // 定义天地图影像注记图层
  layers.cia = new TileLayer({
    name: "天地图影像注记图层",
    visible: false,
    source: new XYZ({
      url: "http://t0.tianditu.gov.cn/cia_w/wmts?service=WMTS&request=GetTile&version=1.0.0&LAYER=cia&tileMatrixSet=w&TileMatrix={z}&TileRow={y}&TileCol={x}&format=tiles&tk=2db74745ac4cdf8487632ded903aca62",
      wrapX: false,
    }),
  });

  const view = new View({
    center: fromLonLat([104.912777, 34.730746]),
    zoom: 4.5,
  });

  map = new Map({
    target: target,
    layers: [baseLayer],
    view: view,
  });
};

// 切换图层显示状态
const toggleLayer = (layerKey) => {
  if (!layers[layerKey]) return;

  const layer = layers[layerKey];
  const isChecked = checkList.value.includes(
    `天地图${layerKey === "img" ? "影像图" : "影像标注"}`
  );

  if (isChecked && !map.getLayers().getArray().includes(layer)) {
    map.addLayer(layer);
    layer.setVisible(true);
  } else if (!isChecked && map.getLayers().getArray().includes(layer)) {
    layer.setVisible(false);
    // 可选择是否移除图层，取决于您的需求
    map.removeLayer(layer);
  }
};

onMounted(() => {
  initMap();
});
</script>

<style scoped lang="scss">
#app {
  height: 100vh; /* 确保应用占据整个视口高度 */
}

.map {
  width: 100%;
  height: 100%;
}

#mouse-position {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 10px;
  z-index: 1000;
  .el-checkbox {
    color: white;
  }
}
</style>
