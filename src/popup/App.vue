<template>
  <div class="container" :class="{ 'dark-mode': isDarkMode }" :style="containerStyle">
    <!-- header -->
    <header>
      <div
        class="header-famous-word"
      >
        {{ famousWord }}
      </div>
    </header>
    <!-- card -->
    <el-card class="box-card" shadow="never">
      <div slot="header" class="card-header">
        <div class="card-header-controls">
          <el-select
            v-model="viewMode"
            size="mini"
            class="view-mode-select"
            @change="handlerViewModeChange"
          >
            <el-option label="月" value="month"></el-option>
            <el-option label="周" value="week"></el-option>
          </el-select>
          <div class="card-header-nav">
            <el-date-picker
              v-if="viewMode === 'month'"
              v-model="curDate"
              type="date"
              placeholder="选择日期"
              @change="changeDate"
              @focus="handlerDateFocus"
              :clearable="false"
              :picker-options="pickerOptions"
            >
            </el-date-picker>
            <div v-else class="week-view">
              <i
                class="el-icon-arrow-left week-nav-arrow"
                @click="handlerPrevWeek"
              ></i>
              <span class="week-range-label">{{ weekRangeLabel }}</span>
              <i
                class="el-icon-arrow-right week-nav-arrow"
                @click="handlerNextWeek"
              ></i>
            </div>
          </div>
        </div>
        <div v-if="viewMode === 'week'" class="week-days">
          <div
            v-for="day in weekDays"
            :key="day.date"
            class="week-day-item"
            :class="{
              'is-active': day.isActive,
              'is-today': day.isToday,
              'has-pending': day.pending > 0 && day.completed === 0,
              'has-completed': day.completed > 0 && day.pending === 0,
              'has-mixed': day.completed > 0 && day.pending > 0,
            }"
            :title="day.pending > 0 || day.completed > 0 ? `已完成: ${day.completed}, 未完成: ${day.pending}` : ''"
            @click="handlerWeekDayClick(day.date)"
          >
            <span class="week-day-label">{{ day.dayOfWeek }}</span>
            <span class="week-day-date">{{ day.dayOfMonth }}</span>
          </div>
        </div>
      </div>
      <!-- todo list -->
      <div v-if="tasks.length !== 0">
        <div class="check-all-bar">
          <el-checkbox
            v-model="allChecked"
            :indeterminate="indeterminate"
            @change="handlerCheckAll"
          >
            全选
          </el-checkbox>
          <span class="check-all-count">{{ checkedCount }}/{{ tasks.length }}</span>
        </div>
        <draggable
          v-model="tasks"
          :disabled="draggableDisabled"
          animation="200"
          @start="onStart"
          @end="onEnd"
          @click.stop
        >
          <transition-group name="fade" tag="div">
            <el-row
              :class="{ 'clear-transition': !isDrag }"
              v-for="item of tasks"
              :key="item.id"
            >
              <el-col>
                <el-checkbox
                  class="checkbox"
                  v-model="item.checked"
                  @change="handlerCheckboxChange(item)"
                ></el-checkbox>
                <el-tooltip
                  v-if="!item.isEdit"
                  class="item"
                  effect="light"
                  :content="item.label"
                  placement="top"
                  :open-delay="500"
                >
                  <label
                    class="checkbox-text"
                    :class="{ select: item.checked }"
                    @dblclick.stop="handlerEditTask(item)"
                  >
                    {{ item.label }}
                  </label>
                </el-tooltip>
                <el-input
                  v-else
                  v-focus
                  class="text-input"
                  v-model="item.label"
                  placeholder="输入待办任务～"
                  size="mini"
                  @blur="handlerBlur(item)"
                ></el-input>
                <i
                  class="el-icon-delete show-remove-icon"
                  @click="handlerRemoveTask(item)"
                ></i>
              </el-col>
            </el-row>
          </transition-group>
        </draggable>
      </div>
      <!-- empty -->
      <el-empty
        v-else
        :image-size="70"
        description="暂无任务列表，快去创建吧～"
      ></el-empty>
    </el-card>
    <!-- footer -->
    <footer>
      <div class="footer-group">
        <el-button size="mini" @click="handlerAddTask">
          <i class="el-icon-circle-plus-outline"></i>
          添加
        </el-button>
        <el-button
          size="mini"
          @click="handlerExport"
          :disabled="clearDisabled"
          class="export"
        >
          <i class="el-icon-download"></i>
          导出
        </el-button>
      </div>
      <div class="footer-group">
        <el-button
          size="mini"
          @click="handlerClear"
          :disabled="clearDisabled"
          class="clear"
        >
          <i class="iconfont icon-qingkong1"></i>
          清空
        </el-button>
        <el-button size="mini" @click="handlerSourceCode">
          <i class="iconfont icon-github"></i>
          源码
        </el-button>
      </div>
    </footer>
    <!-- Dialog -->
    <AuthorDialog ref="AuthorDialog" :isShowFooter="isShowFooter">
    </AuthorDialog>
    <ClearDialog ref="ClearDialog" @confirm="handlerConfirmClear">
    </ClearDialog>
  </div>
