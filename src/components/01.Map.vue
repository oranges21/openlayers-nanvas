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
onMounted(() => {
  initMap();
});
const initMap = () => {
  const map = document.getElementById("map");
  new Map({
    layers: [
      new TileLayer({
        source: new OSM(),
      }),
    ],
    target: map,
    view: new View({
      center: [0, 0],
      zoom: 2,
    }),
  });
  console.log("init finished");
  console.log(map);
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 400px;
  /* background-color: aqua; */
}
</style>
