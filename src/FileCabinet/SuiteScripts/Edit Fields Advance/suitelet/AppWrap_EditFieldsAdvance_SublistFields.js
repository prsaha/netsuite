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

  function createAndPopulateSublistFields(options) {
    var stLogTitle = "sublist.createAndPopulateSublistFields";
    // log.debug({
    //   title: stLogTitle,
    //   details: ["options:", JSON.stringify(options)].join(""),
    // });

    var arrObjList = options.params.list;
    log.debug({
      title: stLogTitle,
      details: ["arrObjList:", arrObjList].join(""),
    });

    arrObjList = JSON.parse(arrObjList);

    arrObjList.map(function (listMember) {
      var ListOptions = listMember;
      log.debug({
        title: stLogTitle,
        details: ["ListOptions:", JSON.stringify(ListOptions)].join(""),
      });

      var sublistName = ListOptions.list.toLowerCase();
      log.debug({
        title: stLogTitle,
        details: ["sublistName:", sublistName].join(""),
      });

      var arrEditableFields = [];
      var arrLineMandatoryFields = [];
      if (ListOptions.ef) arrEditableFields = ListOptions.ef.split(",");
      if (ListOptions.mf) arrLineMandatoryFields = ListOptions.mf.split(",");

      log.debug({
        title: stLogTitle,
        details: [
          "arrEditableFields:",
          JSON.stringify(arrEditableFields),
          " | arrLineMandatoryFields:",
          JSON.stringify(arrLineMandatoryFields),
        ].join(""),
      });

      // check if adding and removing of lines are allowed
      var objSublist;
      var Editable = options.params.bAddRemoveLinesOn;
      log.debug({
        title: stLogTitle,
        details: ["Editable:", Editable].join(""),
      });

      if (Editable === false) {
        log.debug({
          title: stLogTitle,
          details: "Sublist not editable",
        });

        //Add the sublist
        objSublist = options.form.addSublist({
          id: "custpage_sublist_" + sublistName,
          type: nsWidget.SublistType.LIST,
          label: ListOptions.list,
        });
      } else {
        log.debug({
          title: stLogTitle,
          details: "Sublist editable",
        });

        //Add the sublist
        objSublist = options.form.addSublist({
          id: "custpage_sublist_" + sublistName,
          type: nsWidget.SublistType.INLINEEDITOR,
          label: ListOptions.list,
        });

        // add field to keep track of removed lines
        var objFldId = options.form.addField({
          id: "custpage_removed_lines",
          type: nsWidget.FieldType.TEXT,
          label: "Removed Lines",
        });

        objFldId.updateDisplayType({ displayType: "HIDDEN" });
      }

      //Load the main saved search
      var SublistSearch = nsSearch.load({ id: ListOptions.ss });
      var ExistingFilters = SublistSearch.filters;
      ExistingFilters = ExistingFilters.concat(options.filter);
      SublistSearch.filters = ExistingFilters;

      var arrResult = utility.executeSearch(SublistSearch);

      arrResult.map(function (result, index) {
        var arrColumns = result.columns;

        if (index === 0) {
          createSublistColumns({
            form: objSublist,
            columns: arrColumns,
            editable: arrEditableFields,
            mandatory: arrLineMandatoryFields,
            record: options.record,
            sublist: options.sublist,
            sublistName: sublistName,
          });
        }

        populateSublist({
          form: objSublist,
          data: result,
          columns: arrColumns,
          line: index,
        });
      });

      return arrResult;
    });
  }

  function createSublistColumns(options) {
    var stLogTitle = "sublist.createSublistColumns";

    options.columns.map(function (column) {
      // log.debug(stLogTitle, "column" + JSON.stringify(column));

      var ColumnData = JSON.parse(JSON.stringify(column));

      // Getters
      var stLabel = editLibrary.convNull(ColumnData.label);

      var stType = editLibrary.convNull(ColumnData.type);
      var stJoin = editLibrary.convNull(ColumnData.join).toLowerCase();
      var stName = editLibrary.convNull(ColumnData.name).toLowerCase();

      var stFieldType = "";
      switch (true) {
        case stType === "clobtext":
          stFieldType = "textarea";
          break;
        case stType === "url" ||
          stType === "date" ||
          stType === "textarea" ||
          stType === "checkbox":
          stFieldType = stType;
          break;
        case stType === "select":
          stFieldType = stType;
          break;
        case stType.indexOf("currency") !== -1:
          stFieldType = "currency";
          break;
        default:
          stFieldType = nsWidget.FieldType.TEXT;
          break;
      }

      log.debug({
        title: stLogTitle,
        details:
          "stLabel = " +
          stLabel +
          " | stFieldType = " +
          stFieldType +
          " | stName = " +
          stName +
          " | stType = " +
          stType,
      });
      if (stJoin) stName = stName + "_zx_" + stJoin;
      if (stName === "memo") stLabel = "description";

      var CreatedField;
      if (utility.isEmpty(stLabel.match(/^M+[0-9]+/)) === true) {
        if ("select" === stType || "multiselect" === stType) {
          CreatedField = editLibrary.createPopulateSelect({
            label: stLabel,
            type: stFieldType,
            name: stName,
            record: options.record,
            form: options.form,
            sublist: options.sublist,
            sublistId: options.sublistName,
          });
        } else {
          CreatedField = editLibrary.createPopulateField({
            label: stLabel,
            type: stFieldType,
            name: stName,
            form: options.form,
            sublist: options.sublist,
          });
        }

        if (stType !== "multiselect") {
          CreatedField.updateDisplayType({
            displayType: nsWidget.FieldDisplayType.ENTRY,
          });
        }

        if (editLibrary.inArray(stName, options.mandatory)) {
          CreatedField.isMandatory = true;
        }

        if (!editLibrary.inArray(stName, options.editable)) {
          CreatedField.updateDisplayType({
            displayType: nsWidget.FieldDisplayType.DISABLED,
          });
        }

        log.debug(stLogTitle, "CreatedField: " + JSON.stringify(CreatedField));

        return CreatedField;
      }
    });
  }

  function populateSublist(options) {
    var LogTitle = "sublist.populateSublist";

    options.columns.map(function (column) {
      log.debug({
        title: LogTitle,
        details: ["column:", JSON.stringify(column)].join(""),
      });

      var Name = column.name;
      var FieldId = ["custpage_", Name].join("");
      var Value =
        utility.isEmpty(options.data.getValue(column)) === true
          ? null
          : options.data.getValue(column);

      log.debug({
        title: LogTitle,
        details: [
          "Name:",
          Name,
          " | FieldId: ",
          FieldId,
          " | Value: ",
          Value,
          " | options.line: ",
          options.line,
        ].join(""),
      });

      if (column.type === "checkbox") {
        Value = Value === "true" ? true : false;
      }

      if (utility.isEmpty(Value) === false) {
        options.form.setSublistValue({
          id: FieldId,
          value: Value,
          line: options.line,
        });
      }
    });
  }

  return {
    createAndPopulateSublistFields: createAndPopulateSublistFields,
  };
});
