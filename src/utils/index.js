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
