<template>
  <div class="post-detail">
    <el-row justify="center">
      <el-col :span="16">
        <el-card v-if="post" class="post-content">
          <template #header>
            <div class="post-header">
              <router-link :to="`/profile/${post.userId}`" class="author-info">
                <el-avatar size="small" :src="post.userAvatar" />
                <div class="author-details">
                  <span class="author-name">{{ post.username }}</span>
                  <span class="post-time">{{ formatTime(post.createTime) }}</span>
                </div>
              </router-link>
              <div class="post-actions" v-if="canEdit">
                <el-button  size="small" type="primary"  @click="editPost">编辑</el-button>
                <el-button size="small" type="danger" @click="deletePost">删除</el-button>
              </div>
              <div class="post-actions" v-else>
                <el-button type="danger" @click="openReportDialog">举报</el-button>
              </div>
            </div>
          </template>

          <h1 class="post-title">{{ post.title }}</h1>

          <el-carousel v-if="post.images?.length" height="800px" arrow="always">
            <el-carousel-item v-for="(image, index) in post.images" :key="index">
              <el-image :src="image" fit="cover" class="post-image" />
            </el-carousel-item>
          </el-carousel>

          <div class="post-text" v-html="post.content"></div>

          <div class="interactions">
            <el-button  size="small" :type="post.liked ? 'danger' : 'default'" @click="toggleLike">
              <el-icon><Star /></el-icon>
              {{ post.likeCount }} 点赞
            </el-button>
          </div>

          <!-- 评论区 -->
          <section class="comments-section">
            <h3 class="comments-title">评论（{{ post.commentCount }}）</h3>
            <div class="comments-list">
              <div v-if="!comments.content || comments.content.length === 0" class="no-comments">
                <el-empty description="暂无评论，快来抢沙发吧！"></el-empty>
              </div>
              <article
                v-for="comment in comments.content"
                :key="comment.id"
                class="comment-item"
              >
                <div class="comment-main">
                  <header class="comment-header">
                    <el-avatar
                      :src="comment.userAvatar"
                      size="small"
                      class="comment-avatar"
                    />
                    <div class="comment-meta">
                      <span class="comment-author">{{ comment.username }}</span>
                      <time class="comment-time">
                        {{ formatTime(comment.createdAt) }}
                      </time>
                    </div>
                    <el-button
                      v-if="store.state.user"
                      size="small"
                      class="reply-btn"
                      @click="handleReply(comment)"
                    >
                      回复
                    </el-button>
                  </header>
                  <div class="comment-body">
                    <p class="comment-content">{{ comment.content }}</p>
                  </div>
                </div>

                <!-- 嵌套回复 -->
                <div v-if="comment.replies.length" class="replies-list">
                  <div
                    v-for="reply in comment.replies"
                    :key="reply.id"
                    class="reply-item"
                  >
                    <div class="reply-main">
                      <header class="reply-header">
                        <el-avatar
                          :src="reply.userAvatar"
                          size="small"
                          class="reply-avatar"
                        />
                        <div class="reply-meta">
                          <span class="reply-author">{{ reply.username }}</span>
                          <time class="reply-time">
                            {{ formatTime(reply.createdAt) }}
                          </time>
                        </div>
                      </header>
                      <p class="reply-content">{{ reply.content }}</p>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </el-card>
      </el-col>
    </el-row>
  </div>

  <el-dialog
      title="举报帖子"
      v-model="reportDialogVisible"
      width="400px"
  >
    <el-form label-position="top">
      <el-form-item label="举报原因">
        <el-input
            type="textarea"
            v-model="reportReason"
            :rows="4"
            placeholder="请输入详细原因..."
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="reportDialogVisible = false">取消</el-button>
      <el-button type="danger" @click="submitReport">提交举报</el-button>
    </template>
  </el-dialog>

</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import api from "@/services/api";
import dayjs from "dayjs";
import { Star } from "@element-plus/icons-vue";

