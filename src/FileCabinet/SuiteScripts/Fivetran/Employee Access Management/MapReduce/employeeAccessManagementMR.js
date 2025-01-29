/**
    @NApiVersion 2.1
    @NScriptType MapReduceScript
 *
    Copyright (c) 2025  Fivetran.
    All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Fivetran ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Fivetran.
 *
 */

/**
 *  Author: Vasu
 */


define([
    'N/record',
    '/SuiteScripts/Fivetran/Utilities/mapReduceUtilities'
], function (record, mrUtils) {
    const getInputData = () => {

        const empSql = `SELECT id FROM employee WHERE releasedate IS NOT NULL AND giveaccess = 'T'`;

        return {
            type: 'suiteql',
            query: empSql
        }
    }
    const map = (context) => {
        var result = JSON.parse(context.value);
        log.debug('result', result);
        var employeeId = result?.values?.[0];
        try {
            // Update the employee record to uncheck the access checkbox
            if (employeeId) {
                record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: employeeId,
                    values: {
                        giveaccess: false
                    }
                });
                log.audit('Access Removed', `Employee ID: ${employeeId}`);
            }

        } catch (e) {
            log.error(`Error processing Employee ID: ${employeeId}`, e);
        }
    }
    const summarize = (summary) => {
        //Handle map summary errors.
        let mapErrors = mrUtils.mapSummary(summary);

        if (mapErrors.length === 0) {
            log.audit({
                title: "Map Reduce Summary",
                details: {
                    summary: summary
                }
            });
        }

        if (mapErrors.length > 0) {
            log.error({
                title: `Map Reduce Summary with ${mapErrors.length} errors`,
                details: {
                    summary: summary,
                    errors: mapErrors
                }
            });
        }
    }
    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});