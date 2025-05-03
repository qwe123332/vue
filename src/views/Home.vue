<template>
  <div class="home">
    <!-- 轮播图 -->
    <el-carousel height="400px" class="banner">
      <el-carousel-item v-for="banner in banners" :key="banner.id">
        <div class="banner-content" @click="handleBannerClick(banner)">
          <el-image :src="banner.image" fit="cover" class="banner-image" />
          <div class="banner-info">
            <h2>{{ banner.title }}</h2>
            <p>{{ banner.description }}</p>
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>

    <!-- 主要内容 -->
    <div class="content-container">
      <el-row :gutter="20">
        <!-- 主内容区 -->
        <el-col :xs="24" :sm="24" :md="16">
          <!-- 推荐美食 -->
          <el-card class="section-card">
            <template #header>
              <div class="section-header">
                <h3>推荐美食</h3>
                <el-button link @click="goToPosts">
                  查看更多 <el-icon><arrow-right /></el-icon>
                </el-button>
              </div>
            </template>
            <div class="post-grid">
              <div
                v-for="post in recommendedPosts"
                :key="post.id"
                class="post-item"
                @click="goToPostDetail(post.id)"
              >
                <el-image
                  :src="
                    post.images && post.images.length > 0 ? post.images[0] : ''
                  "
                  lazy
                  :preview-src-list="post.images"
                  fit="cover"
                  class="post-image"
                  @click.stop
                />

                <div class="post-info">
                  <h4>{{ post.title }}</h4>
                  <div class="post-meta">
                    <div class="author">
                      <el-avatar :size="24" :src="post.avatar" />
                      <span>{{ post?.username || "未知用户" }}</span>
                    </div>
                    <div class="stats">
                      <span
                        ><el-icon>
                          <star />
                        </el-icon>
                        {{ post.likeCount }}</span
                      >
                      <span
                        ><el-icon><chat-dot-round /></el-icon>
                        {{ post.commentCount }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>

          <!-- 热门餐厅 -->
          <el-card class="section-card">
            <template #header>
              <div class="section-header">
                <h3>热门餐厅</h3>
                <el-button link @click="goToRestaurants">
                  查看更多 <el-icon><arrow-right /></el-icon>
                </el-button>
              </div>
            </template>
            <div class="restaurant-list">
              <div
                v-for="restaurant in hotRestaurants"
                :key="restaurant.id"
                class="restaurant-item"
                @click="goToRestaurantDetail(restaurant.id)"
              >
                <el-image
                  :src="restaurant.image"
                  fit="cover"
                  class="restaurant-image"
                />
                <div class="restaurant-info">
                  <h4>{{ restaurant.name }}</h4>
                  <div class="restaurant-rating">
                    <el-rate
                      v-model="restaurant.rating"
                      disabled
                      text-color="#ff9900"
                    />
                    <span>{{ restaurant.rating }}分</span>
                  </div>
                  <p>{{ restaurant.address }}</p>
                  <div class="tags">
                    <el-tag
                      v-for="tag in restaurant.tags"
                      :key="tag"
                      size="small"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 侧边栏 -->
        <el-col :xs="24" :sm="24" :md="8">
          <div class="sidebar-section">
            <el-card class="restaurant-card">
              <template #header>
                <div class="section-header">
                  <h3>热门餐厅</h3>
                  <el-icon><hot-water /></el-icon>
                </div>
              </template>
              <div
                v-for="restaurant in hotRestaurants"
                :key="restaurant.id"
                class="restaurant-item"
                @click="goToRestaurantDetail(restaurant.id)"
              >
                <el-image
                  :src="restaurant.thumbnail"
                  class="restaurant-thumb"
                  fit="cover"
                />
                <div class="restaurant-info">
                  <h4>{{ restaurant.name }}</h4>
                  <div class="rating">
                    <el-rate
                      v-model="restaurant.rating"
                      disabled
                      show-score
                      text-color="#ff9900"
                    />
                  </div>
                  <div class="tags">
                    <el-tag
                      v-for="tag in restaurant.tags"
                      :key="tag"
                      size="small"
                      type="info"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-card>

            <el-card class="activity-card">
              <template #header>
                <div class="section-header">
                  <h3>近期活动</h3>
                  <el-icon><alarm-clock /></el-icon>
                </div>
              </template>
              <el-timeline>
                <el-timeline-item
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  :timestamp="activity.formattedTime"
                  placement="top"
                >
                  <el-card shadow="hover">
                    <h4>{{ activity.title }}</h4>
                    <div class="activity-status">
                      <el-tag :type="activity.status.type">
                        {{ activity.status.link }}
                      </el-tag>
                    </div>
                    <p class="activity-location">
                      <el-icon>
                        <location />
                      </el-icon>
                      {{ activity.location }}
                    </p>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </div>

          <!-- 热门标签 -->
          <el-card class="section-card">
            <template #header>
              <div class="section-header">
                <h3>热门标签</h3>
              </div>
            </template>
            <div class="tag-cloud">
              <el-tag
                v-for="tag in hotTags"
                :key="tag.name"
                :type="tag.type"
                class="tag-item"
                @click="handleTagClick(tag)"
              >
                {{ tag.name }}
                <span class="tag-count">({{ tag.count }})</span>
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";
import {
  ArrowRight,
  Star,
  ChatDotRound,
  HotWater,
  AlarmClock,
  Location,
} from "@element-plus/icons-vue";
import api from "@/services/api";

const AVATAR_BASE_URL = "http://192.168.146.133:888/avatars/";
// 使用指数退避策略的初始延迟时间
const INITIAL_RETRY_DELAY = 2000;
const MAX_RETRIES = 1;

export default {
  name: "Home",
  components: {
    ArrowRight,
    Star,
    ChatDotRound,
    HotWater,
    AlarmClock,
    Location,
  },
  setup() {
    const router = useRouter();
    // 定义响应式数据
    const banners = ref([]);
    const recommendedPosts = ref([]);
    const hotRestaurants = ref([]);
    const recentActivities = ref([]);
    const hotTags = ref([]);

    const loading = ref({
      banners: true,
      posts: true,
      restaurants: true,
      activities: true,
      tags: true,
    });

    const errors = ref({
      banners: null,
      posts: null,
      restaurants: null,
      activities: null,
      tags: null,
    });

    // 状态映射，便于统一更新状态
    const stateMapping = {
      posts: recommendedPosts,
      restaurants: hotRestaurants,
      activities: recentActivities,
      banners: banners,
      tags: hotTags,
    };

    // 获取认证头
    const getAuthHeader = () => {
      const token = localStorage.getItem("token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // 指数退避重试函数
    const retryDelay = (attempt) => INITIAL_RETRY_DELAY * Math.pow(2, attempt);

    // 通用数据获取函数
    const fetchData = async (endpoint, stateKey, params = {}, options = {}) => {
      const {
        transformer = (data) => data,
        onSuccess = () => {},
        useCustomUrl = false,
      } = options;
      loading.value[stateKey] = true;
      errors.value[stateKey] = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const url = useCustomUrl ? endpoint : `/${endpoint}`;
          const  data  = await api.get(url, {
            params,
            headers: getAuthHeader(),
          });
          let transformedData = transformer(data);
          // 对近期活动数据预处理状态和格式化时间，减少模板渲染时的计算
          if (stateKey === "activities") {
            transformedData = transformedData.map((activity) => {
              const now = dayjs();
              const start = dayjs(activity.startTime);
              const end = dayjs(activity.endTime);
              let status = {};
              if (now.isBefore(start)) {
                status = { type: "info", link: "未开始" };
              } else if (now.isAfter(end)) {
                status = { type: "", link: "已结束" };
              } else {
                status = { type: "success", link: "进行中" };
              }
              return {
                ...activity,
                status,
                formattedTime: dayjs(activity.startTime).format("HH:mm"),
              };
            });
          }
          stateMapping[stateKey].value = transformedData;
          onSuccess(transformedData);
          break;
        } catch (error) {
          console.error(
            `Error fetching ${stateKey} on attempt ${attempt + 1}:`,
            error
          );
          if (attempt === MAX_RETRIES) {
            errors.value[stateKey] = `${stateKey}加载失败，请稍后重试`;
            ElMessage.error(errors.value[stateKey]);
          } else {
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay(attempt))
            );
          }
        }
      }
      loading.value[stateKey] = false;
    };

    //数据获取接口
    const fetchBanners = () => fetchData("banners", "banners");
    const fetchRecommendedPosts = () =>
      fetchData(
        "posts/recommended",
        "posts",
        { size: 6 },
        {
          transformer: (data) =>
            data.map((post) => ({
              ...post,
              avatar: post.userAvatar
                ? `${AVATAR_BASE_URL}${post.userAvatar}`
                : null,
            })),
          onSuccess: (data) => {
            console.log("recommendedPosts:", data);
          },
        }
      );
    const fetchHotRestaurants = () =>
      fetchData("restaurants/hot", "restaurants", { size: 4 });
    const fetchRecentActivities = () =>
      fetchData(
        "activities/recent",
        "activities",
        { size: 5 },
        {
          useCustomUrl: true,
        }
      );
    const fetchHotTags = () =>
      fetchData(
        "tags/hot",
        "tags",
        {},
        {
          transformer: (data) =>
            data.map((tag) => ({
              ...tag,
              type: getRandomTagType(),
            })),
        }
      );

    // 路由跳转函数，避免模板内联函数
    const goToPosts = () => {
      event.target.blur();
      router.push("/posts");
    };
    const goToPostDetail = (id) => {
      event.target.blur();
      router.push(`/posts/${id}`);
    };
    const goToRestaurants = () => {
      router.push("/restaurants");
    };
    const goToRestaurantDetail = (id) => {
      router.push(`/restaurants/${id}`);
    };

    // 事件处理函数
    const handleBannerClick = (banner) => {
      if (banner.link) {
        router.push(banner.link);
      }
    };
    const handleTagClick = (tag) => {
      router.push({ path: "/search", query: { tag: tag.name } });
    };

    // 获取随机标签类型
    const getRandomTagType = () => {
      const types = ["", "success", "warning", "info"];
      return types[Math.floor(Math.random() * types.length)];
    };

    // 日期格式化函数（仅用于其他场景）
    const formatDate = (date) => dayjs(date).format("MM-DD");

    // 加载所有数据
    const fetchAllData = () => {
      return Promise.all([
        // fetchBanners(),
        fetchRecommendedPosts(),
        // fetchHotRestaurants(),
        // fetchRecentActivities(),
        // fetchHotTags()
      ]).catch(() => {
        ElMessage.error("部分内容加载失败，请检查网络连接");
      });
    };

    // 网络恢复事件监听器
    const handleOnline = () => {
      if (Object.values(errors.value).some(Boolean)) {
        ElMessage.info("网络已恢复，正在重试...");
        fetchAllData();
      }
    };

    onMounted(() => {
      fetchAllData();
      window.addEventListener("online", handleOnline);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("online", handleOnline);
    });

    return {
      banners,
      recommendedPosts,
      hotRestaurants,
      recentActivities,
      hotTags,
      handleBannerClick,
      handleTagClick,
      getRandomTagType,
      formatDate,
      goToPosts,
      goToPostDetail,
      goToRestaurants,
      goToRestaurantDetail,
      loading,
      errors,
    };
  },
};
</script>

