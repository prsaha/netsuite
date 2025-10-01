/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(['N/piremoval', 'N/log'], function (piremoval, log) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            try {

                var piRemovalTaskIn = piremoval.createTask({
                    recordType: 'customer',
                    recordIds: [2718802],
                    fieldIds: ['email'],
                    historyOnly: false,
                    historyReplacement: 'removed_value'
                });

                piRemovalTaskIn.save();
                var taskId = piRemovalTaskIn.id;

                var piRemovalTaskInProgress = piremoval.loadTask({
                    id: taskId
                });
                piRemovalTaskInProgress.run();

                var status = piremoval.getTaskStatus(taskId);

                log.audit('PII Removal', 'Task created and run. Task ID: ' + taskId);
                context.response.write('PII removal task created and executed. Task ID: ' + taskId);

            } catch (e) {
                log.error({
                    title: 'PII Removal Error',
                    details: e
                });
                context.response.write('Error during PII removal: ' + e.message);
            }
        }
    }

    return {
        onRequest: onRequest
    };
});
