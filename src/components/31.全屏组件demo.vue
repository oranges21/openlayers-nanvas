<template>
  <div class="fullscreen-container">
    <button @click="toggleFullScreen">Toggle Fullscreen</button>
    <el-table
      :data="tableData"
      style="width: 100%; height: 100%"
      id="app"
      ref="tableElement"
    >
      <!-- 表格列定义 -->
      <el-table-column prop="date" label="Date" width="180"></el-table-column>
      <el-table-column prop="name" label="Name" width="180"></el-table-column>
      <el-table-column prop="address" label="Address"></el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tableData: [
        {
          date: "2016-05-03",
          name: "Tom",
          address: "No. 189, Grove St, Los Angeles",
        },
        {
          date: "2016-05-02",
          name: "John",
          address: "No. 189, Grove St, Los Angeles",
        },
        {
          date: "2016-05-04",
          name: "Micheal",
          address: "No. 189, Grove St, Los Angeles",
        },
        {
          date: "2016-05-01",
          name: "Jerry",
          address: "No. 189, Grove St, Los Angeles",
        },
      ],
    };
  },
  methods: {
    toggleFullScreen() {
      // 获取表格元素，这里使用了 id 选择器来定位元素
      // const elem = document.getElementById("app");
      const elem = this.$refs.tableElement?.$el || this.$refs.tableElement; // 获取实际的 DOM 元素

      // 检查当前是否有元素处于全屏状态
      if (!document.fullscreenElement) {
        console.log("document.fullscreenElement", document.fullscreenElement); // 调试信息：当前没有元素处于全屏状态
        console.log("elem", elem); // 调试信息：即将尝试进入全屏模式的元素

        // 尝试请求全屏，根据不同的浏览器前缀调用相应的方法
        if (elem.requestFullscreen) {
          // 标准方法
          elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          // Firefox 浏览器的非标准方法
          // Firefox
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          // Chrome, Safari 和 Opera 的非标准方法
          // Chrome, Safari and Opera
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          // IE/Edge 的非标准方法
          // IE/Edge
          elem.msRequestFullscreen();
        }
      } else {
        // 如果已经有元素处于全屏状态，则退出全屏
        if (document.exitFullscreen) {
          // 标准方法
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          // Firefox 浏览器的非标准方法
          // Firefox
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          // Chrome, Safari 和 Opera 的非标准方法
          // Chrome, Safari and Opera
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          // IE/Edge 的非标准方法
          // IE/Edge
          document.msExitFullscreen();
        }
      }
    },
  },
};
</script>

<style scoped>
.fullscreen-container {
  /* position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0; */
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}
</style>
