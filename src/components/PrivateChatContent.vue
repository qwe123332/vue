<template>
  <div class="chat-window">
    <div
        v-for="msg in messages"
        :key="msg.id"
        class="chat-bubble"
        :class="{ 'mine': msg.senderId === currentUserId }"
    >
      <div class="text-content" v-html="formatText(msg.content)"></div>
      <div class="timestamp">{{ formatTime(msg.timestamp) }}</div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  messages: Array,
  currentUserId: Number
})

// 处理换行和 emoji（emoji 保留原样即可，前端字体支持）
const formatText = (text) => {
  return text.replace(/\n/g, '<br/>')
}

const formatTime = (ts) => {
  return dayjs(ts).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped>
.chat-window {
  height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: #fafafa;
}
.chat-bubble {
  max-width: 70%;
  padding: 10px;
  margin: 10px 0;
  border-radius: 8px;
  background-color: #f2f2f2;
  word-break: break-word;
  white-space: pre-wrap;
}

.chat-bubble.mine {
  align-self: flex-end;
  background-color: #d3f4ff;
}

.timestamp {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  text-align: right;
}
</style>
