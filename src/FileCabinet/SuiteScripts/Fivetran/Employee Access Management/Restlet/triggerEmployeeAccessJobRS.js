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
 *  Author: Vasu
 */
define(['N/task'],
    (task) => {
        const triggerTerminateEmployeeAccessMR = (requestParams) => {

            try {
                // Create and submit the Map/Reduce task to remove access to the employees whose termination date has populated on the employee record
                const mapReduceTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_ft_emp_acc_mgnt',
                    deploymentId: 'customdeploy_ft_emp_acc_mgnt',
                });
                const taskId = mapReduceTask.submit();
                log.audit('Employee Access Management Script Triggered', `Task ID: ${taskId}`);
                return {
                    success: true,
                    message: 'Employee Access Management script triggered successfully.',
                    taskId
                };
            } catch (e) {
                log.error('Error triggering MR', e.message);
                return {
                    success: false,
                    message: `Failed to trigger Employee Access Management script: ${e.message}`
                };
            }
        };
        return {
            get: triggerTerminateEmployeeAccessMR
        };
    });