/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define([
    'N/record',
    'N/runtime',
    'N/piremoval',
    'N/search',
    '/SuiteScripts/Fivetran/Utilities/mapReduceUtilities'
], function (record, runtime, piremoval, search, mrUtils) {

    function getInputData() {
        try {
            const piiSearch = search.create({
                type: 'customrecord_ft_pii_removal_req',
                filters: [
                    ['custrecord_ft_rs_pii_record_type', 'anyof', [3, 5]], // Employee=3, Vendor=5
                    'AND',
                    ['custrecord_ft_pii_entity_inactive', 'is', 'T'],      // only inactive
                    'AND',
                    ['custrecord_ft_rs_pii_status', 'anyof', 2],           // pending
                    'AND',
                    ['custrecord_ft_rs_pii_entity_internalid', 'isnotempty', '']
                ],
                columns: [
                    'internalid',
                    'custrecord_ft_rs_pii_entity_internalid',
                    'custrecord_ft_rs_pii_record_type',
                    'custrecord_ft_rs_pii_flds_to_rmv'
                ]
            });

            const results = [];
            piiSearch.run().each(result => {
                const entityIdText = result.getValue('custrecord_ft_rs_pii_entity_internalid');
                const entityId = parseInt(entityIdText, 10);

                if (isNaN(entityId)) {
                    log.error('Invalid Entity ID', { piiEntryId: result.getValue('internalid'), entityIdText });
                    return true;
                }

                results.push({
                    piiEntryId: result.getValue('internalid'),
                    entityId,
                    entityType: result.getText('custrecord_ft_rs_pii_record_type').toLowerCase(),
                    piiFields: result.getValue('custrecord_ft_rs_pii_flds_to_rmv')
                });
                return true;
            });

            log.debug('Inactive PII search created', `matching records: ${results.length}`);
            return results;

        } catch (ex) {
            log.error("Error in getInputData", ex);
            throw ex;
        }
    }

    function map(context) {
        const entry = JSON.parse(context.value);
        context.write({
            key: entry.piiEntryId,
            value: JSON.stringify(entry)
        });
    }

    function reduce(context) {
        const piiRecord = JSON.parse(context.values[0]);
        const { piiEntryId, entityId, entityType } = piiRecord;
        let fields = piiRecord.piiFields;

        if (typeof fields === 'string') {
            try {
                fields = JSON.parse(fields);
            } catch (e) {
                return updatePIIRecordStatus({ piiEntryId, status: 'Error', errorMessage: e.message });
            }
        }

        if (!Array.isArray(fields) || fields.length === 0) {
            return updatePIIRecordStatus({ piiEntryId, status: 'Error', errorMessage: 'No fields provided for PII clearing.' });
        }

        const selectFields = fields.filter(f => f.type === 'select').map(f => f.id);
        const decimalFields = fields.filter(f => f.type === 'decimal').map(f => f.id);
        const piiRemovalFields = fields.filter(f => !['select', 'decimal'].includes(f.type)).map(f => f.id);

        let hadError = false;
        let errorMessage = '';

        try {
            const valuesToClear = {};
            selectFields.forEach(id => valuesToClear[id] = '');
            decimalFields.forEach(id => valuesToClear[id] = 0.00);

            if (Object.keys(valuesToClear).length > 0) {
                record.submitFields({
                    type: entityType,
                    id: entityId,
                    values: valuesToClear,
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });
                log.audit('Select/Decimal fields cleared', { piiEntryId, entityId, valuesToClear });
            }

            if (piiRemovalFields.length > 0) {
                const task = piremoval.createTask({ recordType: entityType, recordIds: [entityId], fieldIds: piiRemovalFields, workflowIds: [], historyOnly: false });
                task.save();
                piremoval.loadTask({ id: task.id }).run();
                log.audit('PII Cleared (non-select/decimal)', { piiEntryId, entityId, piiRemovalFields });
            }

        } catch (e) {
            hadError = true;
            errorMessage = e.message || e.toString();
            log.error('PII Processing Error', { piiEntryId, errorMessage });
        }

        // Auto-approved: mark processed or error
        updatePIIRecordStatus({
            piiEntryId,
            status: hadError ? 'Error' : 'Processed',
            entityId,
            entityType,
            errorMessage
        });
    }

    function updatePIIRecordStatus({ piiEntryId, status, entityId, entityType, errorMessage = '' }) {
        try {
            const STATUS_IDS = { Processed: 3, Error: 1 };

            const values = {
                custrecord_ft_rs_pii_status: STATUS_IDS[status],
                custrecord_ft_rs_pii_reviewed_date: new Date(),
                custrecord_ft_rs_pii_err_msg: errorMessage || ''
            };

            if (status === 'Processed' && entityId && entityType) {
                record.submitFields({
                    type: entityType,
                    id: entityId,
                    values: { custentity_ft_pii_rem_processed: true },
                    options: { enableSourcing: false, ignoreMandatoryFields: true }
                });
            }

            record.submitFields({
                type: 'customrecord_ft_pii_removal_req',
                id: piiEntryId,
                values,
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });

            log.audit('PII Record Updated', { piiEntryId, status });
        } catch (e) {
            log.error('Failed to update PII record status', { piiEntryId, updateError: e.message || e });
        }
    }

    function summarize(summary) {
        const mapErrors = mrUtils.mapSummary(summary);
        const reduceErrors = mrUtils.reduceSummary(summary);
        const hasErrors = mapErrors.length > 0 || reduceErrors.length > 0;
        const title = hasErrors ? `Map/Reduce Summary with Errors` : `Map/Reduce Summary`;
        const details = { summary, ...(mapErrors.length > 0 && { mapErrors }), ...(reduceErrors.length > 0 && { reduceErrors }) };
        const logMethod = hasErrors ? log.error : log.audit;
        logMethod({ title, details });
    }

    return { getInputData, map, reduce, summarize };
});
