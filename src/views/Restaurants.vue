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
            :key="product.id"
            class="product-card"
        >
          <div class="image-wrapper">
            <img
                :src="product.image_url"
                :alt="product.name"
                class="product-image"
            />
            <div v-if="product.stock <= 0" class="out-of-stock">Out of Stock</div>
          </div>
          <div class="product-info">
            <h2 class="product-title">{{ product.name }}</h2>
            <div class="price-section">
              <span class="current-price">¥{{ product.price }}</span>
              <span v-if="product.original_price" class="original-price">
                ¥{{ product.original_price }}
              </span>
            </div>
            <div class="product-meta">
              <span class="sales">Sold: {{ product.sales }}</span>
              <span class="stock" :class="{ 'low-stock': product.stock < 10 }">
                Stock: {{ product.stock > 0 ? product.stock : 'Out of stock' }}
              </span>
            </div>
            <div class="product-actions">
              <button
                  class="buy-btn"
                  :disabled="product.stock <= 0"
                  @click="addToCart(product)"
              >
                {{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}
              </button>
              <button
                  class="detail-btn"
                  @click="viewProductDetails(product.id)"
              >
                Details
              </button>
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

        const response = await fetch(`/api/products?${new URLSearchParams(params)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const { items, meta } = await response.json();

        if (this.currentPage === 1) {
          this.products = items;
          this.categories = meta.categories || [];
        } else {
          this.products = [...this.products, ...items];
        }

        this.totalPages = meta.total_pages;
        this.hasMore = meta.has_more;
        this.error = null;
      } catch (err) {
        console.error('API Error:', err);
        this.error = 'Failed to load products. Please try again later.';
        if (this.currentPage > 1) this.currentPage--;
      } finally {
        this.initialLoading = false;
        this.loadingMore = false;
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
    },

    async addToCart(product) {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: product.id,
            quantity: 1
          })
        });

        if (!response.ok) throw new Error('Failed to add to cart');
        alert('Product added to cart!');
      } catch (error) {
        console.error('Cart Error:', error);
        alert('Failed to add to cart. Please try again.');
      }
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
  gap: 10px;
}

.buy-btn {
  flex: 1;
  background: #28a745;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.buy-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.buy-btn:not(:disabled):hover {
  opacity: 0.9;
}

.detail-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
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