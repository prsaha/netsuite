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
define([
  "N/ui/serverWidget",
  "N/search",
  "../AppWrap_EditFieldsAdvance_Library.js",
  "../editfield_lib/UtilityBelt",
], function (nsWidget, nsSearch, editLibrary, utility) {
  /**
   *
   * @NApiVersion 2.0
   * @NModuleScope Public
   */

  function createAndPopulateFields(options) {
    var stLogTitle = "body.createAndPopulateFields";
    // log.debug({title: stLogTitle, details: ["options:", JSON.stringify(options)].join("")};

    var stBodyMandatoryFields = options.params.stBodyMandatory;
    var stBodyNoteField = options.params.stBodyNotes;

    var arrBodyMandatoryFields = [];
    if (stBodyMandatoryFields)
      arrBodyMandatoryFields = stBodyMandatoryFields.split(",");

    log.debug(
      stLogTitle,
      "arrBodyMandatoryFields =" +
        arrBodyMandatoryFields +
        " stBodyNoteField =" +
        stBodyNoteField
    );

    //SS
    var objFldId = options.form.addField({
      id: "custpage_body_ss",
      type: nsWidget.FieldType.TEXT,
      label: "SS Body",
    });
    objFldId.defaultValue = options.params.stBodySS;
    objFldId.updateDisplayType({ displayType: "HIDDEN" });

    //Note
    var objFldId = options.form.addField({
      id: "custpage_body_not",
      type: nsWidget.FieldType.TEXT,
      label: "Note Body",
    });
    objFldId.defaultValue = stBodyNoteField;
    objFldId.updateDisplayType({ displayType: "HIDDEN" });

    //Load the main saved search
    var BodySearch = nsSearch.load({id: options.params.stBodySS});
    var ExistingFilters = BodySearch.filters;
    ExistingFilters = ExistingFilters.concat(options.filter);
    BodySearch.filters = ExistingFilters;

    var arrResult = utility.executeSearch(BodySearch);
    var arrColumns = arrResult[0].columns;

    var CreatedFields = arrColumns.map(function (column) {
      log.debug(stLogTitle, "column" + JSON.stringify(column));

      var ColumnData = JSON.parse(JSON.stringify(column));
      // Getters
      var stLabel = editLibrary.convNull(ColumnData.label);
      var stType = editLibrary.convNull(ColumnData.type);

      if (stType === "clobtext") stType = "textarea";

      var stName = editLibrary.convNull(ColumnData.name).toLowerCase();

      //Get Value
      var stValue = arrResult[0].getValue(column);
      if (!stValue) {
        stValue = arrResult[0].getText(column);
      }

      if (stType === "checkbox") {
        if (stValue === true) stValue = "T";
        if (stValue === false) stValue = "F";
      }
      log.debug({
        title: stLogTitle,
        details:
          "stLabel = " +
          stLabel +
          " | stType = " +
          stType +
          " | stName = " +
          stName +
          " | stValue = " +
          stValue,
      });

      var CreatedField;
      if (utility.isEmpty(stLabel.match(/^M+[0-9]+/)) === true) {
        if ("select" === stType || "multiselect" === stType) {
          log.debug({
            title: stLogTitle,
            details: "Creating select/multiselect",
          });

          CreatedField = editLibrary.createPopulateSelect({
            label: stLabel,
            type: stType,
            name: stName,
            record: options.record,
            form: options.form,
            note: stBodyNoteField,
            value: stValue,
          });
        } else {
          log.debug({
            title: stLogTitle,
            details: "Creating other",
          });

          CreatedField = editLibrary.createPopulateField({
            label: stLabel,
            type: stType,
            name: stName,
            form: options.form,
            note: stBodyNoteField,
            value: stValue,
          });
        }

        if (editLibrary.inArray(stName, arrBodyMandatoryFields)) {
          CreatedField.isMandatory = true;
        }

        return CreatedField.id;
      }
    });
  }

  return {
    createAndPopulateFields: createAndPopulateFields,
  };
});