</template>

<script>
import draggable from "vuedraggable";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
import AuthorDialog from "./components/author-dialog.vue";
import ClearDialog from "./components/clear-dialog.vue";
import sunriseBg from "../images/sunrise-bg.svg";
import sunsetBg from "../images/sunset-bg.svg";
import {
  saveTitleLocalstory,
  getTitleLocalstory,
  setTasksListLocalstory,
  getTasksListLocalstory,
  updateTasksListLocalstory,
  clearTasksLocalstory,
  setBadgeText,
  getAllTaskDateSummary,
} from "../utils/index";
import myWechart from "../icons/myWechart.png";
import wechart from "../icons/wechart.png";
import zhifubao from "../icons/zhifubao.png";
import gongzhonghao from "../icons/gongzhonghao.png";
import famousWords from "../quotes.js";

const defaultTitle = "";
export default {
  components: {
    draggable,
    AuthorDialog,
    ClearDialog,
  },
  directives: {
    focus: {
      inserted: function (el) {
        el.querySelector("input").focus();
      },
    },
  },
  data() {
    return {
      themeTick: Date.now(),
      curDate: dayjs().format("YYYY-MM-DD"),
      viewMode: "month",
      weekOffset: 0,
      drag: false,
      isDrag: false,
      isShowAddTaskDialog: false,
      draggableDisabled: false,
      title: defaultTitle,
      isTitleEdit: false,
      isShowFooter: false,
      clearDisabled: false,
      tasks: [],
      taskDateMap: {},
    };
  },
  computed: {
    nowTime() {
      return dayjs(this.curDate).format("YYYY-MM-DD");
    },
    isShowTitle() {
      return !this.isTitleEdit && this.title !== "";
    },
    isDarkMode() {
      const hour = dayjs(this.themeTick).hour();
      return hour < 6 || hour >= 18;
    },
    famousWord() {
      const d = dayjs(this.curDate);
      const dayOfYear = d.diff(d.startOf("year"), "day") + 1;
      const index = (dayOfYear - 1) % famousWords.length;
      return famousWords[index];
    },
    weekDays() {
      const d = dayjs(this.curDate);
      const dayOfWeek = d.day();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = d.add(mondayOffset + this.weekOffset * 7, "day").startOf("day");
      const labels = ["一", "二", "三", "四", "五", "六", "日"];
      const todayStr = dayjs().format("YYYY-MM-DD");
      const curDateStr = this.nowTime;
      return labels.map((label, i) => {
        const date = monday.add(i, "day");
        const dateStr = date.format("YYYY-MM-DD");
        const info = this.taskDateMap[dateStr] || { completed: 0, pending: 0 };
        return {
          date: dateStr,
          dayOfWeek: label,
          dayOfMonth: date.date(),
          completed: info.completed,
          pending: info.pending,
          isToday: dateStr === todayStr,
          isActive: dateStr === curDateStr,
        };
      });
    },
    weekRangeLabel() {
      const days = this.weekDays;
      if (!days.length) return "";
      const first = dayjs(days[0].date);
      const last = dayjs(days[6].date);
      if (first.month() === last.month()) {
        return `${first.month() + 1}月${first.date()}日 - ${last.date()}日`;
      }
      return `${first.month() + 1}月${first.date()}日 - ${last.month() + 1}月${last.date()}日`;
    },
    allChecked: {
      get() {
        return this.tasks.length > 0 && this.tasks.every((t) => t.checked);
      },
      set(val) {
        this.tasks.forEach((t) => { t.checked = val; });
      },
    },
    indeterminate() {
      const checkedCount = this.tasks.filter((t) => t.checked).length;
      return checkedCount > 0 && checkedCount < this.tasks.length;
    },
    checkedCount() {
      return this.tasks.filter((t) => t.checked).length;
    },
    pickerOptions() {
      const self = this;
      return {
        cellClassName(date) {
          const dateStr = dayjs(date).format("YYYY-MM-DD");
          const info = self.taskDateMap[dateStr];
          if (!info) return "";
          if (info.pending > 0 && info.completed === 0) return "task-pending";
          if (info.completed > 0 && info.pending === 0) return "task-completed";
          if (info.completed > 0 && info.pending > 0) return "task-mixed";
          return "";
        },
      };
    },
    containerStyle() {
      const image = this.isDarkMode ? sunsetBg : sunriseBg;
      return {
        "--scene-image": `url(${image})`,
      };
    },
  },
  created() {
    this.init();
    this.refreshTaskDateMap();
  },
  mounted() {
    this.syncThemeClass();
    this._themeTimer = setInterval(() => {
      this.themeTick = Date.now();
    }, 60000);
  },
  destroyed() {
    const key = this.nowTime;
    setTasksListLocalstory(key, this.tasks);
    if (this._themeTimer) {
      clearInterval(this._themeTimer);
      this._themeTimer = null;
    }
    this.clearThemeClass();
    if (this._calendarObserver) {
      this._calendarObserver.disconnect();
      this._calendarObserver = null;
    }
  },
  watch: {
    isDarkMode() {
      this.syncThemeClass();
    },
    tasks: {
      deep: true,
      immediate: true,
      handler(tasks) {
        this.clearDisabled = tasks.length === 0;
        const undone = tasks.filter((el) => !el.checked);
        setBadgeText(String(undone.length));
      },
    },
  },
  methods: {
    changeDate() {
      const date = this.nowTime;
      console.log("changeDate:" + date);
      getTasksListLocalstory(this, date);
      this.refreshTaskDateMap();
    },
    handlerViewModeChange() {
      this.weekOffset = 0;
      this.refreshTaskDateMap();
    },
    handlerPrevWeek() {
      this.weekOffset -= 1;
      this.refreshTaskDateMap();
    },
    handlerNextWeek() {
      this.weekOffset += 1;
      this.refreshTaskDateMap();
    },
    handlerWeekDayClick(dateStr) {
      this.weekOffset = 0;
      this.curDate = dateStr;
      getTasksListLocalstory(this, dateStr);
      this.refreshTaskDateMap();
    },
    syncThemeClass() {
      if (typeof document === "undefined") return;
      const targetIds = [document.documentElement, document.body, document.getElementById("app")];
      const addClass = this.isDarkMode ? "popup-dark" : "popup-light";
      const removeClass = this.isDarkMode ? "popup-light" : "popup-dark";
      targetIds.forEach((el) => {
        if (!el) return;
        el.classList.remove(removeClass);
        el.classList.add(addClass);
      });
    },
    clearThemeClass() {
      if (typeof document === "undefined") return;
      [document.documentElement, document.body, document.getElementById("app")].forEach((el) => {
        if (!el) return;
        el.classList.remove("popup-dark", "popup-light");
      });
    },
    // ── Calendar task indicators ──
    refreshTaskDateMap() {
      getAllTaskDateSummary((summary) => {
        this.taskDateMap = summary;
      });
    },
    handlerDateFocus() {
      if (this._calendarObserver) {
        this._calendarObserver.disconnect();
        this._calendarObserver = null;
      }
      // Re-fetch task summaries first, then inject tooltips after data is ready
      getAllTaskDateSummary((summary) => {
        this.taskDateMap = summary;
        this.$nextTick(() => {
          setTimeout(() => {
            this.injectCalendarTooltips();
            this.observeCalendarChanges();
          }, 300);
        });
      });
    },
    getDisplayedYearMonth() {
      const labels = document.querySelectorAll(
        ".el-picker-panel__body .el-date-picker__header-label"
      );
      if (labels.length < 2) return null;
      const year = parseInt(labels[0].textContent.trim());
      if (isNaN(year)) return null;
      const monthMatch = labels[1].textContent.trim().match(/(\d+)/);
      const month = monthMatch ? parseInt(monthMatch[1]) : null;
      if (!month || month < 1 || month > 12) return null;
      return { year, month };
    },
    injectCalendarTooltips() {
      const ym = this.getDisplayedYearMonth();
      if (!ym) return;
      const cells = document.querySelectorAll(
        ".el-picker-panel__body .el-date-table td.available"
      );
      const { taskDateMap } = this;
      cells.forEach((cell) => {
        const textEl = cell.querySelector("div span");
        if (!textEl) return;
        const day = parseInt(textEl.textContent.trim());
        if (isNaN(day)) return;
        let month = ym.month;
        let year = ym.year;
        if (cell.classList.contains("prev-month")) {
          month -= 1;
          if (month === 0) {
            month = 12;
            year -= 1;
          }
        } else if (cell.classList.contains("next-month")) {
          month += 1;
          if (month === 13) {
            month = 1;
            year += 1;
          }
        }
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const info = taskDateMap[dateStr];
        if (info && (info.completed > 0 || info.pending > 0)) {
          cell.title = `已完成: ${info.completed}, 未完成: ${info.pending}`;
        } else {
          cell.removeAttribute("title");
        }
      });
    },
    observeCalendarChanges() {
      if (this._calendarObserver) {
        this._calendarObserver.disconnect();
      }
      const panelBody = document.querySelector(".el-picker-panel__body");
      if (!panelBody) return;
      let pending = false;
      this._calendarObserver = new MutationObserver(() => {
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
          this.injectCalendarTooltips();
          pending = false;
        });
      });
      this._calendarObserver.observe(panelBody, {
        childList: true,
        subtree: true,
      });
    },
    // Init
    init() {
      getTasksListLocalstory(this,this.nowTime);
      getTitleLocalstory(this);
    },
    // Start Drag
    onStart() {
      this.drag = true;
      this.isDrag = true;
    },
    // End Drag
    onEnd() {
      this.drag = false;
      this.isDrag = false;
      const key = this.nowTime;
      updateTasksListLocalstory(key, this.tasks);
      this.refreshTaskDateMap();
    },
    // Clear Tasks
    handlerClear() {
      this.$refs["ClearDialog"].open();
    },
    // Confirm Tasks
    handlerConfirmClear(onlyDeleteDone) {
      const { tasks } = this;
      const key = this.nowTime;
      if (onlyDeleteDone) {
        this.tasks = tasks.filter((el) => !el.checked);
        updateTasksListLocalstory(key, this.tasks);
      } else {
        this.tasks = [];
        clearTasksLocalstory(key);
      }
      this.refreshTaskDateMap();
    },
    // Look Source Code
    handlerSourceCode() {
      window.open("https://github.com/wizardchao/todo-list");
    },
    // Contact Author
    handlerContactAuthor() {
      this.isShowFooter = false;
      this.$refs["AuthorDialog"].open(
        ["公众号", "微信"],
        [gongzhonghao, myWechart]
      );
    },
    // Reward Author
    handlerRewardAuthor() {
      this.isShowFooter = true;
      this.$refs["AuthorDialog"].open(["微信", "支付宝"], [wechart, zhifubao]);
    },
    // Dbclick Title
    handlerDbclickTitle() {
      this.isTitleEdit = true;
    },
    // Save Title
    handlerTitleInputBlur() {
      const { title } = this;
      if (title !== "") {
        this.isTitleEdit = false;
      }
      saveTitleLocalstory(title);
    },
    // Check All
    handlerCheckAll(val) {
      this.tasks.forEach((t) => {
        t.checked = val;
      });
      const key = this.nowTime;
      updateTasksListLocalstory(key, this.tasks);
      this.refreshTaskDateMap();
    },
    // Add Task
    handlerAddTask() {
      this.isDrag = true;
      if (this.tasks.length > 49) {
        alert("最多创建 50 个任务哦～");
        return;
      }
      this.draggableDisabled = true;
      this.tasks.unshift({
        id: uuidv4(),
        label: "",
        isEdit: true,
        checked: false,
      });
      this.refreshTaskDateMap();
    },
    // Remove Task
    handlerRemoveTask(item) {
      this.isDrag = true;
      this.$nextTick(() => {
        const index = this.tasks.findIndex((el) => el.id === item.id);
        this.tasks.splice(index, 1);
        const key = this.nowTime;
        updateTasksListLocalstory(key, this.tasks);
        this.refreshTaskDateMap();
      });
    },
    // Input Blur
    handlerBlur(item) {
      if (item.label.trim() !== "") {
        item.isEdit = false;
        const key = this.nowTime;
        setTasksListLocalstory(key, this.tasks);
      } else {
        this.handlerRemoveTask(item);
      }
      this.draggableDisabled = false;
      this.refreshTaskDateMap();
    },
    // Edit Text
    handlerEditTask(item) {
      if (!item.isEdit) {
        item.isEdit = true;
      }
    },
    // Export Tasks
    handlerExport() {
      const date = this.nowTime;
      const pending = this.tasks.filter((t) => !t.checked);
      const completed = this.tasks.filter((t) => t.checked);
      const lines = [`# ${date}`, ""];
      if (pending.length) {
        lines.push("## 未完成", "");
        pending.forEach((t, i) => { lines.push(`${i + 1}. ${t.label}`); });
        lines.push("");
      }
      if (completed.length) {
        lines.push("## 已完成", "");
        completed.forEach((t, i) => { lines.push(`${i + 1}. ${t.label}`); });
        lines.push("");
      }
      const content = lines.join("\n");
      const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${date}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },
    // Checkbox Change
    handlerCheckboxChange(item) {
      if (item.checked) {
        this.isDrag = true;
        const { tasks } = this;
        let temp = [];
        const preIndex = tasks.findIndex((el) => el.id === item.id);
        if (preIndex > 0) {
          const pre = tasks.slice(0, preIndex);
          temp = pre;
        }
        const nextArr = tasks.slice(preIndex + 1, tasks.length);
        if (nextArr.length > 0) {
          temp.push(...nextArr);
        }
        temp.push(item);
        this.tasks = temp;
      }
      const key = this.nowTime;
      updateTasksListLocalstory(key, this.tasks);
      this.refreshTaskDateMap();
    },
  },
};
</script>

