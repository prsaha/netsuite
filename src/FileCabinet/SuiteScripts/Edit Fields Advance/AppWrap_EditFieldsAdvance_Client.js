/**
 * Copyright (c) 2020
 * AppWrap Inc
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of AppWrap Inc. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with AppWrap Inc.
 *
 * Script Name: AppWrap | Edit Field Advance CL
 *
 * Script Description:
 * THis is the client side script for the suitelet
 *
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *     | Author                      | Date          | Version       | Comments                                                                |
 *     |-----------------------------|---------------|---------------|-------------------------------------------------------------------------|
 *     | Gerrom V. Infante           | Oct 31 2020   | 1.0           | Initial Version                                                         |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 * Deployed:
 *
 *     |---------------------------------------------------------------|
 *     | Record                      | Id                              |
 *     |-----------------------------|---------------------------------|
 *     |       |              |
 *     |---------------------------------------------------------------|
 *
 * Script Parameters
 *
 *     |-----------------------------------------------------------------------------------------------------------------------------------|
 *     | ID                          | Type               | Description                                                                    |
 *     |-----------------------------|--------------------|--------------------------------------------------------------------------------|
 *     |        |      |                    |
 *     |-----------------------------------------------------------------------------------------------------------------------------------|
 *
 */
define([], function () {
  /**
   * @exports validateDelete
   * @exports fieldChange
   *
   *
   * @NApiVersion 2.0
   * @NModuleScope Public
   * @NScriptType ClientScript
   */
  var exports = {};

  /**
   * <code>fieldChanged</code> event handler
   *
   * @governance XXX
   *
   * @param context
   *        {Object}
   * @param context.currentRecord
   *        {transaction} The current transaction the user is manipulating in the UI
   * @param context.sublistId
   *        {String} The internal ID of the sublist.
   * @param context.fieldId
   *        {String} The internal ID of the field that was changed.
   * @param [context.lineNum=undefined]
   *        {String} The index of the recordLine if the field is in a sublist or
   *            matrix.
   * @param [context.columnNum=undefined]
   *        {String} The index of the column if the field is in a matrix.
   *
   * @return {void}
   *
   * @static
   * @function fieldChanged
   */
  function fieldChanged(context) {}

  /**
   * <code>validateDelete</code> event handler
   *
   * @param context
   *        {Object}
   * @param context.currentRecord
   *        {transaction} The current transaction the user is manipulating in the UI
   * @param context.sublistId
   *        {String} The internal ID of the sublist.
   *
   * @return {Boolean} <code>true</code> if the recordLine can be removed;
   *         <code>false</code> to prevent the recordLine removal.
   *
   * @static
   * @function validateDelete
   */
  function validateDelete(context) {
    var valid = true;

    return valid;
  }

  /**
   * <code>saveRecord</code> event handler
   *
   * @param context.currentRecord
   *        {CurrentRecord} The current transaction the user is manipulating in the UI
   * @return {Boolean} <code>true</code> if the transaction is valid;
   *         <code>false</code> to stop form submission.
   *
   * @static
   * @function saveRecord
   */
  function saveRecord(context) {
    var save = true;

    return save;
  }

  function backButton() {
    window.history.go(-1);
  }

  function resetButton() {
    window.location.reload();
  }
  exports.fieldChanged = fieldChanged;
  exports.validateDelete = validateDelete;
  exports.saveRecord = saveRecord;
  exports.backButton = backButton;
  exports.resetButton = resetButton;
  return exports;
});
