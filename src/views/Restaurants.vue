<template>
    <div class="restaurants-container">
      <h1 class="page-title">Discover Restaurants</h1>
  
      <div class="search-filter-section">
        <div class="search-bar">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search restaurants..."
          />
          <button @click="searchRestaurants">Search</button>
        </div>
  
        <div class="filters">
          <select v-model="selectedCuisine">
            <option value="">All Cuisines</option>
            <option v-for="cuisine in cuisines" :key="cuisine" :value="cuisine">
              {{ cuisine }}
            </option>
          </select>
  
          <select v-model="sortBy">
            <option value="rating">Rating (High to Low)</option>
            <option value="priceAsc">Price (Low to High)</option>
            <option value="priceDesc">Price (High to Low)</option>
          </select>
        </div>
      </div>
  
      <div v-if="loading" class="loading">Loading restaurants...</div>
  
      <div v-else-if="restaurants.length === 0" class="no-results">
        No restaurants found. Try adjusting your search criteria.
      </div>
  
      <div v-else class="restaurants-grid">
        <div
          v-for="restaurant in filteredRestaurants"
          :key="restaurant.id"
          class="restaurant-card"
        >
          <img
            :src="restaurant.imageUrl"
            :alt="restaurant.name"
            class="restaurant-image"
          />
          <div class="restaurant-info">
            <h2>{{ restaurant.name }}</h2>
            <div class="restaurant-details">
              <span class="cuisine">{{ restaurant.cuisine }}</span>
              <span class="rating">
                <i class="fas fa-star"></i>
                {{ restaurant.rating }}/5
              </span>
              <span class="price">{{
                getPriceSymbol(restaurant.priceLevel)
              }}</span>
            </div>
            <p class="description">{{ restaurant.description }}</p>
            <button
              @click="viewRestaurantDetails(restaurant.id)"
              class="view-details-btn"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: "Restaurants",
    data() {
      return {
        restaurants: [],
        loading: true,
        searchQuery: "",
        selectedCuisine: "",
        sortBy: "rating",
        cuisines: [
          "Italian",
          "Chinese",
          "Mexican",
          "Japanese",
          "Indian",
          "American",
          "French",
        ],
      };
    },
    computed: {
      filteredRestaurants() {
        let result = [...this.restaurants];
  
        // Filter by search query
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          result = result.filter(
            (restaurant) =>
              restaurant.name.toLowerCase().includes(query) ||
              restaurant.description.toLowerCase().includes(query)
          );
        }
  
        // Filter by cuisine
        if (this.selectedCuisine) {
          result = result.filter(
            (restaurant) => restaurant.cuisine === this.selectedCuisine
          );
        }
  
        // Sort results
        switch (this.sortBy) {
          case "rating":
            result.sort((a, b) => b.rating - a.rating);
            break;
          case "priceAsc":
            result.sort((a, b) => a.priceLevel - b.priceLevel);
            break;
          case "priceDesc":
            result.sort((a, b) => b.priceLevel - a.priceLevel);
            break;
        }
  
        return result;
      },
    },
    methods: {
      async fetchRestaurants() {
        try {
          this.loading = true;
          // Replace with your actual API call
          // const response = await fetch('api/restaurants');
          // const data = await response.json();
          // this.restaurants = data;
  
          // Dummy data for now
          setTimeout(() => {
            this.restaurants = [
              {
                id: 1,
                name: "Pasta Paradise",
                cuisine: "Italian",
                rating: 4.5,
                priceLevel: 2,
                description:
                  "Authentic Italian pasta and pizzas in a cozy atmosphere.",
                imageUrl:
                  "https://via.placeholder.com/300x200?text=Pasta+Paradise",
              },
              {
                id: 2,
                name: "Sushi World",
                cuisine: "Japanese",
                rating: 4.8,
                priceLevel: 3,
                description: "Fresh sushi and sashimi prepared by master chefs.",
                imageUrl: "https://via.placeholder.com/300x200?text=Sushi+World",
              },
              {
                id: 3,
                name: "Spice Garden",
                cuisine: "Indian",
                rating: 4.2,
                priceLevel: 2,
                description: "Flavorful Indian dishes with authentic spices.",
                imageUrl: "https://via.placeholder.com/300x200?text=Spice+Garden",
              },
              {
                id: 4,
                name: "Burger Joint",
                cuisine: "American",
                rating: 4.0,
                priceLevel: 1,
                description:
                  "Juicy burgers and crispy fries in a casual setting.",
                imageUrl: "https://via.placeholder.com/300x200?text=Burger+Joint",
              },
            ];
            this.loading = false;
          }, 1000);
        } catch (error) {
          console.error("Error fetching restaurants:", error);
          this.loading = false;
        }
      },
      searchRestaurants() {
        // This could trigger an API call if needed
        // For now we're just using the computed property
      },
      viewRestaurantDetails(id) {
        this.$router.push(`/restaurants/${id}`);
      },
      getPriceSymbol(level) {
        return "$".repeat(level);
      },
    },
    mounted() {
      this.fetchRestaurants();
    },
  };
  </script>
  
  <style scoped>
  .restaurants-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .page-title {
    color: #333;
    margin-bottom: 30px;
    font-size: 2rem;
    text-align: center;
  }
  
  .search-filter-section {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .search-bar {
    display: flex;
    flex: 1;
  }
  
  .search-bar input {
    flex: 1;
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
  }
  
  .search-bar button {
    padding: 10px 15px;
    background-color: #ff642e;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
  }
  
  .filters {
    display: flex;
    gap: 15px;
  }
  
  .filters select {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
  }
  
  .loading,
  .no-results {
    text-align: center;
    margin: 50px 0;
    color: #666;
    font-size: 1.2rem;
  }
  
  .restaurants-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 30px;
  }
  
  .restaurant-card {
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }
  
  .restaurant-card:hover {
    transform: translateY(-5px);
  }
  
  .restaurant-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .restaurant-info {
    padding: 15px;
  }
  
  .restaurant-info h2 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
  }
  
  .restaurant-details {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    font-size: 0.9rem;
  }
  
  .cuisine {
    background-color: #f0f0f0;
    padding: 3px 8px;
    border-radius: 12px;
  }
  
  .rating {
    color: #ff642e;
  }
  
  .price {
    color: #666;
  }
  
  .description {
    margin-bottom: 15px;
    color: #666;
    line-height: 1.4;
  }
  
  .view-details-btn {
    background-color: #ff642e;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
  }
  
  .view-details-btn:hover {
    background-color: #e55a29;
  }
  
  @media (max-width: 768px) {
    .search-filter-section {
      flex-direction: column;
    }
  
    .filters {
      width: 100%;
      justify-content: space-between;
    }
  }
  </style>
  