<style>
@import "./common.css";
</style>
<style scoped>
/* 动画 */
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.clear-transition {
  transition: unset !important;
}

.fade-enter {
  opacity: 0;
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-leave-active {
  position: absolute;
}

.container {
  position: relative;
  width: 350px;
  padding: 0 10px;
  background: #f2f6fc;
  margin: 16px 0 10px 0;
  overflow: hidden;
  isolation: isolate;
}

.container::before {
  content: "";
  position: absolute;
  top: -12px;
  left: 0;
  right: 0;
  height: 220px;
  background-image: var(--scene-image);
  background-repeat: no-repeat;
  background-position: right -6px top -6px;
  background-size: 118% auto;
  opacity: 0.68;
  pointer-events: none;
  z-index: 0;
}

.container::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(242, 246, 252, 0.1) 0%, rgba(242, 246, 252, 0.16) 12%, rgba(242, 246, 252, 0.32) 26%, rgba(242, 246, 252, 0.72) 44%, rgba(242, 246, 252, 0.94) 60%, rgba(242, 246, 252, 0.98) 100%);
  pointer-events: none;
  z-index: 0;
}

.container > * {
  position: relative;
  z-index: 1;
}

.header-title {
  width: 350px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 18px;
  padding: 0 0 10px 10px;
  margin-bottom: 15px;
  color: #2a3a4a;
  font-weight: 500;
  border-bottom: 1px solid #e4e7ed;
  user-select: none;
}

