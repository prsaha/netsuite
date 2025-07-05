/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/record', 'N/runtime'], function (file, record, runtime) {

    function getInputData() {

        var script = runtime.getCurrentScript();

        var fileId = script.getParameter({ name: 'custscript_sp_csv_file_id' });

        var fileObj = file.load({
            id: fileId
        });

        var contents = fileObj.getContents();
        var lines = contents.split(/\r?\n/);
        var ids = [];

        for (var i = 1; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line) {
                var columns = line.split(',');
                var internalId = columns[0].trim();
                if (internalId) {
                    ids.push(internalId);
                }
            }
        }

        return ids;
    }

    function map(context) {
        var internalId = context.value;

        try {
            record.delete({
                type: record.Type.SALES_ORDER,
                id: internalId
            });
            log.audit('Deleted Sales Order', 'Internal ID: ' + internalId);
        } catch (e) {
            log.error('Failed to delete Sales Order', 'ID: ' + internalId + ', Error: ' + e.message);
        }
    }

    function summarize(summary) {
        log.audit('Summary', 'Map/Reduce Script Execution Completed');

        // Log total errors
        summary.mapSummary.errors.iterator().each(function (key, error) {
            log.error('Error Deleting Sales Order ID: ' + key, error);
            return true;
        });

    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };

});
