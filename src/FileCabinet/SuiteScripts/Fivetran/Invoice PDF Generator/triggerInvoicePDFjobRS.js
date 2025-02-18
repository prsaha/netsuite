/**
    @NApiVersion 2.1
    @NScriptType Restlet
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
 *  Author: Prabal
 */
define(['N/task'],
    (task) => {
        const get = (requestParams) => {

            try {
                // Create and submit the Map/Reduce task to remove access to the employees whose termination date has populated on the employee record
                const mapReduceTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_ft_mr_inv_pdf_gen',
                    deploymentId: 'customdeploy_mr_inv_pdf_gen',
                });
                const taskId = mapReduceTask.submit();
                log.audit('Invoice PDF Generation Script Triggered', `Task ID: ${taskId}`);
                return {
                    success: true,
                    message: 'Invoice PDF Generation script triggered successfully.',
                    taskId
                };
            } catch (e) {
                log.error('Error triggering MR', e.message);
                return {
                    success: false,
                    message: `Failed to trigger Invoice PDF Generation script: ${e.message}`
                };
            }
        };
        return {
            get: get
        };
    });