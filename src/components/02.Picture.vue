<template>
  <div id="mapElement" class="map"></div>
</template>

<script setup lang="jsx">
// 导入 OpenLayers 的 CSS 样式文件，确保地图样式正确应用
import "ol/ol.css";
// 导入 ImageLayer 类，用于显示单个图像作为图层
import ImageLayer from "ol/layer/Image";
// 导入 Map 类，这是 OpenLayers 中用于创建地图实例的核心类
import Map from "ol/Map";
// 导入 Projection 类，用于定义自定义投影
import { Projection } from "ol/proj";
// 导入 ImageStatic 类，这是一个静态图像源，适用于加载单张图片作为背景
import Static from "ol/source/ImageStatic";
// 导入 View 类，用于定义地图的视图参数（如中心点、缩放级别等）
import View from "ol/View";
// 导入 getCenter 函数，用于从一个范围（extent）中获取中心点
import { getCenter } from "ol/extent";
import { onMounted, ref } from "vue";

let extent = [0, 0, 338, 600];
let projection = new Projection({
  code: "xkcd-image",
  units: "pixels",
  extent: extent,
});

let map = ref(null);

onMounted(() => {
  initMap();
});

const initMap = () => {
  const mapElement = document.getElementById("mapElement");
  if (mapElement) {
    map.value = new Map({
      layers: [
        new ImageLayer({
          source: new Static({
            attributions: '<a href="http://xkcd.com/license.html">xkcd</a>',
            url: "https://img2.baidu.com/it/u=1337068678,3064275007&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=750", // 修复 URL 拼写错误
            projection: projection,
            imageExtent: extent,
          }),
        }),
      ],
      target: mapElement,
      view: new View({
        projection: projection,
        center: getCenter(extent),
        zoom: 1,
        maxZoom: 4,
        minZoom: 1,
      }),
    });
  } else {
    console.error("Map element not found.");
  }
};
</script>

<style scoped>
.map {
  width: 100%;
  height: 400px;
}
</style>