.todo-list {
  border-radius: 6px;
  background: #fff;
  padding: 10px;
  height: 300px;
  overflow: auto;
}

/* Row */
.el-row {
  height: 36px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  padding: 0 8px;
  margin-bottom: 4px;
}
.el-row:hover {
  background: #f5f7fa;
}

/* Col */
.el-col {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  padding-right: 22px;
}

/* checkbox 文本 */
.checkbox-text {
  width: 100%;
  color: #303133;
  font-size: 14px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  cursor: move;
  user-select: none;
}

/*  移除 icon */
.el-icon-delete {
  display: none;
  position: absolute;
  right: 0;
  cursor: pointer;
  font-size: 14px;
  color: #C0C4CC;
  transition: color 0.2s;
}
.el-icon-delete:hover {
  color: #F56C6C;
}

/* 移除 icon hover */
.el-col:hover .show-remove-icon {
  display: block;
}

.select {
  text-decoration: line-through;
  color: #C0C4CC;
}

/* ── Check All Bar ── */
.check-all-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
}
.check-all-bar .el-checkbox {
  width: auto;
}
.check-all-count {
  font-size: 12px;
  color: #909399;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header-nav {
  display: flex;
  align-items: center;
  flex: 1;
}

.card-header-nav .el-date-editor {
  width: 100%;
}

