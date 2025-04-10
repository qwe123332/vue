<template>
  <div class="restaurant-card" @click="goToDetail">
    <el-card>
      <div class="restaurant-content">
        <div class="restaurant-image">
          <img :src="restaurant.image" :alt="restaurant.name">
        </div>
        <div class="restaurant-info">
          <h3 class="restaurant-name">{{ restaurant.name }}</h3>
          <div class="restaurant-rating">
            <el-rate
              v-model="restaurant.rating"
              disabled
              text-color="#ff9900"
              score-template="{value}"
            />
            <span class="rating-score">{{ restaurant.rating }}分</span>
          </div>
          <p class="restaurant-address">
            <el-icon><Location /></el-icon>
            {{ restaurant.address }}
          </p>
          <div class="restaurant-tags">
            <el-tag v-for="tag in restaurant.tags" :key="tag" size="small">
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { Location } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

export default {
  name: 'RestaurantCard',
  components: { Location },
  props: {
    restaurant: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const router = useRouter()

    const goToDetail = () => {
      router.push(`/restaurants/${props.restaurant.id}`)
    }

    return { goToDetail }
  }
}
</script>

<style scoped>
.restaurant-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.restaurant-card:hover {
  transform: translateY(-2px);
}

.restaurant-content {
  display: flex;
  gap: 16px;
}

.restaurant-image {
  width: 120px;
  height: 120px;
  overflow: hidden;
  border-radius: 8px;
}

.restaurant-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.restaurant-info {
  flex: 1;
}

.restaurant-name {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
}

.restaurant-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.rating-score {
  color: #ff9900;
  font-size: 14px;
}

.restaurant-address {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 8px 0;
  color: #666;
  font-size: 14px;
}

.restaurant-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
