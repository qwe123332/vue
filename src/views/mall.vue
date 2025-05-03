<template>
  <div class="mall-container">
    <h1 class="page-title">Discover Products</h1>

    <div class="search-filter-section">
      <div class="search-bar">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search products..."
          @keyup.enter="handleSearch"
        />
        <button @click="handleSearch">Search</button>
      </div>

      <div class="filters">
        <select v-model="selectedCategory" @change="handleFilterChange">
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>

        <select v-model="sortBy" @change="handleFilterChange">
          <option value="newest">New Arrivals</option>
          <option value="price_asc">Price (Low to High)</option>
          <option value="price_desc">Price (High to Low)</option>
          <option value="sales_desc">Best Selling</option>
        </select>
      </div>
    </div>

    <div v-if="initialLoading" class="loading">Loading products...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <template v-else>
      <div v-if="products.length === 0" class="no-results">
        No products found. Try adjusting your search criteria.
      </div>

      <div v-else class="products-grid">
        <div
          v-for="product in products"
          :key="product.productId"
          class="product-card"
          @click="viewProductDetails(product.productId)"
        >
          <div class="image-wrapper">
            <img
              :src="product.imageUrl"
              :alt="product.name"
              class="product-image"
            />
            <div v-if="product.stock <= 0" class="out-of-stock">Out of Stock</div>
          </div>
          <div class="product-info">
            <h2 class="product-title">{{ product.name }}</h2>
            <p class="product-description">{{ product.description }}</p>
            <div class="price-section">
              <span class="current-price">¥{{ product.price }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loadingMore" class="loading-more">
        <i class="fas fa-spinner fa-spin"></i> Loading more products...
      </div>
      <div v-if="!hasMore && products.length > 0" class="no-more">
        No more products available
      </div>
    </template>
  </div>
</template>

<script>
import { throttle } from 'lodash-es';
import api from '@/services/api';

export default {
  name: "Mall",
  data() {
    return {
      products: [],
      initialLoading: true,
      loadingMore: false,
      error: null,
      searchQuery: "",
      selectedCategory: "",
      sortBy: "newest",
      categories: [],
      currentPage: 1,
      totalPages: 1,
      hasMore: true,
    };
  },
  mounted() {
    this.fetchProducts();
    this.fetchCategories();
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeDestroy() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    async fetchProducts() {
      try {
        if (this.currentPage === 1) {
          this.initialLoading = true;
        } else {
          this.loadingMore = true;
        }

        const params = {
          q: this.searchQuery,
          category: this.selectedCategory,
          sort: this.sortBy,
          page: this.currentPage,
          limit: 20
        };

        const items = await api.get('/mall/products', { params }); // ✅ 直接拿到 data

        if (this.currentPage === 1) {
          this.products = items;
        } else {
          this.products = [...this.products, ...items];
        }

        this.hasMore = items.length > 0;
        this.error = null;
      } catch (err) {
        console.error('Error fetching products:', err);
        this.error = err.message || 'Failed to load products. Please try again later.';
        if (this.currentPage > 1) this.currentPage--;
      } finally {
        this.initialLoading = false;
        this.loadingMore = false;
      }
    },


    async fetchCategories() {
      try {
        const rawCategories = await api.get('/categories');
        this.categories = rawCategories.map(category => category.name); // 提取分类名称
      } catch (err) {
        console.error('Error fetching categories:', err);
        this.error = err.message || 'Failed to load categories. Please try again later.';
      }
    },

    handleSearch() {
      this.currentPage = 1;
      this.hasMore = true;
      this.fetchProducts();
    },

    handleFilterChange() {
      this.currentPage = 1;
      this.hasMore = true;
      this.fetchProducts();
    },

    handleScroll: throttle(function() {
      if (this.shouldLoadMore()) {
        this.currentPage++;
        this.fetchProducts();
      }
    }, 300),

    shouldLoadMore() {
      if (this.loadingMore || !this.hasMore) return false;

      const scrollPosition = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      return pageHeight - scrollPosition < 500;
    },

    viewProductDetails(id) {
      this.$router.push(`/products/${id}`);
    }
  }
};
</script>

<style scoped>
.mall-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.page-title {
  color: #2c3e50;
  margin: 20px 0 30px;
  font-size: 2.4rem;
  text-align: center;
}

.search-filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
}

.search-bar {
  flex: 1;
  min-width: 300px;
  display: flex;
}

.search-bar input {
  flex: 1;
  padding: 12px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 25px 0 0 25px;
  font-size: 1rem;
}

.search-bar button {
  padding: 12px 25px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 0 25px 25px 0;
  cursor: pointer;
  transition: background 0.3s;
}

.search-bar button:hover {
  background: #0056b3;
}

.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filters select {
  padding: 10px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background: white;
  font-size: 1rem;
  min-width: 200px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
  padding: 15px 0;
}

.product-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.image-wrapper {
  position: relative;
  height: 280px;
  background: #f8f9fa;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 20px;
  transition: transform 0.3s;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.out-of-stock {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #dc3545;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.product-info {
  padding: 18px;
}

.product-title {
  font-size: 1.1rem;
  margin: 0 0 12px;
  color: #333;
  height: 44px;
  overflow: hidden;
  line-height: 1.3;
}

.product-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 12px;
}

.price-section {
  margin-bottom: 15px;
}

.current-price {
  color: #dc3545;
  font-size: 1.5rem;
  font-weight: 700;
}

.original-price {
  color: #999;
  font-size: 1rem;
  text-decoration: line-through;
  margin-left: 8px;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 18px;
}

.low-stock {
  color: #dc3545;
  font-weight: 600;
}

.product-actions {
  display: flex;
  justify-content: center;
}

.detail-btn {
  width: 100%;
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: bold;
}

.detail-btn:hover {
  background: #0056b3;
}

.loading,
.loading-more {
  text-align: center;
  padding: 30px;
  color: #666;
  font-size: 1.1rem;
}

.error,
.no-results,
.no-more {
  text-align: center;
  padding: 30px;
  color: #dc3545;
  font-size: 1.1rem;
  background: #f8d7da;
  border-radius: 8px;
  margin: 20px 0;
}

.no-results {
  color: #666;
  background: #f8f9fa;
}

.no-more {
  color: #666;
  background: transparent;
  border-top: 1px solid #eee;
  margin-top: 30px;
}

.fa-spinner {
  margin-right: 10px;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: 1fr;
  }

  .filters {
    width: 100%;
  }

  .filters select {
    width: 100%;
  }
}
</style>