.view-mode-select {
  width: 68px;
  flex-shrink: 0;
}

/* ── Week View ── */
.week-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.week-nav-arrow {
  cursor: pointer;
  font-size: 14px;
  color: #909399;
  padding: 4px;
  border-radius: 4px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.week-nav-arrow:hover {
  color: #409EFF;
  background: #ecf5ff;
}

.week-range-label {
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  text-align: center;
}

.week-days {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.week-day-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 44px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #606266;
  background: #fff;
  border: 1px solid #e4e7ed;
  transition: all 0.2s;
  user-select: none;
}
.week-day-item:hover {
  border-color: #409EFF;
  color: #409EFF;
}
.week-day-item.is-active {
  background: #409EFF;
  border-color: #409EFF;
  color: #fff;
}
.week-day-item.is-active .week-day-date {
  color: #fff;
}
.week-day-item.is-today {
  border-color: #409EFF;
}
.week-day-item.is-today:not(.is-active) .week-day-label {
  color: #409EFF;
  font-weight: 600;
}
.week-day-item .week-day-label {
  font-size: 10px;
  color: #909399;
  line-height: 1.2;
}
.week-day-item .week-day-date {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
}

/* Week day task indicators */
.week-day-item.has-pending { border-color: #F56C6C; }
.week-day-item.has-pending .week-day-date { color: #F56C6C; }
.week-day-item.has-completed { border-color: #4ea30a; }
.week-day-item.has-completed .week-day-date { color: #4ea30a; }
.week-day-item.has-mixed { border-color: #E6A23C; }
.week-day-item.has-mixed .week-day-date { color: #E6A23C; }
.week-day-item.is-active.has-pending,
.week-day-item.is-active.has-completed,
.week-day-item.is-active.has-mixed {
  background: #409EFF;
  border-color: #409EFF;
}
.week-day-item.is-active .week-day-date {
  color: #fff !important;
}

.card-time {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

.icon-mdatepicker {
  margin-right: 5px;
}

footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 8px;
  color: #909399;
  font-size: 13px;
}
footer .el-button {
  width: 100%;
  margin: 0;
  font-size: 13px;
  color: #909399;
  padding: 6px 8px;
  transition: color 0.2s;
}
footer .el-button + .el-button {
  margin-left: 0;
}
footer .el-button:hover {
  color: #409EFF;
}
footer .el-button i {
  font-size: 14px !important;
}
.footer-group {
  display: flex;
  flex: 1;
  gap: 8px;
}

.clear:hover .icon-qingkong1 {
  display: inline-block;
  transform: rotate(180deg);
  transition: transform 0.4s ease;
}

/* ── Dark Mode ── */
.dark-mode {
  background: linear-gradient(180deg, rgba(34, 34, 34, 0.82) 0%, rgba(22, 22, 22, 0.94) 36%, rgba(12, 12, 12, 0.98) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 18px 40px rgba(0, 0, 0, 0.42);
  border-radius: 10px;
}
.dark-mode::before {
  top: -18px;
  height: 228px;
  opacity: 0.62;
  background-position: right 2px top -16px;
}
.dark-mode::after {
  background:
    linear-gradient(180deg, rgba(18, 18, 18, 0.08) 0%, rgba(18, 18, 18, 0.16) 12%, rgba(18, 18, 18, 0.3) 24%, rgba(18, 18, 18, 0.58) 40%, rgba(18, 18, 18, 0.84) 56%, rgba(18, 18, 18, 0.96) 100%);
}
.header-famous-word {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.1) 52%, rgba(255, 255, 255, 0) 100%);
  border-radius: 8px;
  backdrop-filter: blur(2px);
}
.dark-mode .header-famous-word {
  color: #a0a0a0;
  border-bottom-color: #2a2a2a;
  background: linear-gradient(90deg, rgba(26, 26, 26, 0.36) 0%, rgba(26, 26, 26, 0.14) 52%, rgba(26, 26, 26, 0) 100%);
}
.box-card {
  background: rgba(255, 255, 255, 0.88) !important;
  backdrop-filter: blur(10px);
}
.dark-mode .el-card {
  background: linear-gradient(180deg, rgba(29, 29, 29, 0.9) 0%, rgba(24, 24, 24, 0.94) 100%) !important;
  border-color: #2a2a2a !important;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(12px);
}
.dark-mode .el-card__header {
  border-bottom-color: #2a2a2a !important;
}
.dark-mode .el-card__body {
  color: #e0e0e0;
}
.dark-mode .box-card .el-input__inner {
  color: #e0e0e0 !important;
  background: transparent !important;
}
.dark-mode .checkbox-text {
  color: #e0e0e0;
}
.dark-mode .el-row:hover {
  background: #222;
}
.dark-mode .select {
  color: #555;
}
.dark-mode footer {
  color: #888;
}
.dark-mode footer .el-button {
  color: #888;
}
.dark-mode .check-all-bar {
  border-bottom-color: #2a2a2a;
}
.dark-mode .check-all-count {
  color: #888;
}
.dark-mode .export:hover {
  color: #409EFF;
}
.dark-mode .week-day-item {
  background: #1a1a1a;
  border-color: #2a2a2a;
  color: #a0a0a0;
}
.dark-mode .week-range-label {
  color: #e0e0e0;
}
.dark-mode .week-nav-arrow {
  color: #888;
}
.dark-mode .week-nav-arrow:hover {
  background: #222;
}
</style>
