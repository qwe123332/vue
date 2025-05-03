<template>
  <div class="product-detail-container">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading product details...
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="product-detail">
      <div class="back-button">
        <button @click="goBack">← Back to Products</button>
      </div>
      
      <div class="product-content">
        <div class="product-images">
          <img :src="product.image_url" :alt="product.name" class="main-image" />
          <div class="thumbnail-gallery" v-if="product.gallery && product.gallery.length">
            <div 
              v-for="(img, index) in product.gallery" 
              :key="index" 
              class="thumbnail"
              :class="{ active: activeImage === index }"
              @click="setActiveImage(index)"
            >
              <img :src="img" :alt="`${product.name} view ${index + 1}`" />
            </div>
          </div>
        </div>

        <div class="product-info">
          <h1 class="product-title">{{ product.name }}</h1>
          
          <div class="price-box">
            <span class="current-price">¥{{ product.price }}</span>
            <span v-if="product.original_price" class="original-price">
              ¥{{ product.original_price }}
            </span>
          </div>
          
          <div class="availability">
            <span :class="{'in-stock': product.stock > 0, 'out-of-stock': product.stock <= 0}">
              {{ product.stock > 0 ? 'In Stock' : 'Out of Stock' }}
            </span>
            <span class="stock-count" v-if="product.stock > 0">
              ({{ product.stock }} available)
            </span>
          </div>
          
          <div class="sales-info">
            <span>{{ product.sales }} sold</span>
          </div>
          
          <div class="product-description">
            <h2>Product Description</h2>
            <div v-html="product.description"></div>
          </div>
          
          <div class="product-details">
            <h2>Specifications</h2>
            <ul>
              <li v-for="(value, key) in product.specifications" :key="key">
                <strong>{{ formatSpecKey(key) }}:</strong> {{ value }}
              </li>
            </ul>
          </div>
          
          <div class="delivery-info">
            <h2>Shipping Information</h2>
            <p>Ships from: {{ product.shipping?.from || 'Warehouse' }}</p>
            <p>Estimated delivery: {{ product.shipping?.estimated_days || '3-7' }} days</p>
          </div>
        </div>
      </div>
      
      <div class="seller-contact">
        <h2>Contact the Seller</h2>
        <div class="seller-info">
          <div class="seller-profile">
            <img :src="product.seller?.avatar || '/images/default-avatar.png'" alt="Seller Avatar" />
            <div>
              <h3>{{ product.seller?.name || 'Store Owner' }}</h3>
              <div class="rating">
                <i class="fas fa-star"></i>
                <span>{{ product.seller?.rating || '4.8' }} / 5</span>
              </div>
            </div>
          </div>
          
          <div class="contact-form">
            <textarea 
              v-model="message" 
              placeholder="Write your message to the seller here..."
              rows="4"
            ></textarea>
            <button @click="sendMessage" class="contact-btn">
              Send Message
            </button>
          </div>

          <div class="contact-actions">
            <button @click="startChat" class="chat-btn">
              私信商家
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '@/services/api';

export default {
  name: "ProductDetail",
  data() {
    return {
      product: {},
      loading: true,
      error: null,
      message: "",
      activeImage: 0
    };
  },
  mounted() {
    this.fetchProductDetails();
  },
  methods: {
    async fetchProductDetails() {
      try {
        this.loading = true;
        const productId = this.$route.params.id;

        // 调用真实接口获取商品详情
        const data = await api.get(`/products/${productId}`); // 修改为直接获取解包后的数据
        this.product = data;

        document.title = `${this.product.name} - TastySphere`;
      } catch (err) {
        console.error('Error fetching product details:', err);
        this.error = err.message || 'Failed to load product details. Please try again later.';
      } finally {
        this.loading = false;
      }
    }
,

    goBack() {
      this.$router.push('/mall');
    },
    
    setActiveImage(index) {
      this.activeImage = index;
    },
    
    formatSpecKey(key) {
      return key.replace(/_/g, ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());
    },
    
    async sendMessage() {
      if (!this.message.trim()) {
        alert('Please enter a message.');
        return;
      }
      
      try {
        const response = await api.post('/messages/start', {
          seller_id: this.product.seller?.id,
          message: this.message
        });

        alert('Your message has been sent to the seller!');
        this.message = '';
        console.log('Message response:', response.data);
      } catch (error) {
        console.error('Message Error:', error);
        alert('Failed to send message. Please try again.');
      }
    },

    startChat() {
      console.log('Starting chat with seller:', this.product);
      console.log('Starting chat with seller:', this.product.userId);
      if (this.product.userId) {
    
        this.$router.push(`/chat/${this.product.userId}`);
      } else {
        alert('无法发起私信，商家信息缺失。');
      }
    }
  }
};
</script>

<style scoped>
.product-detail-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.loading, .error {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  font-size: 1.2rem;
}

.error {
  color: #dc3545;
}

.back-button {
  margin-bottom: 20px;
}

.back-button button {
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 1rem;
  padding: 8px 0;
  display: inline-flex;
  align-items: center;
}

.back-button button:hover {
  text-decoration: underline;
}

.product-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.product-images {
  position: sticky;
  top: 20px;
}

.main-image {
  width: 100%;
  height: 400px;
  object-fit: contain;
  border-radius: 8px;
  background: #f8f9fa;
  margin-bottom: 15px;
}

.thumbnail-gallery {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
}

.thumbnail.active {
  border-color: #007bff;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-title {
  font-size: 2rem;
  margin: 0 0 15px;
  color: #2c3e50;
}

.price-box {
  margin-bottom: 20px;
}

.current-price {
  font-size: 2.2rem;
  color: #dc3545;
  font-weight: 700;
}

.original-price {
  color: #999;
  font-size: 1.4rem;
  text-decoration: line-through;
  margin-left: 15px;
}

.availability {
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.in-stock {
  color: #28a745;
  font-weight: 600;
}

.out-of-stock {
  color: #dc3545;
  font-weight: 600;
}

.stock-count {
  color: #666;
  margin-left: 5px;
}

.sales-info {
  color: #666;
  margin-bottom: 25px;
  font-size: 1rem;
}

.product-description, .product-details, .delivery-info {
  margin-bottom: 30px;
}

.product-description h2, .product-details h2, .delivery-info h2 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.product-details ul {
  list-style: none;
  padding: 0;
}

.product-details li {
  margin-bottom: 8px;
  display: flex;
  gap: 5px;
}

.delivery-info p {
  margin: 8px 0;
}

.seller-contact {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
  margin-top: 40px;
}

.seller-contact h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5rem;
  color: #2c3e50;
}

.seller-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.seller-profile {
  display: flex;
  align-items: center;
  gap: 15px;
}

.seller-profile img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.seller-profile h3 {
  margin: 0;
  font-size: 1.2rem;
}

.rating {
  color: #f39c12;
  margin-top: 5px;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.contact-form textarea {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  resize: vertical;
  font-family: inherit;
}

.contact-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
}

.contact-btn:hover {
  background: #0056b3;
}

.contact-actions {
  margin-top: 20px;
}

.chat-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
}

.chat-btn:hover {
  background: #0056b3;
}

@media (max-width: 960px) {
  .product-content {
    grid-template-columns: 1fr;
  }
  
  .product-images {
    position: static;
  }
}

@media (max-width: 640px) {
  .product-title {
    font-size: 1.6rem;
  }
  
  .current-price {
    font-size: 1.8rem;
  }
  
  .original-price {
    font-size: 1.2rem;
  }
}
</style>
