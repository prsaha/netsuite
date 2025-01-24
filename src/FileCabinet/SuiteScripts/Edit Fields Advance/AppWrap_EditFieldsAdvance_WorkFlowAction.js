/**
 * Copyright (c) 2018
 * AppWrap LLC
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of AppWrap LLC. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license
 * agreement you entered into with AppWrap LLC.
 *
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *     | Author                      | Date          | Version       | Comments                                                                |
 *     |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *     | MJ Pascual	                 | Feb 28 2018   | 1.1           | Initial Version                                                         |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 */

/**
 * @NApiVersion 2.x
 * @NScriptType WorkflowActionScript
 * @NModuleScope Public
 */
define(["N/redirect", "N/runtime", "./editfield_lib/UtilityBelt"], function (redirect, runtime, utility) {
  function onAction(scriptContext) {
    var logTitle = "AppWrap|EditFieldsWA.onAction";

    //Body Fields
    var stBodySS = runtime
      .getCurrentScript()
      .getParameter("custscript_aw_bodys_ss");
    var stBodyMandatory = runtime
      .getCurrentScript()
      .getParameter("custscript_aw_bodys_mandatory");
    var stBodyNotes = runtime
      .getCurrentScript()
      .getParameter("custscript_aw_bodys_notes");

    //List Fields
    var stList = runtime
      .getCurrentScript()
      .getParameter("custscript_aw_params");
    var bListAmort = runtime
      .getCurrentScript()
      .getParameter("custscript_aw_amortsched");
    var bAddRemoveLinesOn = runtime
      .getCurrentScript()
      .getParameter("custscript_aw_add_remove_items_on");

    log.audit({
      title: logTitle,
      details:
        "==================== CUSTOM WORKFLOW ACTION START ====================",
    });

    // store the information needed by the Suitelet
    var suiteletInfo = {};
    suiteletInfo.custpage_id = scriptContext.newRecord.id;
    suiteletInfo.custpage_type = scriptContext.newRecord.type;
    suiteletInfo.custpage_body_ss = stBodySS;
    suiteletInfo.custpage_body_man = stBodyMandatory;
    suiteletInfo.custpage_body_not = stBodyNotes;
    suiteletInfo.custpage_amortsched = utility.toBoolean(bListAmort);
    suiteletInfo.custpage_add_remove_lines = utility.toBoolean(bAddRemoveLinesOn);

    suiteletInfo.custpage_list = stList;

    log.debug({
      title: logTitle,
      details: "JSON.stringify(suiteletInfo) =" + JSON.stringify(suiteletInfo),
    });

    log.audit({
      title: logTitle,
      details: "Calling to Suitelet...",
    });

    redirect.toSuitelet({
      scriptId: "customscript_aw_edit_linefields_advsl",
      deploymentId: "customdeploy_aw_edit_field_adv_sl",
      parameters: suiteletInfo,
    });

    log.audit({
      title: "wf",
      details:
        "==================== CUSTOM WORKFLOW ACTION END ====================",
    });
  }
  return {
    onAction: onAction,
  };
});
