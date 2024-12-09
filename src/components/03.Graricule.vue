<template>
  <!-- OSM资源包有问题无法加载出来地图 -->
  <div id="map" class="map"></div>
</template>

<script setup>
import "ol/ol.css";
import Map from "ol/Map";
import OSM from "ol/source/OSM";
import TileLayer from "ol/layer/Tile";
import View from "ol/View";
import { onMounted, ref } from "vue";
// 经纬网
import Graticule from "ol/layer/Graticule";
import Stroke from "ol/style/Stroke";

onMounted(() => {
  initMap();
});

const initMap = () => {
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

  // 创建地图实例，并将 Graticule 添加为图层之一
  new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
      graticule, // 将 Graticule 添加到图层列表中
      vector,
    ],
    target: "map",
    view: new View({
      center: [0, 0],
      zoom: 2,
    }),
  });

  console.log("init finished");
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 100vh;
}
</style>
