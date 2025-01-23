define([
  "N/record",
  "N/error",
  "N/format",
  "N/runtime",
  "N/search",
  "./editfield_lib/UtilityBelt",
], function (record, error, format, runtime, search, utility) {
  /**
   *
   * @NApiVersion 2.0
   * @NModuleScope Public
   */

  var inArray = function (stValue, arrValue) {
    var bIsValueFound = false;
    for (var i = arrValue.length - 1; i >= 0; i--) {
      if (stValue === arrValue[i]) {
        bIsValueFound = true;
        break;
      }
    }
    return bIsValueFound;
  };

  var isEmpty = function (stValue) {
    if (stValue === "" || stValue == null) {
      return true;
    } else {
      if (stValue instanceof String) {
        if (stValue === "") {
          return true;
        }
      } else if (stValue instanceof Array) {
        if (stValue.length === 0) {
          return true;
        }
      }

      return false;
    }
  };

  var convNull = function (value) {
    if (value == null) value = "";
    return value;
  };

  var getObjKey = function (obj) {
    var stLogTitle = "getObjKey";

    var arrObjKey = [];
    for (var key in obj) {
      arrObjKey.push(key);
    }

    log.debug(stLogTitle, "arrObjKey =" + arrObjKey);

    return arrObjKey;
  };

  var getAllRowsFromSearch = function (
    search,
    recType,
    searchId,
    filters,
    columns,
    overWriteCols
  ) {
    var retList = [];
    var srchObj = null;
    if (searchId == null || searchId === "")
      srchObj = search.create({
        type: recType,
        filters: filters,
        columns: columns,
      });
    else {
      srchObj = search.load({ id: searchId });
      var existFilters = srchObj.filters;
      var existColumns = srchObj.columns;

      existFilters =
        existFilters == null || existFilters === "" ? [] : existFilters;
      existColumns =
        existColumns == null || existColumns === "" ? [] : existColumns;
      if (filters != null && filters !== "") {
        for (var idx = 0; idx < filters.length; idx++)
          existFilters.push(filters[idx]);
      }
      if (columns != null && columns !== "") {
        if (overWriteCols === true) existColumns = columns;
        else {
          for (var idx = 0; idx < columns.length; idx++)
            existColumns.push(columns[idx]);
        }
      }

      srchObj.filters = existFilters;
      srchObj.columns = existColumns;
    }

    var resultSet = srchObj.run();
    var startPos = 0,
      endPos = 1000;
    while (startPos <= 10000) {
      var options = {};
      options.start = startPos;
      options.end = endPos;
      var currList = resultSet.getRange(options);
      if (currList == null || currList.length <= 0) break;
      if (retList == null) retList = currList;
      else retList = retList.concat(currList);

      if (currList.length < 1000) break;

      startPos += 1000;
      endPos += 1000;
    }

    return retList;
  };

  var runSearch = function (search, recType, searchId, filters, columns) {
    var srchObj = null;
    if (searchId == null || searchId === "")
      srchObj = search.create({
        type: recType,
        filters: filters,
        columns: columns,
      });
    else {
      srchObj = search.load({ id: searchId });
      var existFilters = srchObj.filters;
      var existColumns = srchObj.columns;

      existFilters =
        existFilters == null || existFilters === "" ? [] : existFilters;
      existColumns =
        existColumns == null || existColumns === "" ? [] : existColumns;
      if (filters != null && filters !== "") {
        for (var idx = 0; idx < filters.length; idx++)
          existFilters.push(filters[idx]);
      }
      if (columns != null && columns !== "") {
        for (var idx = 0; idx < columns.length; idx++)
          existColumns.push(columns[idx]);
      }

      srchObj.filters = existFilters;
      srchObj.columns = existColumns;
    }

    var resultSet = srchObj.run();

    return resultSet;
  };

  var forceFloat = function (stValue) {
    var flValue = parseFloat(stValue);

    if (isNaN(flValue)) {
      return 0.0;
    }

    return flValue;
  };

  var formatDate = function (initialFormattedDateString) {
    return format.parse({
      value: initialFormattedDateString,
      type: format.Type.DATE,
    });
  };

  var formatDateDDMMMYYYY = function (date) {
    var stDate = "";
    if (date) {
      var months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      var d = formatDate(date);
      var year = d.getFullYear();
      var month = "" + d.getMonth();
      var day = "" + d.getDate();
      stDate = day + "-" + months[month] + "-" + year;
    }
    return stDate;
  };

  function createPopulateField(options) {
    var LogTitle = "createPopulateField";
    log.debug({
      title: LogTitle,
      details: ["options:", JSON.stringify(options)].join(""),
    });

    var Field;
    if (utility.isEmpty(options.body) === false) {
      // log.debug({
      //   title: LogTitle,
      //   details: "(utility.isEmpty(options.body) === false)",
      // });

      if (options.body === options.name) {
        // log.debug({
        //   title: LogTitle,
        //   details: "(options.body === options.name)",
        // });

        Field = options.form.addField({
          id: "custpage_" + options.name,
          type: options.type,
          label: ["Add ", options.label].join(""),
        });

        Field.defaultValue = "";

        var LogField = options.form.addField({
          id: "custpage_" + options.name + "2",
          type: options.type,
          label: options.label + " Logs",
        });
        LogField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });
      }
    } else {
      // log.debug({
      //   title: LogTitle,
      //   details: "} else {",
      // });

      Field = options.form.addField({
        id: "custpage_" + options.name,
        type: options.type,
        label: options.label,
      });
    }

    if (utility.isEmpty(options.value) === false) {
      Field.defaultValue = options.value;
    }
    // log.debug(LogTitle, "Field: " + JSON.stringify(Field));

    return Field;
  }

  function createPopulateSelect(options) {
    var LogTitle = "createPopulateSelect";

    log.debug({
      title: LogTitle,
      details: [
        "options.sublistId:",
        options.sublistId,
        " | options.name: ",
        options.name,
        " | options.value:",
        options.value,
      ].join(""),
    });

    var Field;
    if (utility.isEmpty(options.sublistId) === true) {
      Field = options.record.getField(options.name);
    } else {
      Field = options.record.getSublistField({
        sublistId: options.sublistId,
        fieldId: options.name,
        line: "0",
      });
    }
    log.debug({
      title: LogTitle,
      details: "Field: " + JSON.stringify(Field),
    });

    if (utility.isEmpty(Field) === false) {
      // log.debug({
      //   title: LogTitle,
      //   details: "Field + " + JSON.stringify(Field),
      // });

      var fieldOptions = {
        id: "custpage_" + options.name,
        type: Field.type,
        label: options.label,
      };

      if (options.name.substring(0, 4) !== "cust") {
        fieldOptions.source = options.name;
      }

      // create the field
      var FormField = options.form.addField(fieldOptions);

      if (options.name.substring(0, 4) === "cust") {
        var objSelectOptions = Field.getSelectOptions();

        if (Field.type === "multiselect") {
          log.debug({
            title: LogTitle,
            details: "Populating Multi Select",
          });
          var arrVal = options.value.split(",");

          FormField.addSelectOption({ value: " ", text: " " });

          objSelectOptions.map(function (selectOptions) {
            if (inArray(options.value, arrVal)) {
              FormField.addSelectOption({
                value: selectOptions.value,
                text: selectOptions.text,
                isSelected: true,
              });
            } else {
              FormField.addSelectOption({
                value: selectOptions.value,
                text: selectOptions.text,
              });
            }
          });
        }

        if (Field.type !== "multiselect") {
          log.debug({
            title: LogTitle,
            details: "Populating None Multi Select",
          });

          FormField.addSelectOption({ value: " ", text: " " });

          objSelectOptions.map(function (select) {
            FormField.addSelectOption({
              value: select.value,
              text: select.text,
            });
          });

          if (utility.isEmpty(options.value) === false) {
            FormField.defaultValue = options.value;
          }
        }
      }
    }

    return FormField;
  }

  return {
    formatDateDDMMMYYYY: formatDateDDMMMYYYY,
    formatDate: formatDate,
    forceFloat: forceFloat,
    runSearch: runSearch,
    getAllRowsFromSearch: getAllRowsFromSearch,
    getObjKey: getObjKey,
    convNull: convNull,
    isEmpty: isEmpty,
    inArray: inArray,
    createPopulateField: createPopulateField,
    createPopulateSelect: createPopulateSelect,
  };
});
