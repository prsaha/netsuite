/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */
define(['N/file', 'N/record', 'N/runtime', 'N/log'], function (file, record, runtime, log) {

    function getInputData() {
        var script = runtime.getCurrentScript();
        var fileId = script.getParameter({ name: 'custscript_sp_csv_file_id' });

        if (!fileId) {
            log.error('Missing Parameter', 'custscript_sp_csv_file_id is not provided.');
            return [];
        }

        var fileObj = file.load({ id: fileId });
        var contents = fileObj.getContents();
        var lines = contents.split(/\r?\n/);
        var ids = [];

        for (var i = 1; i < lines.length; i++) { // skip header
            var line = lines[i].trim();
            if (line) {
                var columns = line.split(',');
                var internalId = columns[0].trim();
                if (internalId) {
                    ids.push(internalId);
                }
            }
        }

        log.audit('Input Data Loaded', `Total IDs parsed from file: ${ids.length}`);
        return ids;
    }

    function map(context) {
        var internalId = context.value;

        try {
            record.delete({
                type: record.Type.INVOICE,
                id: internalId
            });

            log.audit({
                title: 'Invoice Deleted',
                details: `Successfully deleted Invoice with internal ID: ${internalId}`
            });

        } catch (e) {
            log.error({
                title: 'Failed to Delete Invoice',
                details: `Internal ID: ${internalId}, Error: ${e.message}`
            });

            // Optionally: pass error to summarize
            context.write({
                key: internalId,
                value: e.message
            });
        }
    }

    function summarize(summary) {
        log.audit('Summary', 'Map/Reduce Script Execution Completed');

        summary.mapSummary.errors.iterator().each(function (key, error) {
            log.error({
                title: `Error Deleting Invoice ID: ${key}`,
                details: error
            });
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };

});
