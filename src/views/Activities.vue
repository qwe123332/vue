<template>
    <div class="activities-container">
        <h1 class="activities-title">Our Activities</h1>
        
        <div class="filter-section">
            <el-select v-model="selectedCategory" placeholder="Filter by category" clearable @change="filterActivities">
                <el-option v-for="category in categories" :key="category" :label="category" :value="category"></el-option>
            </el-select>
            <el-date-picker v-model="selectedDate" type="date" placeholder="Filter by date" @change="filterActivities"></el-date-picker>
            <el-button type="primary" @click="resetFilters">Reset Filters</el-button>
        </div>

        <div class="activities-list" v-if="filteredActivities.length">
            <el-card v-for="activity in filteredActivities" :key="activity.id" class="activity-card">
                <div class="activity-image">
                    <img :src="activity.image" :alt="activity.title">
                </div>
                <div class="activity-content">
                    <h2 class="activity-title">{{ activity.title }}</h2>
                    <div class="activity-meta">
                        <span class="activity-date">{{ formatDate(activity.date) }}</span>
                        <el-tag>{{ activity.category }}</el-tag>
                    </div>
                    <p class="activity-description">{{ activity.description }}</p>
                    <div class="activity-footer">
                        <el-button type="primary" @click="viewActivityDetails(activity.id)">Learn More</el-button>
                        <el-button type="success" @click="registerForActivity(activity.id)">Register</el-button>
                    </div>
                </div>
            </el-card>
        </div>

        <div v-else class="no-activities">
            <el-empty description="No activities found matching your criteria"></el-empty>
        </div>

        <el-pagination
            v-if="totalActivities > 0"
            background
            layout="prev, pager, next"
            :total="totalActivities"
            :page-size="pageSize"
            @current-change="handlePageChange">
        </el-pagination>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const activities = ref([]);
const filteredActivities = ref([]);
const selectedCategory = ref('');
const selectedDate = ref(null);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(6);
const totalActivities = computed(() => filteredActivities.value.length);

// Categories for filtering
const categories = ref(['Cooking Class', 'Food Tasting', 'Food Festival', 'Workshop', 'Competition']);

// Fetch activities from API
const fetchActivities = async () => {
    loading.value = true;
    try {
        // In a real app, replace this with actual API call
        // const response = await fetch('/api/activities');
        // activities.value = await response.json();
        
        // Mock data for demonstration
        activities.value = [
            {
                id: 1,
                title: 'Italian Cuisine Masterclass',
                description: 'Learn to create authentic Italian dishes with our expert chefs. This hands-on session will guide you through preparing a complete Italian meal from appetizers to desserts.',
                date: '2023-11-15',
                category: 'Cooking Class',
                image: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            },
            {
                id: 2,
                title: 'Wine & Cheese Festival',
                description: 'Join us for an evening of exquisite wine and cheese pairings. Sample selections from local and international producers while learning about proper tasting techniques.',
                date: '2023-12-10',
                category: 'Food Tasting',
                image: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            },
            {
                id: 3,
                title: 'Baking Competition',
                description: 'Show off your baking skills in our annual baking competition. Categories include cakes, breads, pastries, and gluten-free options.',
                date: '2023-12-05',
                category: 'Competition',
                image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            },
            {
                id: 4,
                title: 'Chocolate Making Workshop',
                description: 'Discover the art of chocolate making in this interactive workshop. You\'ll learn tempering, molding, and decoration techniques to create your own delicious treats.',
                date: '2023-12-15',
                category: 'Workshop',
                image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            },
            {
                id: 5,
                title: 'Asian Street Food Festival',
                description: 'Experience the vibrant flavors of Asian street cuisine with food stalls representing China, Thailand, Japan, Vietnam, and more.',
                date: '2023-11-28',
                category: 'Food Festival',
                image: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            },
            {
                id: 6,
                title: 'Sustainable Cooking Class',
                description: 'Learn how to reduce food waste and cook with sustainable ingredients in this environmentally-conscious cooking class.',
                date: '2023-12-20',
                category: 'Cooking Class',
                image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            },
            {
                id: 7,
                title: 'Spice Masterclass',
                description: 'Dive into the world of spices, learning how to select, blend and use spices to transform your everyday cooking.',
                date: '2023-12-22',
                category: 'Workshop',
                image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            }
        ];
        
        filteredActivities.value = [...activities.value];
    } catch (error) {
        console.error('Error fetching activities:', error);
        ElMessage.error('Failed to load activities. Please try again later.');
    } finally {
        loading.value = false;
    }
};

// Filter activities based on selected criteria
const filterActivities = () => {
    filteredActivities.value = activities.value.filter(activity => {
        const categoryMatch = !selectedCategory.value || activity.category === selectedCategory.value;
        
        const dateMatch = !selectedDate.value || 
            new Date(activity.date).toDateString() === new Date(selectedDate.value).toDateString();
        
        return categoryMatch && dateMatch;
    });
    
    // Reset to first page when filtering
    currentPage.value = 1;
};

// Reset all filters
const resetFilters = () => {
    selectedCategory.value = '';
    selectedDate.value = null;
    filteredActivities.value = [...activities.value];
    currentPage.value = 1;
};

// Format date for display
const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Navigate to activity details page
const viewActivityDetails = (activityId) => {
    router.push(`/activities/${activityId}`);
};

// Handle registration for an activity
const registerForActivity = (activityId) => {
    // In a real app, this would make an API call and handle the response
    ElMessage.success('Registration successful! You will receive a confirmation email shortly.');
};

// Handle pagination
const handlePageChange = (page) => {
    currentPage.value = page;
    // In a real app with server pagination, you would fetch the specific page here
};

// Fetch activities when component is mounted
onMounted(() => {
    fetchActivities();
});
</script>

<style scoped>
.activities-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
}

.activities-title {
    font-size: 2.5rem;
    color: #2c3e50;
    margin-bottom: 30px;
    text-align: center;
}

.filter-section {
    display: flex;
    gap: 15px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.activities-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 30px;
    margin-bottom: 40px;
}

.activity-card {
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
}

.activity-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.activity-image {
    height: 200px;
    overflow: hidden;
}

.activity-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
}

.activity-card:hover .activity-image img {
    transform: scale(1.05);
}

.activity-content {
    padding: 20px;
}

.activity-title {
    font-size: 1.4rem;
    margin-bottom: 10px;
    color: #2c3e50;
}

.activity-meta {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    align-items: center;
}

.activity-date {
    color: #606266;
    font-size: 0.9rem;
}

.activity-description {
    color: #606266;
    margin-bottom: 20px;
    line-height: 1.5;
}

.activity-footer {
    display: flex;
    justify-content: space-between;
}

.no-activities {
    padding: 40px;
    text-align: center;
}

@media (max-width: 768px) {
    .filter-section {
        flex-direction: column;
    }
    
    .activities-list {
        grid-template-columns: 1fr;
    }
    
    .activity-footer {
        flex-direction: column;
        gap: 10px;
    }
}
</style>