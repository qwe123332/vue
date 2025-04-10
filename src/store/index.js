import { createStore } from 'vuex'
import api from '@/services/api'

export default createStore({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    posts: [],
    notifications: {
      items: [],
      unreadCount: 0
    }
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    SET_POSTS(state, posts) {
      state.posts = posts
    },
    SET_NOTIFICATIONS(state, notifications) {
      state.notifications.items = notifications
    },
    SET_UNREAD_COUNT(state, count) {
      state.notifications.unreadCount = count
    }
  },
  actions: {
    // 检查token是否过期
    checkTokenExpiration({ dispatch }) {
      const expirationTime = localStorage.getItem('tokenExpiration');
      if (expirationTime && new Date().getTime() > parseInt(expirationTime)) {
        // Token已过期，执行登出操作
        dispatch('logout');
        return false;
      }
      return true;
    },
    
    async login({ commit, dispatch }, credentials) {
      const { data } = await api.post('/auth/login', credentials);
      
      // 存储token和过期时间
      localStorage.setItem('token', data.token);
      const expirationTime = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem('tokenExpiration', expirationTime);
      
      // 如果服务器返回了用户数据，应该在这里直接保存
      if (data.user) {
        commit('SET_USER', data.user);
      }
      
      await dispatch('fetchUserProfile');
    },
    
    async logout({ commit }) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('user');
      localStorage.removeItem('tokenExpiration'); // 删除过期时间
      api.post('/auth/logout');
      commit('SET_USER', null);
    },
    
    async fetchUserProfile({ commit, dispatch }) {
      if (!dispatch('checkTokenExpiration')) return;
      
      try {
        // 获取用户资料
        console.log("开始获取用户资料");
        const token = localStorage.getItem('token');
        const { data } = await api.get('/users/profile');
        console.log("打印USERINFO", data);
        
        if (data.roles && data.roles.length > 0) {
          localStorage.setItem('userRole', data.roles[0].name);
        }
        
        // 确保用户数据被正确提交到mutation
        commit('SET_USER', data);
        
        // 验证数据是否成功存储
        console.log("存储到localStorage的用户数据:", localStorage.getItem('user'));
        return data;
      } catch (error) {
        console.error("获取用户资料失败:", error);
        // 如果获取失败，考虑清除无效token
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          dispatch('logout');
        }
        throw error;
      }
    },
    
    async fetchPosts({ commit, dispatch }, { page = 0, size = 10 } = {}) {
      if (!dispatch('checkTokenExpiration')) return;
      
      const { data } = await api.get('/posts', { params: { page, size } });
      commit('SET_POSTS', data);
    },
    
    async fetchNotifications({ commit, dispatch }) {
      if (!dispatch('checkTokenExpiration')) return;
      
      const { data } = await api.get('/notifications');
      commit('SET_NOTIFICATIONS', data);
      const { data: unreadCount } = await api.get('/notifications/unread-count');
      commit('SET_UNREAD_COUNT', unreadCount);
    },
    
    async register({ commit, dispatch }, credentials) {
      try {
        const { data } = await api.post('/auth/register', {
          username: credentials.username,
          password: credentials.password
        });
        
        // 设置token和过期时间
        localStorage.setItem('token', data.token);
        const expirationTime = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem('tokenExpiration', expirationTime);
        
        // 确保用户数据被正确保存
        if (data.user) {
          commit('SET_USER', data.user);
        } else {
          // 如果注册接口没有直接返回用户数据，尝试获取用户资料
          await dispatch('fetchUserProfile');
        }
        
        return data;
      } catch (error) {
        throw new Error(error.response?.data?.message || '注册失败');
      }
    }
  }
})