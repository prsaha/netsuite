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
 *  Script Description:
 *  This module contains all the logic for determining if the record is part of an Approver Group
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
   *  This module contains all the logic for determining if the record is part of an Approver Group
   *
   * @type {Object} AppWrap_InApproverGroup.js
   *
   * @copyright 2024 AppWrap, LLC
   * @author Gerrom V. Infante <ginfan@appwrap.tech>
   *
   * @NApiVersion 2.1
   * @NModuleScope Public
   */
  const exports = {};
  const moduleName = "AppWrap_InApproverGroup.js";

  const utilityBelt = require("../../lib/AppWrap_UtilityBelt");

  const nsSearch = require("N/search");

  /**
   * The InApproverGroup class
   */
  class InApproverGroup {
    #currentUser;

    /**
     * The constructor method is responsible for initializing the InApproverGroup class object.
     * It takes a currentUser parameter and sets it as the value of the #currentUser private property.
     * It also calls the getScriptParameterValues method from the utilityBelt module to retrieve the
     * script parameter values and assigns them to the #parameterValues private property.
     *
     * @param {string} currentUser The internal id of the current user
     */
    constructor(currentUser) {
      this.#currentUser = currentUser;
    }

    /**
     * The check method is a part of the InApproverGroup class. It is responsible for checking if the record is part of
     * an approver group and turning on a flag if it is.
     *
     * @returns {boolean} true if the record is part of an approver group.False if the record is not.
     */
    check() {
      return this.#inApproverGroup({
        recordId: this.#currentUser,
      });
    }

    /**
     * The #inApproverGroup method checks if a given record belongs to an approver group by searching for the record's
     * internal ID in the entitygroup record type.
     *
     * @param {object} option
     * @param {string} option.recordId The internal ID of the record to be checked
     * @returns {boolean} true if the record belongs to an approver group.False if the record does not belong to an
     * approver group.
     */
    #inApproverGroup(option) {
      const { recordId } = option;

      const searchObject = nsSearch.create({
        type: "entitygroup",
        filters: [
          nsSearch.createFilter({
            name: "internalid",
            join: "groupmember",
            operator: nsSearch.Operator.ANYOF,
            values: [recordId],
          }),
        ],
        columns: [nsSearch.createColumn({ name: "groupname" })],
      });

      const searchResult = utilityBelt.executeSearch(searchObject);

      // if the search returns a result, it means that it is part of a group
      return searchResult.length > 0;
    }
  }
  exports.InApproverGroup = InApproverGroup;

  return exports;
});
