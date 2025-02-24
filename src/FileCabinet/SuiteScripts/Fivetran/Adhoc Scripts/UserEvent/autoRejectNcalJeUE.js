/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * 
 *
    Copyright (c) 2025  Fivetran.
    All Rights Reserved.
 *
 * This software is the confidential and proprietary information of
 * Fivetran ("Confidential Information"). You shall not
 * disclose such Confidential Information and shall use it only in
 * accordance with the terms of the license agreement you entered into
 * with Fivetran.
 */

/**
*  Author: Vasu
*/

define(['N/record', 'N/runtime'],
    /**
 * @param{record} record
 */
    (record, runtime) => {

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            if (scriptContext.type !== scriptContext.UserEventType.CREATE) {
                return;
            }
            try {
                const scriptObj = runtime.getCurrentScript();
                const REJECTED = scriptObj.getParameter({ name: 'custscript_ft_sp_rejected' });
                const newRecord = scriptContext.newRecord;
                /**** FUTURE REFERENCE: Commenting this line out because "isAnyReclassJE" returning empty when running the reclassifications batch job ***/
                /* 
                const isAnyReclassJE = newRecord.getValue({ fieldId: 'isanyreclassje' });
                 log.audit('isAnyReclassJE', isAnyReclassJE);
                 if (isAnyReclassJE !== 'T') return;
                 **/
                const lineCount = newRecord.getLineCount({ sublistId: 'line' });
                if (lineCount === 0) return;
                const firstLineMemo = newRecord.getSublistValue({
                    sublistId: 'line',
                    fieldId: 'memo',
                    line: 0
                });
                if (firstLineMemo && firstLineMemo.includes('Net Contract Asset or Liability per Element')) {
                    log.audit('NCAL JE', 'NCAL JE')
                    newRecord.setValue({ fieldId: 'approvalstatus', value: REJECTED });
                }

            }
            catch (error) {
                log.error(
                    {
                        title: 'Error in before submit',
                        details: error
                    }
                )
            }

        };

        return { beforeSubmit }

    });
