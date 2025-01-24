/*
 *  Copyright (c) 2024
 *  AppWrap, Inc.
 *  All Rights Reserved.
 *
 *  This software is the confidential and proprietary information of AppWrap, Inc.. ('Confidential Information').
 *  You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the
 *  license agreement you entered into with AppWrap, Inc..
 *
 * AppWrap Code Disclaimer
 * ================================================================================
 * This code has been provided by AppWrap, a NetSuite consulting firm specializing
 * in integration and IT solutions. The following terms and conditions apply to
 * the use of this code by the recipient:
 *
 * 1. Use of Code:
 *   This code is provided to the recipient for the sole purpose of addressing
 *   specific integration or IT challenges as discussed between AppWrap and the
 *   recipient. Any use of this code for purposes other than its intended use
 *   requires prior written consent from AppWrap.
 *
 * 2. No Warranty:
 *    This code is provided "as is" and without any warranty, express or implied.
 *    AppWrap does not guarantee the accuracy, reliability, or suitability of this
 *    code for any particular purpose. The recipient acknowledges that the use of
 *    this code is at their own risk.
 *
 * 3. Limitation of Liability:
 *    In no event shall AppWrap be liable for any direct, indirect, incidental,
 *    special, exemplary, or consequential damages arising in any way out of the
 *    use of this code, even if advised of the possibility of such damage.
 *
 * 4. Support and Modifications:
 *    AppWrap is not obligated to provide support, maintenance, or updates for
 *    this code. However, the recipient may contact AppWrap for additional
 *    assistance or modifications, subject to mutually agreed-upon terms.
 *
 * 5. Intellectual Property:
 *    All intellectual property rights to this code, including but not limited to
 *    copyrights, trademarks, and trade secrets, are owned by AppWrap. The
 *    recipient is prohibited from reproducing, distributing, or modifying this
 *    code without explicit written permission from AppWrap.
 *
 * By using this code, the recipient agrees to comply with the terms and conditions
 * outlined above. If you have any questions or concerns about the use of this code,
 * please contact AppWrap at support@appwrap.tech.
 *
 * --------------------------------------------------------------------------------
 *
 *  Script Name:  AW | In Approver Group
 *
 *  Script Description:
 *  Checks if employee is part of an approver group, if Yes it will turn the flag on for the record
 *
 *  |---------------------------------------------------------------------------------------------------------------------------------------|
 *  | Author                      | Date          | Version       | Comments                                                                |
 *  |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *  | Gerrom V. Infante           | Mar/08/2024   | 1.0           | Initial Version                                                         |
 *  |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 */
define((require) => {
  /**
   * Entry point script
   *
   * @type {Object} AppWrap_UE_InApproverGroup.js
   *
   * @copyright 2024 AppWrap, Inc.
   * @author Gerrom V. Infante <ginfan@appwrap.tech>
   *
   * @NApiVersion 2.1
   * @NModuleScope Public
   * @NScriptType UserEventScript
   */
  const exports = {};
  const moduleName = "AppWrap_UE_InApproverGroup.js";

  /**
   * afterSubmit event handler; executes immediately after a write operation on a record.
   *
   * @gov XXX
   *
   * @param {Object} context
   * @param {Record} context.newRecord - The new record being submitted
   * @param {Record} context.oldRecord - The old record before it was modified
   * @param {UserEventType} context.type - The action type that triggered this event
   */
  function afterSubmit(context) {
    const logTitle = `${moduleName}.afterSubmit`;

    // check that the record is not being deleted
    if (context.type === context.UserEventType.DELETE) {
      return true;
    }

    log.debug({
      title: logTitle,
      details: "==================== AFTER SUBMIT START ====================",
    });

    // log the id of the record being processed
    log.debug({
      title: logTitle,
      details: "Record ID: " + context.newRecord.id,
    });

    const inApproverGroup = require("./modules/AppWrap_InApproverGroup");

    const InApproverGroupClass = new inApproverGroup.InApproverGroup(
      context.newRecord,
    );

    // check if record is in an approver group
    InApproverGroupClass.check();

    log.debug({
      title: logTitle,
      details: "==================== AFTER SUBMIT END ====================",
    });
  }

  exports.afterSubmit = afterSubmit;
  return exports;
});
