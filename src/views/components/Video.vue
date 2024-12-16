<template>
  <div class="video-container">
    <h1>Vue 3 + Video.js 播放器示例</h1>
    <!-- Video.js 播放器容器 -->
    <video-js
      ref="videoPlayer"
      class="vjs-default-skin"
      controls
      preload="auto"
      width="640"
      height="268"
    >
      <source :src="videoSrc" type="video/mp4" />
      <p class="vjs-no-js">
        为了观看此视频，请启用 JavaScript 并考虑升级到支持 HTML5 视频的浏览器。
      </p>
    </video-js>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import videojs from "video.js";
import "video.js/dist/video-js.css"; // 引入 Video.js 的 CSS

// 定义 props 或者直接定义变量
const props = defineProps({
  videoSrc: {
    type: String,
    required: true,
  },
});

// 使用 ref 获取播放器 DOM 元素
const videoPlayer = ref(null);
let player = null;

onMounted(() => {
  // 初始化 Video.js 播放器
  player = videojs(videoPlayer.value);

  // 监听播放器事件
  player.on("play", () => {
    console.log("视频开始播放");
  });

  player.on("pause", () => {
    console.log("视频暂停");
  });
});

onUnmounted(() => {
  if (player) {
    // 销毁播放器以释放资源
    player.dispose();
    player = null;
  }
});
</script>

<style scoped>
.video-container {
  text-align: center;
}
</style>
