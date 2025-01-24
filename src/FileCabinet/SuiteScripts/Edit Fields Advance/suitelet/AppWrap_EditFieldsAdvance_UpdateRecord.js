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
  "N/redirect",
  "N/runtime",
  "N/format",
  "N/record",
  "../AppWrap_EditFieldsAdvance_Library.js",
  "../editfield_lib/UtilityBelt",
], function (
  nsWidget,
  nsSearch,
  nsRedirect,
  nsRuntime,
  nsFormat,
  nsRecord,
  editLibrary,
  utility
) {
  /**
   *
   * @NApiVersion 2.0
   * @NModuleScope Public
   */
  var INT_NOTE_LEN = "50";

  function updateRecord(options) {
    var stLogTitle = "updateRecord";
    log.debug(stLogTitle, "Processing updateRecord...");

    log.debug(
      stLogTitle,
      "JSON.stringify(option.request.data) = " +
        JSON.stringify(options.request.parameters)
    );

    var stRecId = options.request.parameters.custpage_id;
    var stRecType = options.request.parameters.custpage_type;
    var stBodySS = options.request.parameters.custpage_body_ss;
    var stBodyNoteField = options.request.parameters.custpage_body_not;
    var stList = options.request.parameters.custpage_list;

    //Load Record
    var rec = nsRecord.load({
      type: stRecType,
      id: stRecId,
      isDynamic: true
    });

    //Body Fields
    if (stBodySS) {
      log.debug(stLogTitle, "Updating body fields");

      updateBodyFields({
        bodySearch: stBodySS,
        bodyNote: stBodyNoteField,
        transaction: rec,
        data: options.request.parameters,
      });
    }

    log.debug(stLogTitle, "stList = " + stList);

    if (stList) {
      updateSublist({
        bodySearch: stBodySS,
        bodyNote: stBodyNoteField,
        transaction: rec,
        data: options.request,
        list: stList,
        removeLines: options.request.parameters.custpage_removed_lines,
      });
    }

    var stId = rec.save({
      enableSourcing: true,
      ignoreMandatoryFields: true,
    });

    log.audit(stLogTitle, "Updated " + stId);
    //Redirect
    nsRedirect.toRecord({
      type: stRecType,
      id: stRecId,
    });
  }

  function removeLines(options) {
    var stLogTitle = "removeLine";

    options.removeLines.map(function (lineKey) {
      log.audit(stLogTitle, "lineKey " + lineKey);

      var removeLine = options.transaction.findSublistLineWithValue({
        sublistId: options.sublist,
        fieldId: "lineuniquekey",
        value: lineKey,
      });
      log.audit(stLogTitle, "removeLine " + removeLine);

      if (removeLine !== -1) {
        options.transaction.selectLine({sublistId: options.sublist, line: removeLine});
        options.transaction.removeLine({
          sublistId: options.sublist,
          line: removeLine,
        });
      }
    });
  }
  function updateSublist(options) {
    var stLogTitle = "updateSublist";

    var arrObjList = JSON.parse(options.list);

    arrObjList.map(function (objList) {
      var sublist = objList.list.toLowerCase();
      log.debug(stLogTitle, "sublist = " + sublist);

      var arrEditableFields = [];
      if (objList.ef) arrEditableFields = objList.ef.split(",");

      // load the search to get the columns to be populated
      var SublistSearch = nsSearch.load({ id: objList.ss });

      var Columns = SublistSearch.columns;

      var intLineCount = options.data.getLineCount({
        group: "custpage_sublist_" + sublist,
      });
      log.debug(stLogTitle, "intLineCount = " + intLineCount);

      for (var intCtr = 0; intCtr < intLineCount; intCtr++) {
        var stLine = options.data.getSublistValue({
          group: "custpage_sublist_" + sublist,
          name: "custpage_lineuniquekey",
          line: intCtr,
        });
        log.debug(stLogTitle, "stLine = " + stLine);

        if (utility.isEmpty(stLine) === false) {
          log.debug(stLogTitle, "updating existing line");

          var lineToUpdate = options.transaction.findSublistLineWithValue({
            sublistId: sublist,
            fieldId: "lineuniquekey",
            value: stLine,
          });

          log.debug(stLogTitle, "lineToUpdate = " + lineToUpdate);

          updateLine({
            recordLine: lineToUpdate,
            transaction: options.transaction,
            data: options.data,
            editable: arrEditableFields,
            sublist: sublist,
            sublistLine: intCtr,
            columns: Columns,
          });
        } else {
          log.debug(stLogTitle, "adding new line");

          addLine({
            transaction: options.transaction,
            data: options.data,
            sublist: sublist,
            columns: Columns,
            sublistLine: intCtr,
          });
        }

        if (utility.isEmpty(options.removeLines) === false) {
          log.debug(stLogTitle, "removing existing line");

          removeLines({
            transaction: options.transaction,
            removeLines: options.removeLines.split(","),
            sublist: sublist,
          });
        }
      }
    });
  }

  function addLine(options) {
    var stLogTitle = "addLine";

    var NewLine = options.transaction.getLineCount({
      sublistId: options.sublist,
    });
    NewLine++;

    options.transaction.selectNewLine({sublistId: options.sublist});

    options.columns.map(function (column) {
      var ColumnData = JSON.parse(JSON.stringify(column));
      log.debug(stLogTitle, "ColumnData: " + JSON.stringify(ColumnData));

      // Getters
      var stLabel = editLibrary.convNull(ColumnData.label);
      var stType = editLibrary.convNull(ColumnData.type);
      var stName = editLibrary.convNull(ColumnData.name).toLowerCase();
      log.debug(
        stLogTitle,
        "stLabel =" + stLabel + " | stType =" + stType + " | stName =" + stName
      );

      var RecordField = ColumnData.name;
      var stVal = options.data.getSublistValue({
        group: "custpage_sublist_" + options.sublist,
        name: "custpage_" + RecordField,
        line: options.sublistLine,
      });

      log.debug(
        stLogTitle,
        "RecordField = " + RecordField + " stVal =" + stVal
      );

      // skip line unique key
      if (RecordField !== "lineuniquekey") {
        stVal =
          utility.isEmpty(stVal) === true
            ? null
            : formatValue(utility.replaceAll(stVal, "\u0001", ""), stType);
        log.debug(stLogTitle, "stVal =" + stVal);

        if (RecordField === "revrecstartdate") RecordField = "amortizstartdate";
        if (RecordField === "revrecenddate")
          RecordField = "amortizationenddate";

        // if (stType !== "date" && stType !== "datetime") {
        //   options.transaction.setSublistValue({
        //     sublistId: options.sublist,
        //     fieldId: RecordField,
        //     line: NewLine,
        //     value: stVal,
        //   });
        // } else {
        //   log.debug(stLogTitle, "Setting date field");
        //
        //   if (utility.isEmpty(stVal) === false) {
        //     options.transaction.setSublistText({
        //       sublistId: options.sublist,
        //       fieldId: RecordField,
        //       line: NewLine,
        //       value: stVal,
        //     });
        //   }
        // }

        options.transaction.setCurrentSublistValue({
          sublistId: options.sublist,
          fieldId: RecordField,
          value: stVal,
        });
      }
    });

    options.transaction.commitLine({sublistId: options.sublist});
  }

  function updateLine(options) {
    var stLogTitle = "updateLine";

    // select the line to be updated
    options.transaction.selectLine({sublistId: options.sublist, line: options.recordLine});

    options.editable.map(function (editable) {
      var RecordField = editable;
      var stVal = options.data.getSublistValue({
        group: "custpage_sublist_" + options.sublist,
        name: "custpage_" + RecordField,
        line: options.sublistLine,
      });
      log.debug(
          stLogTitle,
          "stVal =" +
          stVal
      );

      if (utility.isEmpty(stVal) === false) {
        var ColumnData = getColumnData(options.columns, RecordField);
        log.debug(stLogTitle, "ColumnData: " + JSON.stringify(ColumnData));
        ColumnData = JSON.parse(JSON.stringify(ColumnData));

        // Getters
        var stLabel = editLibrary.convNull(ColumnData.label);
        var stType = editLibrary.convNull(ColumnData.type);
        var stName = editLibrary.convNull(ColumnData.name).toLowerCase();
        // log.debug(
        //   stLogTitle,
        //   "stLabel =" +
        //     stLabel +
        //     " | stType =" +
        //     stType +
        //     " | stName =" +
        //     stName
        // );

        stVal = formatValue(stVal, stType);

        if (RecordField === "memo") RecordField = "description";
        if (RecordField === "revrecstartdate") RecordField = "amortizstartdate";
        if (RecordField === "revrecenddate")
          RecordField = "amortizationenddate";

        // options.transaction.setSublistValue({
        //   sublistId: options.sublist,
        //   fieldId: RecordField,
        //   line: options.recordLine,
        //   value: stVal,
        // });
        log.debug(
            stLogTitle,
            "RecordField = " + RecordField + " | Formatted stVal =" + stVal
        );

        options.transaction.setCurrentSublistValue({
          sublistId: options.sublist,
          fieldId: RecordField,
          value: stVal,
        });

        log.debug(
          stLogTitle,
          "Updated RecordField= " + RecordField + " | stVal =" + stVal
        );
      }
    });

    options.transaction.commitLine({sublistId: options.sublist});
  }

  function getColumnData(columns, name) {
    // log.debug(
    //   "getColumnData",
    //   "name: " + name + "columns: " + JSON.stringify(columns)
    // );

    return columns.find(function (obj) {
      // log.debug(
      //   "getColumnData",
      //   "obj.name: " + name + "obj: " + JSON.stringify(obj)
      // );

      return obj.name === name;
    });
  }

  function formatValue(fieldValue, type) {
    var stLogTitle = "formatValue";

    // log.debug(stLogTitle, "length:" + fieldValue.length);
    // log.debug({
    //   title: stLogTitle,
    //   details: [
    //     "fieldValue type:",
    //     JSON.stringify(Object.prototype.toString.call(fieldValue)),
    //     " | typeof: ",
    //     typeof fieldValue,
    //   ].join(""),
    // });

    var formattedValue = fieldValue;

    if (formattedValue === "T") formattedValue = true;
    if (formattedValue === "F") formattedValue = false;

    if (type === "date" || type == "datetime") {
      formattedValue = nsFormat.parse({
        value: fieldValue,
        type: nsFormat.Type.DATE,
      });
    }

    // log.debug(stLogTitle, "length:" + fieldValue.length);
    // log.debug({
    //   title: stLogTitle,
    //   details: [
    //     "formattedValue type:",
    //     JSON.stringify(Object.prototype.toString.call(fieldValue)),
    //     " | typeof: ",
    //     typeof formattedValue,
    //   ].join(""),
    // });
    return formattedValue;
  }

  function updateBodyFields(options) {
    var stLogTitle = "updated.updateBodyFields";

    var arrFilter = [];

    arrFilter.push(
      nsSearch.createFilter({
        name: "internalid",
        operator: "anyof",
        values: [options.transaction.id],
      })
    );

    //Load the main saved search
    var BodySearch = nsSearch.load({
      id: options.bodySearch,
    });
    var ExistingFilters = BodySearch.filters;
    BodySearch.filters = ExistingFilters.concat(arrFilter);

    var arrResult = utility.executeSearch(BodySearch);
    var arrColumns = arrResult[0].columns;

    arrColumns.map(function (column) {
      var ColumnData = JSON.parse(JSON.stringify(column));
      log.debug(stLogTitle, "ColumnData" + JSON.stringify(ColumnData));

      // Getters
      var stLabel = editLibrary.convNull(ColumnData.label);
      var stType = editLibrary.convNull(ColumnData.type);
      var stName = editLibrary.convNull(ColumnData.name).toLowerCase();
      log.debug(
        stLogTitle,
        "stLabel =" + stLabel + " | stType =" + stType + " | stName =" + stName
      );

      if (utility.isEmpty(stLabel.match(/^M+[0-9]+/)) === true) {
        var stVal = options.data[["custpage_", stName].join("")];

        stVal = utility.isEmpty(stVal) === true ? null : stVal;

        if (stType === "date") {
          if (stVal) {
            stVal = nsFormat.parse({
              value: stVal,
              type: nsFormat.Type.DATE,
            });
          }
        }

        if (stType === "checkbox") {
          if (stVal === "T") stVal = true;
          if (stVal === "F") stVal = false;
        }
      }

      if (options.bodyNote === stName) {
        var dDate = new Date();
        var stDate =
          dDate.getMonth() +
          1 +
          "/" +
          dDate.getDate() +
          "/" +
          dDate.getFullYear();
        log.debug("DEBUG", stLogTitle, "stDate =" + stDate);

        var userObj = nsRuntime.getCurrentUser();
        log.debug(stLogTitle, "Name of current user: " + userObj.name);

        var new_reason = "";
        if (stVal) {
          new_reason = "{" + userObj.name + " | " + stDate + "}" + ": " + stVal;
          new_reason = new_reason.wordWrap(INT_NOTE_LEN, "\n", 1);

          try {
            options.transaction.setValue(
              "custbody_aw_lastcollectionnote_date",
              new Date()
            );
          } catch (f) {}
        }

        var existing_reason = options.parameters["custpage_" + stName + "2"];
        if (existing_reason) {
          new_reason = existing_reason + "\n" + new_reason;
        }
        if (new_reason) options.transaction.setValue(stName, new_reason);
      } else {

        // change memomain to memo
        if (stName === "memomain") {
          stName = "memo"
        }

        options.transaction.setValue(stName, stVal);
      }

      log.debug(stLogTitle, "stName | " + stName + " | stVal =" + stVal);
    });
  }

  String.prototype.wordWrap = function (m, b, c) {
    var i, j, l, s, r;
    if (m < 1) return this;
    for (i = -1, l = (r = this.split("\n")).length; ++i < l; r[i] += s)
      for (
        s = r[i], r[i] = "";
        s.length > m;
        r[i] += s.slice(0, j) + ((s = s.slice(j)).length ? b : "")
      )
        j =
          c === 2 || (j = s.slice(0, m + 1).match(/\S*(\s)?$/))[1]
            ? m
            : j.input.length - j[0].length ||
              (c === 1 && m) ||
              j.input.length + (j = s.slice(m).match(/^\S*/)).input.length;
    return r.join("\n");
  };

  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, "find", {
      value: function (predicate) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;

        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
        if (typeof predicate !== "function") {
          throw TypeError("predicate must be a function");
        }

        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
        var thisArg = arguments[1];

        // 5. Let k be 0.
        var k = 0;

        // 6. Repeat, while k < len
        while (k < len) {
          // a. Let Pk be ! ToString(k).
          // b. Let kValue be ? Get(O, Pk).
          // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
          // d. If testResult is true, return kValue.
          var kValue = o[k];
          if (predicate.call(thisArg, kValue, k, o)) {
            return kValue;
          }
          // e. Increase k by 1.
          k++;
        }

        // 7. Return undefined.
        return undefined;
      },
      configurable: true,
      writable: true,
    });
  }

  return {
    update: updateRecord,
  };
});