export default {
  name: "PostDetail",
  setup() {
    const reportDialogVisible = ref(false);
    const reportReason = ref('');
    const reportReasons = [
      "色情内容",
      "恶意攻击",
      "垃圾广告",
      "其他",
    ];
    const store = useStore();
    const route = useRoute();
    const router = useRouter();

    const post = ref(null);
    const comments = ref({ content: [], totalElements: 0 });
    const currentPage = ref(1);
    const pageSize = ref(10);

    // 判断是否可编辑帖子
    const canEdit = computed(() => {
      return (
        store.state.user &&
        (store.state.user.id === post.value?.userId ||
          store.state.user.role === "ADMIN")
      );
    });

    // 获取帖子详情
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/posts/${route.params.id}`);
        post.value = data;
        console.log(post.value);
      } catch (error) {
        ElMessage.error("获取帖子详情失败");
        router.push("/posts");
      }
    };

    // 获取评论列表
    const fetchComments = async (page = 1) => {
      try {
        const { data } = await api.get(
          `/social/posts/${route.params.id}/comments`,
          { params: { page: page - 1, size: pageSize.value } }
        );
        comments.value = data || { content: [], totalElements: 0 };
        currentPage.value = page;
      } catch (error) {
        ElMessage.error("获取评论失败");
        comments.value = { content: [], totalElements: 0 };
      }
    };

    // 点赞/取消点赞操作（统一使用 post.value.id）
    const toggleLike = async () => {
      if (!store.state.user) {
        router.push("/login");
        return;
      }
      try {
        console.log(post.value);
        if (post.value.liked) {
          console.log(post.valued);
          await api.delete(`/posts/${post.value.postId}/like`);
          post.value.likeCount--;
        } else {
          await api.post(`/posts/${post.value.postId}/like`);
          post.value.likeCount++;
        }
        post.value.liked = !post.value.liked;
      } catch (error) {
        ElMessage.error("操作失败");
      }
    };

    const deletePost = async () => {
      try {
        await ElMessageBox.confirm("确定要删除这篇帖子吗？", "提示", {
          type: "warning",
        });
        await api.delete(`/posts/${post.value.id}`);
        ElMessage.success("删除成功");
        router.push("/posts");
      } catch (error) {
        if (error !== "cancel") {
          ElMessage.error("删除失败");
        }
      }
    };

    const editPost = () => {
      router.push(`/posts/${post.value.id}/edit`);
    };

    const formatTime = (time) => {
      return dayjs(time).format("YYYY-MM-DD HH:mm");
    };

    // 回复操作（占位函数，后续可扩展为弹窗或内联回复）
    const handleReply = (comment) => {
      ElMessage.info(`回复评论：${comment.id}`);
    };
    const openReportDialog = () => {
      if (!store.state.user) {
        router.push("/login");
        return;
      }
      reportDialogVisible.value = true;
    };
    const submitReport = async () => {
      try {
        if (!reportReason.value.trim()) {
          ElMessage.warning("请填写举报原因");
          return;
        }

        await api.post("/posts/report", {
          postId: post.value.id,
          reason: reportReason.value
        });

        ElMessage.success("举报成功，感谢反馈！");
        reportDialogVisible.value = false;
        reportReason.value = '';
      } catch (error) {
        ElMessage.error("举报失败，请稍后重试");
      }
    };


    // 在组件 mounted 时并行加载帖子详情和评论
    onMounted(() => {
      fetchPost();
      fetchComments();
    });

    return {
      store,
      post,
      comments,
      currentPage,
      pageSize,
      canEdit,
      toggleLike,
      deletePost,
      editPost,
      formatTime,
      handleReply,
      reportDialogVisible,
      reportReason,
      openReportDialog,
      submitReport,
    };
  },
};
</script>

<style scoped>
.post-detail {
  padding: 20px;
}
.post-content {
  margin-bottom: 40px;
}
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.author-details {
  display: flex;
  flex-direction: column;
}
.author-name {
  font-weight: bold;
}
.post-time {
  color: #999;
  font-size: 14px;
}
.post-title {
  margin: 20px 0;
  font-size: 24px;
  font-weight: bold;
}
.author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.author-info:hover .author-name {
  text-decoration: underline;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.post-text {
  margin: 20px 0;
  line-height: 1.6;
}
.interactions {
  margin: 20px 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.comments-section {
  margin-top: 20px;
}
.comments-title {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}
.comment-item {
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}
.comment-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.comment-author {
  font-weight: bold;
}
.comment-time {
  color: #999;
  font-size: 14px;
}
.comment-content {
  color: #333;
  line-height: 1.5;
}
.replies-list {
  margin-left: 2.5rem;
  border-left: 2px solid #f0f0f0;
  padding-left: 1rem;
}
.reply-item {
  margin: 1rem 0;
  position: relative;
}
.reply-item::before {
  content: "";
  position: absolute;
  left: -1rem;
  top: 1.25rem;
  width: 0.75rem;
  height: 1px;
  background: #ddd;
}
.reply-content {
  margin-left: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}
.no-comments {
  padding: 20px 0;
  text-align: center;
  color: #909399;
}
@media (max-width: 768px) {
  .post-image {
    height: auto;
  }
  .replies-list {
    margin-left: 1.5rem;
    padding-left: 0.5rem;
  }
  .reply-item::before {
    left: -0.5rem;
    width: 0.5rem;
  }
}
</style>
