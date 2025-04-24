import { createRouter, createWebHistory } from 'vue-router'
import {ElMessage} from "element-plus";

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
  // {
  //   path: '/profile',
  //   name: 'Profile',
  //   component: Profile,
  //   meta: { requiresAuth: true }
  // },
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
  },
  {
    path: '/chat-list',
    name: 'ChatList',
    component: () => import('@/views/ChatList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat/:userId',
    name: 'ChatPage',
    component: () => import('@/views/ChatPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/:userId',
    name: 'Profile',
    component: () => import('@/views/user/Profile.vue'),
    props: true
  },




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

  const tokenExpiration = localStorage.getItem('tokenExpiration')
  const isTokenExpired = tokenExpiration && Date.now() > parseInt(tokenExpiration)

  // 1. token 过期处理
  if (isTokenExpired) {
    localStorage.clear()
    if (to.meta.requiresAuth) return next({ name: 'Login' })
  }

  // 2. 需要认证但无 token
  if (to.meta.requiresAuth && !token) {
    return next({ name: 'Login' })
  }

  // 3. 拦截角色权限不足的访问
  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    ElMessage.warning('无权限访问该页面')
    return next({ name: 'Home' }) // 或自定义 403 页面
  }

  // 4. 正常通过
  next()
})

export default router
