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
            const inputData = runtime.getCurrentScript().getParameter({
                name: "custscript_ft_sp_apprvd_pii_entries"
            });
            log.debug('Input Data', inputData);
            return JSON.parse(inputData); // [{ piiEntryId, entityId, entityType, approver, action, piiFields }]
        } catch (ex) {
            log.error("Error in getInputData", ex);
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
        const { piiEntryId, entityId, entityType, approver, action, reviewerComment } = piiRecord;
        log.debug('reviewerComment', reviewerComment);
        let fields = piiRecord.piiFields;

        if (typeof fields === 'string') {
            try {
                fields = JSON.parse(fields);
            } catch (e) {
                return updatePIIRecordStatus({
                    piiEntryId,
                    status: 'Error',
                    approverId: approver,
                    errorMessage: e.message
                });
            }
        }

        // Handle rejection
        if (action === 'reject') {
            return updatePIIRecordStatus({
                piiEntryId,
                status: 'Rejected',
                approverId: approver,
                reviewerComment
            });
        }

        // Validate field input
        if (!Array.isArray(fields) || fields.length === 0) {
            return updatePIIRecordStatus({
                piiEntryId,
                status: 'Error',
                approverId: approver,
                errorMessage: 'No fields provided for PII clearing.'
            });
        }

        // Separate field types
        const selectFields = fields.filter(f => f.type === 'select').map(f => f.id);
        const decimalFields = fields.filter(f => f.type === 'decimal').map(f => f.id);
        const piiRemovalFields = fields.filter(f => !['select', 'decimal'].includes(f.type)).map(f => f.id);

        let hadError = false;
        let errorMessage = '';

        try {
            // Clear select and decimal fields via submitFields
            const valuesToClear = {};
            selectFields.forEach(id => valuesToClear[id] = '');
            decimalFields.forEach(id => valuesToClear[id] = 0.00);

            if (Object.keys(valuesToClear).length > 0) {
                record.submitFields({
                    type: entityType,
                    id: entityId,
                    values: valuesToClear,
                    options: {
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
                log.audit('Select/Decimal fields cleared', { piiEntryId, entityId, valuesToClear });
            }

            // Clear remaining fields using PII Removal API
            if (piiRemovalFields.length > 0) {
                const task = piremoval.createTask({
                    recordType: entityType,
                    recordIds: [entityId],
                    fieldIds: piiRemovalFields,
                    workflowIds: [],
                    historyOnly: false
                });
                task.save();
                piremoval.loadTask({ id: task.id }).run();
                log.audit('PII Cleared (non-select/decimal)', { piiEntryId, entityId, piiRemovalFields });
            }

            // Process related contacts if entity is Customer, Vendor, Employee, or Partner
            if (['customer', 'vendor', 'employee', 'partner'].includes(entityType.toLowerCase())) {
                processContacts(entityId);
            }

        } catch (e) {
            hadError = true;
            errorMessage = e.message || e.toString();
            log.error('PII Processing Error', { piiEntryId, errorMessage });
        }

        // Update status after processing
        updatePIIRecordStatus({
            piiEntryId,
            status: hadError ? 'Error' : 'Processed',
            approverId: approver,
            entityId,
            entityType,
            errorMessage,
            reviewerComment
        });
    }

    function processContacts(parentId) {
        try {
            let contactSearch = search.create({
                type: 'contact',
                filters: [['company', 'anyof', parentId]],
                columns: ['internalid']
            });

            contactSearch.run().each(result => {
                let contactId = result.getValue('internalid');
                try {
                    // Load fields to be cleared from script param
                    let piiConfigRaw = runtime.getCurrentScript().getParameter({
                        name: 'custscript_sp_pii_removal_fields_v1'
                    });
                    if (!piiConfigRaw) {
                        log.error('Missing PII Config', 'Script parameter is empty or missing');
                        return true;
                    }

                    let piiMap = JSON.parse(piiConfigRaw);
                    let fields = piiMap['contact'] || [];
                    if (fields.length === 0) {
                        log.audit('No PII fields configured for contact', contactId);
                        return true;
                    }

                    // Separate field types
                    const selectFields = fields.filter(f => f.type === 'select').map(f => f.id);
                    const decimalFields = fields.filter(f => f.type === 'decimal').map(f => f.id);
                    const piiRemovalFields = fields.filter(f => !['select', 'decimal'].includes(f.type)).map(f => f.id);

                    // Clear select/decimal fields via submitFields
                    const valuesToClear = {};
                    selectFields.forEach(id => valuesToClear[id] = '');
                    decimalFields.forEach(id => valuesToClear[id] = 0.00);

                    if (Object.keys(valuesToClear).length > 0) {
                        record.submitFields({
                            type: record.Type.CONTACT,
                            id: contactId,
                            values: valuesToClear,
                            options: {
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            }
                        });
                    }

                    // Clear remaining fields using PII removal API
                    if (piiRemovalFields.length > 0) {
                        const task = piremoval.createTask({
                            recordType: record.Type.CONTACT,
                            recordIds: [contactId],
                            fieldIds: piiRemovalFields,
                            workflowIds: [],
                            historyOnly: false
                        });
                        task.save();
                        piremoval.loadTask({ id: task.id }).run();
                    }

                    // Mark processed
                    record.submitFields({
                        type: record.Type.CONTACT,
                        id: contactId,
                        values: {
                            custentity_ft_pii_rem_processed: true
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });

                    log.audit('Contact PII Cleared', contactId);
                } catch (err) {
                    log.error('Contact Processing Failed', `${contactId} - ${err.message}`);
                }
                return true;
            });
        } catch (e) {
            log.error('Contact Search Failed', e.message);
        }
    }


    function updatePIIRecordStatus({
        piiEntryId,
        status,
        approverId,
        entityId,
        entityType,
        errorMessage = '',
        reviewerComment = ''
    }) {
        try {
            const STATUS_IDS = {
                Processed: 3,
                Error: 1,
                Rejected: 4
            };

            const values = {
                custrecord_ft_rs_pii_status: STATUS_IDS[status],
                custrecord_ft_rs_pii_reviewed_date: new Date(),
                custrecord_ft_rs_pii_reviewed_by: approverId,
                custrecord_ft_rs_pii_err_msg: '',
                custrecord_ft_rs_pii_review_comments: reviewerComment || ''
            };

            if (status === 'Error') {
                values.custrecord_ft_rs_pii_err_msg = errorMessage || 'Unknown error';
            }
            if (status === 'Rejected') {
                values.custrecord_ft_rs_pii_rejeceted_by = approverId;
            }
            if (status === 'Processed' && entityId && entityType) {
                values.custrecord_ft_rs_pii_apprvd_by = approverId;

                record.submitFields({
                    type: entityType,
                    id: entityId,
                    values: {
                        custentity_ft_pii_rem_processed: true
                    },
                    options: {
                        enablesourcing: false,
                        ignoreMandatoryFields: true
                    }
                });
            }

            record.submitFields({
                type: 'customrecord_ft_pii_removal_req',
                id: piiEntryId,
                values,
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                }
            });
            log.audit('PII Record Updated', {
                piiEntryId,
                status,
                approverId
            });
        } catch (e) {
            log.error('Failed to update PII record status', {
                piiEntryId,
                updateError: e.message || e
            });
        }
    }

    function summarize(summary) {
        const mapErrors = mrUtils.mapSummary(summary);
        const reduceErrors = mrUtils.reduceSummary(summary);
        const hasErrors = mapErrors.length > 0 || reduceErrors.length > 0;
        const title = hasErrors
            ? `Map/Reduce Summary with Errors`
            : `Map/Reduce Summary`;
        const details = {
            summary,
            ...(mapErrors.length > 0 && { mapErrors }),
            ...(reduceErrors.length > 0 && { reduceErrors })
        };
        const logMethod = hasErrors ? log.error : log.audit;
        logMethod({ title, details });
    }

    return {
        getInputData,
        map,
        reduce,
        summarize
    };
});
