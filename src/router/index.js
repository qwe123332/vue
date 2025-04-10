import { createRouter, createWebHistory } from 'vue-router'

// 懒加载导入视图组件
const Home = () => import('@/views/Home.vue')
const Login = () => import('@/views/auth/Login.vue')
const Register = () => import('@/views/auth/Register.vue')
const Profile = () => import('@/views/user/Profile.vue')
const PostList = () => import('@/views/post/PostList.vue')
const PostDetail = () => import('@/views/post/PostDetail.vue')
const AdminDashboard = () => import('@/views/admin/Dashboard.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/restaurants',
    component: () => import('@/views/Restaurants.vue') // 先创建一个占位组件
  },
  {
    path: '/activities',
    component: () => import('@/views/Activities.vue') // 先创建一个占位组件
  },
  {
    path: '/posts/create',
    component: () => import('@/views/post/CreatePost.vue') // 先创建一个占位组件
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/posts',
    name: 'PostList',
    component: PostList
  },
  {
    path: '/posts/:id',
    name: 'PostDetail',
    component: PostDetail
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/SearchView.vue'),
    meta: {
      title: '搜索结果'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，根据 token 和用户角色进行权限校验
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole')?.toUpperCase()
  const userData = localStorage.getItem('user')
  
  // 检查token过期
  const tokenExpiration = localStorage.getItem('tokenExpiration')
  const isTokenExpired = tokenExpiration && Date.now() > parseInt(tokenExpiration)
  
  if (isTokenExpired) {
    // 清除过期信息
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('user')
    localStorage.removeItem('tokenExpiration')
    
    // 如果要访问需要认证的页面，重定向到登录页
    if (to.meta.requiresAuth) {
      return next({ name: 'Login' })
    }
  }

  // 如果有token但没有用户数据，可能需要重新获取用户信息
  if (token && !userData && to.meta.requiresAuth && to.name !== 'Login') {
    // 可以选择重定向到登录页，或者触发一个获取用户信息的操作
    // 这里简单处理为重定向到登录页
    return next({ name: 'Login' })
  }

  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login' })
  } else if (to.meta.requiresAdmin && userRole !== 'ADMIN') {
    next({ name: 'Home' })
  } else {
    next()
  }
})

export default router
