<template>
  <div>
    <canvas
      ref="myCanvas"
      @mousedown="startDrag"
      @mousemove="drag"
      @mouseup="stopDrag"
    ></canvas>
    <img
      ref="myImage"
      :src="imageSrc"
      style="display: none"
      @load="onImageLoad"
    />
    <button
      @click="
        drawClippedImage({
          clipStartX,
          clipStartY,
          clipEndX,
          clipEndY,
        })
      "
    >
      裁剪
    </button>
    <button @click="drawRotatedImage(90)">旋转</button>
    <button @click="drawMaskedImage('rgba(0,0,0,0.5)')">遮罩</button>
    <button @click="drawScaledImage(0.5, 0.5)">缩小 50%</button>
    <button @click="resetCanvas">重置</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const myCanvas = ref(null);
const myImage = ref(null);
const imageSrc = ref(
  "https://img2.baidu.com/it/u=1337068678,3064275007&fm=253&fmt=auto&app=120&f=JPEG?w=500&h=750"
);
let ctx = null;
let isDragging = false;
let startX, startY, currentX, currentY;
const clipStartX = ref(0);
const clipStartY = ref(0);
const clipEndX = ref(0);
const clipEndY = ref(0);
// 添加一个新的ref来保存备用画布
const offscreenCanvas = ref(null);
// 在组件的状态中添加一个变量来跟踪当前的旋转角度
const rotationAngle = ref(0);

// 当图像加载时调用
function onImageLoad() {
  // 初始化画布大小
  myCanvas.value.width = myImage.value.width;
  myCanvas.value.height = myImage.value.height;
  // 同时初始化备用画布大小和内容
  if (offscreenCanvas.value) {
    offscreenCanvas.value.width = myCanvas.value.width;
    offscreenCanvas.value.height = myCanvas.value.height;
    const offscreenCtx = offscreenCanvas.value.getContext("2d");
    offscreenCtx.drawImage(myImage.value, 0, 0);
  }
  drawImage();
}

// 组件挂载后初始化画布
onMounted(() => {
  ctx = myCanvas.value.getContext("2d");
  // 初始化备用画布
  offscreenCanvas.value = document.createElement("canvas");
  offscreenCanvas.value.width = myCanvas.value.width;
  offscreenCanvas.value.height = myCanvas.value.height;
  const offscreenCtx = offscreenCanvas.value.getContext("2d");

  // 将原始图像绘制到备用画布
  offscreenCtx.drawImage(myImage.value, 0, 0);
});

// 在这里绘制原始图像
function drawImage() {
  ctx.drawImage(myImage.value, 0, 0);
}
// 开始拖拽
function startDrag(event) {
  // 获取画布的位置信息，方便找相对坐标
  const rect = myCanvas.value.getBoundingClientRect();
  //相当于使用画布的左上角为坐标原点
  startX = event.clientX - rect.left;
  startY = event.clientY - rect.top;
  isDragging = true;
  console.log("startDrag");
  console.log("startX", startX);
  console.log("startY", startY);
  drawImage(); // 清除任何之前的绘图并重绘图像
}

// 拖拽中
function drag(event) {
  // 如果为false则跳出
  if (!isDragging) return;
  //相当于使用画布的左上角为坐标原点
  const rect = myCanvas.value.getBoundingClientRect();
  currentX = event.clientX - rect.left;
  currentY = event.clientY - rect.top;
  console.log("Drag");
  console.log("currentX", currentX);
  console.log("currentY", currentY);
  previewClippedImage({
    clipStartX: startX,
    clipStartY: startY,
    clipEndX: currentX,
    clipEndY: currentY,
  }); // 动态绘制裁剪框
}
function previewClippedImage({ clipStartX, clipStartY, clipEndX, clipEndY }) {
  ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height);

  // 绘制带有模糊效果的原始图像
  ctx.filter = "blur(10px)";
  ctx.drawImage(offscreenCanvas.value, 0, 0);
  ctx.filter = "none";

  // 应用裁剪 - 在非模糊状态下重绘裁剪区域内的图像部分
  ctx.save();
  ctx.beginPath();
  ctx.rect(
    clipStartX,
    clipStartY,
    clipEndX - clipStartX,
    clipEndY - clipStartY
  );
  ctx.clip();
  // 重新绘制裁剪区内的图像，不带模糊效果
  ctx.drawImage(
    offscreenCanvas.value,
    clipStartX,
    clipStartY,
    clipEndX - clipStartX,
    clipEndY - clipStartY,
    clipStartX,
    clipStartY,
    clipEndX - clipStartX,
    clipEndY - clipStartY
  );

  ctx.restore();
  // 添加裁剪框边框
  ctx.strokeStyle = "red"; // 设置边框颜色为红色
  ctx.lineWidth = 2; // 设置边框宽度
  ctx.strokeRect(
    clipStartX,
    clipStartY,
    clipEndX - clipStartX,
    clipEndY - clipStartY
  );
}
// 停止拖拽
function stopDrag() {
  // 如果为false则跳出
  if (!isDragging) return;

  isDragging = false;
  // 保存裁剪区域坐标
  //给按钮传递的参数赋值
  clipStartX.value = startX;
  clipStartY.value = startY;
  clipEndX.value = currentX;
  clipEndY.value = currentY;
  console.log("stopDrag");
  previewClippedImage({
    clipStartX: startX,
    clipStartY: startY,
    clipEndX: currentX,
    clipEndY: currentY,
  });
}
// 裁剪
function drawClippedImage({ clipStartX, clipStartY, clipEndX, clipEndY }) {
  ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height); // 清除画布
  ctx.save();
  ctx.beginPath();
  // 定义裁剪区域
  // ctx.rect(x坐标的值, y坐标的值,宽 , 高);
  ctx.rect(
    clipStartX,
    clipStartY,
    clipEndX - clipStartX,
    clipEndY - clipStartY
  );
  ctx.clip();

  // ctx.drawImage(myImage.value, 0, 0);
  // 在裁剪区域内重绘图像的部分
  ctx.drawImage(
    offscreenCanvas.value,
    clipStartX,
    clipStartY,
    clipEndX - clipStartX,
    clipEndY - clipStartY,
    clipStartX,
    clipStartY,
    clipEndX - clipStartX,
    clipEndY - clipStartY
  );

  ctx.restore(); // 恢复之前保存的绘图状态
}
// 旋转
function drawRotatedImage(angle) {
  rotationAngle.value += angle;
  ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height); // 清除画布
  const x = myCanvas.value.width / 2;
  const y = myCanvas.value.height / 2;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotationAngle.value * Math.PI) / 180); // 将角度转换为弧度
  ctx.drawImage(
    myImage.value,
    -myImage.value.width / 2,
    -myImage.value.height / 2
  );
  ctx.restore();
}

// 遮罩
function drawMaskedImage(maskColor) {
  ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height); // 清除画布
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(myImage.value, 0, 0);

  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = maskColor;
  ctx.fillRect(0, 0, myCanvas.value.width, myCanvas.value.height);

  ctx.globalCompositeOperation = "source-over"; // 恢复默认的合成操作
}

// 缩放
function drawScaledImage(scaleX, scaleY) {
  ctx.clearRect(0, 0, myCanvas.value.width, myCanvas.value.height); // 清除画布
  ctx.save();
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(myImage.value, 0, 0);
  ctx.restore();
}

// 重置画布回到原始图像
function resetCanvas() {
  drawImage();
}
</script>
