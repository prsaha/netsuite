/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/log'], (search, record, log) => {

    const CUSTOM_RECORD_TYPE = 'customrecord_ft_pii_removal_req';

    /**
     *  Get all records of type customrecord_ft_pii_removal_req
     */
    const getInputData = () => {
        return search.create({
            type: CUSTOM_RECORD_TYPE,
            filters: [], 
            columns: ['internalid']
        });
    };

    /**
     *  Delete each record
     */
    const map = (context) => {
        try {
            const searchResult = JSON.parse(context.value);
            const recId = searchResult.id;

            record.delete({
                type: CUSTOM_RECORD_TYPE,
                id: recId
            });

            log.debug({
                title: 'Deleted Record',
                details: `Deleted ${CUSTOM_RECORD_TYPE} with ID ${recId}`
            });
        } catch (e) {
            log.error({
                title: 'Delete Failed',
                details: e.message
            });
        }
    };

    /**
     *  Summarize process
     */
    const summarize = (summary) => {
        log.audit({
            title: 'Summary',
            details: `Finished deleting records of type ${CUSTOM_RECORD_TYPE}`
        });

        if (summary.inputSummary.error) {
            log.error({
                title: 'Input Error',
                details: summary.inputSummary.error
            });
        }

        summary.mapSummary.errors.iterator().each((key, error) => {
            log.error({
                title: `Error deleting record ID ${key}`,
                details: error
            });
            return true;
        });
    };

    return {
        getInputData,
        map,
        summarize
    };
});
