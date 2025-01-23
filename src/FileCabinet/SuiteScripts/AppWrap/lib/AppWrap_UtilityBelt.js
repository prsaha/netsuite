/**
 * UtilityBelt2.0.js
 * @NApiVersion 2.1
 * @NModuleScope public
 */
define((require) => {
  /**
   * This function checks if the passed value is Null or Undefined.
   *
   * @param  {string | number | Array}  value The value that will be checked.
   * @returns {boolean}       True if value is null or undefined, false if otherwise.
   */
  function nullUndefined(value) {
    if (value === null) {
      return true;
    }
    return value === undefined;
  }

  /**
   * This function removes extra specified character from the left of the String.
   *
   * @param  {string} str   String to process.
   * @param  {string} chars Optional. The character to be removed from the left side.
   *                        Defaults to space if blank.
   * @returns {string}       Processed string.
   */
  function leftTrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp(`^[${chars}]+`, "g"), "");
  }

  /**
   * This function removes extra specified character from the right of the String.
   *
   * @param  {string} str   String to process.
   * @param  {string} chars Optional. The character to be removed from the right side.
   *                        Defaults to space if blank.
   * @returns {string}       Processed string.
   */
  function rightTrim(str, chars) {
    chars = chars || "\\s";
    return str.replace(new RegExp(`[${chars}]+$`, "g"), "");
  }

  /**
   * This function removes extra specified character from the left and right of the String.
   *
   * @param  {string} str   String to process.
   * @param  {string} chars Optional. The character to be removed from the left and right side.
   *                        Defaults to space if blank.
   * @returns {string}       Processed string.
   */
  function trim(str, chars) {
    return leftTrim(rightTrim(str, chars), chars);
  }

  /**
   * This function executes the NetSuite search.
   *
   * @param  {search} search_obj The NetSuite search object.
   * @returns {Array}            Array contain the search result objects.
   */
  function executeSearch(search_obj) {
    const pagedData = search_obj.runPaged({ pageSize: 1000 });

    const search_result = [];
    pagedData.pageRanges.forEach((pageRange) => {
      pagedData.fetch({ index: pageRange.index }).data.forEach((result) => {
        search_result.push(result);
        return true;
      });

      return true;
    });

    log.debug({
      title: "Execute Search",
      details: `Number of Records Found:=${search_result.length}`,
    });

    return search_result;
  }

  /**
   * This function checks if the string or array is empty.
   *
   * @param  {string | Array | object}  stValue The value that will be checked.
   * @returns {boolean}         True is the value is empty, false if otherwise.
   */
  function isEmpty(stValue) {
    switch (true) {
      case isString(stValue) === true:
        return isBlank(stValue) || !stValue || 0 === stValue.length;
      case isArray(stValue) === true:
        return stValue.length === 0;
      case nullUndefined(stValue) === true:
        return true;
      case isObject(stValue) === true:
        return isObjectEmpty(stValue);
      default:
        return false;
    }
  }

  /**
   *
   * @param variable
   * @param base
   */
  function forceParseInt(variable, base) {
    base = isEmpty(base) === true ? 10 : base;
    const value = !isEmpty(variable)
      ? parseInt(`${variable}`.replace(/[^\d.-]/gi, ""), base)
      : 0;

    return !isNaN(value) ? value : 0;
  }

  /**
   *
   * @param variable
   */
  function forceParseFloat(variable) {
    const value = !isEmpty(variable)
      ? parseFloat(`${variable}`.replace(/[^\d.-]/gi, ""))
      : 0;

    return !isNaN(value) ? value : 0;
  }

  /**
   * Wrapper for SS2.0 N/format.format method. Converts a Date object into a date string
   * in the date format specified in the current NetSuite account.
   * For client side scripts, the string returned is based on the user’s system time.
   * For server-side scripts, if you do not provide a timeZone parameter the string returned
   * is based on the system time of the server your NetSuite system is running on.
   *
   * @param  {Date} date       Date object to be converted into date string format
   * @param  {enum} formatType Holds the string values for the supported field types.
   * @param  {enum} timeZone   Holds the valid time zone names in Olson Value, the date will be converted to this time zone.
   *                           If a time zone is not specified, the time zone is set based on the server your NetSuite system is running on.
   *                           If the time zone is invalid, the time zone is set to GMT.
   * @returns {string}          The formatted value as a string.
   */
  function dateToString(date, formatType, timeZone) {
    const format = require("N/format");

    return format.format({
      value: date,
      type: formatType,
      timezone: format.Timezone[timeZone],
    });
  }

  /**
   * Wrapper for SS2.0 N/format.parse method. Converts a string date into a Date object.
   *
   * @param  {Date} date       Date object to be converted into date string format
   * @param  {enum} formatType Holds the string values for the supported field types.
   * @returns {Date}
   */
  function stringToDate(date, formatType) {
    const format = require("N/format");

    return format.parse({
      value: date,
      type: formatType,
    });
  }

  /**
   *
   */
  function closeSuitelet() {
    let html = [];
    html.push("<html>");
    html.push("<head>");
    html.push("<script>");
    html.push("window.close()");
    html.push("</script>");
    html.push("</head>");
    html.push("<body>");
    html.push("</body>");
    html.push("</html>");

    html = html.join("");

    return html;
  }

  /**
   * Converts 'T' or 'F' to its Boolean counterpart
   *
   * @param  {string | boolean} val 'T' or 'F'
   * @returns {boolean}     true or false
   */
  function toBoolean(val) {
    if (!nullUndefined(val)) {
      if (typeof val === "boolean") {
        return val;
      } else {
        if (val === "T" || val === "TRUE") {
          return true;
        }
        if (val === "t" || val === "true") {
          return true;
        }
      }
    }
    return false;
  }

  /**
   *
   * @param value
   */
  function isNumber(value) {
    return typeof value === "number" && isFinite(value);
  }

  /**
   *
   * @param value
   */
  function isString(value) {
    return typeof value === "string" || value instanceof String;
  }

  /**
   *
   * @param value
   */
  function isArray(value) {
    return value && typeof value === "object" && value.constructor === Array;
  }

  /**
   *
   * @param obj
   */
  function isObjectEmpty(obj) {
    let k;
    for (k in obj) {
      // even if its not own property I'd still call it non-empty
      return false;
    }
    return true;
  }

  /**
   *
   * @param str
   */
  function isBlank(str) {
    return !str || /^\s*$/.test(str);
  }

  /**
   *
   * @param results
   */
  function resultsToObject(results) {
    const jsonResult = [];

    results.forEach((result) => {
      const { columns } = result;

      const jsonData = {
        id: result.id,
        recordType: result.recordType,
        values: {},
      };

      columns.forEach((column) => {
        let index = "";
        if (isEmpty(column.join) === false) {
          index = `${column.name}.${column.join}`;
        } else {
          index = column.name;
        }

        const columnValue = result.getValue(column);
        const columnText = result.getText(column);

        if (isEmpty(columnText) === true) {
          jsonData.values[index] = columnValue;
        } else {
          jsonData.values[index] = {
            label: column.label,
            text: columnText,
            value: columnValue,
          };
        }

        return true;
      });
      jsonResult.push(jsonData);

      return true;
    });

    return jsonResult;
  }

  /**
   * Gets the values of the script parameters
   * @param parameters {object} The object containing the ids of the script parameters
   * @returns {{}}
   */
  function getScriptParameterValues(parameters) {
    const runtime = require("N/runtime");

    const scriptContext = runtime.getCurrentScript();

    const parametersMap = {};

    let obj;
    let value;
    let isMandatory;
    let id;
    for (const key in parameters) {
      if (parameters.hasOwnProperty(key)) {
        obj = parameters[key];
        if (typeof obj === "string") {
          value = scriptContext.getParameter(obj);
        } else {
          id = obj.id;
          isMandatory = obj.isMandatory;
          value = scriptContext.getParameter(id);
        }

        if (value !== "" && value !== null) {
          parametersMap[key] = value;
        } else {
          if (isMandatory == true) {
            const error = require("N/error");
            throw error.create({
              name: "MISSING_PARAMETER",
              message: `Missing Script Parameter:${key}[${id}]`,
            });
          }
        }
      }
    }
    return parametersMap;
  }

  /**
   * This function iterates the members of the array of objects. It groups the members by the value of the specified
   * object property.
   * @param options
   * @param {object[]} options.values The array of object containing the data to be grouped and summed.
   * @param {string} options.key The property name whose value will be used for the grouping.
   * @returns {object[]} Array of objects containing the grouped and summed information.
   */
  function groupBy(options) {
    // log.debug({
    //   title: "groupBy",
    //   details: ["options.key:", JSON.stringify(options.key)].join(""),
    // });

    return options.values.reduce((r, a) => {
      const groupKey = options.key;
      r[a[groupKey]] = r[a[groupKey]] || [];
      r[a[groupKey]].push(a);
      return r;
    }, Object.create(null));
  }

  /**
   * This function gets the members of an object array based on the unique value of the passed property
   *
   * @param {object[]} data The array of object containing the data to be filtered.
   * @returns {object[]} Array of objects.
   */
  function uniqueFromObjectArray(data) {
    // To store the unique sub arrays
    const uniques = [];

    // To keep track of the sub arrays
    const itemsFound = {};

    for (let i = 0; i < data.length; i++) {
      const val = data[i];

      // convert the sub array to the string
      const stringified = JSON.stringify(val);

      // If it is already added then skip to next element
      if (itemsFound[stringified]) {
        continue;
      }

      // Else add the value to the unique list
      uniques.push(val);

      // Mark it as true so that it can tracked
      itemsFound[stringified] = true;
    }
    // Return the unique list
    return uniques;
  }

  /**
   * This function sets the values on fields on the NetSuite Record object.
   * Helps reduce the number of repetitive lines
   *
   * @param {object} options The object containing the options for the function
   * @param {Record} options.record The NetSuite record object
   * @param {object} options.valuesMap The map containing the values to be set on the record.
   * @param {string} options.sublistId The map containing the values to be set on the record.
   * @param {boolean} options.isDynamic Indicates if the record is in dynamic mode or not
   * @param {number} options.lineId The line for the sublist
   */
  function setRecordFieldsByValue(options) {
    const { record, valuesMap, sublistId, isDynamic, lineId } = options;

    Object.keys(valuesMap).forEach((key) => {
      if (isEmpty(sublistId) === true) {
        record.setValue({ fieldId: key, value: valuesMap[key] });
      } else {
        if (isDynamic === false) {
          record.setSublistValue({
            fieldId: key,
            value: valuesMap[key],
            sublistId,
            line: lineId,
          });
        } else {
          if (isEmpty(lineId) === false) {
            record.selectLine({ sublistId, line: lineId });
          } else {
            record.selectNewLine({ sublistId });
          }
          record.setCurrentSublistValue({
            sublistId,
            fieldId: key,
            value: valuesMap[key],
          });
          record.commitLine({ sublistId });
        }
      }
    });
  }

  /**
   * This function sets the values on fields on the NetSuite Record object using text.
   * Helps reduce the number of repetitive lines
   *
   * @param {object} options The object containing the options for the function
   * @param {Record} options.record The NetSuite record object
   * @param {object} options.valuesMap The map containing the values to be set on the record.
   * @param {string} options.sublistId The map containing the values to be set on the record.
   * @param {boolean} options.isDynamic Indicates if the record is in dynamic mode or not
   * @param {number} options.lineId The line for the sublist
   */
  function setRecordFieldsByText(options) {
    const { record, valuesMap, sublistId, isDynamic, lineId } = options;

    Object.keys(valuesMap).forEach((key) => {
      if (isEmpty(sublistId) === true) {
        record.setValue({ fieldId: key, value: valuesMap[key] });
      } else {
        if (isDynamic === false) {
          record.setSublistText({
            fieldId: key,
            value: valuesMap[key],
            sublistId,
            line: lineId,
          });
        } else {
          if (isEmpty(lineId) === false) {
            record.selectLine({ sublistId, line: lineId });
          } else {
            record.selectNewLine({ sublistId });
          }
          record.setCurrentSublistText({
            sublistId,
            fieldId: key,
            value: valuesMap[key],
          });
          record.commitLine({ sublistId });
        }
      }
    });
  }

  /**
   *
   * @param obj
   */
  function isObject(obj) {
    return (
      obj === Object(obj) &&
      Object.prototype.toString.call(obj) !== "[object Array]"
    );
  }

  /**
   *
   * @param obj
   */
  function toPlainObject(obj) {
    let plainObj;
    plainObj = {
      ...obj,
    };
    let prototype = Object.getPrototypeOf(obj);
    while (prototype) {
      plainObj = {
        ...plainObj,
        ...prototype,
      };
      prototype = Object.getPrototypeOf(prototype);
    }
    return plainObj;
  }

  /**
   *
   * @param options
   */
  function _getRecordText(options) {
    const { record, sublistId, fieldId, lineId, isDynamic } = options;

    let fieldValue;
    if (isEmpty(sublistId) === true) {
      fieldValue = record.getText({ fieldId });
    } else {
      if (isDynamic === false) {
        fieldValue = record.getSublistText({
          fieldId,
          sublistId,
          line: lineId,
        });
      } else {
        if (isEmpty(lineId) === false) {
          record.selectLine({ sublistId, line: lineId });
        }
        fieldValue = record.getCurrentSublistText({
          sublistId,
          fieldId,
        });
      }
    }

    return fieldValue;
  }

  /**
   *
   * @param options
   */
  function _getRecordValue(options) {
    const { record, sublistId, fieldId, lineId, isDynamic } = options;

    let fieldValue;
    if (isEmpty(sublistId) === true) {
      fieldValue = record.getValue({ fieldId });
    } else {
      if (isDynamic === false) {
        fieldValue = record.getSublistValue({
          fieldId,
          sublistId,
          line: lineId,
        });
      } else {
        if (isEmpty(lineId) === false) {
          record.selectLine({ sublistId, line: lineId });
        }
        fieldValue = record.getCurrentSublistValue({
          sublistId,
          fieldId,
        });
      }
    }

    return fieldValue;
  }

  /**
   * This function gets the value of the fields on the NetSuite Record object.
   * Helps reduce the number of repetitive lines
   *
   * @param {object} options The object containing the options for the function
   * @param {Record} options.record The NetSuite record object
   * @param {string[]} options.fieldIds The array of field ids of the record
   * @param {string} options.sublistId The id of the sublist
   * @param {boolean} options.isDynamic Indicates if the record is in dynamic mode or not
   * @param {number} options.lineId The line for the sublist
   * @param {boolean} options.getText Indicates if the field text or value should be retrieved
   */
  function getRecordFieldValues(options) {
    const {
      record,
      fieldIds,
      sublistId,
      isDynamic = false,
      lineId,
      getText = false,
    } = options;

    const fieldValues = {};
    fieldIds.forEach((key) => {
      const getOptions = {
        record,
        fieldId: key,
        sublistId,
        isDynamic,
        lineId,
      };
      fieldValues[key] =
        getText === false
          ? _getRecordValue(getOptions)
          : _getRecordText(getOptions);
    });

    return fieldValues;
  }

  /**
   *
   * @param options
   */
  function _setRecordText(options) {
    const { record, sublistId, fieldId, value, lineId, isDynamic } = options;

    if (isEmpty(sublistId) === true) {
      record.setText({ fieldId, value });
    } else {
      if (isDynamic === false) {
        record.setSublistText({
          fieldId,
          sublistId,
          value,
          line: lineId,
        });
      } else {
        if (isEmpty(lineId) === false) {
          record.selectLine({ sublistId, line: lineId });
        }
        record.setCurrentSublistText({
          sublistId,
          fieldId,
          value,
        });

        record.commitLine({ sublistId });
      }
    }
  }

  /**
   *
   * @param options
   */
  function _setRecordValue(options) {
    const { record, sublistId, fieldId, value, lineId, isDynamic } = options;

    if (isEmpty(sublistId) === true) {
      record.setValue({ fieldId, value });
    } else {
      if (isDynamic === false) {
        record.setSublistValue({
          fieldId,
          sublistId,
          value,
          line: lineId,
        });
      } else {
        if (isEmpty(lineId) === false) {
          record.selectLine({ sublistId, line: lineId });
        }
        record.setCurrentSublistValue({
          sublistId,
          fieldId,
          value,
        });

        record.commitLine({ sublistId });
      }
    }
  }

  /**
   * This function sets the value of the fields on the NetSuite Record object.
   * Helps reduce the number of repetitive lines
   *
   * @param {object} options The object containing the options for the function
   * @param {Record} options.record The NetSuite record object
   * @param {object[]} options.valuesMap The map containing the values to be set on the record
   * @param {string} options.sublistId The id of the sublist
   * @param {boolean} options.isDynamic Indicates if the record is in dynamic mode or not
   * @param {number} options.lineId The line for the sublist
   * @param {boolean} options.setText Indicates if the field text or value should be retrieved
   */
  function setRecordFieldValues(options) {
    const {
      record,
      valuesMap,
      sublistId,
      isDynamic = false,
      lineId,
      setText = false,
    } = options;

    Object.keys(valuesMap).forEach((key) => {
      const getOptions = {
        record,
        fieldId: key,
        value: valuesMap[key],
        sublistId,
        isDynamic,
        lineId,
      };
      if (setText === false) {
        _setRecordValue(getOptions);
      } else {
        _setRecordText(getOptions);
      }
    });
  }

  /**
   *
   * @param searchId
   */
  function loadStandaloneSearch(searchId) {
    const STANDALONE_SEARCHES = [];
    STANDALONE_SEARCHES.push("DeletedRecord");
    STANDALONE_SEARCHES.push("Role");
    STANDALONE_SEARCHES.push("EndToEndTime");
    STANDALONE_SEARCHES.push("ExpenseAmortPlanAndSchedule");
    STANDALONE_SEARCHES.push("RevRecPlanAndSchedule");
    STANDALONE_SEARCHES.push("GlLinesAuditLog");
    STANDALONE_SEARCHES.push("Crosschargeable");
    STANDALONE_SEARCHES.push("FinRptAggregateFR");
    STANDALONE_SEARCHES.push("BillingAccountBillCycle");
    STANDALONE_SEARCHES.push("BillingAccountBillRequest");
    STANDALONE_SEARCHES.push("BinItemBalance");
    STANDALONE_SEARCHES.push("PaymentEvent");
    STANDALONE_SEARCHES.push("Permission");
    STANDALONE_SEARCHES.push("GatewayNotification");
    STANDALONE_SEARCHES.push("TimeApproval");
    STANDALONE_SEARCHES.push("RecentRecord");
    STANDALONE_SEARCHES.push("SavedSearch");
    STANDALONE_SEARCHES.push("ShoppingCart");
    STANDALONE_SEARCHES.push("SubscriptionRenewalHistory");
    STANDALONE_SEARCHES.push("SuiteScriptDetail");
    STANDALONE_SEARCHES.push("SupplyChainSnapshotDetails");
    STANDALONE_SEARCHES.push("SystemNote");
    STANDALONE_SEARCHES.push("TaxDetail");
    STANDALONE_SEARCHES.push("TimesheetApproval");
    STANDALONE_SEARCHES.push("Uber");
    STANDALONE_SEARCHES.push("ResAllocationTimeOffConflict");
    STANDALONE_SEARCHES.push("ComSearchOneWaySyn");
    STANDALONE_SEARCHES.push("ComSearchGroupSyn");
    STANDALONE_SEARCHES.push("Installment");
    STANDALONE_SEARCHES.push("InventoryBalance");
    STANDALONE_SEARCHES.push("InventoryNumberBin");
    STANDALONE_SEARCHES.push("InventoryNumberItem");
    STANDALONE_SEARCHES.push("InventoryStatusLocation");
    STANDALONE_SEARCHES.push("InvtNumberItemBalance");
    STANDALONE_SEARCHES.push("ItemBinNumber");

    const search = require("N/search");
    let WithError = false;
    let i = 0;
    let LoadedSearch;
    do {
      try {
        // log.debug({
        //   title: "loadStandaloneSearch",
        //   details: "Standalone Search Type:" + STANDALONE_SEARCHES[i],
        // });

        LoadedSearch = search.load({
          id: searchId,
          type: STANDALONE_SEARCHES[i],
        });
        WithError = false;
      } catch (e) {
        // log.debug({
        //   title: "loadStandaloneSearch",
        //   details:
        //     "Incorrect standalone search type. Trying different search type",
        // });

        WithError = true;
      }

      i++;
    } while (WithError === true);

    return LoadedSearch;
  }

  /**
   *
   * @param dataArray
   * @param chunkSize
   */
  function chunkArray(dataArray, chunkSize) {
    return Array.from(
      { length: Math.ceil(dataArray.length / chunkSize) },
      (v, i) => dataArray.slice(i * chunkSize, i * chunkSize + chunkSize)
    );
  }

  /**
   * Get the folder path of the currently executing script file.
   */
  function getScriptFolderPath() {
    const nsRuntime = require("N/runtime");
    const nsSearch = require("N/search");
    const nsFile = require("N/file");

    const script = nsRuntime.getCurrentScript();
    const results = nsSearch
      .create({
        type: "script",
        filters: ["scriptid", "is", script.id],
        columns: ["scriptfile"],
      })
      .run()
      .getRange({ start: 0, end: 1 });
    if (results.length === 0) {
      throw new Error("Failed to look up script file.");
    }
    const scriptFileId = results[0].getValue("scriptfile");
    const scriptFilePath = nsFile.load({ id: scriptFileId }).path;
    const lastSlash = scriptFilePath.lastIndexOf("/");
    return scriptFilePath.substring(0, lastSlash);
  }

  /**
   *
   * @param option
   */
  function dynamicDeploy(option) {
    const nsError = require("N/error");
    const nsTask = require("N/task");
    const nsSearch = require("N/search");
    const nsRecord = require("N/record");

    const stMethodName = "forceDeploy";
    log.debug({ title: stMethodName, details: " - Entry - " });

    try {
      if (!option.scriptId) {
        throw nsError.create({
          name: "MISSING_REQUIRED_PARAM",
          message: "script id",
          notifyOff: true,
        });
      }

      const _random = function (len) {
        if (!len) {
          len = 5;
        }
        const str = new Date().getTime().toString();
        return str.substring(str.length - len, str.length);
      };

      const _deploy = function (scriptid, params, tasktype) {
        const stMethodName = "_deploy";
        log.debug({ title: stMethodName, details: " - Entry - " });

        try {
          const objTask = nsTask.create({
            taskType: tasktype,
            scriptId: scriptid,
            params,
          });
          return objTask.submit();
        } catch (e) {
          log.error({
            title: stMethodName,
            details: `Message ${e.name}: ${e.message}`,
          });
          if (e.name == "NO_DEPLOYMENTS_AVAILABLE") {
            return null;
          } else {
            throw e;
          }
        } finally {
          log.debug({ title: stMethodName, details: " - Exit -" });
        }
      };

      const _copyAndDeploy = function (scriptId, params, tasktype) {
        const stMethodName = "_copyAndDeploy";
        log.debug({ title: stMethodName, details: " - Entry - " });

        try {
          const stDeploymentID = _copyDeployment(scriptId);
          log.debug({
            title: stMethodName,
            details: `Deployment ID : ${stDeploymentID}`,
          });
        } catch (error) {
          log.debug({
            title: stMethodName,
            details: `Deployment Error : ${JSON.stringify(error)}`,
          });
        } finally {
          log.debug({ title: stMethodName, details: " - Exit -" });
        }

        _deploy(scriptId, params, tasktype);
      };

      const _copyDeployment = function (scriptId) {
        const stMethodName = "_copyDeployment";
        log.debug({ title: stMethodName, details: " - Entry - " });

        try {
          log.debug({
            title: stMethodName,
            details: `Script ID : ${scriptId}`,
          });

          const objSrch = nsSearch.create({
            type: nsSearch.Type.SCRIPT_DEPLOYMENT,
            filters: [
              ["script.internalidnumber", "equalto", scriptId],
              "AND",
              ["status", "is", "NOTSCHEDULED"],
              "AND",
              ["isdeployed", "is", "T"],
            ],
            columns: ["scriptid"],
          });
          log.debug({
            title: stMethodName,
            details: `Result Count : ${objSrch.runPaged().count}`,
          });

          let newDeploy = null;
          objSrch.run().each((result) => {
            log.debug({
              title: stMethodName,
              details: `Existing Deployment ID : ${result.id}`,
            });
            if (result.id) {
              newDeploy = nsRecord.copy({
                type: nsRecord.Type.SCRIPT_DEPLOYMENT,
                id: result.id,
              });

              let newScriptId = result.getValue({ name: "scriptid" });
              log.debug({
                title: stMethodName,
                details: `Script ID : ${newScriptId}`,
              });

              newScriptId = newScriptId.toUpperCase().split("CUSTOMDEPLOY")[1];
              newScriptId = [newScriptId.substring(0, 20), _random()].join("_");
              log.debug({
                title: stMethodName,
                details: `New Deployment ID : ${newScriptId}`,
              });

              newDeploy.setValue({ fieldId: "status", value: "NOTSCHEDULED" });
              newDeploy.setValue({ fieldId: "isdeployed", value: true });
              newDeploy.setValue({
                fieldId: "scriptid",
                value: newScriptId.toLowerCase().trim(),
              });
            }
          });

          return newDeploy
            ? newDeploy.save({
                enableSourcing: false,
                ignoreMandatoryFields: true,
              })
            : "";
        } catch (e) {
          log.error({
            title: stMethodName,
            details: `Catch Message : ${e.name}: ${e.message}`,
          });
          throw e;
        } finally {
          log.debug({ title: stMethodName, details: " - Exit -" });
        }
      };

      // 1. Deploy script, will take the first available deployment record
      // 2. If no deployment record available, copy an existing deployment record, then deploy again
      return (
        _deploy(option.scriptId, option.params) ||
        _copyAndDeploy(option.scriptId, option.params)
      );
    } catch (e) {
      log.error({
        title: stMethodName,
        details: `Catch Message : ${e.name}: ${e.message}`,
      });
      throw e;
    }
  }

  /**
   * This function is used to send an error notification email to the support team. It includes details such as the user's name and email, the script and deployment IDs, the account ID and type, and the error stack trace.
   *
   * @param {Record} recordObj The NetSuite record object
   * @param {string} errorStack The stack trace of the error
   */
  function _sendErrorToSupport(recordObj, errorStack) {
    const nsRuntime = require("N/runtime");
    const nsEmail = require("N/email");

    const scriptContext = nsRuntime.getCurrentScript();
    const user = nsRuntime.getCurrentUser();

    const emailMessage = [];
    emailMessage.push(`A script encountered an error. Below are the details:`);
    emailMessage.push(`User Name: ${user.name}`);
    emailMessage.push(`User Email: ${user.email}`);
    if (isEmpty(recordObj) === false) {
      emailMessage.push(`Record Id: ${recordObj.id}`);
      emailMessage.push(`Record Type: ${recordObj.type}`);
    }
    emailMessage.push(`Script Id: ${scriptContext.id}`);
    emailMessage.push(`Deployment Id: ${scriptContext.deploymentId}`);
    emailMessage.push(`Account Id: ${nsRuntime.accountId}`);
    emailMessage.push(`Account Type: ${nsRuntime.envType}`);
    emailMessage.push(`Error Details:`);
    emailMessage.push(`${errorStack}`);

    nsEmail.send({
      author: user.id,
      recipients: "support@appwrap.tech",
      subject: `Script Error: Script Id: ${scriptContext.id} Account: ${
        nsRuntime.accountId
      } - ${new Date().toISOString()}`,
      body: emailMessage.join("\n"),
    });
  }

  /**
   * Wraps a potentially unsafe NetSuite call in a try/catch and implements basic logging
   * @returns {{isSuccess: boolean, result?: object,error?: Error, message?: string, details?: object}} Custom object with the result of the execution
   */
  function safeExecute() {
    const parameters = Array.prototype.slice.call(arguments);
    const functionToExecute = parameters.shift();
    if (typeof functionToExecute === "function") {
      try {
        const result = functionToExecute.apply(this, parameters);
        return {
          isSuccess: true,
          result,
        };
      } catch (ex) {
        const errorObj = JSON.parse(
          JSON.stringify(ex, Object.getOwnPropertyNames(ex))
        );
        const response = {
          isSuccess: false,
          message: errorObj.message,
          error: ex,
          details: {
            functionCalled: functionToExecute.name,
            stackTrace: errorObj.stack,
          },
        };
        log.error("Failed to call function", JSON.stringify(response));
        _sendErrorToSupport(null, errorObj);
        return response;
      }
    } else {
      const message = `${functionToExecute} is not a function and cannot be called.`;
      log.error({
        title: "INVALID_ARGUMENT",
        details: message,
      });
      return {
        isSuccess: false,
        message,
        details: {
          functionCalled: functionToExecute.name,
          stackTrace: "",
        },
      };
    }
  }

  /**
   * This function iterates the members of the array of objects. It groups the members by the value of the specified
   * object property.  It also gets the sum of the value of the specified object property.
   * @param options
   * @param {object[]} options.values The array of object containing the data to be grouped and summed.
   * @param {string} options.key The property name whose value will be used for the grouping.
   * @param {string} options.sumKey The property name whose value will be used for the summation.
   * @return {object[]} Array of objects containing the grouped and summed information.
   */
  function groupByThenSumBy(options) {
    const helper = {};
    return options.values.reduce(function (r, o) {
      const key =
        isEmpty(o[options.key].value) === true
          ? o[options.key]
          : o[options.key].value;

      if (!helper[key]) {
        helper[key] = Object.assign({}, o); // create a copy of o

        r.push(helper[key]);
      } else {
        helper[key][options.sumKey] =
          forceParseFloat(helper[key][options.sumKey]) +
          forceParseFloat(o[options.sumKey]);
      }
      return r;
    }, []);
  }

  function cleanArray(arrayToClean) {
    const cleanedArray = [];
    arrayToClean.forEach((val) => {
      if (
        val !== null &&
        typeof val !== "undefined" &&
        ("" + val).trim() !== ""
      ) {
        cleanedArray.push(val);
      }
    });

    return cleanedArray;
  }

  return {
    groupBy,
    leftTrim,
    rightTrim,
    trim,
    executeSearch,
    isNullUndefined: nullUndefined,
    isEmpty,
    forceInteger: forceParseInt,
    forceFloat: forceParseFloat,
    dateToString,
    stringToDate,
    closeSuitelet,
    resultsToObject,
    toBoolean,
    isNumber,
    isArray,
    isString,
    isBlank,
    getScriptParameterValues,
    isObjectEmpty,
    uniqueFromObjectArray,
    setRecordFieldsByValue,
    setRecordFieldsByText,
    isObject,
    toPlainObject,
    getRecordFieldValues,
    setRecordFieldValues,
    loadStandaloneSearch,
    chunkArray,
    getScriptFolderPath,
    dynamicDeploy,
    safeExecute,
    groupByThenSumBy,
    cleanArray,
  };
});
