<template>
  <el-dialog :show-close="false" :show-header="false" :visible.sync="show">
    <div class="container">
      <i class="iconfont icon-qingkong"></i>
      <div>确认清理所有任务么？</div>
    </div>
    <div class="checkbox-warpper">
      <el-checkbox class="checkbox" v-model="onlyDeleteDone"></el-checkbox>
      <span>仅删除已完成任务～</span>
    </div>

    <div class="footer">
      <el-button size="mini" @click="close" round class="cancle"
        >误操作~</el-button
      >
      <el-button
        size="mini"
        type="warning"
        round
        @click="confirm"
        class="confirm"
        >确定了~</el-button
      >
    </div>
  </el-dialog>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      onlyDeleteDone: true,
    };
  },
  methods: {
    close() {
      this.show = false;
    },
    confirm() {
      this.$emit("confirm", this.onlyDeleteDone);
      this.show = false;
    },
    open() {
      this.show = true;
    },
  },
};
</script>

<style scoped>
.container {
  display: flex;
  font-size: 15px;
  align-items: center;
  justify-content: center;
  color: #303133;
  margin-top: 16px;
}
.checkbox-warpper {
  display: flex;
  justify-content: center;
  align-items: center;
  color: #909399;
  margin-top: 12px;
  font-size: 13px;
}
.checkbox {
  display: contents;
  margin-right: 8px;
}
.checkbox-warpper > span {
  margin-left: 4px;
}
.icon-qingkong {
  margin-right: 6px;
}
.cancle {
  color: #909399;
}
.confirm {
  background-color: #4ea30a !important;
  border-color: #4ea30a !important;
}
.footer {
  display: flex;
  margin-top: 20px;
  justify-content: center;
  gap: 12px;
}
</style>
