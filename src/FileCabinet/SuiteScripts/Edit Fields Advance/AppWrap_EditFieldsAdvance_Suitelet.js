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
 *     | Gerrom V. Infante           | Oct 15 2020   | 1.0           | Refactored script. Added the following functionality: Add, and Remove   |
 *     |                             |               |               | lines. Setting mandatory columns.  Added client side script to help with|
 *     |                             |               |               | validation.                                                             |
 *     | MJ Pascual	                 | Feb 28 2018   | 1.1           | Initial Version                                                         |
 *     |---------------------------------------------------------------------------------------------------------------------------------------|
 *
 */

/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * @NScriptType suitelet
 */
define([
  "N/record",
  "N/search",
  "N/ui/serverWidget",
  "N/runtime",
  "N/error",
  "N/format",
  "N/redirect",
  "./AppWrap_EditFieldsAdvance_Library",
  "./suitelet/AppWrap_EditFieldsAdvance_BodyFields",
  "./suitelet/AppWrap_EditFieldsAdvance_SublistFields",
  "./suitelet/AppWrap_EditFieldsAdvance_UpdateRecord",
], function (
  record,
  search,
  serverWidget,
  runtime,
  error,
  format,
  redirect,
  editLibrary,
  bodyFields,
  sublistFields,
  updateRecord
) {
  var OBJ_TAGS = {
    _do_not_show_result: "NA",
    _hide_result: "HIDE",
  };

  //Get the data
  var objParam = {
    _suitelet_title: "Edit Fields",
    _suitelet_sublistmsg: "",
    _suitelet_ss1: "",
    _suitelet_cs: "",
    _suitelet_listhdr: "List",
    _suitelet_grp1: "",
    _defaultday: "",
  };

  var INT_NOTE_LEN = "50";

  function suitelet_editFields(option) {
    var stLogTitle = "suitelet_editFields";

    try {
      log.debug(stLogTitle, ">> Entry Log <<");

      //Start Display of Form
      var stAction = option.request.parameters.custpage_action;
      var obj = {};
      obj.stId = option.request.parameters.custpage_id;
      obj.stType = option.request.parameters.custpage_type;

      //Body Fields
      obj.stBodySS = option.request.parameters.custpage_body_ss;
      obj.stBodyMandatory = option.request.parameters.custpage_body_man;
      obj.stBodyNotes = option.request.parameters.custpage_body_not;

      //List Fields
      obj.list = option.request.parameters.custpage_list;
      obj.bShowAmortSched = option.request.parameters.custpage_amortsched;
      obj.bAddRemoveLinesOn =
        option.request.parameters.custpage_add_remove_lines;

      log.debug(
        stLogTitle,
        "stAction = " +
          stAction +
          " | JSON.stringify(obj) =" +
          JSON.stringify(obj) +
          " | JSON.stringify(option.request.data) = " +
          JSON.stringify(option.request.parameters)
      );

      if (stAction === "SUBMIT") {
        updateRecord.update(option);
      } else {
        var objForm = showSuiteletPage(option, obj);
        option.response.writePage(objForm);
      }
    } catch (e) {
      if (e.message !== undefined) {
        log.error("ERROR", e.name + " " + e.message);
        throw e.name + " " + e.message;
      } else {
        log.error("ERROR", "Unexpected Error", e.toString());
        throw error.create({
          name: "99999",
          message: e.toString(),
        });
      }
    } finally {
      log.debug(stLogTitle, ">> Exit Log <<");
    }
  }

  /**
   * Show the suitelet form
   * @option
   * @stParamCourseSearch
   */
  function showSuiteletPage(option, paramValues) {
    var stLogTitle = "showSuiteletPage";
    log.debug(stLogTitle, "Creating the form...");

    log.debug(
      stLogTitle,
      ["paramValues:", JSON.stringify(paramValues)].join("")
    );

    //Create Form
    var objForm = serverWidget.createForm({
      title: objParam._suitelet_title,
      hideNavBar: false,
    });

    // add client script
    objForm.clientScriptModulePath = "./AppWrap_EditFieldsAdvance_Client";

    //Action Field
    var objFldAction = objForm.addField({
      id: "custpage_action",
      type: serverWidget.FieldType.TEXT,
      label: "Action",
    });
    objFldAction.defaultValue = "SUBMIT";
    objFldAction.updateDisplayType({ displayType: "HIDDEN" });

    //Record Id
    var objFldId = objForm.addField({
      id: "custpage_id",
      type: serverWidget.FieldType.TEXT,
      label: "Id",
    });
    objFldId.defaultValue = paramValues.stId;
    objFldId.updateDisplayType({ displayType: "HIDDEN" });

    //Record Type
    var objFldId = objForm.addField({
      id: "custpage_type",
      type: serverWidget.FieldType.TEXT,
      label: "Type",
    });
    objFldId.defaultValue = paramValues.stType;
    objFldId.updateDisplayType({ displayType: "HIDDEN" });

    //Record Id
    var objFldRec = objForm.addField({
      id: "custpage_rec",
      type: serverWidget.FieldType.SELECT,
      label: "Record",
      source: paramValues.stType,
    });
    objFldRec.defaultValue = paramValues.stId;
    objFldRec.updateDisplayType({ displayType: "DISABLED" });

    //List
    var objFldId = objForm.addField({
      id: "custpage_list",
      type: "textarea",
      label: "List",
    });
    objFldId.defaultValue = paramValues.list;
    objFldId.updateDisplayType({ displayType: "HIDDEN" });

    //-------------------------------------------- FILTERS -------------------------------------------------

    var arrFilter = [];

    arrFilter.push(
      search.createFilter({
        name: "internalid",
        operator: "anyof",
        values: [paramValues.stId],
      })
    );

    //Load Record
    var rec = record.load({
      type: paramValues.stType,
      id: paramValues.stId,
      isDynamic: true,
    });

    if (paramValues.stBodySS) {
      log.debug({ title: stLogTitle, details: "Creating body fields" });

      // ----------------------------------------------- BODY FIELDS ---------------------------------------------------
      bodyFields.createAndPopulateFields({
        form: objForm,
        params: paramValues,
        record: rec,
        filter: arrFilter,
        sublist: objFldId,
      });
    }

    if (paramValues.list) {
      log.debug({ title: stLogTitle, details: "Creating Sublist" });

      // ----------------------------------------------- SUBLIST FIELDS ---------------------------------------------------
      sublistFields.createAndPopulateSublistFields({
        form: objForm,
        params: paramValues,
        record: rec,
        filter: arrFilter,
        sublist: objFldId,
      });
    }

    //Submit Button
    objForm.addSubmitButton({
      label: "Update",
    });

    objForm.addButton({
      id: "custpage_back",
      label: "Back",
      functionName: "backButton",
    });

    objForm.addButton({
      id: "custpage_reset",
      label: "Reset",
      functionName: "resetButton",
    });

    return objForm;
  }

  return {
    onRequest: suitelet_editFields,
  };
});
