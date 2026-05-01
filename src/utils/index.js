// Save Tasks
export const setTasksListLocalstory = (key,tasks) => {
  let param={}
  param[key]=tasks
  chrome.storage.sync.set(param, function () {
    console.log("😄 Create Tasks Success～");
  });
};

// Get Tasks
export const getTasksListLocalstory = (self,date) => {
  const key=date
  console.log({key})
  chrome.storage.sync.get(key, (result) => {
    self.tasks=[]
    if(result?.[key]) self.tasks = result[key]
    console.log(self.tasks)
    console.log("👌 Get Tasks Success～");
  });
};

// Update Tasks
export const updateTasksListLocalstory = (key,tasks) => {
  let param={}
  param[key]=tasks
  chrome.storage.sync.set(param, () => {
    console.log("🚀 Update Tasks Success～");
  });
};

// Clear Tasks
export const clearTasksLocalstory = (key) => {
  chrome.storage.sync.remove(key, () => {
    console.log("🧹 Clear Tasks Success～");
  });
};

// Save Title
export const saveTitleLocalstory = (title) => {
  chrome.storage.sync.set({ title: title }, function () {
    console.log("😄 Create Title Success～");
  });
};

// Get Title
export const getTitleLocalstory = (self) => {
  chrome.storage.sync.get("title", (result) => {
    if (!result?.title) {
      self.isTitleEdit = true;
    }
    self.title = result?.title || "";
    console.log("👌 Get Title Success～");
  });
};

// SetBadgeText
export const setBadgeText = (text = "0", color = "#4ea30a") => {
  chrome.action.setBadgeText({ text: text });
  chrome.action.setBadgeBackgroundColor({ color: color });
};

// Get all date-keyed task summaries for calendar indicators
export const getAllTaskDateSummary = (callback) => {
  chrome.storage.sync.get(null, (result) => {
    const summary = {};
    Object.keys(result).forEach((key) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
        const tasks = result[key];
        if (Array.isArray(tasks) && tasks.length > 0) {
          const completed = tasks.filter((t) => t.checked).length;
          const pending = tasks.filter((t) => !t.checked).length;
          if (completed > 0 || pending > 0) {
            summary[key] = { completed, pending };
          }
        }
      }
    });
    callback(summary);
  });
};
