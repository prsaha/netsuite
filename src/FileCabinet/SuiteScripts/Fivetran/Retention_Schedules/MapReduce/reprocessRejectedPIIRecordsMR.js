/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/runtime'], (search, record, runtime) => {

    const PII_RECORD_TYPE = 'customrecord_ft_pii_removal_req';
    const STATUS_FIELD_ID = 'custrecord_ft_rs_pii_status';
    const REVIEWED_DATE_FIELD_ID = 'custrecord_ft_rs_pii_reviewed_date';

    const STATUS_REJECTED = 4;
    const STATUS_PENDING = 2;

    const getInputData = () => {
        const daysParam = runtime.getCurrentScript().getParameter({
            name: 'custscript_pii_rejected_days'
        });
        const days = daysParam ? parseInt(daysParam, 10) : 30;
        log.debug('days', days);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const cutoffDateStr = formatDate(cutoffDate);
        log.debug('cutoffDateStr', cutoffDateStr);

        return search.create({
            type: PII_RECORD_TYPE,
            filters: [
                [STATUS_FIELD_ID, 'is', STATUS_REJECTED],
                'AND',
                [REVIEWED_DATE_FIELD_ID, 'onorbefore', cutoffDateStr]
            ],
            columns: ['internalid']
        });
    };


    

    const map = (context) => {
        const result = JSON.parse(context.value);
        const recId = result.id;

        try {
            log.debug('recId', recId);
            record.submitFields({
                type: PII_RECORD_TYPE,
                id: recId,
                values: {
                    [STATUS_FIELD_ID]: STATUS_PENDING
                }
            });
            log.audit('Updated', `Record ${recId} marked as Pending`);
        } catch (e) {
            log.error('Error Updating Record', `Record ${recId}: ${e.message}`);
        }
    };

    const summarize = (summary) => {
        log.audit('Summary', `Completed with usage: ${summary.usage}`);
        if (summary.inputSummary.error) {
            log.error('Input Error', summary.inputSummary.error);
        }

        summary.mapSummary.errors.iterator().each((key, error) => {
            log.error(`Map Error for key: ${key}`, error);
            return true;
        });
    };


    const formatDate = (dateObj) => {
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${month}/${day}/${year}`;
    };

    return { getInputData, map, summarize };
});
