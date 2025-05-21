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

/**
 *  
 * GET Response Sample Payload:
 {
    "success": true,
    "message": "Invoice PDF Generation script triggered successfully.",
    "taskId": "MAPREDUCETASK_02686f157c6b17050417060f6c1d0057380b04071d1669011645074d5e_658cb17cc6051f2a7d1d330ee9347b9145135a0d",
    "timeStamp": "2025-02-21T17:36:39.143Z"
}
 * 
 * POST Payload Sample Request:

  {
    "taskId": "MAPREDUCETASK_02686f157c6b17050417060f6c1d0057380b04071d166c011645074d5e_1050a8292f283aac6bc76b4f281507efc48ef616"
  } 

   /* POST Payload Sample Response:
    {
    "success": true,
    "status": "COMPLETE",
    "files": [
        {
            "rownumber": 1,
            "id": 2856923,
            "name": "INV23112430044.pdf",
            "url": "/core/media/media.nl?id=2856923&c=5260239_SB1&h=oVIpc6IP7VEwN10Z3k_q0HTeTLNv2P2lcyoMZa2ic8qK5lA0&_xt=.pdf",
            "fullUrl": "https://5260239-sb1.app.netsuite.com/core/media/media.nl?id=2856923&c=5260239_SB1&h=oVIpc6IP7VEwN10Z3k_q0HTeTLNv2P2lcyoMZa2ic8qK5lA0&_xt=.pdf"
        },
        {
            "rownumber": 2,
            "id": 2856924,
            "name": "INV23112430950.pdf",
            "url": "/core/media/media.nl?id=2856924&c=5260239_SB1&h=1qDETqu_MDPT3XpHzb7ZZWKuFWpitkCnu840cEJ4nQwAEdZB&_xt=.pdf",
            "fullUrl": "https://5260239-sb1.app.netsuite.com/core/media/media.nl?id=2856924&c=5260239_SB1&h=1qDETqu_MDPT3XpHzb7ZZWKuFWpitkCnu840cEJ4nQwAEdZB&_xt=.pdf"
        }
    ]
    }
 */

define([
    'N/task',
    'N/runtime',
    'N/url',
    '/SuiteScripts/Fivetran/Utilities/suiteQlUtilities'
],
    (task, runtime, url, suiteQlUtils) => {
        const generateInvoicePDfsGet = (requestParams) => {

            try {
                // Create and submit the Map/Reduce task to remove access to initiate the invoice pdf generation job
                const mapReduceTask = task.create({
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: 'customscript_ft_mr_inv_pdf_gen',
                    deploymentId: 'customdeploy_mr_inv_pdf_gen',
                });
                const taskId = mapReduceTask.submit();
                let timeStamp = new Date().toISOString().slice(0, -1);
                log.audit('Invoice PDF Generation Script Triggered', `Task ID: ${taskId}`);
                return {
                    success: true,
                    message: 'Invoice PDF Generation script triggered successfully.',
                    taskId,
                    timeStamp
                };
            } catch (e) {
                log.error('Error triggering MR', e.message);
                return {
                    success: false,
                    message: `Failed to trigger Invoice PDF Generation script: ${e.message}`
                };
            }
        };


        const writeInvoicePdfUrlsPost = (requestBody) => {
            try {
                const taskId = requestBody.taskId;
                const scriptObj = runtime.getCurrentScript();
                const STAGED = scriptObj.getParameter({ name: 'custscript_ft_sp_dec_staged' });
                if (!taskId) {
                    return { success: false, message: 'Missing taskId', files: [] };
                }
                const taskStatusObj = task.checkStatus({ taskId });
                log.audit('Task Status', taskStatusObj.status);
                if (taskStatusObj.status === 'COMPLETE') {

                    const sql = `SELECT id, name, url FROM file WHERE folder = ${STAGED} AND filetype = 'PDF'`;
                    const files = suiteQlUtils.runQuery({ sql, pageSize: 5000, queryName: 'Invoice PDF Files' });
                    const domain = url.resolveDomain({ hostType: url.HostType.APPLICATION, accountId: runtime.accountId });


                    const invoiceNumbers = files.map(file => {
                        const match = file.name.match(/(INV\d+)/i);
                        return match ? match[1] : null;
                    }).filter(Boolean);
                    log.debug('Invoice Numbers', invoiceNumbers);
                    let invoiceAccountMap = {};


                    if (invoiceNumbers.length > 0) {
                        const quotedDocNums = invoiceNumbers.map(num => `'${num}'`).join(', ');
                        const accountQuery = `
                                        SELECT tran.tranid AS document_number, cust.custentity_ft_account_id_sf AS account_id
                                        FROM transaction tran
                                        JOIN customer cust ON tran.entity = cust.id
                                        WHERE tran.type = 'CustInvc'
                                        AND tran.tranid IN (${quotedDocNums})
                                    `;
                        const results = suiteQlUtils.runQuery({
                            sql: accountQuery,
                            pageSize: 1000,
                            queryName: 'Invoice Account Mapping'
                        });
                        results.forEach(row => {
                            invoiceAccountMap[row.document_number] = row.account_id;
                        });
                    }

                    const enrichedFiles = files.map(file => {
                        const match = file.name.match(/(INV\d+)/i);
                        const docNumber = match ? match[1] : null;
                        return {
                            ...file,
                            fullUrl: `https://${domain}${file.url}`,
                            billingAccountId: docNumber ? invoiceAccountMap[docNumber] || null : null
                        };
                    });
                    return { success: true, status: 'COMPLETE', files: enrichedFiles };
                } else {
                    return { success: true, status: taskStatusObj.status, files: [] };
                }
            } catch (e) {
                log.error('Error in POST handler', e);
                return { success: false, status: 'ERROR', message: e.message, files: [] };
            }
        };

        return {
            get: generateInvoicePDfsGet,
            post: writeInvoicePdfUrlsPost
        };
    });