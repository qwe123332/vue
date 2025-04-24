<template>
  <div class="app">
    <the-navbar />
    <div class="main-content">
        <router-view />
    </div>
  </div>
</template>

<script>
import TheNavbar from "@/components/TheNavbar.vue";

export default {
  name: "App",
  components: {
    TheNavbar,
  },
};
</script>

<style>
.app {
  min-height: 100vh;
  
}
/* 全局样式文件，例如 src/assets/styles.css */

.main-content {
  margin-top: 60px;
  min-height: calc(100vh - 60px);
}
</style>