<style scoped>
/* 保持原有样式不变 */
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.banner {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.banner-content {
  position: relative;
  height: 100%;
  cursor: pointer;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.banner-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: #fff;
}

.banner-info h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.banner-info p {
  margin: 0;
  font-size: 16px;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  gap: 30px;
}

.section-card {
  margin-bottom: 20px;
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.section-card:hover {
  transform: translateY(-5px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--el-color-primary);
}

.post-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.post-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.post-item:hover {
  transform: translateY(-5px);
}

.post-image {
  width: 100%;
  height: 200px;
  border-radius: 8px;
}

.post-info {
  padding: 10px 0;
}

.post-info h4 {
  margin: 0 0 8px;
  font-size: 16px;
}

.post-info p {
  margin: 0 0 8px;
  color: #666;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.author {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats {
  display: flex;
  gap: 15px;
  color: #666;
}

.restaurant-list {
  display: grid;
  gap: 15px;
}

.restaurant-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.restaurant-item:hover {
  background-color: #f5f7fa;
}

.restaurant-image {
  width: 120px;
  height: 80px;
  border-radius: 4px;
}

.restaurant-info {
  flex: 1;
}

.restaurant-info h4 {
  margin: 0 0 8px;
  font-size: 16px;
}

.restaurant-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.restaurant-info p {
  margin: 0 0 8px;
  color: #666;
  font-size: 14px;
}

.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sidebar-section {
  margin-bottom: 20px;
}

.restaurant-card,
.activity-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
  margin-bottom: 20px;
}

.restaurant-card:hover,
.activity-card:hover {
  transform: translateY(-5px);
}

.restaurant-thumb {
  width: 120px;
  height: 80px;
  border-radius: 4px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.activity-location {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.activity-status {
  margin-bottom: 8px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  cursor: pointer;
}

.tag-count {
  margin-left: 4px;
  font-size: 12px;
  opacity: 0.8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .post-grid {
    grid-template-columns: 1fr;
  }

  .restaurant-item,
  .post-item {
    flex-direction: column;
  }

  .restaurant-image,
  .restaurant-thumb {
    width: 100%;
    height: 140px;
  }
}
</style>
