/**
 * Copyright (c) 2019
 * AppWrap Inc
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of AppWrap Inc. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with AppWrap Inc.
 *
 * Script Name: AppWrap|Call Reject Reason Suitelet
 *
 * Script Description:
 * This workflow action calls the suitelet where the user can enter the reason for the rejection
 *
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *     | Author                      | Date          | Version       | Comments                                                                |
 *     |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *     | Gerrom V. Infante           | Nov 20 2020   | 1.0           | Initial Version                                                         |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 * Deployed:
 *
 *     |-------------------------------------------------------|
 *     | Record              | Id                              |
 *     |---------------------|---------------------------------|
 *     | Purchase Order      | purchaseorder                   |
 *     |-------------------------------------------------------|
 *
 * Script Parameters
 *
 *     |---------------------------------------------------------------------------------------------------------------------|
 *     | ID                              | Type               | Description                                                  |
 *     |---------------------------------|--------------------|--------------------------------------------------------------|
 *     | custscript_aw_wa_scriptid       | Free Form Text     | The id of the suitelet that will be called                   |
 *     | custscript_aw_wa_deployid       | Free Form Text     | The deployment id of the suitelet that will be called        |
 *     |---------------------------------------------------------------------------------------------------------------------|
 *
 */
define(["N/runtime", "N/redirect"], function (nsRuntime, nsRedirect) {

    /**
     * @exports onAction
     *
     *
     * @NApiVersion 2.0
     * @NModuleScope SameAccount
     * @NScriptType WorkflowActionScript
     */
    var exports = {};

    /**
     * <code>onAction</code> event handler
     *
     * @governance XXX
     *
     * @param context
     *        {Object}
     * @param context.newRecord
     *        {Record} The new record with all changes. <code>save()</code> is not
     *        permitted.
     * @param context.oldRecord
     *        {Record} The old record with all changes. <code>save()</code> is not
     *        permitted.
     * @param context.form
     *        {serverWidget.Form} The record form loaded in the UI
     * @param context.type
     *        {String} The event type, such as create, edit, view, delete, etc
     * @param context.workflowId
     *        {String} The internal ID of the workflow that invoked this script
     *
     * @return {void}
     *
     * @static
     * @function onAction
     */
    function onAction(context) {
        log.audit({title: "onAction", details: "==================== ON ACTION EVENT START ===================="});

        var ScriptId = nsRuntime.getCurrentScript().getParameter({name: "custscript_aw_wa_scriptid"});
        var DeployId = nsRuntime.getCurrentScript().getParameter({name: "custscript_aw_wa_deployid"});

        nsRedirect.toSuitelet({scriptId: ScriptId, deploymentId: DeployId, parameters: {custpage_recordid : context.newRecord.id}});

        log.audit({title: "onAction", details: "==================== ON ACTION EVENT END ===================="});
    }

    exports.onAction = onAction;
    return exports;
});
