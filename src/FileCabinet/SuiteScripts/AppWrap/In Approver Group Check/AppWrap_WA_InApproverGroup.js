/*
 *  Copyright (c) 2024
 *  AppWrap, LLC
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of AppWrap, LLC. ('Confidential Information').
 *  You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the
 *  license agreement you entered into with AppWrap, LLC.
 *
 * AppWrap, LLC Code Disclaimer
 * ================================================================================
 * This code has been provided by AppWrap, LLC, a NetSuite consulting firm specializing
 * in integration and IT solutions. The following terms and conditions apply to
 * the use of this code by the recipient:
 *
 * 1. Use of Code:
 *   This code is provided to the recipient for the sole purpose of addressing
 *   specific integration or IT challenges as discussed between AppWrap, LLC and the
 *   recipient. Any use of this code for purposes other than its intended use
 *   requires prior written consent from AppWrap, LLC.
 *
 * 2. No Warranty:
 *    This code is provided "as is" and without any warranty, express or implied.
 *    AppWrap, LLC does not guarantee the accuracy, reliability, or suitability of this
 *    code for any particular purpose. The recipient acknowledges that the use of
 *    this code is at their own risk.
 *
 * 3. Limitation of Liability:
 *    In no event shall AppWrap, LLC be liable for any direct, indirect, incidental,
 *    special, exemplary, or consequential damages arising in any way out of the
 *    use of this code, even if advised of the possibility of such damage.
 *
 * 4. Support and Modifications:
 *    AppWrap, LLC is not obligated to provide support, maintenance, or updates for
 *    this code. However, the recipient may contact AppWrap, LLC for additional
 *    assistance or modifications, subject to mutually agreed-upon terms.
 *
 * 5. Intellectual Property:
 *    All intellectual property rights to this code, including but not limited to
 *    copyrights, trademarks, and trade secrets, are owned by AppWrap, LLC. The
 *    recipient is prohibited from reproducing, distributing, or modifying this
 *    code without explicit written permission from AppWrap, LLC.
 *
 * By using this code, the recipient agrees to comply with the terms and conditions
 * outlined above. If you have any questions or concerns about the use of this code,
 * please contact AppWrap, LLC at support@appwrap.tech.
 *
 * --------------------------------------------------------------------------------
 *
 *  Script Name: AW|WA In Approver Group
 *
 *  Script Description:
 *  Checks if employee is part of an approver group, if Yes it will turn the flag on for the record
 *
 *  |---------------------------------------------------------------------------------------------------------------------------------------|
 *  | Author                      | Date          | Version       | Comments                                                                |
 *  |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *  | Gerrom V. Infante           | Mar/20/2024   | 1.0           | Initial Version                                                         |
 *  |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 */
define((require) => {
  /**
   * This is the entry point module for the custom workflow action script
   *
   * @type {Object} AppWrap_WA_InApproverGroup.js
   *
   * @copyright 2024 AppWrap, LLC
   * @author Gerrom V. Infante <ginfan@appwrap.tech>
   *
   * @NApiVersion 2.1
   * @NModuleScope Public
   * @NScriptType WorkflowActionScript
   */
  const exports = {};
  const moduleName = "AppWrap_WA_InApproverGroup.js";

  const nsRuntime = require("N/runtime");

  /**
   * onAction event handler
   *
   * @gov XXX
   *
   * @param {Object} context
   * @param {Record} context.newRecord - The new record with all changes. save() is not permitted
   * @param {Record} context.oldRecord - The old record with all changes. save() is not permitted
   * @param {Form} context.form - The UI form in context; only available in beforeLoad context
   * @param {string} context.type - Event Type, such as create, edit, delete
   * @param {number} context.workflowId - Internal ID of the currently executing workflow
   */
  function onAction(context) {
    const logTitle = `${moduleName}.onAction`;

    log.debug({
      title: logTitle,
      details: "==================== ON ACTION START ====================",
    });

    // log the id of the record being processed
    log.debug({
      title: logTitle,
      details: `Record ID: ${context.newRecord.id}`,
    });

    const inApproverGroup = require("./modules/AppWrap_InApproverGroup");

    // get the current user
    const currentUser = nsRuntime.getCurrentUser().id;
    log.debug({
      title: logTitle,
      details: `User ID: ${currentUser}`,
    });

    const InApproverGroupClass = new inApproverGroup.InApproverGroup(
      currentUser
    );

    // check if record is in an approver group
    const inGroup = InApproverGroupClass.check();

    log.debug({
      title: logTitle,
      details: "==================== ON ACTION END ====================",
    });

    return inGroup === true ? "T" : "F";
  }

  exports.onAction = onAction;
  return exports;
});
