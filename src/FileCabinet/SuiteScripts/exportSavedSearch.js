/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
 define(['N/task', 'N/file', 'N/error'],

function(task, file, error) {
    function exportToFileCabinet(searchId) {
        if (searchId === undefined)
            throw error.create({ name: 'UNSPECIFIED_SEARCH_ID', message: 'Search ID is mandatory'});

        var filePath = 'PigmentExports/' + searchId + '.csv';

        var searchTask = task.create({
            taskType: task.TaskType.SEARCH
        });
        searchTask.savedSearchId = searchId;
        searchTask.filePath = filePath;

        var searchTaskId = searchTask.submit();

        return { taskId: searchTaskId, filePath: filePath };
    }

    function getTaskStatus(taskId) {
        return task.checkStatus(taskId);
    }

    function isTaskCompleted(taskId) {
        var taskStatus = getTaskStatus(taskId);
        if (taskStatus.status == task.TaskStatus.FAILED)
            throw error.create({ name: 'EXPORT_TASK_FAILED', message: 'Export task has failed unexpectedly'});

        return taskStatus.status == task.TaskStatus.COMPLETE;
    }

    function downloadFromFileCabinet(fileId) {
        var fileCsv = file.load({
            id: fileId
        });
        var contents = '';
        fileCsv.lines.iterator().each(function (line) {
            contents += line.value + '\n';
            return true;
        });

        return contents;
    }

    function doGet(requestParams) {
        var method = requestParams.method;
        if (method == "export") {
            return JSON.stringify(exportToFileCabinet(requestParams.searchid));
        } else if (method == "status") {
            var taskStatus = getTaskStatus(requestParams.taskid);
            switch (taskStatus.status) {
                case task.TaskStatus.PENDING: return JSON.stringify({ status: "PENDING" });
                case task.TaskStatus.PROCESSING: return JSON.stringify({ status: "PROCESSING" });
                case task.TaskStatus.FAILED: return JSON.stringify({ status: "FAILED" });
                case task.TaskStatus.COMPLETE: return JSON.stringify({ status: "COMPLETE", fileId: taskStatus.fileId });
            }
        } else if (method == "download") {
            return downloadFromFileCabinet(requestParams.fileid);
        } else if (method == "exportAndWaitCompletion") {
            var exportTask = exportToFileCabinet(requestParams.searchid);
            while (!isTaskCompleted(exportTask.taskId)) {}
            return exportTask.fileId;
        } else if (method == "exportAndDownload") {
            var exportTask = exportToFileCabinet(requestParams.searchid);
            while (!isTaskCompleted(exportTask.taskId)) {}
            return downloadFromFileCabinet(exportTask.fileId);
        } else {
            throw error.create({ name: 'UNSPECIFIED_METHOD', message: 'Method parameter is mandatory'});
        }
    }

    return {
        'get': doGet,
    };
});
 